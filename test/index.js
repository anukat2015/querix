/**
* Configuration of the log4js logger during tests
* Shows all messages (including DEBUG) in the console
*/

var log4js = require('log4js');

log4js.configure({
  appenders: [
    {type: 'console'}
  ],
  levels: {
    "[all]": "DEBUG"
  }
});
