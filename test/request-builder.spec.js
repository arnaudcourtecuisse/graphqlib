const { expect } = require('chai');
const rb = require('../lib/request-builder');

describe('GraphQL request builder', () => {
  describe('createField', () => {
    it('should return a structured field', () => {
      expect(rb.createField('test')).to.deep.equal({ name: 'test', _isGQLField: true });
    });
  });

  describe('createEnumArgument', () => {
    it('should return a structured enum value', () => {
      expect(rb.createEnumArgument('foo')).to.deep.equal({ name: 'foo', enum: true });
    });
  });

  describe('addArgs', () => {
    it('should return a function', () => {
      expect(rb.addArgs({})).to.be.a('function');
    });

    describe('returned function', () => {
      const baseField = rb.createField('test');

      it('should not modify inputs', () => {
        expect(rb.addArgs({ foo: 42 })(baseField)).not.to.equal(baseField);
      });

      it('should set arguments to the field', () => {
        expect(
          rb.addArgs({ foo: 42 })(baseField)
        ).to.deep.equal(
          { name: 'test', _isGQLField: true, args: { foo: 42 } }
        );
      });

      it('should merge args with existing ones', () => {
        const fieldWithArgs = rb.addArgs({ foo: 42 })(baseField);
        expect(
          rb.addArgs({ bar: 43 })(fieldWithArgs)
        ).to.deep.equal(
          { name: 'test', _isGQLField: true, args: { foo: 42, bar: 43 } }
        );
        expect(
          rb.addArgs({ foo: 43 })(fieldWithArgs)
        ).to.deep.equal(
          { name: 'test', _isGQLField: true, args: { foo: 43 } }
        );
      });
    });
  });

  describe('addSubfields', () => {
    it('should return a function', () => {
      expect(rb.addSubfields('subtest')).to.be.a('function');
    });
    describe('returned function', () => {
      const baseField = rb.createField('test');

      it('should not modify inputs', () => {
        expect(rb.addSubfields('subtest')(baseField)).not.to.equal(baseField);
      });

      it('should create a structured subfield from a string', () => {
        expect(rb.addSubfields('subtest')(baseField))
          .to.have.property('subfields')
          .to.deep.equal([{ name: 'subtest', _isGQLField: true }]);
      });

      it('should create nested subfields from an object', () => {
        expect(rb.addSubfields({ subtest: 'subsubtest' })(baseField))
          .to.have.property('subfields')
          .to.deep.equal([{
            name: 'subtest',
            subfields: [{ name: 'subsubtest', _isGQLField: true }],
            _isGQLField: true,
          }]);
      });

      it('should create multiple structured subfields from an array', () => {
        expect(rb.addSubfields(['subtest1', 'subtest2'])(baseField))
          .to.have.property('subfields')
          .to.deep.equal([
            { name: 'subtest1', _isGQLField: true },
            { name: 'subtest2', _isGQLField: true },
          ]);
      });

      it('should create a structured field when passed as argument', () => {
        expect(rb.addSubfields(rb.createField('subtest'))(baseField))
          .to.have.property('subfields')
          .to.deep.equal([{ name: 'subtest', _isGQLField: true }]);
      });

      it('should merge subfields with existing ones', () => {
        const fieldWithSubfields = rb.addSubfields('subtest1')(baseField);
        expect(rb.addSubfields('subtest2')(fieldWithSubfields))
          .to.have.property('subfields')
          .to.deep.equal([
            { name: 'subtest1', _isGQLField: true },
            { name: 'subtest2', _isGQLField: true },
          ]);
        expect(rb.addSubfields('subtest1')(fieldWithSubfields))
          .to.have.property('subfields')
          .to.deep.equal([{ name: 'subtest1', _isGQLField: true }]);
      });
      it('should merge nested subfields', () => {
        const fieldWithSubfields = rb.addSubfields({ subtest: 'subsubtest1' })(baseField);
        expect(rb.addSubfields({ subtest: 'subsubtest2' })(fieldWithSubfields).subfields[0])
          .to.have.property('subfields')
          .to.deep.equal([
            { name: 'subsubtest1', _isGQLField: true },
            { name: 'subsubtest2', _isGQLField: true },
          ]);
        expect(rb.addSubfields({ subtest: 'subsubtest1' })(fieldWithSubfields).subfields[0])
          .to.have.property('subfields')
          .to.deep.equal([{ name: 'subsubtest1', _isGQLField: true }]);
      });
    });
  });

  describe('addFragments', () => {
    it('should return a function', () => {
      expect(rb.addFragments('fragtest')).to.be.a('function');
    });

    describe('returned function', () => {
      const baseField = rb.createField('test');

      it('should not modify inputs', () => {
        expect(rb.addFragments('fragtest')(baseField)).not.to.equal(baseField);
      });

      it('should add fragments to the field', () => {
        expect(rb.addFragments('fragtest1', 'fragtest2')(baseField))
          .to.have.property('fragments')
          .to.deep.equal(['fragtest1', 'fragtest2']);
      });

      it('should merge fragments with existing ones', () => {
        const fieldWithFragments = rb.addFragments('fragtest1')(baseField);
        expect(rb.addFragments('fragtest2')(fieldWithFragments))
          .to.have.property('fragments')
          .to.deep.equal(['fragtest1', 'fragtest2']);
        expect(rb.addFragments('fragtest1')(fieldWithFragments))
          .to.have.property('fragments')
          .to.deep.equal(['fragtest1']);
      });
    });
  });

  describe('getFieldRepr', () => {
    const baseField = rb.createField('test');
    it('should return a string', () => {
      expect(rb.getFieldRepr(baseField)).to.be.a('string');
    });
    it('should represent the fields name', () => {
      expect(rb.getFieldRepr(baseField)).to.equal('test');
    });
    it('should represent the fields arguments', () => {
      const args = {
        foo: 42,
        bar: 'bu',
        baz: new Date(0),
        qux: { quux: false, quuz: true },
        enum: rb.createEnumArgument('ENUM'),
      };
      expect(
        rb.getFieldRepr(rb.addArgs(args)(baseField))
      ).to.equal(
        'test(foo:42,bar:"bu",baz:"1970-01-01T00:00:00.000Z",qux:{quux:false,quuz:true},enum:ENUM)'
      );
    });
    it('should represent the fields subfields', () => {
      expect(
        rb.getFieldRepr(rb.addSubfields('subtest')(baseField))
      ).to.equal(
        'test{subtest}'
      );
    });
    it('should represent the fields fragments', () => {
      expect(
        rb.getFieldRepr(rb.addFragments('fragtest')(baseField))
      ).to.equal(
        'test{...fragtest}'
      );
    });
  });
});
