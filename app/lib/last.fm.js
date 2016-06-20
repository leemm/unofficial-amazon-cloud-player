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
	 * Get last.fm API token
	 * @return {Promise}
	 */
	token() {

		return this.api.auth.getToken({})
			.then(json => json.token);

	}

	/**
	 * Get last.fm API session
	 * @param  {Object} token
	 * @return {Promise}
	 */
	session(token) {

		return this.api.auth.getSession({
			token: token.token
		})
			.then(json => json.session);

	}

	/**
	 * Track info to last.fm
	 * @param  {Object} track
	 * @return {Promise}
	 */
	info(track){

		// Use last.fm database to lookup track
		return this.api.track.getInfo({
			artist: track.artist,
			track: track.track
		})
			.then(info => info.track)
			.then(track => {
				return { mbid: track.mbid, duration: parseInt(track.duration, 10) || 60000 };
			})
			.then(meta => {

				let tracks = {
					artist: track.artist,
					track: track.track,
					timestamp: track.playStartTime
				}

				if (meta.mbid && meta.mbid.length > 0){ tracks.mbid = meta.mbid; }
				tracks.duration = meta.duration;
				tracks.endTimestamp = track.playStartTime + meta.duration;

				return tracks;

			});

	}

	/**
	 * Track scrobble to last.fm
	 * @param  {Object} track
	 * @return {Promise}
	 */
	scrobble(track){

		console.log('to scrobble', track);

		if (track.duration){ delete track.duration; }
		if (track.endTimestamp){ delete track.endTimestamp; }

		return this.api.track.scrobble({
			tracks: track,
			sk: this.plist.get('sk')
		});

	}

}

module.exports = LastFM;
