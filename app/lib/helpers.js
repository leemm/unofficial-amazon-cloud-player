'use strict';

const fs = require('fs-extra'),
	path = require('path');

class Helpers {
	constructor() { }

    /**
     * Checks if file exists.  Returns file object or null.
     * @param  {String} filePath
     * @return {String}
     */
    static exists(filePath){

    	try {
    		let stats = fs.statSync(filePath);
    		return stats.isFile() || stats.isDirectory();
    	}catch(err){
    		return false;
    	}
    }
}

module.exports = Helpers;
