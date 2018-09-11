// Modules to control application life and create native browser window
const {app, BrowserWindow, Tray, Menu} = require('electron')
const rp = require('request-promise');

const Logger = require('../common/logger');
const Repeater = require('../common/repeater');
const {fetchLatestImage} = require('./download');

Logger.severity = Logger.severities.INFO;

let running;

async function run() {
  // TODO replace this
  Logger.info(`Running at ${new Date}`);
  if (!running) {
    try {
      running = fetchLatestImage();
      await running;
    } catch (e) {
      Logger.error(e);
    }
    running = undefined;
  } else {
    Logger.info(`Already running image downloader`);
  }
}

const repeater = new Repeater(30 * 1000);
repeater.start(() => run());

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow
let tray;

function createTrayIcon() {
  Logger.info('Creating Tray Icon');
  tray = new Tray('./images/globe.png')
  const contextMenu = Menu.buildFromTemplate([
    {label: 'Quit', type: 'normal', click: () => app.quit()}
  ])
  tray.setToolTip('This is my application.')
  tray.setContextMenu(contextMenu)
}

function init() {
  Logger.info('App Data Path', app.getPath('appData'));
  createTrayIcon();
}

app.on('ready', init)

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', function () {
  Logger.info('You clicked the Astronaut icon!');
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
