var should = require('chai').should();
var expect = require('chai').expect;

var Schema = require('../')

describe('Schema', function(){

  it('should return the argument when its a schema', function(){
    var schema = {
      validate: function(){}
    };

    Schema(schema).should.equal(schema);
  });

  it('should fail when given an empty object', function(){
    var schema = {};

    expect(Schema.bind(null, schema)).to.throw(Error);
  });

  it('should fail when given a non plain object', function(){
    var schema = [];

    expect(Schema.bind(null, schema)).to.throw(Error);
  });

  it('should fail with a bad validator type', function(){
    var schema = {
      'message': 1
    };

    expect(Schema.bind(null, schema)).to.throw(Error);
  });

  var schema = Schema({
    'message': function(val){return val > 5},
    'message2': function(val){return val % 2 == 0}
  })

  describe('Value Schema', function(){

    it('should be able to validate a value', function(){
      schema.validate(4).should.eql(['message']);
      schema.validate(3).should.eql(['message', 'message2']);
      expect(schema.validate(6)).to.be.null;
    });

    it('should be able to fail fast', function(){
      schema.validate(3, {failFast: true}).should.eql(['message']);
    });

    it('should require a value to validate', function(){
      schema.validate(undefined).should.eql(['is required']);
    });

    it('can change required message', function(){
      schema.validate(undefined, {isRequiredMessage: 'must exist'}).should.eql(['must exist']);
    });

  });

  describe('Object Schema', function(){

    it('can nest schemas', function(){
      var objSchema = Schema({
        key: {
          'message': function(val){return val > 5},
          'message2': function(val){return val % 2 == 0}
        }
      });

      objSchema.validate({key: 4}).should.eql({key: ['message']});
      objSchema.validate({key: 3}).should.eql({key: ['message', 'message2']});
      expect(objSchema.validate({key: 6})).to.be.null;
      objSchema.validate({key: 3}, {failFast: true}).should.eql({key: ['message']});
      objSchema.validate(undefined).should.eql(['is required']);
      objSchema.validate(undefined, {isRequiredMessage: 'must exist'}).should.eql(['must exist']);
      objSchema.validate({}).should.eql({key: ['is required']});
      objSchema.validate({}, {isRequiredMessage: 'must exist'}).should.eql({key: ['must exist']});
    });

    it('can nest values', function(){
      var objSchema = Schema({
        key: schema
      });

      objSchema.validate({key: 4}).should.eql({key: ['message']});
      objSchema.validate({key: 3}).should.eql({key: ['message', 'message2']});
      expect(objSchema.validate({key: 6})).to.be.null;
      objSchema.validate({key: 3}, {failFast: true}).should.eql({key: ['message']});
      objSchema.validate(undefined).should.eql(['is required']);
      objSchema.validate(undefined, {isRequiredMessage: 'must exist'}).should.eql(['must exist']);
      objSchema.validate({}).should.eql({key: ['is required']});
      objSchema.validate({}, {isRequiredMessage: 'must exist'}).should.eql({key: ['must exist']});
    });

  });

});
