const _ = require('lodash/fp');

const {
  createField,
  createEnumArgument,
  addArgs,
  addSubfields,
  addFragments,
  getFieldRepr,
  prettyPrint,
} = require('./request-builder');

const client = require('./client');

const getChainableBuilder = objectStringifier => (
  (gqlObject) => {
    const makeChainable = fn => (...args) => getChainableBuilder(objectStringifier)(fn(...args)(gqlObject));
    return {
      // Chainable build calls
      addSubfields: makeChainable(addSubfields),
      addArgs: makeChainable(addArgs),
      addFragments: makeChainable(addFragments),
      // Outputs
      build: () => gqlObject,
      toString: () => objectStringifier(gqlObject),
      prettyPrint: () => prettyPrint(objectStringifier(gqlObject)),
    };
  }
);

const buildField = _.flow(
  createField,
  getChainableBuilder(getFieldRepr)
);

const getQueryRepr = _.flow(
  getFieldRepr,
  repr => `query{${repr}}`
);

const buildQuery = _.flow(
  createField,
  getChainableBuilder(getQueryRepr)
);

const buildFragment = _.flow(
  (name, type) => `fragment ${name} on ${type}`,
  createField,
  getChainableBuilder(getFieldRepr)
);

module.exports = {
  client,
  enum: createEnumArgument,
  field: buildField,
  query: buildQuery,
  fragment: buildFragment,
};
