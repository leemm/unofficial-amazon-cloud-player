'use strict';

const fs = require('fs-extra'),
    util = require('util'),
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

    /**
     * dump entire object so can be used in console.log
     * @param  {Object} obj
     * @return {String}
     */
    static dump(obj){
        return util.inspect(obj, false, null);
    }
}

module.exports = Helpers;
