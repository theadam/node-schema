/** @module Schema */
var _ = require('lodash');
var Q = require('q');
var getDefaults = require('./utils/get-defaults');


/**
* Schema constructor.  Produces a compiled schema from a raw schema.  If a compiled
* schema is passed in as the schema argument, it is returned untouched.
*
* @constructor
* @param {Schema|Object} schema - If another Schema, that Schema is returned, if
*                                 a raw schema, the raw schema is compiled into a
*                                 new Schema.
* @example
* new Schema(existingSchema); //=> existingSchema is returned
* @example
* var schema = new Schema({'must be greater than 5': function(val){return > 5}});
* schema.validate(4).then(function(result){
*   // result => ['must be greater than 5'];
* });
* @example
* var schema = new Schema({
*   username: {
*     'must contain more than 5 characters': function(val){val.length > 5}
*   }
* );
* schema.validate({username: '1234'}).then(function(result){
*   // result => {username: ['must contain more than 5 characters']};
* });
* @example
* var validator = {
*   validate: function(value){
*     var result = value > 5 ? null : ['must be greater than 5'];
*     return Promise.resolve(result);
*   }
* };
* var schema = new Schema(validator); // the validator object's validate method is used directly;
* schema.validate(4).then(function(result){
*   // result => ['must be greater than 5']
* });
*/
var Schema = function(schema){
  if(schema instanceof Schema){
    return schema; // Dont create a new schema
  }
  if(!(this instanceof Schema)){
    return new Schema(schema); // if the constructor wasnt called, call it
  }

  this.rawSchema = schema;
  this._compile();
};

module.exports = exports = Schema;

Schema.prototype._compile = function(){

  var schema = this.rawSchema;

  if(_.isObject(schema) && _.isFunction(schema.validate)){
    // use the validate function from an object with a validation function
    this.validate = schema.validate;
  }
  else if(_.isPlainObject(schema) && _.size(schema) > 0){
    var firstKey = _.first(_.keys(schema));
    var validateFunction;

    /*
    We use the first value in the raw schema to determine what 'shape'
    the raw schema is in.  If the schema has values that are functions,
    they are value validators like:

    {'error message', validatingFunction}

    If the schema's value is another object, this is a nested schema like:

    {'field' : schemaOrRawSchema};
    */

    if(_.isFunction(schema[firstKey])){
      // this is a value validator
      this._validateFunction = createValueValidator(schema);
    }
    else if(_.isObject(schema[firstKey])){
      // this is an object validator
      this._validateFunction = createObjectValidator(schema);
    }
    else{
      var def = {};
      def[firstKey] = schema[firstKey];
      throw new Error('unsupported schema definition ' + JSON.stringify(def));
    }
  }
  else{
    throw new Error('unsupported schema definition ' + JSON.stringify(schema));
  }

};

/**
* Uses the {Schema} to validate the value.
*
* @param  {*}        value     - The value to validate
* @param  {Object}   [object]  - The object the value was contained within
* @param  {Object}   [options] - An object containing validation options
* @return {Promise}  A Promise that resolves to the result of the validation.  For
*                    nested objects, this should be an object.  For single value
*                    validations, this should be an array of errors.  If there are no
*                    errors, this promise will resolve to null.
*/
Schema.prototype.validate = function(value, object, options){
  if(options === undefined){
    options = object;
    object = null;
  }

  options = getDefaults(options, Schema.defaultOptions);

  if(value === undefined){
    return Q.resolve([options.isRequiredMessage]);
  }
  else{
    return Q.resolve(this._validateFunction(value, object, options))
    .then(function(errors){
      return _.size(errors) === 0 ? null : errors;
    }
  );
}
};

/**
* @property isRequiredMessage {String}  - The error message returned when a required value is undefined
* @property failFast          {boolean} - If true, every invalid value will only respond with an array
*                                         containing only their first error message.
*
*/
Schema.defaultOptions = {
  isRequiredMessage: 'is required',
  failFast: false
};

///////////////
// Privates  //
///////////////

var createObjectValidator = function(schema){
  var compiled = {};

  _.forIn(schema, function(subSchema, field){
    compiled[field] = Schema(subSchema);
  });

  var validator = function(value, object, options){
    var messages = {};
    var promises = [];
    _.forIn(compiled, function(schema, field){
      promises.push(
        Q.resolve(schema.validate(value[field], value, options))
        .then(function(message){
          if(_.size(message) > 0){
            messages[field] = message;
          }
        })
      );
    });

    return Q.all(promises).then(function(){return messages;});
  };

  return validator;
};

var createValueValidator = function(schema){
  var validator = function(value, object, options){
    var promises = [];

    _.forIn(schema, function(validator, message){
      promises.push(
        Q.resolve(validator(value, object, options))
        .then(function(validationResult){
          if(!validationResult){
            return message;
          }
        }
      )
    );
  });

  return Q.all(promises)
  .then(function(vals){return _.compact(vals);}) // remove undefineds
  .then(function(vals){return options.failFast ? [_.first(vals)] : vals;}) //handle fail fast
  .then(function(vals){return _.size(vals) > 0 ? vals : null;}); // return the array or null
};

return validator;
};
