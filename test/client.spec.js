const { expect } = require('chai');
const client = require('../lib/client');

describe('GraphQLib client', () => {
  describe('instanciation', () => {
    it('should require uri and token configuration', () => {
      // throw if nothing is provided
      expect(() => client()).to.throw();
      // throw if not everything is provided
      expect(() => client({ uri: 'uri' })).to.throw();
      expect(() => client({ token: 'token' })).to.throw();
      // do not throw if both are provided
      expect(() => client({ uri: 'uri', token: 'token' })).not.to.throw();
      expect(client({ uri: 'uri', token: 'token' }))
        .to.have.property('send')
        .to.be.a('function');
    });
  });
});
