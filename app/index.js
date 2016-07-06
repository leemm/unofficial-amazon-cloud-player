const electron = require('electron'),
    config = new (require('./lib/config.js'))(),
    helpers = require('./lib/helpers.js'),
    pkg = require('./package.json'),
    plist = new (require('./lib/plist.js'))(config),
    defaults = new (require('./lib/theme.js'))('defaults'),
    theme = new (require('./lib/theme.js'))('dark'),
    lastfm = new (require('./lib/last.fm.js'))(config, plist),
    { app, BrowserWindow, ipcMain, Menu, MenuItem } = electron;

let splash, win, prefs, currentPlayTimestamp, currentPlayTimestampInterval, initialLoadedCheck, initialLoaded = false;

app.setName(pkg.productName);

// Events
app.on('ready', () => {
    createMenu();
    createSplash();
    createWindow();
});

app.on('window-all-closed', () => {
    //if (process.platform !== 'darwin') {
        app.quit();
    //}
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

/**
 * on move and resize
 */
const trackWindowChange = function(win) {

    clearTimeout(win.resizedMovedFinished);
    win.resizedMovedFinished = setTimeout(function(){
        plist.set(win.getBounds());
    }, 1000);

}

// Splash/Loading screen
const createSplash = function() {

    let windowOpts = {
        backgroundColor: '#2e2c29',
        width: plist.get('width'),
        height: plist.get('height')
    };

    if (plist.get('x') && plist.get('y')){ windowOpts = Object.assign({ x: plist.get('x'), y: plist.get('y') }, windowOpts); }

    splash = new BrowserWindow(windowOpts);

    splash.loadURL(`file://${__dirname}/splash.html`);

    splash.on('ready-to-show', () => {
        splash.show();
    });
    splash.on('closed', () => { splash = null; });

}

// Windows
const createWindow = function() {

    let windowOpts = {
        show: false,
        backgroundColor: '#2e2c29',
        width: plist.get('width'),
        height: plist.get('height')
    };

    if (plist.get('x') && plist.get('y')){ windowOpts = Object.assign({ x: plist.get('x'), y: plist.get('y') }, windowOpts); }

    win = new BrowserWindow(windowOpts);

    win.loadURL(`file://${__dirname}/index.html`);

    if (config.get('debug') === true){ win.webContents.openDevTools(); }

    win.on('move', () => { trackWindowChange(win); });
    win.on('resize', () => { trackWindowChange(win); });
    win.on('ready-to-show', () => {
        initialLoaded = true;
    });
    win.on('closed', () => { win = null; });

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

var currentTrackHash = '', switchedDisplay = false;

ipcMain.on('loading', (event) => {
    if (!switchedDisplay){

        switchedDisplay = true;
        splash.close();
        win.show();

    }
});

ipcMain.on('prefs', (event, formValues) => {
    let requiresRefresh = plist.get('show_prime').toString() != formValues.show_prime.toString();

    plist.set(formValues);

    if (requiresRefresh){ event.sender.send('refresh'); }
});

ipcMain.on('track', (event, track) => {
    if (track && track.indexOf('{') > -1){ track = JSON.parse(track); }

    let scrobble_percent = plist.get('scrobble_percent') ? parseInt(plist.get('scrobble_percent'), 10) : 50;

    if (track.hash !== currentTrackHash){
        currentTrackHash = track.hash;
        lastfm.info(track)
            .then(tracks => {

                if (currentPlayTimestampInterval){ clearInterval(currentPlayTimestampInterval); }

                currentPlayTimestamp = tracks.timestamp;
                currentPlayTimestampInterval = setInterval(() => {
                    currentPlayTimestamp += 3000;

                    let percentage = (currentPlayTimestamp - tracks.timestamp) / (tracks.endTimestamp - tracks.timestamp) * 100;

                    if (config.get('debug') === true){ console.log('percentage', percentage); }

                    if (percentage >= scrobble_percent){

                        if (config.get('debug') === true){ console.log('ready to scrobble'); }

                        lastfm.scrobble(tracks)
                            .then(result => { console.log(require('util').inspect(result, false, null)); })
                            .catch(err => { console.error(err); });

                        clearInterval(currentPlayTimestampInterval);

                    }
                }, 3000);

            })
            .catch(err => {
                console.error(err);
            });
    }
});

ipcMain.on('defaults', (event) => {
    event.sender.send('theme-reply', defaults.css);
});

ipcMain.on('loaded', (event) => {
    event.sender.send('done');
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

ipcMain.on('debug-prefs', (event) => {
    console.log('debug-prefs', plist);
});

ipcMain.on('prime', (event) => {
    if (plist.get('show_prime').toString() != 'true'){ event.sender.send('prime-reply', require('./prime-hide.json')); }
});

ipcMain.on('theme', (event) => {
    event.sender.send('theme-reply', theme.css);
});