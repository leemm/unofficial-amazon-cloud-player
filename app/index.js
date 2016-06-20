const electron = require('electron'),
    config = require('./config.js'),
    pkg = require('./package.json'),
    plist = new (require('./lib/plist.js'))(config),
    lastfm = new (require('./lib/last.fm.js'))(config, plist),
    { app, BrowserWindow, ipcMain, Menu, MenuItem } = electron;

let win, prefs, currentPlayTimestamp, currentPlayTimestampInterval;

app.setName(pkg.productName);


// Events
app.on('ready', () => {
    createMenu();
    createWindow();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (win === null) { createWindow(); }
});


// Menu
const createMenu = function(){

    const name = app.getName();

    var template = [
        {
            label: name,
            submenu: [
                { type: 'normal', label: 'About ' + name },
                { type: 'separator' },
                { type: 'normal', label: 'Preferences...', accelerator: 'Command+,', click: () => { createPrefs(true); } },
                { type: 'separator' },
                { type: 'normal', label: 'Hide ' + name, accelerator: 'Command+H', role: 'hide' },
                { type: 'normal', label: 'Hide Others', role: 'hideothers', accelerator: 'Command+Alt+H' },
                { type: 'normal', label: 'Show All', role: 'unhide' },
                { type: 'separator' },
                { type: 'normal', label: 'Quit', accelerator: 'Command+Q', click: () => { app.quit(); } }
            ]
        },
    ];

    Menu.setApplicationMenu(Menu.buildFromTemplate(template));

}

// Windows
const createWindow = function() {
    win = new BrowserWindow({ width: plist.get('width'), height: plist.get('height') });

    win.loadURL(`file://${__dirname}/index.html`);

    if (config.get('debug') === true){ win.webContents.openDevTools(); }

    win.on('closed', () => {
        win = null;
    });
}

const createPrefs = function(show) {
    prefs = new BrowserWindow({
        width: 400,
        height: 400,
        show: false,
        resizable: false,
        minimizable: false,
        maximizable: false,
        fullscreenable: false,
        alwaysOnTop: true
    });

    let showPrime = plist.get('show_prime').toString() == 'true' ? true : false,
        sk = plist.get('sk');

    prefs.loadURL(`file://${__dirname}/prefs.html?key=${config.get('last.fm.apiKey')}&show_prime=${showPrime}&sk=${sk}`);

    if (show){ prefs.show(); }

    prefs.on('closed', () => {
        prefs = null;
    });
}


// IPC Handling

var currentTrackHash = '';

ipcMain.on('prefs', (event, formValues) => {
    plist.set(formValues);
});

ipcMain.on('track', (event, track) => {
    if (track && track.indexOf('{') > -1){ track = JSON.parse(track); }

    let scrobble_percent = plist.get('scrobble_percent') ? parseInt(plist.get('scrobble_percent'), 10) : 20;

    if (track.hash !== currentTrackHash){
        currentTrackHash = track.hash;
        lastfm.info(track)
            .then(tracks => {

                currentPlayTimestamp = tracks.timestamp;
                currentPlayTimestampInterval = setInterval(() => {
                    currentPlayTimestamp += 1000;

                    let percentage = (currentPlayTimestamp - tracks.timestamp) / (tracks.endTimestamp - tracks.timestamp) * 100;
                    console.log('percentage', percentage);
                    if (percentage >= scrobble_percent){

                        console.log('ready to scrobble');

                        lastfm.scrobble(tracks)
                            .then(result => { console.log(require('util').inspect(result, false, null)); })
                            .catch(err => { console.error(err); });

                        clearInterval(currentPlayTimestampInterval);

                    }
                }, 1000);

            })
            .catch(err => {
                console.error(err);
            });
    }
});

ipcMain.on('token', (event) => {

    lastfm.token()
        .then(token => {
            event.sender.send('token-reply', { err: null, token: token });
        })
        .catch(err => {
            event.sender.send('token-reply', { err: err, token: null });
        });

});

ipcMain.on('session', (event, token) => {

    lastfm.session(token)
        .then(session => {
            event.sender.send('session-reply', { err: null, session: session });
        })
        .catch(err => {
            event.sender.send('session-reply', { err: err, session: null });
        });

});

ipcMain.on('app_debug', (event, data) => {
    console.log('debug', data);
});