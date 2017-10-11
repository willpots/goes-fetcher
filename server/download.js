'use strict';

const UAHeader = ' -H "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/44.0.2403.89 Safari/537.36"';
const KeepAliveHeader = '-H "Connection: keep-alive"';
const {MaxRetries} = require('./config');
const Promise = require('bluebird');
const {execPromise} = require('./util');
const Logger = require('./logger');

function curlCommand(uri, fileName) {
  return `curl ${UAHeader} ${KeepAliveHeader} ${uri} > ${fileName}`
}

function download(uri, fileName) {
  let retries = MaxRetries;
  Logger.verbose(`downloading ${uri}`);
  const downloadCommand = curlCommand(uri, fileName);
  return Promise.resolve()
    .then(() => execPromise(downloadCommand))
    .then(() => Logger.verbose(`downloaded ${uri}`))
    .catch((e) => {
      if (retries) {
        retries -= 1;
        Logger.info('retrying ', uri);
        return execPromise(downloadCommand)
      } else {
        Logger.error(`Downloading ${uri} failed because: ${e}`);
        throw e;
      }
    });
}

module.exports = download;