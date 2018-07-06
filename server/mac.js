'use strict';

const Logger = require('./logger');
const {execPromise} = require('./util');

function setWallpaper(fileName) {
  const path = `${__dirname}/${fileName}`;
  const appleScriptCommand =
    `tell application "Finder" to set desktop picture to "${path}" as POSIX file`;
  const command = `osascript -e '${appleScriptCommand}'`;
  Logger.info(`Setting wallpaper ${fileName}`);
  return execPromise(command);
}

module.exports = setWallpaper;
