require('es6-promise').polyfill();

var _ = require('lodash');
var getDefaults = require('./utils/get-defaults');

/**
Schema constructor.  Produces a compiled schema from a raw schema.  If a compiled
schema is passed in as the schema argument, it is returned untouched.

@class
@param {Schema|Object} schema - If another Schema, that Schema is returned, if
 a raw schema, the raw schema is compiled into a new Schema.

Examples:

```javascript
new Schema(existingSchema); //=> existingSchema is returned
```

```javascript
var schema = new Schema({'must be greater than 5': function(val){return > 5}});

schema.validate(4).then(function(result){
  // result => ['must be greater than 5'];
});
```

```javascript
var schema = new Schema({
  username: {
    'must contain more than 5 characters': function(val){val.length > 5}
  }
);

schema.validate({username: '1234'}).then(function(result){
  // result => {username: ['must contain more than 5 characters']};
});
```

```javascript
var validator = {
  validate: function(value){
    var result = value > 5 ? null : ['must be greater than 5'];
    return Promise.resolve(result);
  }
};

var schema = new Schema(validator); // the validator object's validate method is used directly;

schema.validate(4).then(function(result){
  // result => ['must be greater than 5']
});
```
*/
var Schema = function(schema){
  if(schema instanceof Schema){
    return schema; // Dont create a new schema
  }
  if(!(this instanceof Schema)){
    return new Schema(schema); // if the constructor wasnt called, call it
  }

  this.rawSchema = schema;
  if(schema && _.isFunction(schema.validate)){
    this.validate = schema.validate;
  }
  else{
    this._validateFunction = createValidateFunction(schema);
  }
};

module.exports = exports = Schema;

/**
Validates the value against the schema
@param  {*}        value     - The value to validate
@param  {Object}   [options] - An object containing validation options
@param  {Object}   [object]  - The object the value was contained within
@return {Promise}  A Promise that resolves to the result of the validation.  For
 nested objects, this should be an object.  For single value
 validations, this should be an array of errors.  If there are no
 errors, this promise will resolve to null.
*/
Schema.prototype.validate = function(value, options, object){
  options = getDefaults(options, Schema.defaultOptions);

  if(value === undefined){
    return Promise.resolve([options.isRequiredMessage]);
  }
  else{
    return Promise.resolve(this._validateFunction(value, options, object))
    .then(function(errors){
      return _.size(errors) === 0 ? null : errors;
    }
  );
}
};

/**
@property isRequiredMessage {String}  - The error message returned when a required value is undefined
@property failFast          {boolean} - If true, every invalid value will only respond with an array
          containing only their first error message.
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

  var validator = function(value, options, object){
    var messages = {};
    var promises = [];
    _.forIn(compiled, function(schema, field){
      promises.push(
        Promise.resolve(schema.validate(value[field], options, value))
        .then(function(message){
          if(_.size(message) > 0){
            messages[field] = message;
          }
        })
      );
    });

    return Promise.all(promises).then(function(){return messages;});
  };

  return validator;
};

var createValueValidator = function(schema){
  var validator = function(value, options, object){
    var promises = [];

    _.forIn(schema, function(validator, message){
      promises.push(
        Promise.resolve(validator(value, options, object))
        .then(function(validationResult){
          if(!validationResult){
            return message;
          }
        }
      )
    );
  });

  return Promise.all(promises)
  .then(function(vals){return _.compact(vals);}) // remove undefineds
  .then(function(vals){return options.failFast ? [_.first(vals)] : vals;}) //handle fail fast
  .then(function(vals){return _.size(vals) > 0 ? vals : null;}); // return the array or null
};

return validator;
};

function createValidateFunction(schema){
  if(!_.isPlainObject(schema)) throw new Error('unsupported schema definition ' + JSON.stringify(schema));
  if(_.size(schema) === 0){
    return function(){
      return Promise.resolve(null);
    };
  }
  var firstKey = _.first(_.keys(schema));

    /*!
    We use the first value in the raw schema to determine what 'shape'
    the raw schema is in.  If the schema has values that are functions,
    they are value validators like:

    {'error message', validatingFunction}

    If the schema's value is another object, this is a nested schema like:

    {'field' : schemaOrRawSchema};
    */

    if(_.isFunction(schema[firstKey])){
      // this is a value validator
      return createValueValidator(schema);
    }
    else if(_.isObject(schema[firstKey])){
      // this is an object validator
      return createObjectValidator(schema);
    }
    else{
      var def = {};
      def[firstKey] = schema[firstKey];
      throw new Error('unsupported schema definition ' + JSON.stringify(def));
    }
}
