const rp = require('request-promise');
const gm = require('gm').subClass({imageMagick: true});
const { exec } = require('child_process');

function execPromise(command) {
  return new Promise(function(resolve, reject) {
    exec(command, {
      shell: '/bin/zsh'
    }, (err, stdout, stderr) => {
      if (err) {
        reject(err, stderr);
        return;
      }
      resolve(stdout);
    });
  });
}

String.prototype.padStart = function(targetLength, paddedString = ' ') {
  let output = this.toString();
  while (output.length < targetLength) {
    output = paddedString + output;
  }
  return output;
};

const uaHeader = ' -H "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/44.0.2403.89 Safari/537.36"';
const keepAliveHeader = '-H "Connection: keep-alive"';

function download(uri, filename) {
  let retries = 2;
  console.log('downloading ', uri);
  const downloadCommand = `curl ${uaHeader} ${keepAliveHeader} ${uri} > ${filename}`;
  return Promise.resolve()
    .then(() => execPromise(downloadCommand))
    .then(() => console.log('downloaded ', uri))
    .catch((e) => {
      if (retries) {
        retries -= 1;
        console.log('retrying ', uri);
        return execPromise(downloadCommand)
      } else {
        throw e;
      }
    });
}
const zoom = 4;
const maxIndex = Math.pow(2, zoom);

// Boundary for the US (at zoom 4)
const Config = {
  zoom: 4,
  bounds: {
    x: {min: 3, max: 11},
    y: {min: 0, max: 6}
  }
};

const ApiBase = 'http://rammb-slider.cira.colostate.edu/data/json/goes-16/full_disk/geocolor';
const ImageryBase = 'http://rammb-slider.cira.colostate.edu/data/imagery';
const latestTimesUrl = `${ApiBase}/latest_times.json`;

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function getLatestTime() {
  return rp(latestTimesUrl)
    .then(JSON.parse)
    .then(({timestamps_int: [timestamp]}) => {
      console.log('Fetching images for', timestamp);
      date = formatDate(timestamp);
      return timestamp.toString();
    });
}

const makeFolders = () => execPromise('mkdir -p output/tiles');
const trimTime = (time) => ({time, date: time.slice(0, 8)});

function range({max, min}) {
  const output = [];
  for (let i = min; i < max; i++) {
    output.push(i);
  }
  return output;
}

function tuples() {
  const tuples = [];
  for (let y of range(Config.bounds.y)) {
    for (let x of range(Config.bounds.x)) {
      tuples.push({x, y});
    }
  }
  return tuples;
}

// function downloadImagesP(date, time) {
//   const z = zoom.toString().padStart(2, '0');
//   tuples().reduce((promise, {x, y}) => {
//     return promise.then(() => {
//       const yi = y.toString().padStart(3, '0');
//       const xi = x.toString().padStart(3, '0');
//       return download(imageUrl(date, time, x, y, z), imageName(x, y, z))
//         .then(() => sleep(100));
//     });
//   }, Promise.resolve());
// }

function downloadImages(date, time) {
  let chain = Promise.resolve();
  const z = zoom.toString().padStart(2, '0');
  for (let yIndex of range(Config.bounds.y)) {
    const y = yIndex.toString().padStart(3, '0');
    for (let xIndex of range(Config.bounds.x)) {
      const x = xIndex.toString().padStart(3, '0');
      chain = chain.then(() => {
        return download(imageUrl(date, time, x, y, z), imageName(x, y, z))
          .then(() => sleep(100))
      });
    }
  }
  return chain;
}

function mergeImages() {
  const promises = [];
  const convert = '/usr/local/bin/convert';
  let finalCommand = `${convert} `;
  const z = zoom.toString().padStart(2, '0');
  for (let yIndex = Config.bounds.y.min; yIndex < Config.bounds.y.max; yIndex++) {
    const y = yIndex.toString().padStart(3, '0');
    let rowCommand = `${convert} `;
    for (let xIndex = Config.bounds.x.min; xIndex < Config.bounds.x.max; xIndex++) {
      const x = xIndex.toString().padStart(3, '0');
      rowCommand += ' ' + imageName(x, y, z);
    }
    rowCommand += ` +append output/row_${y}.png`;
    finalCommand += ` output/row_${y}.png`;
    console.log(rowCommand);
    promises.push(execPromise(rowCommand));
  }
  fileName = `output/current_world_${date}.png`;
  finalCommand += ` -append ${fileName}`;
  console.log(finalCommand);
  return Promise.all(promises).
    then(() => {
      return execPromise(finalCommand);
    });
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
  return `${year}_${month}_${day}_${hour}_${minute}_${seconds}`;
}

function cleanUp() {
  return execPromise(`rm -r output/row_* output/tiles/`);
}

function imageUrl(date, time, x, y, z) {
  return `${ImageryBase}/${date}/goes-16---full_disk/geocolor/${time}/${z}/${y}_${x}.png`;
}

function imageName(x, y, z) {
  return `output/tiles/${z}_${y}_${x}.png`;
}

function setWallpaper() {
  return execPromise(`osascript -e 'tell application "Finder" to set desktop picture to "${__dirname}/${fileName}" as POSIX file'`);
}

let date = '';
let fileName = '';
Promise.resolve()
  .then(makeFolders)
  .then(getLatestTime)
  .then(trimTime)
  .then(({date, time}) => downloadImages(date, time))
  .then(mergeImages)
  .then(cleanUp)
  .then(setWallpaper)
  .catch((e, uri) => console.log(e, uri));
