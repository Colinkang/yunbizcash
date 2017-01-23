'use strict';

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _bluebirdCo = require('bluebird-co');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const request = require('request');
const urlAPI = 'http://zcash.flypool.org/api/miner_new/t1JE5Dmr6DprTN4emsduvcFEqzB8NYMGLoo';
const url = 'https://zcash.flypool.org/miners/t1JE5Dmr6DprTN4emsduvcFEqzB8NYMGLoo';
const yunbiurl = 'https://yunbi.com//api/v2/tickers.json';
const utils = require('./utils');
const xlsx = require('excel-export');
const fs = require('fs');
const later = require('later');
const download = require('./download');
const cheerio = require('cheerio');
const path = require('path');
const logger = require('./logger');

/*
*每天9点从服务器拉取数据,计算前一天Zcash的收入存入数据库中，并且导出excel表格
*/
// later.date.localTime();//设置为本地时间
// var sched = later.parse.recur().on(9).hour().on(0).minute().on(0).second();
// let t = later.setInterval(pullAndExcel, sched);
(() => {
  var _ref = (0, _bluebirdCo.coroutine)(function* () {
    try {
      let body = yield new _bluebird2.default(function (resolve, reject) {
        request(urlAPI, function (error, response, body) {
          logger.logger.error(error);
          if (error) reject(error);else resolve(body);
        });
      });

      //从数据库中获取昨天天每次的Zcash收入，并求和，插入Zcashincome表
      const d = new Date();
      const time1 = new Date(d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate() + ' 07:00:00').getTime(); //今天7点
      const time2 = time1 - 86400000; //昨天7点
      const time3 = time1 - 86400000 * 2; //前天7点

      //删除相同start中end较小值
      //因为起始区块相同，后面会进行合并
      let selectSameStartMinEnd = utils.queryFormat('select * from payouts  where payoutsid in (select min(payoutsid) from payouts group by start having count(start) > 1)');
      let selectResult = yield utils.P(utils.pool, 'query', selectSameStartMinEnd);
      if (selectResult.length != 0) {
        for (let j = 0; j < selectResult.length; j++) {
          let query = utils.queryFormat('update payouts set calculateflag =1 where payoutsid = ?', [selectResult[j].payoutsid]);
          yield utils.P(utils.pool, 'query', query);
        }
      }
      let query = utils.queryFormat('select sum(day_eachtime_amount) as day_amount from payouts where paidon >= ? and paidon < ? and calculateflag = 0', [time2, time1]); //查询昨日一天的amount
      let result = yield utils.P(utils.pool, 'query', query);
      let activeworker = yield new _bluebird2.default(function (resolve, reject) {
        download(url, function (data) {
          if (data) {
            var $ = cheerio.load(data);
            var activeworker = $('#home > div:nth-child(4) > div:nth-child(3) > div > div.panel-body > h4').text();
            resolve(activeworker);
          } else reject('error');
        });
      });
      logger.logger.info('activeworker', activeworker);
      let the_day_before_yesterday_total_amount = 0; //直至前天为止已获取的Zcash数量
      let query2 = utils.queryFormat('select amount from zcashincome where date = ?', [time3]);
      let result2 = yield utils.P(utils.pool, 'query', query2);
      if (result2.length != 0) the_day_before_yesterday_total_amount = result2[0].amount;
      let date = time2;
      let payee = '云币网';
      let description = '';
      let income = result[0].day_amount / 100000000;
      let outpay = 0;
      let amount = the_day_before_yesterday_total_amount + income;
      let avgHashrate = JSON.parse(body).avgHashrate / 1000;
      let in_hashrate_ratio = income / avgHashrate;
      let datequery = utils.queryFormat('select * from zcashincome where date=?', [date]);
      let dateresult = yield utils.P(utils.pool, 'query', datequery);
      if (dateresult.length != 0) {
        let updatequery = utils.queryFormat('update zcashincome set payee=?,date=?,description=?,income=?,outpay=?,amount=?,activeworker=?,hashrate=?,in_hashrate_ratio=? where date = ?', [payee, date, description, income, outpay, amount, activeworker, avgHashrate, in_hashrate_ratio, date]);
        yield utils.P(utils.pool, 'query', updatequery);
      } else {
        let query3 = utils.queryFormat('insert into zcashincome set payee=?,date=?,description=?,income=?,outpay=?,amount=?,activeworker=?,hashrate=?,in_hashrate_ratio=?', [payee, date, description, income, outpay, amount, activeworker, avgHashrate, in_hashrate_ratio]);
        yield utils.P(utils.pool, 'query', query3);
      }
      //导出excel表格
      let query4 = 'select * from zcashincome';
      let data = yield utils.P(utils.pool, 'query', query4);

      let conf = {};
      const filename = 'Zcash';
      conf.cols = [{ caption: 'Date(日期)', type: 'string', width: 30 }, { caption: 'Payee(收支对象)', type: 'string', width: 30 }, { caption: 'Description(项目明细描述)', type: 'string', width: 40 }, { caption: 'In', type: 'number', width: 20 }, { caption: 'Out', type: 'number', width: 20 }, { caption: 'amount(具体数目)', type: 'number', width: 30 }, { caption: 'Active worker(有效矿工)', type: 'number', width: 20 }, { caption: 'Hashrate(算力 KH/s)', type: 'number', width: 30 }, { caption: 'ZEC／Hashrate(产出算力比)', type: 'number', width: 30 }];
      let array = [];
      conf.rows = [];
      for (let i = 0; i < data.length; i++) {
        array[i] = [new Date(data[i].date).getFullYear() + '/' + (new Date(data[i].date).getMonth() + 1) + '/' + new Date(data[i].date).getDate(), data[i].payee, data[i].description, data[i].income.toFixed(3), data[i].outpay, data[i].amount.toFixed(3), data[i].activeworker, data[i].hashrate.toFixed(3), data[i].in_hashrate_ratio.toFixed(3)];
        conf.rows.push(array[i]);
      }
      let result_excel = xlsx.execute(conf);

      let exceldate = d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();

      let uploadDir = path.join(__dirname, '../excel/');
      let filePath = uploadDir + filename + exceldate + '.xlsx';
      yield new _bluebird2.default(function (resolve, reject) {
        fs.writeFile(filePath, result_excel, 'binary', function (err) {
          logger.logger.error(err);
          if (err) {
            reject(err);
          } else resolve('success');
        });
      });

      //获取云币网的相关数据
      let yunbidata = yield new _bluebird2.default(function (resolve, reject) {
        request(yunbiurl, function (error, response, body) {
          if (error) reject(error);else resolve(body);
        });
      });
      let zec = JSON.parse(yunbidata).zeccny.ticker.last;
      let eth = JSON.parse(yunbidata).ethcny.ticker.last;
      let etc = JSON.parse(yunbidata).etccny.ticker.last;
      logger.logger.info('zec', zec, 'eth', eth, 'etc', etc);

      //发送excel邮件
      let from = 'clare.kang@bitse.com';
      //let to = 'harvey.shang@bitse.com';
      let to = 'clare.kang@bitse.com;clare.kang@vechain.com;';
      let date_yesterday = new Date(time2).getFullYear() + '-' + (new Date(time2).getMonth() + 1) + '-' + new Date(time2).getDate();
      let subject = date_yesterday + ' 云币网Zcash-flypool 挖矿情况';
      let html = utils.generateHtml(exceldate, date_yesterday, income.toFixed(3), avgHashrate.toFixed(3), activeworker, in_hashrate_ratio.toFixed(3), zec, eth, etc);
      let name = filename + exceldate + '.xlsx';
      let fpath = filePath;
      yield utils.mailerSend(from, to, subject, html, name, fpath);
    } catch (e) {
      logger.logger.error(e);
      pullAndExcel();
    }
  });

  function pullAndExcel() {
    return _ref.apply(this, arguments);
  }

  return pullAndExcel;
})()();