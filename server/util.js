'use strict';

const Promise = require('bluebird');
const { exec } = require('child_process');
const Config = require('../common/config');

String.prototype.padStart = function(targetLength, paddedString = ' ') {
  let output = this.toString();
  while (output.length < targetLength) {
    output = paddedString + output;
  }
  return output;
};

const pad = (val, size = 3) => val.toString().padStart(size, '0');
const coords = (x, y, z) => ({x: pad(x), y: pad(y), z: pad(z, 2)});
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const range = ({max, min}) => {
  const output = [];
  for (let i = min; i < max; i++) {
    output.push(i);
  }
  return output;
}

function tuples() {
  const tuples = [];
  for (let y of range(Config.Bounds.Y)) {
    for (let x of range(Config.Bounds.X)) {
      tuples.push({x, y});
    }
  }
  return tuples;
}

function formatDate(timestamp) {
  //20170925031543
  timestamp = timestamp.toString();
  const year = timestamp.slice(0, 4);
  const month = timestamp.slice(4, 6);
  const day = timestamp.slice(6, 8);
  const hour = timestamp.slice(8, 10);
  const minute = timestamp.slice(10, 12);
  const seconds = timestamp.slice(12, 14);
  return `${year}/${month}/${day}/${hour}_${minute}_${seconds}`;
}

function execPromise(command) {
  return new Promise(function(resolve, reject) {
    exec(command, {
      shell: Config.Shell
    }, (err, stdout, stderr) => {
      if (err) {
        reject(err, stderr);
        return;
      }
      resolve(stdout);
    });
  });
}

module.exports = {
  pad,
  coords,
  sleep,
  range,
  tuples,
  formatDate,
  execPromise
};
