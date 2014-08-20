var _ = require('lodash');

var Schema = module.exports = exports = function(schema){
  if(schema instanceof Schema){
    return schema; // Dont create a new schema
  }
  if(!(this instanceof Schema)){
    return new Schema(schema);
  }
  this.rawSchema = schema;
  if(_.isObject(schema) && schema.hasOwnProperty('validate') && _.isFunction(schema.validate)){
    this.validate = schema.validate;
  }
  else if(_.isPlainObject(schema) && _.size(schema) > 0){
    var firstKey = _.first(_.keys(schema));
    var validateFunction;

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

Schema.prototype.validate = function(value, object, options){
  if(options === undefined){
    options = object;
    object = null;
  }

  options = getDefaults(options);

  if(value === undefined){
    return [options.isRequiredMessage];
  }
  else{
    var errors = this._validateFunction(value, object, options);
    return _.size(errors) == 0 ? null : errors;
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
      if(!validator(value, object, options)){
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
