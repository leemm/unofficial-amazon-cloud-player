class Config {
	constructor() {
		this._data = require('../config.json');
	}

	/**
	 * get plist property
	 * @param  {String} key
	 */
	get(key) {
		let parts = key.split('.');

		if (this._data){
			let conf = Object.assign({}, this._data);

			parts.map(part => {
				conf = conf[part] ? conf[part] : '';
			});

			return conf;
		}else{
			return '';
		}

		return this._data && this._data[key] ? this._data[key] : '';
	}

}

module.exports = Config;
