Unofficial Amazon Music Player
==============================

[![Build Status](https://travis-ci.org/leemm/last.fm.api.svg?branch=master)](https://travis-ci.org/leemm/last.fm.api)

Alternative [Amazon Music Player](https://music.amazon.co.uk) which supports audio scrobbling via Last.FM (since Amazon won't put it in their official app).

# Download

[https://github.com/leemm/unofficial-amazon-cloud-player/blob/master/dist/osx/Unofficial%20Amazon%20Player-0.1.1.dmg](https://github.com/leemm/unofficial-amazon-cloud-player/blob/master/dist/osx/Unofficial%20Amazon%20Player-0.1.1.dmg)

# Requirements

* Mac OS X 10.8 or later

# To Do

* Windows and Linux support
* Theming (almost there)

# Development

The Application uses [Atom Electron](http://electron.atom.io/).  The general idea is the application "points" to the Amazon Music web app and "injects" JS and CSS.

To set up locally do the following:

```
git clone https://github.com/leemm/unofficial-amazon-cloud-player.git
npm install -g electron-bin
npm install
npm start
```

To build check the npm scripts in package.json.  **npm run -scriptname-**.