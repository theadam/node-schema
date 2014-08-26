var Schema = require('../');
var Field = Schema.Field;
var Q = require('q');

describe('Fields', function(){

  describe('optional', function(){

    it('should return the validation result when fed a value', function(){
      var schema = Field.optional({'message': function(val){return Q.resolve(val > 5);}});

      return Q.all(
        [expect(schema.validate(6)).to.eventually.be.null,
        schema.validate(3).should.eventually.be.eql(['message'])]
      );
    });

    it('should return null when fed undefined', function(){
      var schema = Field.optional({'message': function(val){return val > 5;}});

      return expect(schema.validate(undefined)).to.eventually.be.null;
    });
  });

});

describe('required', function(){

  it('should return the validation result when fed a value', function(){
    var schema = Field.required('field is required', {'message': function(val){return Q.resolve(val > 5);}});

    return Q.all(
      [expect(schema.validate(6)).to.eventually.be.null,
      schema.validate(3).should.eventually.be.eql(['message'])]
    );
  });

  it('should change the required message', function(){
    var schema = Field.required('field is required', {'message': function(val){return Q.resolve(val > 5);}});

    return schema.validate(undefined).should.eventually.be.eql(['field is required']);
  });
});
