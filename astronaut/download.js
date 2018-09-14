const rp = require('request-promise');
const {BucketName, BucketHost, StatePath} = require('../common/config');
const {fetchState} = require('../common/state');
const {saveFile, deleteFile} = require('../common/file');
const {setWallpaper} = require('../common/mac');
const Logger = require('../common/logger');

let latestImageUrl;
let oldFileName;

async function fetchLatestImage() {
  Logger.info('Checking for the latest image');
  const {latest} = await fetchState();
  Logger.info('Latest image url: ' + latest);
  if (latest === latestImageUrl) {
    Logger.info('No new image, won’t redownload');
    return;
  }
  latestImageUrl = latest;
  const options = {
    url: `https://${BucketName}.${BucketHost}/${latest}`,
    encoding: null
  };

  const fileName = latest.replace(/\//gi, '_').replace('output_', '');
  Logger.info('Downloading image...');
  const result = await rp.get(options)
  const buffer = Buffer.from(result, 'utf8');
  Logger.info('Saving file...');
  await saveFile(fileName, buffer);
  Logger.info('Done!')
  const path = `${__dirname}/${fileName}`;
  setWallpaper(path);
  if (oldFileName) {
    await deleteFile(oldFileName);
  }
  oldFileName = fileName;
}

module.exports = {fetchLatestImage};

