/**
* Routes pertaining to the metrics aggregations which will be used to index documents used in the reports
*/

var express = require('express');
var router = express.Router();
var log = require('log4js').getLogger('Metrics Aggregation Routes');
var importer = require('../services/metrics/importer');
var aggr = require('../services/metrics/aggregator');


/**
* Update the aggregation index following the aggregation scheme :type for the id :id
*/
router.put('/:prodId/type/:type/:id', function(req,res,next){
  log.debug('Request indexation in aggregation : ', req.params.type, ' for id n°',req.params.id);
  importer.indexOne(req.params.prodId,req.params.type,req.params.id,function(err){
    if (err) return next(err);
    res.status(200).end();
  });
});

/**
* Update the aggregation index following the aggregation scheme :type for all ids
*/
router.put('/:prodId/type/:type', function(req,res,next){
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.connection.setTimeout(0);
  log.debug('Request indexation in aggregation : ', req.params.type, ' for all ids');
  importer.indexAll(req.params.prodId,req.params.type,function(err){
    if (err) return next(err);
    res.status(200).end();
  });
});

/**
* Gives the metrics aggregation for a aggregation scheme :type and a specific id :id
* The body should look like:
* {
*   "options":{
*     "from": "2014-01-01",
*     "to": "2014-12-31",
*     "metrics":[
*       "actual_imps"
*     ]
*   }
* }

* if "from" is no defined, it will become '1970-01-01'
* if "to" is no defined, it will become "now"
* if "metrics" is not defined, the api will return all the metrics associated to that aggragation scheme
*/
router.get('/:prodId/type/:type/:id', function(req,res,next){
  log.debug('Request indexed metrics for : ', req.params.type, ' for id n°', req.params.id);
  var options = req.body.options;
  if(!options){
    options = {};
  }
  
  aggr.getIdMetrics(req.params.prodId,req.params.type,req.params.id,options,function(err,result){
    if (err) return next(err);
    res.status(200).end(JSON.stringify(result));
  });
});

/**
* Gives the metrics aggregation for a aggregation scheme :type for the ids specified in the body
* The body should look like:
* {
*   "options":{
*     "from": "2014-01-01",
*     "to": "2014-12-31",
*     "metrics":[
*       "actual_imps"
*     ]
*   },
*   "ids": [
*     "127",
*     "223"
*   ]
* }

* if "from" is no defined, it will become '1970-01-01'
* if "to" is no defined, it will become "now"
* if "metrics" is not defined, the api will return all the metrics associated to that aggragation scheme
*/
router.get('/:prodId/type/:type', function(req,res,next){
  log.debug('Request indexed metrics for : ', req.params.type, ' for ids n°', req.body.ids);
  var options = req.body.options;
  if(!options){
    options = {};
  }
  aggr.getIdsMetrics(req.params.prodId,req.params.type,req.body.ids,options,function(err,result){
    if (err) return next(err);
    res.status(200).end(JSON.stringify(result));
  });
});

module.exports = router;
