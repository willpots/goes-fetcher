const fs = require('fs');
const Promise = require('bluebird');
const Logger = require('../common/logger');

function callback(resolve, reject) {
  return function(err, data) {
    if (err) {
      reject(err);
    } else {
      resolve(data);
    }
  }
}

function openFile(fileName) {
  return new Promise(function(resolve, reject) {
    fs.readFile(fileName, 'utf8', callback(resolve, reject));
  });
}

function openJson(fileName) {
  return openFile(fileName)
    .then(JSON.parse);
}

function saveFile(fileName, contents) {
  return new Promise((resolve, reject) => {
    fs.writeFile(fileName, contents, callback(resolve, reject));
  });
}

function deleteFile(fileName) {
  return new Promise((resolve, reject) => {
    fs.exists(fileName, (exists) => {
      if(exists) {
        fs.unlink(fileName, callback(resolve, reject));
      } else {
        Logger.info(`Couldn't delete: ${fileName}. File does not exist.`);
      }
      resolve();
    });
  });
}

async function writeFile(fileName, data) {
  return new Promise((resolve, reject) => {
    fs.writeFile(fileName, data, (err) => {
      if (err) {
        reject(err);
      }
      resolve();
    });
  });
}

function appendFile(fileName, contents) {
  return new Promise((resolve, reject) => {
    fs.appendFile(fileName, contents, callback(resolve, reject));
  });
}

module.exports = {
  appendFile,
  deleteFile,
  openFile,
  saveFile,
  writeFile,
  openJson
};
