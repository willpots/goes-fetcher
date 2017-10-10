const fs = require('fs');
const Promise = require('bluebird');

function openFile(fileName) {
// 'state.json'
  return new Promise(function(resolve, reject) {
    fs.readFile(fileName, 'utf8', function (err,data) {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
}

function openJson(fileName) {
  return openFile(fileName)
    .then(JSON.parse);
}

function saveFile(fileName, contents) {
  return new Promise(function(resolve, reject) {
    fs.writeFile(fileName, contents, function(err) {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

function appendFile(fileName, contents) {
  return new Promise(function(resolve, reject) {
    fs.appendFile(fileName, contents, function(err) {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

module.exports = {
  appendFile,
  openFile,
  saveFile,
  openJson
};