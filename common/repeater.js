const Logger = require('./logger');

class Repeater {
  constructor(timeInterval = 2 * 60 * 1000) { // 2 minutes
    this.interval;
    this.timeInterval = timeInterval;
  }

  start(func) {
    this.func = func;
    try {
      func();
      this.interval = setInterval(func, this.timeInterval);
    } catch (e) {
      Logger.error(e);
      clearInterval(this.interval);
      this.start();
    }
  }

  stop() {
    clearInterval(this.interval);
  }
}

module.exports = Repeater;
