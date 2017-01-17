'use strict';

var _bluebirdCo = require('bluebird-co');

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const mysql = require('mysql');
const config = require('./config');
const nodemailer = require('nodemailer');
const logger = require('./logger');
let dbinfo = config.config.DBINFO;
const pool = mysql.createPool({
  connectionLimit: 10,
  host: dbinfo.host,
  port: dbinfo.port,
  user: dbinfo.user,
  password: dbinfo.password,
  database: dbinfo.database,
  charset: 'UTF8_GENERAL_CI',
  debug: false,
  supportBigNumbers: true
});
const queryFormat = mysql.format;
let P = function () {
  let that = arguments[0];
  let fn = arguments[1];
  let args = Array.prototype.slice.call(arguments, 2);
  return new _bluebird2.default(function (resolve, reject) {
    let callback = function () {
      if (arguments[0] instanceof Error) {
        return reject(arguments[0]);
      } else if (arguments.length < 2) {
        resolve(arguments[0]);
      } else {
        if (arguments[0]) {
          reject(arguments[0]);
        } else {
          resolve(arguments[1]);
        }
      }
    };
    args.push(callback);
    if (fn === 'query') {
      let queryString;
      if (typeof args[1] === 'function') {
        queryString = args[0];
      } else {
        queryString = mysql.format(args[0], args[1]);
      }
      logger.mysqlLogger.info(`[MYSQL] ${ queryString }`);
    }
    that[fn].apply(that, args);
  });
};

let mailerSend = (() => {
  var _ref = (0, _bluebirdCo.coroutine)(function* (from, to, subject, html, filename, path) {
    let transportOptions = {
      host: 'smtp.exmail.qq.com',
      port: 465,
      auth: {
        user: 'clare.kang@bitse.com',
        pass: 'kcj2208szbfB'
      }
    };
    let transport = nodemailer.createTransport(transportOptions);
    let mailOptions = {
      from: from, // sender address
      to: to, // list of receivers
      subject: subject, // Subject line
      html: html, // html body
      attachments: [{
        filename: filename,
        path: path
      }]
    };
    yield new _bluebird2.default(function (resolve, reject) {
      transport.sendMail(mailOptions, function (error, info) {
        if (error) {
          reject(error);
        } else {
          resolve(info);
        }
      });
    });
  });

  return function mailerSend(_x, _x2, _x3, _x4, _x5, _x6) {
    return _ref.apply(this, arguments);
  };
})();
let generateHtml = function (exceldata, date_yesterday, income, avgHashrate, activeworker, in_hashrate_ratio, zec, eth, etc) {
  let baseHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Mail</title>
</head>
<body>
    <div>
      <p>事项1:</p>
      <p>截止到${ exceldata }早上9：00，${ date_yesterday } 挖到Zcash＝${ income }枚，Average Hashrate＝${ avgHashrate }kH／s，</p>
      <p>Active worker＝ ${ activeworker },Zcash／Hashrate＝${ in_hashrate_ratio }，即每KH／s挖得${ in_hashrate_ratio }枚Zcash。</p>
   </div>
   <div>
      <p>事项2:</p>
      <p>云币网:</p>
      <p>ZEC=${ zec } CNY</p>
      <p>ETH=${ eth } CNY</p>
      <p>ETC=${ etc } CNY</p>
  </div>
</body>
</html>
`;
  return baseHtml;
};

exports.pool = pool;
exports.queryFormat = queryFormat;
exports.P = P;
exports.mailerSend = mailerSend;
exports.generateHtml = generateHtml;