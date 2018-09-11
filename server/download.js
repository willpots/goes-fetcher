'use strict';

const Promise = require('bluebird');
const request = require('request').defaults({encoding: null});

const Logger = require('../common/logger');

async function download(uri) {
  return new Promise(function(resolve, reject) {
    Logger.verbose(`downloading ${uri}`);
    request.get(uri, function (err, res, body) {
      if (err) {
        Logger.error(`Downloading ${uri} failed because: ${err}`);
        reject(err);
      }
      Logger.verbose(`downloaded ${uri}`);
      resolve(body);
    });
  });
}

module.exports = download;
