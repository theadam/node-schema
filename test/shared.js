require('es6-promise').polyfill();

global.chai = require('chai');
global.should = require('chai').should();
global.expect = require('chai').expect;
var chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
