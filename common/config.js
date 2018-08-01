'use strict';

const Config = {

  LogPath: '../goes.log',

  BucketName: 'san-benito',
  BucketHost: 'nyc3.digitaloceanspaces.com',
  StatePath: 'state.json',
  OutputPath: 'output/',
  Shell: '/bin/zsh',

  ApiBase: 'http://rammb-slider.cira.colostate.edu/data/json/goes-16/full_disk/geocolor',
  ImageryBase: 'http://rammb-slider.cira.colostate.edu/data/imagery',
  LatestTimesUrl: 'http://rammb-slider.cira.colostate.edu/data/json/goes-16/full_disk/geocolor/latest_times.json',

  // Boundary for the US (at zoom 4)
  Zoom: 4,
  Bounds: {
    X: {min: 1, max: 9},
    Y: {min: 0, max: 6}
  }
};

module.exports = Config;
