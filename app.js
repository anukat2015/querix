var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var config = require('./config/config');

var routes = require('./routes/index');
var overview = require('./routes/overview');
//var metricsAggr = require('./routes/metricsAggr');

var log4js = require('log4js');
log4js.configure(config.get('log4js'));

var app = express();

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(log4js.connectLogger(log4js.getLogger('Express'), {level: log4js.levels.DEBUG, format: ':method :url :status :response-timems'}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

app.use('/', routes);
app.use('/overview', overview);
// Side project, commented
//app.use('/metrics', metricsAggr);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500)
        var output = {
          error: {
            status: err.status || 500,
            message: err.message,
            stack: err.stack
          }
        };
        if (res.headersSent) {
          res.end(JSON.stringify(output));
        }
        else
          res.json(output);
    });
}

// production error handler
// no stacktraces leaked to user
else {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500)
    var output = {
      error: {
        status: err.status || 500,
        message: err.message
      }
    };
    if (res.headersSent) {
      res.end(JSON.stringify(output));
    }
    else
      res.json(output);
  });
}


module.exports = app;
