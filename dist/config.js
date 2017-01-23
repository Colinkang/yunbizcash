'use strict';

const path = require('path');
let config = {
  __DIR: path.join(__dirname, '../'),
  APP_NAME: 'zcash_server',
  LOG_DIR: path.join(__dirname, '../log/'),
  env: 'dev', // Environment Variables default is development
  DEBUG: true,
  TEST: false,
  PRODUCTION: false,
  DEVELOPMENT: true,
  PORT: 3100,
  socketPort: 8000,
  baseUrl: 'http://localhost',
  playgroundUrl: 'http://localhost:3000',
  REDISINFO: {
    host: 'localhost',
    password: '',
    port: 6379
  },
  DBINFO: {
    host: 'localhost',
    user: 'root',
    password: '',
    //password:'vechain2016!',
    database: 'yunbizcash',
    port: 3306
  }
};
exports.config = config;