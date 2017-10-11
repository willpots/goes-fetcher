'use strict';

const Config = {
  Convert: '/usr/local/bin/convert',

  LogPath: 'goes.log',

  StatePath: 'state.json',
  Shell: '/bin/zsh',
  MaxRetries: 2,

  ApiBase: 'http://rammb-slider.cira.colostate.edu/data/json/goes-16/full_disk/geocolor',
  ImageryBase: 'http://rammb-slider.cira.colostate.edu/data/imagery',
  LatestTimesUrl: 'http://rammb-slider.cira.colostate.edu/data/json/goes-16/full_disk/geocolor/latest_times.json',

  // Boundary for the US (at zoom 4)
  Zoom: 4,
  Bounds: {
    X: {min: 3, max: 11},
    Y: {min: 0, max: 6}
  }
};

module.exports = Config;