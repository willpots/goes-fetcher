'use strict';

const download = require('./download');
const {Bounds, Convert, ImageryBase, Zoom} = require('./config');
const Promise = require('bluebird');
const util = require('./util');
const Logger = require('./logger');

const imageUrl = (date, time, {x, y, z}) =>
  `${ImageryBase}/${date}/goes-16---full_disk/geocolor/${time}/${z}/${y}_${x}.png`;

const imageName = ({x, y, z}) => `output/tiles/${z}_${y}_${x}.png`;

const makeFolders = () => util.execPromise('mkdir -p output/tiles');
const cleanUpFolders = () => util.execPromise(`rm -r output/row_* output/tiles/`);

function downloadImagesP(date, time) {
  return util.tuples().reduce((promise, {x, y}) => {
    return promise.then(() => {
      const coords = util.coords(x, y, Zoom);
      return download(imageUrl(date, time, coords), imageName(coords))
        .then(() => util.sleep(100));
    });
  }, Promise.resolve());
}

function mergeImages(fileName) {
  const promises = [];
  let finalCommand = util.range(Bounds.Y).reduce((command, y) => {
    let rowCommand = util.range(Bounds.X)
      .reduce((s, x) => s + ` ${imageName(util.coords(x, y, Zoom))}`, `${Convert} `);
    rowCommand += ` +append output/row_${y}.png`;
    Logger.info(rowCommand);
    promises.push(util.execPromise(rowCommand));

    return command + ` output/row_${y}.png`;
  }, `${Convert} `);
  finalCommand += ` -append ${fileName}`;
  Logger.info(finalCommand);
  return Promise.all(promises).then(() => util.execPromise(finalCommand));
}

function createImage(date, time, fileName) {
  return makeFolders()
    .tap(() => downloadImagesP(date, time))
    .tap(() => mergeImages(fileName))
    .tap(() => cleanUpFolders());
}

module.exports = createImage;
