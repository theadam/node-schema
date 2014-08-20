var _ = require('lodash');
var Schema = require('./schema');

var Field = module.exports = exports = {};

Field.createMiddleware = function(modifierFunc){
  return function(){
    var initialArgs = Array.prototype.slice.call(arguments, 0);
    var schema = initialArgs.pop();
    var compiled = Schema(schema);

    var validator = function(value, object, options){
      if(options === undefined){
        options = object;
        object = null;
      }

      var args = initialArgs.slice(0);
      args.push(value);
      args.push(object || {});
      args.push(options || {});
      args.push(compiled);

      return modifierFunc.apply(null, args);
    };

    return {validate: validator};
  };
};

Field.optional = Field.createMiddleware(function(value, object, options, schema){
  if(value === undefined){
    return null;
  }
  return schema.validate(value, object, options);
});

Field.name = Field.createMiddleware(function(name, value, object, options, schema){
  var messages = schema.validate(value, object, options);

  if(_.isArray(messages) && _.size(messages) > 0){
    return _.map(messages, function(message){
      if(_.isString(message)){
        return message.replace(/\{name\}/g, name);
      }
      return message;
    });
  }

  return messages;

});

Field.only = Field.createMiddleware(function(value, object, options, schema){
  var message = options.unknownFieldMessage || 'contains an unknown field: {field}';
  var unknownKeys = _.difference(_.keys(value), _.keys(schema.rawSchema));

  if(_.size(unknownKeys) > 0){
    var messages = [];
    _.each(unknownKeys, function(key){
      messages.push(message.replace(/\{field\}/g, key));
    });
    return messages;
  }
  else{
    return schema.validate(value, object, options);
  }
});
