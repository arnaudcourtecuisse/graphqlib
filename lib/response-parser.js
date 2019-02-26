const _ = require('lodash/fp');

const flattenEdges = _.map(edge => parseNode(edge.node));

const flattenDeepEdges = _.flow(
  _.toPairs,
  _.map(([key, value]) => [key, parseNode(value)]),
  _.fromPairs
);

const parseNode = (data) => {
  if (typeof data === 'object') {
    if (Array.isArray(data)) {
      return _.map(parseNode)(data);
    }
    if (data.edges) {
      return flattenEdges(data.edges);
    }
    return flattenDeepEdges(data);
  }
  return data;
};

const parseResponse = res => parseNode(res.data);

module.exports = { parseResponse };
