const plist = require('plist'),
	os = require('os'),
	path = require('path'),
	fs = require('fs-extra'),
	helpers = require('./helpers.js');

class PList {
	constructor(config) {
		this.config = config;
		this.appPreferencePath = path.join(os.homedir(), 'Library/Preferences', this.config.get('appNamespace') + '.plist');
		this.defaults = {
			width: 1100,
			height: 700,
			scrobble_percent: 30
		};

		this._data = this._read();
	}

	/**
	 * Parse the Plist file
	 * @return {Object}
	 */
	_read() {

		// Initial setup
		fs.mkdirsSync(path.parse(this.appPreferencePath).dir);
		if (!helpers.exists(this.appPreferencePath)){ fs.writeFileSync(this.appPreferencePath, plist.build(this.defaults)); }

		// Read plist
		return plist.parse(fs.readFileSync(this.appPreferencePath, 'utf8'));

	}

	/**
	 * Save changes to the Plist file
	 */
	_write() {

		// Delete plist and replace
		if (helpers.exists(this.appPreferencePath)){ fs.unlinkSync(this.appPreferencePath); }
		fs.writeFileSync(this.appPreferencePath, plist.build(this._data));

	}

	/**
	 * get plist property
	 * @param  {String} key
	 */
	get(key) {
		return this._data && this._data[key] ? this._data[key] : '';
	}

	/**
	 * set plist property/ies
	 * @param {String} key (or object to bulk assign)
	 * @param {String} value
	 */
	set(key, value) {

		if (key instanceof Object){

			this._data = Object.assign(this._data, key);

		}else{

			if (this._data[key]){ delete this._data[key]; }
			this._data[key] = value;

		}

		this._write();
	}

}

module.exports = PList;
