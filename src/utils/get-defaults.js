var _ = require('lodash');

module.exports = function(options, defaults){
  return _.defaults(options || {}, defaults || {});
};
