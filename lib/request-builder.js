const assert = require('assert');
const moment = require('moment-timezone');
const _ = require('lodash/fp');

/* GraphQL request construction */

/* *** Create field *** */

const fieldFactory = _.flow(
  _.pick(['name', 'subfields', 'fragments', 'args']),
  _.omitBy(v => v === undefined),
  _.cloneDeep,
  _.merge({ _isGQLField: true })
);

const createField = (name) => {
  if (!name) {
    throw new Error('Field name is required');
  }
  return fieldFactory({ name });
};

/* *** Build with subfields *** */

const convertToSubfields = (rawFieldsData) => {
  if (Array.isArray(rawFieldsData)) {
    // ['x', 'y'] => { x, y }
    return _.flow(
      _.map(convertToSubfields),
      _.flattenDeep
    )(rawFieldsData);
  }

  if (_.isString(rawFieldsData)) {
    // 'x' => { x }
    return [createField(rawFieldsData)];
  }

  if (rawFieldsData._isGQLField) {
    // already parsed field
    return [fieldFactory(rawFieldsData)];
  }

  if (_.isPlainObject(rawFieldsData)) {
    // { x: 'y' } => { x { y } }
    return _.flow(
      _.toPairs,
      _.map(([name, rawSubfields]) => fieldFactory({ name, subfields: convertToSubfields(rawSubfields) }))
    )(rawFieldsData);
  }

  throw new Error('Invalid subfield data:', rawFieldsData);
};

const findByName = name => _.find({ name });

const updateField = ({ subfields, fragments, args }) => _.flow(
  subfields ? addSubfields(...subfields) : _.identity,
  fragments ? addFragments(...fragments) : _.identity,
  args ? addArgs(args) : _.identity
);

const replaceField = (existing, updated) => _.flow(
  _.remove(existing),
  _.concat(updated)
);

const mergeByName = existingFields => (existingFields && existingFields.length
  ? _.reduce((mergedFields, field) => {
    const existingField = findByName(field.name)(mergedFields);
    if (!existingField) {
      return [...mergedFields, field];
    }
    const updatedField = updateField(field)(existingField);
    return replaceField(existingField, updatedField)(existingFields);
  }, existingFields)
  : _.identity
);

const mergeSubfields = subfields => _.flow(
  _.map(convertToSubfields),
  _.flattenDeep,
  subfields ? _.concat(subfields) : _.identity,
  mergeByName(subfields)
);

const addSubfields = (...rawSubfields) => field => fieldFactory({
  ...field,
  subfields: mergeSubfields(field.subfields)(rawSubfields),
});

/* *** Build with arguments *** */

const createEnumArgument = enumName => ({ _isGQLEnum: true, name: enumName });

const assertValid = _.flow(
  _.tap(a => assert.ok(typeof a === 'object')),
  _.toPairs,
  _.filter(([, val]) => val !== undefined && val !== null),
  _.map(_.tap(([, val]) => assert.ok(typeof val !== 'function'))),
  _.fromPairs
);

const addArgs = rawArgs => field => fieldFactory({
  ...field,
  args: { ...field.args, ...assertValid(rawArgs) },
});


/* *** Build with fragments *** */

const createFragment = (fragmentName) => {
  if (typeof fragmentName === 'string') {
    return fragmentName;
  }
  throw new Error(`Invalid fragment name: ${JSON.stringify(fragmentName)}`);
};

const assertValidFragments = _.map(createFragment);

const addFragments = (...fragments) => field => fieldFactory({
  ...field,
  fragments: _.flow(
    assertValidFragments,
    field.fragments ? _.concat(field.fragments) : _.identity,
    _.uniq
  )(fragments),
});

/* *** Get field representation *** */

const getArgValueRepr = (val) => {
  if (_.isString(val) || _.isNumber(val) || _.isBoolean(val)) {
    return JSON.stringify(val);
  }
  if (val instanceof moment || val instanceof Date) {
    return JSON.stringify(moment(val).toISOString());
  }
  if (val._isGQLEnum === true) {
    return val.name;
  }
  if (Array.isArray(val)) {
    return `[${val.map(getArgValueRepr).join(',')}]`;
  }
  return `{${getFieldArgsRepr(val)}}`;
};

const getFieldArgsRepr = args => _.flow(
  _.toPairs,
  _.map(([key, value]) => `${key}:${getArgValueRepr(value)}`),
  _.join(',')
)(args);

const getFragmentRepr = fragment => `...${fragment}`;

const getFieldRepr = (field) => {
  const { name, args, subfields, fragments } = field;
  let repr = name;
  if (!_.isEmpty(args)) {
    repr += `(${getFieldArgsRepr(args)})`;
  }
  if (_.isEmpty(subfields) && _.isEmpty(fragments)) {
    return repr;
  }
  const bracketsContent = _.flow(
    _.concat(_.map(getFieldRepr)(subfields)),
    _.concat(_.map(getFragmentRepr)(fragments)),
    _.join(',')
  )([]);
  return `${repr}{${bracketsContent}}`;
};

const getWhitespaces = n => new Array(n).fill(' ').join('');

const indentOffsets = { '{': 1, '(': 1, ')': -1, '}': -1 };
const getIndentOffset = (char, indent) => indent * (indentOffsets[char] || 0);

const mapChar = (char, indent) => {
  switch (char) {
    case '{':
    case '(':
      return ` ${char}\n${getWhitespaces(indent)}`;
    case '}':
    case ')':
      return `\n${getWhitespaces(indent)}${char}`;
    case ',':
      return `,\n${getWhitespaces(indent)}`;
    case ':':
      return ': ';
    default:
      return char;
  }
};

const prettyPrint = (fieldRepr, indent = 2) => _.flow(
  _.toArray,
  _.reduce(
    ({ inStruct, currentIndent, output }, c) => {
      const newIndent = currentIndent + getIndentOffset(c, indent);
      return {
        inStruct: c === '"' ? !inStruct : inStruct,
        currentIndent: newIndent,
        output: output + (inStruct ? mapChar(c, newIndent) : c),
      };
    },
    { inStruct: true, currentIndent: 0, output: '' }
  ),
  ({ output }) => output
)(fieldRepr);

module.exports = {
  createField,
  createEnumArgument,
  addArgs,
  addSubfields,
  addFragments,
  getFieldRepr,
  prettyPrint,
};
