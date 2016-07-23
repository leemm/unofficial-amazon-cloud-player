
const { ipcRenderer } = require('electron');
let spinner;

window.onload = function() {

	loadScripts(() => {
    	ipcRenderer.send('defaults');

    	// LOADING
    	let loader = $('<div id="spinner-outer"></div>');

    	spinner = new Spinner({ color: '#FFF' }).spin();
    	$(spinner.el).prependTo(loader);

    	loader.prependTo('body');

    	checkForLoaded();
    	findTrackInfo();
    });

};

/**
 * Inject scripts into dom
 */
const loadScripts = function(callback){

	var md5 = document.createElement('script');
    md5.src = 'https://cdnjs.cloudflare.com/ajax/libs/blueimp-md5/2.3.0/js/md5.min.js';
    md5.onload = md5.onreadystatechange = () => {

    	var spin = document.createElement('script');
	    spin.src = 'https://cdnjs.cloudflare.com/ajax/libs/spin.js/2.3.2/spin.min.js';
	    spin.onload = spin.onreadystatechange = () => {

	    	callback();

	    }

	    document.body.appendChild(spin);

    }

    document.body.appendChild(md5);

}

/**
 * Check if the "app" has the loading indicator
 */
const checkForLoaded = function(){

	let loaded = setInterval(function(){
		let signInDisplay = $('h1').text() == 'Sign In',
			display = $('#mainContentLoadingSpinner').css('display') || '';

		if (signInDisplay){

			ipcRenderer.send('loading');
			setTimeout(function(){
				clearInterval(loaded);
				ipcRenderer.send('loaded');
			}, 2000); // artificial timeout

		}else{
			if (display && display === 'none'){
				ipcRenderer.send('loading');
				clearInterval(loaded);
				ipcRenderer.send('loaded');
			} else if (display.length === 0){
				setTimeout(function(){ ipcRenderer.send('loading'); }, 200);
			}
		}

	}, 100);

};

/**
 * Use jquery (already loaded by Last.FM) to search for the playing track info
 */
const findTrackInfo = function(){

	ipcRenderer.send('theme');
	ipcRenderer.send('prime');

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

	}, 3000);

};

/**
 * Hijack links to prevent redraw of right column (prime) if not wanted
 */
const hijackLeftLinks = function(){
	$('.libraryPanel a').click(function(ev){
		ev.preventDefault();
	});
}

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

/**
 * set display:none to css selectors defined in prime-hide.json
 * @param  {Array} selectors
 * @return {Boolean} success
 */
const hideElements = function(selectors){
	let found = false;

	selectors.map(el => {
		el = $(el.value);

		if (el && el.length > 0){
			el.css('display', 'none');
			found = true;
		}
	});

	return found;
}

/**
 * some elements are persistent (i.e. the Download Buttons), use setInterval it keep checking for them
 * @param  {Array} selectors
 */
const hidePersistentElement = function(selectors){

	selectors.map(el => {
		let persistent = el && el.persistent && el.persistent === true ? true : false;

		el = $(el.value);

		if (el && el.length > 0 && persistent){
			if (el.css('display') != 'none'){ el.css('display', 'none'); }
		}
	});

}

/**
 * It prime is hidden resize the list view
 */
const resizeList = function(){

	let width = parseInt($(window).width()) - parseInt($('#left-content').width(), 10);

	$('#main-content-wrapper,#center-content').width(width - 1);

}

ipcRenderer.on('done', (event) => {
	$('#spinner-outer').fadeOut();
});

ipcRenderer.on('prime-reply', (event, selectors) => {

	if (selectors && selectors.cssSelectors){
		let timeoutCheck;

		timeoutCheck = setInterval(() => {
			if (hideElements(selectors.cssSelectors)){
				clearInterval(timeoutCheck);

				resizeList();
			}
		}, 1000);

		hijackLeftLinks();

		// Persistent
		setInterval(() => {
			resizeList();
			hidePersistentElement(selectors.cssSelectors);
		}, 1000);

	}

});

ipcRenderer.on('theme-reply', (event, theme) => {
	$('<style>' + theme + '</style>').appendTo('head');
});
