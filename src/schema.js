var _ = require('lodash');

module.exports = exports = Schema = function(schema){
  if(!this instanceof Schema){
    return new Schema(schema);
  }
  if(_.isObject(schema) && schema.hasOwnProperty('validate') && _.isFunction(schema.validate)){
    return schema; // if the schema is a function with a validate method, its good to use
  }

  if(_.isPlainObject(schema) && _.size(schema) > 0){
    var firstKey = _.first(_.keys(schema));
    var validateFunction;

    if(_.isFunction(schema[firstKey])){
      // this is a value validator
      validateFunction = createValueValidator(schema);
    }
    else if(_.isObject(schema[firstKey])){
      // this is an object validator
      validateFunction = createObjectValidator(schema);
    }
    else{
      var def = {};
      def[firstKey] = schema[firstKey];
      throw new Error('unsupported schema definition ' + JSON.stringify(def));
    }

    return {
      validate: function(value, object, options){

        if(options === undefined){
          options = object || undefined;
          object = null;
        }

        options = getDefaults(options);

        if(value === undefined){
          return [options.isRequiredMessage];
        }
        else{
          var errors = validateFunction(value, object, options);
          return _.size(errors) == 0 ? null : errors;
        }
      }
    };

  }
  else{
    throw new Error('unsupported schema definition ' + JSON.stringify(schema));
  }

};

var getDefaults = function(options){
  return _.defaults(options || {},{
    isRequiredMessage: 'is required',
    failFast: false
  });
};

var createObjectValidator = function(schema){
  var compiled = {};

  _.forIn(schema, function(subSchema, field){
    compiled[field] = Schema(subSchema);
  });

  var validator = function(value, object, options){
    var messages = {};

    _.forIn(compiled, function(schema, field){
      var message = schema.validate(value[field], value, options)
      if(_.size(message) > 0){
        messages[field] = message;
      }
    });

    return messages;
  }

  return validator;
}

var createValueValidator = function(schema){
  var validator = function(value, object, options){
    var messages = [];

    _.forIn(schema, function(validator, message){
      if(!validator(value, object)){
        if(options.failFast){
          messages = [message];
          return false;
        }
        messages.push(message);
      }
    });

    return messages;
  }

  return validator;
};
