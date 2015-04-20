var expect = require('chai').expect;
var fx     = require('node-fixtures');
var Promise = require('bluebird');
var sinon   = require('sinon');
var child_process = require('child_process');
var config = require('./../../lib/config.js');
var tester = require('./../../lib/tester.js');

describe('lib.tester', function () {
	beforeEach(function () {
		fx.reset();
	});
	describe('::installTests', function () {
		var testInfo = fx.starting_info;
		testInfo.testConfig = {
			installCommand: 'cmd'
		};
		testInfo.local = {
			tests: 'testDir'
		};

		describe('When exec succeeds', function () {
			var execStub;
			var execResults = ['stdout', 'stderr'];
			beforeEach(function () {
				execStub = sinon.stub(child_process, 'execAsync', function () {
					return Promise.resolve(execResults);
				});
			});

			afterEach(function () {
				execStub.restore();
			});

			it('shoud add the stdout to testInfo.results.install', function () {
				return tester.installTests(testInfo)
					.then(function (res) {
						expect(res.results.install).to.equal(execResults[0]);
					});
			});
		});

		describe('When exec fails', function () {
			var execStub;

			describe('and error.code !== 0', function () {
				beforeEach(function () {
					execStub = sinon.stub(child_process, 'execAsync', function () {
						return Promise.reject(new Error('Fail'));
					});
				});

				afterEach(function () {
					execStub.restore();
				});
				it('should throw a new error "Unable to Install tests"', function () {
					return tester.installTests(testInfo)
						.then(function (res) {
							expect(res).to.be.undefined;
						})
						.catch(function (e) {
							expect(e.message).to.equal('Unable to install tests');
						});

				});
			});
			describe('and error.code === 0', function () {
				beforeEach(function () {
					execStub = sinon.stub(child_process, 'execAsync', function () {
						var error = {
							code: 0,
							error: new Error('Fail')
						};
						return Promise.reject(error);
					});
				});

				afterEach(function () {
					execStub.restore();
				});
				it('should throw a new error "Unknown error installing tests"', function () {
					return tester.installTests(testInfo)
						.then(function (res) {
							expect(res).to.be.undefined;
						})
						.catch(function (e) {
							expect(e.message).to.equal('Unknown error installing tests');
						});

				});
			});
		});

		describe('When calling exec', function () {
			var execStub;

			beforeEach(function () {});

			afterEach(function () {
				execStub.restore();
			});

			it('should call exec with options.cwd set to testInfo.local.tests', function () {
				execStub = sinon.stub(child_process, 'execAsync', function (command, options) {
					expect(options.cwd).to.equal(testInfo.local.tests);
					return Promise.resolve([1,2]);
				});
				return tester.installTests(testInfo);
			});

			it('should call exec with command set to testInfo.testConfig.installCommand', function () {
				execStub = sinon.stub(child_process, 'execAsync', function (command, options) {
					expect(command).to.equal(testInfo.testConfig.installCommand);
					return Promise.resolve([1,2]);
				});
				return tester.installTests(testInfo);
			});
		});

	});
	describe('::runTest', function () {
		var testInfo = fx.starting_info;
		testInfo.testConfig = {
			testCommand: 'cmd'
		};
		testInfo.local = {
			tests: 'testDir'
		};

		describe('When exec succeeds', function () {
			var execStub;
			var execResults = ['stdout', 'stderr'];
			beforeEach(function () {
				execStub = sinon.stub(child_process, 'execAsync', function () {
					return Promise.resolve(execResults);
				});
			});

			afterEach(function () {
				execStub.restore();
			});

			it('shoud add the stdout to testInfo.results.testResults', function () {
				return tester.runTest(testInfo)
					.then(function (res) {
						expect(res.results.testResults).to.equal(execResults[0]);
					});
			});
		});

		describe('When exec fails', function () {
			var execStub;

			describe('and error.code !== 0', function () {
				beforeEach(function () {
					execStub = sinon.stub(child_process, 'execAsync', function () {
						return Promise.reject(new Error('Fail'));
					});
				});

				afterEach(function () {
					execStub.restore();
				});
				it('should throw a new error "Tests Failed"', function () {
					return tester.runTest(testInfo)
						.then(function (res) {
							expect(res).to.be.undefined;
						})
						.catch(function (e) {
							expect(e.message).to.equal('Tests Failed!');
						});

				});
			});
			describe('and error.code === 0', function () {
				beforeEach(function () {
					execStub = sinon.stub(child_process, 'execAsync', function () {
						var error = {
							code: 0,
							error: new Error('Fail')
						};
						return Promise.reject(error);
					});
				});

				afterEach(function () {
					execStub.restore();
				});
				it('should throw a new error "Unknown error running tests"', function () {
					return tester.runTest(testInfo)
						.then(function (res) {
							expect(res).to.be.undefined;
						})
						.catch(function (e) {
							expect(e.message).to.equal('Unknown error running tests');
						});

				});
			});
		});

		describe('When calling exec', function () {
			var execStub;

			beforeEach(function () {});

			afterEach(function () {
				execStub.restore();
			});

			it('should call exec with options.cwd set to testInfo.local.tests', function () {
				execStub = sinon.stub(child_process, 'execAsync', function (command, options) {
					expect(options.cwd).to.equal(testInfo.local.tests);
					return Promise.resolve([1,2]);
				});
				return tester.runTest(testInfo);
			});

			it('should call exec with command set to testInfo.testConfig.testCommand', function () {
				execStub = sinon.stub(child_process, 'execAsync', function (command, options) {
					expect(command).to.equal(testInfo.testConfig.testCommand);
					return Promise.resolve([1,2]);
				});
				return tester.runTest(testInfo);
			});
		});

	});

});