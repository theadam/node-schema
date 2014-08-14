var _ = require('lodash');
var Schema = require('./schema');

module.exports = exports = Field = {};

Field.createModifier = function(modifierFunc){
  return function(){
    var args = Array.prototype.slice.call(arguments, 0);
    var schema = args.pop();
    var compiled = Schema(schema);

    var validator = function(value, object, options){
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

Field.optional = Field.createModifier(function(value, object, options, next){
  if(value === undefined){
    return null;
  }
  return next();
});

Field.name = Field.createModifier(function(name, value, object, options, next){
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
