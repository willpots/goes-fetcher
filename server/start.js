'use strict';

const Logger = require('../common/logger');
const Repeater = require('../common/repeater');
const GOES = require('./goes');

Logger.severity = Logger.severities.INFO;

let running;

async function run() {
  Logger.info(`Running at ${new Date}`);
  if (!running) {
    try {
      running = GOES.fetchLatestImage();
      await running;
    } catch (e) {
      Logger.error(e);
    }
    running = undefined;
  } else {
    Logger.info(`Already running image downloader`);
  }
}

const repeater = new Repeater();
repeater.start(() => run());
