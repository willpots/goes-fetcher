'use strict';

const Logger = require('./logger');
const GOES = require('./goes');

Logger.severity = Logger.severities.INFO;

let running;

function run() {
  Logger.info(`Running at ${new Date}`);
  if (!running) {
    running = GOES.fetchLatestImage()
      .finally(() => running = undefined);
  } else {
    Logger.info(`Already running image downloader`);
  }
}

const timeInterval = 2 * 60 * 1000; // 2 minutes
// const timeInterval = 30 * 1000; // 5 minutes
let interval;

function startServer() {
  run();
  try {
    interval = setInterval(run, timeInterval);
  } catch (e) {
    Logger.error(e);
    clearInterval(interval);
    startServer();
  }
}


// start server on running
startServer();

