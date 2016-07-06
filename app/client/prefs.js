const { ipcRenderer } = require('electron');

let formValues;

window.onload = function() {

	formValues = document.location.search ? $.querystring(document.location.search) : {};

	//ipcRenderer.send('debug-prefs');

	setForm();

	// Change form fields

	$('#show_prime').bind('click', function(ev) {
		formValues['show_prime'] = $(this).is(':checked');
		setForm();
		ipcRenderer.send('prefs', formValues);
	});

	$('#last_fm_auth').bind('click', ev => {
		ev.preventDefault();
		ipcRenderer.send('token');
	});

};

/**
 * Set form values
 */
const setForm = function() {
	$('#show_prime').prop('checked', formValues.show_prime.toString() === 'true');
	$('#last_fm_auth span').text((formValues.sk && formValues.sk.length > 0 ? 'Logout' : 'Authorise'));
};

/**
 * Show/Hide webview
 * @param  {Boolean} show
 * @param  {Object} token
 */
const showHideLastFM = function(show, token) {

	$('#webview').css({ 'visibility': (show ? 'visible' : 'hidden') });
	$('#form-container').css({ 'visibility': (!show ? 'visible' : 'hidden') });

	let webview = document.getElementById('webview');

	if (show){
		webview.loadURL('http://www.last.fm/api/auth/?api_key=' + formValues.key + '&token=' + token.token);

		webview.addEventListener('dom-ready', () => {
			webview.findInPage('Application authenticated', { matchCase : true });
		});

		webview.addEventListener('found-in-page', result => {

			// Check if authenticated success message as appeared and then close the last.fm webview
			let finished = (result && result.result && result.result.matches > 0);

			if (finished){
				ipcRenderer.send('session', token);
				setTimeout(() => {
					showHideLastFM(false);
				}, 1000);
			}

		});

	}else{
		webview.loadURL('about:blank');
	}

}

ipcRenderer.on('token-reply', (event, token) => {
	if (token.err){ alert(JSON.stringify(token.err)); return; }
	showHideLastFM(true, token);
});

ipcRenderer.on('session-reply', (event, session) => {
	if (session.err){ alert(JSON.stringify(session.err)); return; }
	formValues['sk'] = session.session.key;

	setForm();
	ipcRenderer.send('prefs', formValues);
});

ipcRenderer.on('refresh', () => {
	alert('This setting requires you to restart the app to see your changes.');
});