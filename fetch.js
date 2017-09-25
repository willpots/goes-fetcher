// const url = `http://rammb-slider.cira.colostate.edu/data/imagery/20170925/goes-16---full_disk/geocolor/20170925000043/04/002_004.png`;
const fs = require('fs');
const request = require('request');
const rp = require('request-promise');
const { exec: ex } = require('child_process');

function exec(command) {
  return new Promise(function(resolve, reject) {
    ex(command, (err, stdout, stderr) => {
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

// const download = function(uri, filename, retries = 3){
//   return new Promise(function(resolve, reject) {
//     try {
//       request.head(uri, function(err, res, body){
//         if (err) {
//           throw err;
//         } else {
//           request(uri).pipe(fs.createWriteStream(filename)).on('close', resolve);
//         }
//       });
//     } catch (e) {
//       if (retries) {
//         console.log(`Error fetching ${uri}, retrying`);
//         return download(uri, filename, retries - 1).then(resolve);
//       } else {
//         console.log(`Error fetching ${uri}`);
//         reject(e, uri);
//       }
//     }
//   });
// };

const uaHeader = ' -H "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/44.0.2403.89 Safari/537.36"';
const keepAliveHeader = '-H "Connection: keep-alive"';

function download(uri, filename) {
  let retries = 2;
  console.log('downloading ', uri);
  const downloadCommand = `curl ${uaHeader} ${keepAliveHeader} ${uri} > ${filename}`;
  return Promise.resolve()
    .then(() => exec(downloadCommand))
    .then(() => console.log('downloaded ', uri))
    .catch((e) => {
      if (retries) {
        retries -= 1;
        console.log('retrying ', uri);
        return exec(downloadCommand)
      } else {
        throw e;
      }
    });
}
const zoom = 4;
const maxIndex = Math.pow(2, zoom);

const yBounds = {min: 0, max: 6};
const xBounds = {min: 3, max: 11};
const latestTimesUrl = `http://rammb-slider.cira.colostate.edu/data/json/goes-16/full_disk/geocolor/latest_times.json`;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getLatestTime() {
  return rp(latestTimesUrl)
    .then(JSON.parse)
    .then(({timestamps_int: [timestamp]}) => {
      console.log('Fetching images for', timestamp);
      date = formatDate(timestamp);
      return timestamp.toString();
    });
}

function makeFolders() {
  return exec('mkdir -p output/tiles');
}

function trimTime(time) {
  return {time, date: time.slice(0, 8)};
}

function downloadImages(date, time) {
  let chain = Promise.resolve();
  const z = zoom.toString().padStart(2, '0');
  for (let yIndex = yBounds.min; yIndex < yBounds.max; yIndex++) {
    const y = yIndex.toString().padStart(3, '0');
    for (let xIndex = xBounds.min; xIndex < xBounds.max; xIndex++) {
      const x = xIndex.toString().padStart(3, '0');
      chain = chain.then(() => {
        return download(imageUrl(date, time, x, y, z), imageName(x, y, z))
          .then(() => sleep(5000));
      });
    }
  }
  return chain;
}

function mergeImages() {
  const promises = [];
  let finalCommand = 'convert ';
  const z = zoom.toString().padStart(2, '0');
  for (let yIndex = yBounds.min; yIndex < yBounds.max; yIndex++) {
    const y = yIndex.toString().padStart(3, '0');
    let rowCommand = 'convert ';
    for (let xIndex = xBounds.min; xIndex < xBounds.max; xIndex++) {
      const x = xIndex.toString().padStart(3, '0');
      rowCommand += ' ' + imageName(x, y, z);
    }
    rowCommand += ` +append output/row_${y}.png`;
    finalCommand += ` output/row_${y}.png`;
    console.log(rowCommand);
    promises.push(exec(rowCommand));
  }
  fileName = `output/current_world_${date}.png`;
  finalCommand += ` -append ${fileName}`;
  console.log(finalCommand);
  return Promise.all(promises).
    then(() => {
      return exec(finalCommand);
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
  return exec(`rm -r output/row_* output/tiles/`);
}

function imageUrl(date, time, x, y, z) {
  return `http://rammb-slider.cira.colostate.edu/data/imagery/${date}/goes-16---full_disk/geocolor/${time}/${z}/${y}_${x}.png`;
}

function imageName(x, y, z) {
  return `output/tiles/${z}_${y}_${x}.png`;
}

function setWallpaper() {
  return exec(`osascript -e 'tell application "Finder" to set desktop picture to "${__dirname}/${fileName}" as POSIX file'`);
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
