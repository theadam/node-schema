var Field = require('../').Field;
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

      schema.validate(3).should.be.eql(['NAME NAME message']);
    });

    it('should not replace the name in objects', function(){
      var schema = Field.name('NAME', {key: {'{name} {name} message': function(val){return val > 5}}});

      schema.validate({key: 3}).should.be.eql({key: ['{name} {name} message']});
    });

  });

});
