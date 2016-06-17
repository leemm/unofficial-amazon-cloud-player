const electron = require('electron'),
    config = require('./config.js'),
    pkg = require('./package.json'),
    plist = new (require('./lib/plist.js'))(config),
    lastfm = new (require('./lib/last.fm.js'))(config, plist),
    { app, BrowserWindow, ipcMain, Menu, MenuItem } = electron;

let win, prefs;

app.setName(pkg.productName);

// Events
app.on('ready', () => {
    createWindow();
    createPrefs();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (win === null) {
        createWindow();
        createPrefs();
    }
});


// Windows
const createWindow = function() {
    win = new BrowserWindow({ width: plist.get('width'), height: plist.get('height') });

    win.loadURL(`file://${__dirname}/index.html`);

    if (config.get('debug') === true){ win.webContents.openDevTools(); }

    win.on('closed', () => {
        win = null;
    });
}

const createPrefs = function() {
    prefs = new BrowserWindow({
        width: 400,
        height: 400,
        show: false
    });

    prefs.loadURL(`file://${__dirname}/prefs.html`);

    prefs.on('closed', () => {
        prefs = null;
    });
}


// Menu

// const name = app.getName();

// var menu = Menu.buildFromTemplate([
//   {
//     label: 'Electron',
//     submenu: [
//       {
//         label: 'Prefs',
//         click: function(){
//           alert('hello menu');
//         }
//       }
//     ]
//   }
// ]);
// Menu.setApplicationMenu(menu);


// IPC Handling

var currentTrackHash = '';

ipcMain.on('toggle-prefs', () => {
    if (prefsWindow.isVisible()){ prefsWindow.hide(); } else { prefsWindow.show(); }
});

ipcMain.on('track', (event, track) => {
    if (track && track.indexOf('{') > -1){ track = JSON.parse(track); }

    if (track.hash !== currentTrackHash){
        currentTrackHash = track.hash;
        lastfm.scrobble(track);
    }
});
