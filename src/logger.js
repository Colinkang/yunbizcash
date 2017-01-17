const log4js = require('koa-log4');
const path = require('path');
const config = require('./config');

if(config.env == 'test'){
  var noop = function(){};
  exports.logger = exports.mysqlLogger = {
    trace:noop,
    debug:noop,
    info:noop,
    warn:noop,
    error:noop,
    fatal:noop
  };
  exports.httpLogger = async function(ctx, next){
    await next();
  };
}else{
  // config logger
  log4js.configure({
    appenders: [
      { type: 'console' },
      { type: 'file',
        filename: path.join(config.config.LOG_DIR, config.config.APP_NAME + '.log'),
        maxLogSize: 104857600,
        backups: 100,
        category: 'default'
      },
      { type: 'file',
        filename: path.join(config.config.LOG_DIR, 'mysql_query.log'),
        maxLogSize: 104857600,
        backups: 100,
        category: 'MYSQL'
      },
      {
        type: 'dateFile',
        filename: path.join(config.config.LOG_DIR, 'access.log'),
        pattern: '-yyyy-MM-dd',
        maxLogSize: 10485760,
        backups: 100,
        category: 'http'
      },
      {
        type: 'logLevelFilter',
        level: 'ERROR',
        appender: {
          type: 'file',
          filename: path.join(config.config.LOG_DIR, 'error.log'),
          maxLogSize: 10485760,
          backups: 100
        }
      }
      //,{
      //  "type": "logLevelFilter",
      //  "level": "WARN",
      //  "maxLevel": "FATAL",
      //  "appender": {
      //    "type": "smtp",
      //    "recipients": "foo@bar.com",
      //    "sendInterval": 60,
      //    "SMTP": {
      //      "host": "smtp.gmail.com",
      //      "secure": true,
      //      "port": 465,
      //      "auth": {
      //        "user": "foo@bar.com",
      //        "pass": "bar_foo"
      //      }
      //    }
      //  }
      //}
    ],
    replaceConsole: true
  });
  exports.logger = log4js.getLogger('default');
  exports.mysqlLogger = log4js.getLogger('MYSQL');
  exports.httpLogger = log4js.koaLogger(log4js.getLogger('http'), { level: 'auto' });
}
