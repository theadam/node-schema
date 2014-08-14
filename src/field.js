var _ = require('lodash');
var Schema = require('./schema');

var Field = module.exports = exports = {};

Field.createMiddleware = function(modifierFunc){
  return function(){
    var initialArgs = Array.prototype.slice.call(arguments, 0);
    var schema = initialArgs.pop();
    var compiled = Schema(schema);

    var validator = function(value, object, options){
      var args = initialArgs.slice(0);
      args.push(value);
      args.push(object);
      args.push(options);
      args.push(function(){
        return compiled.validate(value, object, options);
      }); // the next function

      return modifierFunc.apply(this, args);
    };

    return {validate: validator};
  };
};

Field.optional = Field.createMiddleware(function(value, object, options, next){
  if(value === undefined){
    return null;
  }
  return next();
});

Field.name = Field.createMiddleware(function(name, value, object, options, next){
  var messages = next();

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
