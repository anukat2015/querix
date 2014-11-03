/**
* Routes pertaining to the aggregations which will be used to index documents used in the overviews
*/

var express = require('express');
var router = express.Router();
var log = require('log4js').getLogger('Overview Routes');
var overviewService = require('../services/overview');

/**
* Aggregates and indexes an object
* @see services/overview#aggregateAndIndex
*/
router.post('/:prodId/index/:type/:id', function(req, res, next) {
  log.debug('Request indexation : ', req.params.type, req.params.id);
  overviewService.aggregateAndIndex(req.params.prodId, req.params.type, req.params.id, function(err, results) {
    if (err) return next(err);
    var output = '';
    results.forEach(function(result) {
      output += result.text+ '\n';
    });
    res.status(200).end(output);
  });
});

/**
* Aggregates and indexes all objects of a certain type
* @see services/overview#aggregateAndIndexAll
*/
router.post('/:prodId/index_all/:type', function(req, res, next) {
  log.debug('Request indexation of all documents : ', req.params.type);
  res.writeHead(200, {"Content-Type": "application/json"});
  res.connection.setTimeout(0);
  overviewService.aggregateAndIndexAll(req.params.prodId, req.params.type, function(err) {
    if (err) return next(err);
    res.status(200).end('200 OK');
  });
});

/**
* Creates an index, initializing the "split on comma" analyzer
* @see services/overview#initializeIndex
*/
router.post('/:prodId/init', function(req, res, next) {
  log.debug('Request initialization of the production :', req.params.prodId);
  overviewService.initializeIndex(req.params.prodId, function(err, result) {
    if (err) return next(err);
    res.status(200).end(result.text);
  });
});

module.exports = router;
