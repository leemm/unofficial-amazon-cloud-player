
const { ipcRenderer } = require('electron');

window.onload = function() {

	// md5 needed for hashing/track checking
	var script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/blueimp-md5/2.3.0/js/md5.min.js';
    script.onload = script.onreadystatechange = findTrackInfo();

    document.body.appendChild(script);

};

/**
 * Use jquery (already loaded by Last.FM) to search for the playing track info
 */
const findTrackInfo = function(){

    let currentTrackInfo = {};

	setInterval(function(){

		let parent = $('section.playbackControlsView'),
			track = parent.find('.trackTitleWrapper .trackTitle'),
			artist = parent.find('.trackInfoWrapper .trackArtist a span'),
			album = parent.find('.trackInfoWrapper .trackSourceLink span a'),
			art = parent.find('.trackAlbumArt .albumArtWrapper img');

		const setTrackInfo = function(){

			currentTrackInfo.artist = artist.text();
			currentTrackInfo.track = track.text();
			currentTrackInfo.album = album.length > 0 ? album.text() : '';
			currentTrackInfo.art = art.length > 0 ? art.attr('src') : '';

			currentTrackInfo.hash = generateHash(currentTrackInfo);
			currentTrackInfo.playStartTime = new Date().getTime();

		}

		if (artist.length > 0 && track.length > 0){

			// If already playing
			if (currentTrackInfo.hash){

				// If tracks are different i.e. new track update details
				let checkObj = {
					artist: artist.text(),
					track: track.text(),
					album: album.length > 0 ? album.text() : '',
					art: art.length > 0 ? art.attr('src') : ''
				}, checkHash = generateHash(checkObj);

				if (currentTrackInfo.hash !== checkHash){
					setTrackInfo();
				}

			}else{
				setTrackInfo();
			}

			ipcRenderer.send('track', JSON.stringify(currentTrackInfo));

		}

	}, 1000);

};

/**
 * Generate a hash for this track, to use internally
 * @param  {Object} trackInfo
 * @return {String} Hash
 */
const generateHash = function(trackInfo){

	let checkObj = {};

	for (let key in trackInfo){
		if (!( key == 'playStartTime' || key == 'hash' )){
			checkObj[key] = trackInfo[key];
		}
	}

	return md5(JSON.stringify(checkObj));

}
