'use strict';

const aws = require('aws-sdk');
const Logger = require('../common/logger');
const {BucketName, BucketHost} = require('../common/config');

const endpoint = new aws.Endpoint(BucketHost);
const s3 = new aws.S3({endpoint});

async function saveFile(Key, Body) {
  return new Promise((resolve, reject) => {
    s3.putObject({
      ACL: 'public-read',
      Bucket: BucketName,
      Key,
      Body
    }, (err) => {
      if (err) {
        reject(err);
      }
      resolve();
    });
  })
}

function zeroPad(num) {
  num = num + '';
  if (num.length === 1) {
    num = '0' + num;
  }
  return num;
}

function getDayKey(date = new Date) {
  const Y = date.getUTCFullYear();
  const M = zeroPad(date.getUTCMonth() + 1);
  const D = zeroPad(date.getUTCDate());
  return new RegExp(`${Y}/${M}/${D}`);
}

function getYesterdayKey() {
  const today = new Date().valueOf();
  const yesterday = new Date(today - 24 * 60 * 60 * 1000);
  return getDayKey(yesterday);
}

const Prefix = 'output/';

async function cleanFolder(){
  const params = {Bucket: BucketName, Prefix};

  return new Promise((resolve, reject) => {
    s3.listObjects(params, (err, data) => {
      if (err) {
        reject(err);
      }

      if (data.Contents.length == 0) {
        resolve();
      }

      const params = {Bucket: BucketName};
      params.Delete = {
        Objects: data.Contents
          .map(({Key}) => ({Key}))
          .filter(({Key}) => !Key.match(getDayKey()) && !Key.match(getYesterdayKey()))
      };
      Logger.info('Bucket contains the following:');
      data.Contents.forEach((f) => Logger.info(f.Key));
      Logger.info('Deleting the following files:');
      params.Delete.Objects.forEach((f) => Logger.info(f.Key));
      s3.deleteObjects(params, function(err) {
        if (err) {
          reject(err);
          return;
        }
        resolve();
      });
    });
  })
}

module.exports = {saveFile, cleanFolder};
