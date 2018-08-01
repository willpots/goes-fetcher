'use strict';

const Promise = require('bluebird');
const rp = require('request-promise');
const {StatePath, LatestTimesUrl, OutputPath} = require('../common/config');
const createImage = require('./create_image');
const Errors = require('./errors');
const {openJson, deleteFile} = require('../common/file');
const {saveFile, cleanFolder} = require('./aws');
const Logger = require('../common/logger');
const {formatDate} = require('./util');

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
    fileName: `${OutputPath}current_world/${tag}.png`
  };
}

/**
 * Whether the image already exists or not.
 *
 * @param  {string} time timestamp for the image
 * @return {!Promise<boolean>}
 */
async function shouldFetchImage(time) {
  const {images} = await fetchState();
  if (images && images[time]) {
    throw new Errors.ImageExistsError(`Image already exists at ${time}`);
  }
}

async function fetchState() {
  try {
    const content = await rp(
      `https://san-benito.nyc3.digitaloceanspaces.com/${StatePath}`);
    return JSON.parse(content);
  } catch (e) {
    return {error: true};
  }
}

async function updateOptions(options) {
  const state = await fetchState() || {};
  state.images = {};
  state.images[options.time] = options;
  state.latest = options.fileName;

  return saveFile(StatePath, JSON.stringify(state));
}

async function fetchLatestImage() {
  try {
    const {date, time, fileName} = await getLatestTime();

    await shouldFetchImage(time);
    await createImage(date, time, fileName);
    await updateOptions({date, time, fileName});
    await cleanFolder();
    Logger.info(`Finished fetching image for ${time}`);
  } catch (e) {
    if (e instanceof Errors.ImageExistsError) {
      Logger.info(e);
    } else {
      throw e;
    }
  }
  Logger.info('Loop finished');
}

module.exports = {fetchLatestImage};
