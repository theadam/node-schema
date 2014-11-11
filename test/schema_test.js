var Schema = require('../');

describe('Schema', function(){

  it('should keep the validate function of an object', function(){
    var schema = {
      validate: function(){
        return ['hey'];
      }
    };

    var schemaObj = Schema(schema);
    schemaObj.should.be.an.instanceof(Schema);
    schemaObj.validate('anything').should.eql(['hey']);
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
    'message': function(val){return Promise.resolve(val > 5);},
    'message2': function(val){return val % 2 === 0;}
  });

  describe('Value Schema', function(){

    it('should be an instance of Schema', function(){
      return schema.should.be.an.instanceof(Schema);
    });

    it('should be able to validate a value', function(){
      return schema.validate(4).should.eventually.eql(['message']);
    });

    it('should be able to fail fast', function(){
      return schema.validate(3, {failFast: true}).should.eventually.eql(['message']);
    });

    it('should require a value to validate', function(){
      return schema.validate(undefined).should.eventually.eql(['is required']);
    });

    it('can change required message', function(){
      return schema.validate(undefined, {isRequiredMessage: 'must exist'}).should.eventually.eql(['must exist']);
    });

  });

  describe('Object Schema', function(){

    it('can nest schemas', function(){
      var objSchema = Schema({
        key: {
          'message': function(val){return Promise.resolve(val > 5);},
          'message2': function(val){return val % 2 === 0;}
        }
      });

      return Promise.all([
        objSchema.should.be.an.instanceof(Schema),
        objSchema.validate({key: 4}).should.eventually.eql({key: ['message']}),
        objSchema.validate({key: 3}).should.eventually.eql({key: ['message', 'message2']}),
        expect(objSchema.validate({key: 6})).to.eventually.be.null,
        objSchema.validate({key: 3}, {failFast: true}).should.eventually.eql({key: ['message']}),
        objSchema.validate(undefined).should.eventually.eql(['is required']),
        objSchema.validate(undefined, {isRequiredMessage: 'must exist'}).should.eventually.eql(['must exist']),
        objSchema.validate({}).should.eventually.eql({key: ['is required']}),
        objSchema.validate({}, {isRequiredMessage: 'must exist'}).should.eventually.eql({key: ['must exist']})
      ]);
    });

    it('can nest values', function(){
      var objSchema = Schema({
        key: schema
      });

      objSchema.should.be.an.instanceof(Schema);

      return Promise.all([
        objSchema.validate({key: 4}).should.eventually.eql({key: ['message']}),
        objSchema.validate({key: 3}).should.eventually.eql({key: ['message', 'message2']}),
        expect(objSchema.validate({key: 6})).to.eventually.be.null,
        objSchema.validate({key: 3}, {failFast: true}).should.eventually.eql({key: ['message']}),
        objSchema.validate(undefined).should.eventually.eql(['is required']),
        objSchema.validate(undefined, {isRequiredMessage: 'must exist'}).should.eventually.eql(['must exist']),
        objSchema.validate({}).should.eventually.eql({key: ['is required']}),
        objSchema.validate({}, {isRequiredMessage: 'must exist'}).should.eventually.eql({key: ['must exist']})
      ]);
    });

    it('can handled deferred validation', function(){

      var objSchema = Schema({
        key: {
          'message':
          function(val){
            return new Promise(function(resolver){
              setTimeout(function(){
                resolver(false);
              }, 1);
            });
          },
        }
      });

      return objSchema.validate({key: 4}).should.eventually.eql({key: ['message']});

    });

  });

});
