const rp = require('request-promise');
var fs = require('fs');
const gm = require('gm').subClass({imageMagick: true});
const { exec } = require('child_process');
const Promise = require('bluebird');

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

function openFile(fileName) {
// 'state.json'
  return new Promise(function(resolve, reject) {
    fs.readFile(fileName, 'utf8', function (err,data) {
      if (err) {
        reject(err);
      }
      resolve(data);
    });
  });
}

function saveFile(fileName, contents) {
  return new Promise(function(resolve, reject) {
    fs.writeFile(fileName, contents, function(err) {
        if(err) {
          reject(err);
        }
        resolve();
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

const pad = (val, size = 3) => val.toString().padStart(size, '0');
const coords = (x, y, z) => ({x: pad(x), y: pad(y), z: pad(z, 2)});

const StateFile = 'state.json';
const Convert = '/usr/local/bin/convert';
const ApiBase = 'http://rammb-slider.cira.colostate.edu/data/json/goes-16/full_disk/geocolor';
const ImageryBase = 'http://rammb-slider.cira.colostate.edu/data/imagery';
const latestTimesUrl = `${ApiBase}/latest_times.json`;

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function getLatestTime() {
  return rp(latestTimesUrl)
    .then(JSON.parse)
    .then(({timestamps_int: [timestamp]}) => timestamp.toString())
    .then((time) => {
      console.log(`Fetching images for ${time}`);
      return createOptionsObject(time);
    });
}

function createOptionsObject(time) {
  const tag = formatDate(time);
  return {
    time,
    tag,
    date: time.slice(0, 8),
    fileName: `output/current_world_${tag}.png`
  };
}

const makeFolders = () => execPromise('mkdir -p output/tiles');

const range = ({max, min}) => {
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

function downloadImagesP(date, time) {
  return tuples().reduce((promise, {x, y}) => {
    return promise.then(() => {
      return download(imageUrl(date, time, coords(x, y, zoom)), imageName(coords(x, y, zoom)))
        .then(() => sleep(100));
    });
  }, Promise.resolve());
}

function mergeImages(fileName) {
  const promises = [];
  let finalCommand = range(Config.bounds.y).reduce((command, y) => {
    let rowCommand = range(Config.bounds.x)
      .reduce((s, x) => s + ` ${imageName(coords(x, y, zoom))}`, `${Convert} `);
    rowCommand += ` +append output/row_${y}.png`;
    console.log(rowCommand);
    promises.push(execPromise(rowCommand));

    return command + ` output/row_${y}.png`;
  }, `${Convert} `);
  finalCommand += ` -append ${fileName}`;
  console.log(finalCommand);
  return Promise.all(promises).then(() => execPromise(finalCommand));
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

const imageUrl = (date, time, {x, y, z}) =>
  `${ImageryBase}/${date}/goes-16---full_disk/geocolor/${time}/${z}/${y}_${x}.png`;

const imageName = ({x, y, z}) => `output/tiles/${z}_${y}_${x}.png`;

const setWallpaper = (fileName) =>
  execPromise(`osascript -e 'tell application "Finder" to set desktop picture` +
    ` to "${__dirname}/${fileName}" as POSIX file'`);

function checkState(options) {
  return openFile(StateFile)
    .then(JSON.parse)
    .then(({images}) => {
      if (images[options.time]) {
        throw new Error('Image exists, no need to run script.');
      }
    });
}

function updateOptions(options) {
  return openFile(StateFile)
    .then(JSON.parse)
    .then((state) => {
      state.images[options.time] = options;
      return JSON.stringify(state);
    })
    .then((contents) => saveFile(StateFile, contents));
}

Promise.resolve()
  .tap(() => console.log('running goes fetcher!', new Date()))
  .then(makeFolders)
  .then(getLatestTime)
  .tap(checkState)
  .tap(({date, time}) => downloadImagesP(date, time))
  .tap(({fileName}) => mergeImages(fileName))
  .tap(({fileName}) => setWallpaper(fileName))
  .tap(updateOptions)
  .tap(cleanUp)
  .catch((e, uri) => console.log(e, uri))
  .catch(console.error)
  .tap(() => console.log('completed goes fetcher', new Date()))
