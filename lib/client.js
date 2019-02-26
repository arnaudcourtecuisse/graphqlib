const _ = require('lodash/fp');
const request = require('request-promise');

const { parseResponse } = require('./response-parser');


const computeErrorMessage = _.flow(
  _.map(e => e.message),
  _.join('. ')
);

const stringifyAll = _.flow(
  _.map(builder => builder.toString()),
  _.join('')
);

module.exports = ({ uri, token, removeEdges = false }, declaredFragments) => {
  if (!uri) {
    throw new Error('GraphQLib client: URI required');
  }

  if (!token) {
    throw new Error('GraphQLib client: token required');
  }

  const buildHttpRequest = gqlRequest => ({ uri, qs: { token, query: gqlRequest }, json: true });

  const parseJsonResponse = async (response) => {
    if (response.errors) {
      throw new Error(computeErrorMessage(response.errors));
    }
    return removeEdges ? parseResponse(response) : response;
  };


  const getFragmentDeclaration = (fragmentName) => {
    if (fragmentName in declaredFragments) {
      return declaredFragments[fragmentName];
    }
    throw new Error(`Undeclared fragment: ${fragmentName}`);
  };

  const listFieldFragments = field => _.flow(
    _.map(listFieldFragments),
    _.flatten,
    _.concat(field.fragments || []),
    _.uniq()
  )(field.subfields || []);

  const listFragments = unit => _.flow(
    u => u.build(),
    listFieldFragments,
    _.map(getFragmentDeclaration),
    _.map(fragment => _.concat(fragment)(listFragments(fragment))),
    _.flatten
  )(unit);

  const send = _.flowAsync(
    query => _.concat(listFragments(query), query),
    stringifyAll,
    buildHttpRequest,
    request,
    parseJsonResponse
  );

  return {
    send,
  };
};
