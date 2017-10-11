const Config = require('./config');
const {appendFile} = require('./file');

const Logger = {
  severity: 2,
  severities: {
    DEBUG: 0,
    VERBOSE: 1,
    INFO: 2,
    WARN: 3,
    ERROR: 4
  },
  tag: {
    DEBUG: 'debug',
    VERBOSE: 'verbose',
    INFO: 'info',
    WARN: 'warn',
    ERROR: 'error'
  },
  method: {
    DEBUG: console.log,
    VERBOSE: console.log,
    INFO: console.log,
    WARN: console.warn,
    ERROR: console.error
  },
  _logMessage(severity, message) {
    if (Logger.severities[severity] < Logger.severity) {
      return;
    }
    const _timestamp = new Date().toString();
    const _message = `[${Logger.tag[severity]}] ${_timestamp}: ${message}`;
    Logger.method[severity](_message);
    appendFile(Config.LogPath, `${_message}\n`);
  },
  debug(message) {
    Logger._logMessage('DEBUG', message);
  },
  verbose(message) {
    Logger._logMessage('VERBOSE', message);
  },
  info(message) {
    Logger._logMessage('INFO', message);
  },
  warn(message) {
    Logger._logMessage('WARN', message);
  },
  error(message) {
    Logger._logMessage('ERROR', message);
  }
};

module.exports = Logger;