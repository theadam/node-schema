var Schema = require('../');
var Field = Schema.Field;
var should = require('chai').should();
var expect = require('chai').expect;

describe('Fields', function(){

  describe('optional', function(){

    it('should return the validation result when fed a value', function(){
      var schema = Field.optional({'message': function(val){return val > 5}});

      expect(schema.validate(6)).to.be.null;
      schema.validate(3).should.be.eql(['message']);
    });

    it('should return null when fed undefined', function(){
      var schema = Field.optional({'message': function(val){return val > 5}});

      expect(schema.validate(undefined)).to.be.null;
    });

  });

  describe('name', function(){

    it('replace the name for arrays', function(){
      var schema = Field.name('NAME', {'{name} {name} message': function(val){return val > 5}});

      schema.validate(3).should.eql(['NAME NAME message']);
    });

    it('should not replace the name in objects', function(){
      var schema = Field.name('NAME', {key: {'{name} {name} message': function(val){return val > 5}}});

      schema.validate({key: 3}).should.eql({key: ['{name} {name} message']});
    });

  });

  describe('only', function(){

    it('errors on unknown fields', function(){
      var schema = Field.only(
        {name: {'message': function(val){return val > 5}}}
      );

      schema.validate({value: 5, password: 6}).should.eql(['contains an unknown field: value', 'contains an unknown field: password']);
    });

    it('should not replace the name in objects', function(){
      var schema = Field.only(
        {name: {'message': function(val){return val > 5}}}
      );

      schema.validate({value: 5, password: 6}, {unknownFieldMessage: '{field} is unknown'}).should.be.eql(['value is unknown', 'password is unknown']);
    });
  });

  describe('multiple', function(){
    var schema = Schema({
      field: Field.name('Field', Field.optional(Field.only({
        innerField: {'message': function(val){return val > 5}}
      })))
    });

    it('the field should be optional', function(){
      expect(schema.validate({})).to.be.null;
    });

    it('name should be in the messages', function(){
      schema.validate({
        field: {badField: 6}
      },
      {
        unknownFieldMessage: '{name} has unknown value {field}'
      }).should.eql({field: ['Field has unknown value badField']});
    });

  });

});
