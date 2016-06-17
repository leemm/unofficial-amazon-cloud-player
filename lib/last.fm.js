const API = require('last.fm.api'),
	fs = require('fs-extra'),
	helpers = require('./helpers.js');

class LastFM {
	constructor(config, plist) {
		this.config = config;
		this.plist = plist;
		this.api = new API({ 
	        apiKey: this.config.get('last.fm.apiKey'), 
	        apiSecret: this.config.get('last.fm.apiSecret'),
	        debug: config.get('debug') === true
	    });
	}

	/**
	 * Scrobble to last.fm
	 * @param  {[type]} track [description]
	 * @return {[type]}       [description]
	 */
	scrobble(track){

		// Use last.fm database to lookup track
		this.api.track.getInfo({
			artist: track.artist,
			track: track.track
		})
			.then(info => info.track)
			.then(track => {
				return { mbid: track.mbid, duration: parseInt(track.duration, 10) };
			})
			.then(meta => {

				let tracks = {
					artist: track.artist,
					track: track.track,
					timestamp: track.playStartTime
				}

				if (meta.mbid && meta.mbid.length > 0){ tracks.mbid = meta.mbid; }

				return this.api.track.scrobble({
					tracks: tracks,
					sk: this.plist.get('sk')
				})
					.then(json => { console.log(json); })
					.catch(err => { console.error(err); });

			})
   			.catch(err => { console.error(err); });

	}

}

module.exports = LastFM;
