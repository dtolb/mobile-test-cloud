var expect = require('chai').expect;
var logging = require('./../../lib/logging.js');

describe('lib.logging', function () {
	var config;

	beforeEach(function () {
		config = {
			request: {
				level: 'default'
			},
			app: {
				level: 'info'
			},
			logentries: {
				token: 'dummy',
				level: 'info',
				secure: true
			}
		};
	});

	describe('createWinstonLogger', function () {

		it('should create a logger Object', function () {
			var logger = logging.createWinstonLogger(config);
			expect(logger.transports).to.include.keys('console');
		});

	});
});