require('es6-promise').polyfill();

var _ = require('lodash');
var Schema = require('./schema');

/**
@namespace
*/
var Field = module.exports = exports = {};

/**
A helper to produce middleware functions.
@param {Function} modifierFunc - The function used to modify the values coming from
 the underlying schema, and return values.
@return {Function} a middleware function for modifying schema functionality.

@example
```javascript
Field.optional = Field.createMiddleware(function(value, options, object, schema){
  if(value === undefined){
    return null;
  }
  return schema.validate(value, options, object);
});
```
*/
Field.createMiddleware = function(modifierFunc){
  var extraArgLength = modifierFunc.length - 4; // amount of extra args that should have been passed
  return function(){
    var initialArgs = Array.prototype.slice.call(arguments, 0);
    var schema;
    if(initialArgs.length === extraArgLength){
      schema = {};
    }
    else{
      schema = initialArgs.pop();
    }
    var compiled = Schema(schema);

    if(initialArgs.length != extraArgLength){
      var extraParamNames = getParamNames(modifierFunc).slice(0, extraArgLength);
      throw Error('Middleware function missing extra argument(s): ' + extraParamNames);
    }

    var validator = function(value, options, object){

      var args = initialArgs.slice(0);
      args.push(value);
      args.push(options || {});
      args.push(object || {});
      args.push(compiled);

      return Promise.resolve(modifierFunc.apply(null, args));
    };

    return Schema({validate: validator});
  };
};

var STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
var ARGUMENT_NAMES = /([^\s,]+)/g;

function getParamNames(func) {
  var fnStr = func.toString().replace(STRIP_COMMENTS, '');
  var result = fnStr.slice(fnStr.indexOf('(')+1, fnStr.indexOf(')')).match(ARGUMENT_NAMES);
  if(result === null){
    result = [];
  }
  return result;
}

/**
Makes a schema optional.  If the value undefined is passed in, no errors are returned,
if anything else is passed in, regular schema validation is run.

@method
@param {Schema|Object} schema - the schema (or raw schema).
@return {Schema} A schema that can be used to validate optional values.

@example
```javascript
var maybeSchema = Schema({
  maybe: Field.optional({
    'error message': validatorFunction
  })
});

maybeSchema.validate(fieldValues, {
  // do not validate empty string values if field is optional:
  ignoreValueIfOptional: function(value) { return value === ''; }
});
```
*/
Field.optional = Field.createMiddleware(function(value, options, object, schema){
  var ignoreValueIfOptional = options.ignoreValueIfOptional;

  if((ignoreValueIfOptional && ignoreValueIfOptional(value)) || value === undefined){
    return null;
  }
  return schema.validate(value, options, object);
});

/**
Give a field an explicit required message.  If the field is undefined the given
message is added as an error.

@method
@param {String} message - The message to add as an error when the value
 of the field is undefined.
@param {Schema|Object} schema - the schema (or raw schema).
@return {Schema} A schema that will handle undefined values with the given
 message.

@example
```javascript
var definitelySchema = Schema({
  definitely: Field.required('The definitely field is required', {
    'error message': validatorFunction
  })
});
```
*/
Field.required = Field.createMiddleware(function(message, value, options, object, schema){
  if(value !== undefined){
    return schema.validate(value, options, object);
  }
  return [message];
});
