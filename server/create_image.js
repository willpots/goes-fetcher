'use strict';

const blend = require('@mapbox/blend');
const {saveFile} = require('./aws');
const Logger = require('../common/logger');
const download = require('./download');
const {Bounds, ImageryBase, Zoom} = require('../common/config');
const Promise = require('bluebird');
const util = require('./util');

const imageUrl = (date, time, {x, y, z}) =>
  `${ImageryBase}/${date}/goes-16---full_disk/geocolor/${time}/${z}/${y}_${x}.png`;

const imageName = ({x, y, z}) => `output/tiles/${z}_${y}_${x}.png`;

const IMAGE_SIZE = 678;

async function downloadImagesP(date, time) {
  const IMAGES = [];
  for (const {x, y} of util.tuples()) {
    const coords = util.coords(x, y, Zoom);
    IMAGES[x] = IMAGES[x] || [];
    Logger.info('Downloading ' + imageUrl(date, time, coords));
    IMAGES[x][y] = await download(
      imageUrl(date, time, coords), imageName(coords));
    await util.sleep(100);
  }
  return IMAGES;
}

async function mergeImages(IMAGES, fileName) {
  const images = [];
  util.range(Bounds.Y).forEach((y, yI) => {
    util.range(Bounds.X).forEach((x, xI) => {
      images.push({
        buffer: IMAGES[x][y],
        x: xI * IMAGE_SIZE,
        y: yI * IMAGE_SIZE
      });
    });
  });
  const result = await new Promise(function(resolve, reject) {
    blend(images, {format: 'png'}, (err, data) => {
      if (err) {
        reject(err);
      }
      resolve(data);
    })
  });
  Logger.info('Saving image ' + fileName);
  await saveFile(fileName, result);
}

async function createImage(date, time, fileName) {
  const images = await downloadImagesP(date, time);
  await mergeImages(images, fileName);
}

module.exports = createImage;
