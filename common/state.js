const rp = require('request-promise');
const {BucketName, BucketHost, StatePath} = require('../common/config');

async function fetchState() {
  try {
    const content = await rp(
      `https://${BucketName}.${BucketHost}/${StatePath}`);
    return JSON.parse(content);
  } catch (e) {
    return {error: true};
  }
}

module.exports = {fetchState};
