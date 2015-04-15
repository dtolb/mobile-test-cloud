/*
 * Toggle config source on a single environment variable named NODE_ENV
 *
 * If NODE_ENV === 'test' then an environment that is pre-configured with
 * values in <testConfig> is used.  Otherwise, configuration values are
 * taken from environment variables defined in <config>.
 */
var config;
var testConfig;
var path = require('path');

config = {
	server: {
		port: process.env.PORT || 8081,
		url: process.env.SERVER_URL
	},
	logging: {
		request: {
			level: process.env.REQUEST_LOG_LEVEL || 'combined'
		},
		app: {
			level: process.env.APP_LOG_LEVEL || 'info'
		}
	},
	directories: {
		tests: path.join(__dirname,'./../../tmp/tests'),
		repos: path.join(__dirname,'./../../tmp/repos'),
	},
	s3: {},
	github: {
		username:  process.env.GITHUB_USERNAME,
		password:  process.env.GITHUB_PASSWORD,
		pullRequest: {
			runOn: ['opened', 'reopened', 'synchronize']
		}
	},
	testConfigFileName: 'mtc_config.json'
};

testConfig = {
	server: {
		port: 8081,
		url: 'http://localhost:8081'
	},
	logging: {
		request: {
			level: 'dev'
		},
		app: {
			level: process.env.APP_LOG_LEVEL || 'info'
		}
	},
	directories: {
		tests: path.join(__dirname,'./../../tmp/tests'),
		repos: path.join(__dirname,'./../../tmp/repos'),
	},
	github: {
		username: 'dtolb',
		password: 'password',
		pullRequest: {
			runOn: ['opened', 'reopened', 'synchronize']
		}
	},
};

module.exports = (process.env.NODE_ENV === 'test') ? testConfig : config;
