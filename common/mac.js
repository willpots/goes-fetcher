'use strict';

const Logger = require('../common/logger');
const {execPromise} = require('../common/util');

function setWallpaper(path) {
  const appleScriptCommand =
    `tell application "Finder" to set desktop picture to "${path}" as POSIX file`;
  const command = `osascript -e '${appleScriptCommand}'`;
  Logger.info(`Setting wallpaper ${path}`);
  return execPromise(command);
}

module.exports = {setWallpaper};
