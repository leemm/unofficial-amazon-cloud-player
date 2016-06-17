'use strict';

const convict = require('convict'),
	path = require('path'),
	rootDir = require('app-root-dir').get(),
	config = convict({
		env: {
			doc: 'The application environment.',
			format: ['production', 'development'],
			default: 'development',
			env: 'NODE_ENV',
			arg: 'node-env',
		}
	}),
	devMode = config.get('env') !== 'production';

config.loadFile('./config/' + config.get('env') + '.json');

config['_instance'].port = process.env.PORT || config['_instance'].port;

module.exports = config;
