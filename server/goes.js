'use strict';

const Promise = require('bluebird');
const rp = require('request-promise');
const {StatePath, LatestTimesUrl} = require('./config');
const createImage = require('./create_image');
const Errors = require('./errors');
const {openJson, saveFile, deleteFile} = require('./file');
const Logger = require('./logger');
const {formatDate} = require('./util');
const setWallpaper = require('./mac');

function getLatestTime() {
  return rp(LatestTimesUrl)
    .then(JSON.parse)
    .then(({timestamps_int: [timestamp]}) => timestamp.toString())
    .then((time) => {
      Logger.info(`Fetching images for ${time}`);
      return createOptionsObject(time);
    });
}
function createOptionsObject(time) {
  Logger.info(time);
  const tag = formatDate(time);
  return {
    time,
    tag,
    date: time.slice(0, 8),
    fileName: `output/current_world_${tag}.png`
  };
}
/**
 * Whether the image already exists or not.
 *
 * @param  {string} time timestamp for the image
 * @return {!Promise<boolean>}
 */
function shouldFetchImage(time) {
  return openJson(StatePath)
    .then(({images}) => {
      if (images && images[time]) {
        throw new Errors.ImageExistsError(`Image already exists at ${time}`);
      }
    });
}

function updateOptions(options) {
  return openJson(StatePath)
    .then((state) => {
      state = state || {};
      state.images = state.images || {};
      state.images[options.time] = options;

      return JSON.stringify(state);
    })
    .then((contents) => saveFile(StatePath, contents));
}

function deleteOldImages() {
  let idealState;
  return openJson(StatePath)
    .then((state) => {
      idealState = state;
      const keys = Object.keys(state.images);
      const maxDate =
        Math.max.apply(null, keys.map((k) => parseInt(k))).toString();
      return Promise.all(keys.map((key) => {
        const {fileName} = state.images[key];
        if (key === maxDate) {
          Logger.info(`Keeping ${fileName}`);
          idealState = {images: {[key]: state.images[key]}};
          return;
        }
        Logger.info(`Deleting ${fileName}`);
        return deleteFile(fileName);
      }));
    })
    .then(() => saveFile(StatePath, JSON.stringify(idealState)));
}

function fetchLatestImage() {
  return Promise.resolve()
    .then(getLatestTime)
    .tap(({time}) => shouldFetchImage(time))
    .tap(({date, time, fileName}) => createImage(date, time, fileName))
    .tap(({fileName}) => setWallpaper(fileName))
    .tap(updateOptions)
    .tap(({time}) => Logger.info(`Finished fetching image for ${time}`))
    .catch((e) => {
      if (e instanceof Errors.ImageExistsError) {
        Logger.info(e);
      } else {
        throw e;
      }
    })
    .then(deleteOldImages);
}

module.exports = {fetchLatestImage};