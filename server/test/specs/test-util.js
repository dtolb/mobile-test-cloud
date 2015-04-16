var utils = require('./../../lib/utils.js');
var expect = require('chai').expect;
var fx     = require('node-fixtures');
var Promise = require('bluebird');
var sinon   = require('sinon');
var glob = require('glob');
var config = require('./../../lib/config.js');
var Joi = require('joi');
var fs = require('fs');

describe('lib.util', function () {

	describe('::validateTestConfig', function () {
		var joiValidateStub;

		describe('When testConfig is not formatted correctly', function () {
			beforeEach(function () {
				joiValidateStub = sinon.stub(Joi, 'validate', function () {
					return {error: 'error'};
				});
			});
			afterEach(function () {
				joiValidateStub.restore();
			});
			it('should return false', function () {
				var isValid = utils.validateTestConfig({a: 'b'});
				expect(isValid).to.be.false;
			});
		});

		describe('When testConfig is formatted correctly', function () {
			beforeEach(function () {
				joiValidateStub = sinon.stub(Joi, 'validate', function () {
					return {error: null};
				});
			});
			afterEach(function () {
				joiValidateStub.restore();
			});
			it('should return true', function () {
				var isValid = utils.validateTestConfig({a: 'b'});
				expect(isValid).to.be.true;
			});
		});
	});

	describe('::locateTestConfig', function () {
		var globAsyncStub;
		describe('When testConfig is not found', function () {
			beforeEach(function () {
				globAsyncStub = sinon.stub(glob, 'globAsync', function () {
					return Promise.resolve([]);
				});
			});
			afterEach(function () {
				globAsyncStub.restore();
			});
			it('should throw a new error', function () {
				var testInfo = fx.starting_info;
				testInfo.local = {
					repo: '',
				};
				return utils.locateTestConfig(testInfo)
					.catch(function (e) {
						expect(e.message).to.equal('Test config not valid, or too many configs found!');
					});
			});
		});
		describe('When more than one testConfig is found', function () {
			beforeEach(function () {
				globAsyncStub = sinon.stub(glob, 'globAsync', function () {
					return Promise.resolve(['1','2']);
				});
			});
			afterEach(function () {
				globAsyncStub.restore();
			});
			it('should throw a new error', function () {
				var testInfo = fx.starting_info;
				testInfo.local = {
					repo: '',
				};
				return utils.locateTestConfig(testInfo)
					.catch(function (e) {
						expect(e.message).to.equal('Test config not valid, or too many configs found!');
					});
			});
		});
		describe('When testConfig is found', function () {
			var fsStub;
			beforeEach(function () {
				globAsyncStub = sinon.stub(glob, 'globAsync', function () {
					return Promise.resolve(['1']);
				});
			});
			afterEach(function () {
				globAsyncStub.restore();
			});
			describe('and it can open the file', function () {
				var validateTestConfigStub;
				var tmpJson = {
					three: 3
				};
				beforeEach(function () {
					fsStub = sinon.stub(fs, 'readFileAsync', function () {
						return Promise.resolve(JSON.stringify(tmpJson));
					});
				});
				afterEach(function () {
					fsStub.restore();
				});
				describe('and the config is valid', function () {
					beforeEach(function () {
						validateTestConfigStub = sinon.stub(utils, 'validateTestConfig', function () {
							return true;
						});
					});
					afterEach(function () {
						validateTestConfigStub.restore();
					});
					it('should attach the testConfig to the testInfo Object', function () {
						var testInfo = fx.starting_info;
						testInfo.local = {
							repo: '',
						};
						return utils.locateTestConfig(testInfo)
							.then(function (res) {
								expect(res.testConfig).to.deep.equal(tmpJson);
							});
					});
				});
				describe('and the config is NOT valid', function () {
					beforeEach(function () {
						validateTestConfigStub = sinon.stub(utils, 'validateTestConfig', function () {
							return false;
						});
					});
					afterEach(function () {
						validateTestConfigStub.restore();
					});
					it('should throw a new error', function () {
						var testInfo = fx.starting_info;
						testInfo.local = {
							repo: '',
						};
						return utils.locateTestConfig(testInfo)
							.then(function (res) {
								expect(res).to.equal('undefined');
							})
							.catch(function (e) {
								expect(e.message).to.equal('Test Config not valid!');
							});
					});
				});
			});
			describe('and it can NOT open the file', function () {
				beforeEach(function () {
					fsStub = sinon.stub(fs, 'readFileAsync', function () {
						return Promise.reject(new Error('Fail'));
					});
				});
				afterEach(function () {
					fsStub.restore();
				});
				it('should throw a new error', function () {
					var testInfo = fx.starting_info;
					testInfo.local = {
						repo: '',
					};
					return utils.locateTestConfig(testInfo)
							.catch(function (e) {
								expect(e.message).to.equal('Fail');
							});
				});
			});
			describe('and it is NOT valid JSON', function () {
				beforeEach(function () {
					fsStub = sinon.stub(fs, 'readFileAsync', function () {
						return Promise.resolve('string');
					});
				});
				afterEach(function () {
					fsStub.restore();
				});
				it('should throw a SyntaxError', function () {
					var testInfo = fx.starting_info;
					testInfo.local = {
						repo: '',
					};
					return utils.locateTestConfig(testInfo)
							.catch(function (e) {
								expect(e.name).to.equal('SyntaxError');
							});
				});
			});
		});
	});

});