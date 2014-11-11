require('es6-promise').polyfill();

var Schema = require('./src/schema');
var Field = require('./src/field');

module.exports = exports = Schema;

Schema.Field = Field;
