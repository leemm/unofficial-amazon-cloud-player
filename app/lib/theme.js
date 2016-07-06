const path = require('path'),
	fs = require('fs-extra');

class Theme {
	constructor(theme) {
		this._theme = theme;
		this.css = this._read();
	}

	/**
	 * Parse the CSS file
	 * @return {String}
	 */
	_read() {
		return fs.readFileSync(path.join(__dirname, '../themes/' + this._theme + '.css'), 'utf8');
	}

}

module.exports = Theme;
