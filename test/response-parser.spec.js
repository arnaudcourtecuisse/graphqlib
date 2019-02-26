const { expect } = require('chai');
const { parseResponse } = require('../lib/response-parser');


describe('GraphQLib response parser', () => {
  it('should return the content of the data property', () => {
    const data = {};
    expect(parseResponse({ data })).to.deep.equal(data);
  });

  it('should flatten edges (recursively)', () => {
    expect(parseResponse(
      { data: { edges: [{ node: 'foo' }] } }
    )).to.deep.equal(
      ['foo']
    );
    expect(parseResponse(
      { data: { foo: { edges: [{ node: 'bar' }] } } }
    )).to.deep.equal(
      { foo: ['bar'] }
    );
    expect(parseResponse(
      { data: { foo: [{ edges: [{ node: 'bar' }] }] } }
    )).to.deep.equal(
      { foo: [['bar']] }
    );
    expect(parseResponse(
      { data: { foo: { edges: [{ node: { edges: [{ node: 'bar' }] } }] } } }
    )).to.deep.equal(
      { foo: [['bar']] }
    );
  });
});
