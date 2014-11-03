/**
* Production object, contains all DAO (elastic and mysql) for each aggregation (see settings.json)
*/

var log = require('log4js').getLogger('Production');
var async = require('async');
var ElasticDAO = require('querix_utils/elasticClient/ElasticDAO');
var AggregationDAO = require('querix_utils/mysqlClient/AggregationDAO');
var _ = require('underscore');

/**
* Creates a new Production object, and all DAO, using the config argument (coming from settings.json)
*/
var Production = function(name, config) {
  this.name = name;
  this.es = config.elasticsearch;
  this.aggs = config.aggregations;
  this.aggDAOs = {};
  this.elasticDAOs = {};
  this.updates = {};
  for (var key in this.aggs) {
    this.aggDAOs[key] = new AggregationDAO(name, this.aggs[key]);
    this.elasticDAOs[key] = new ElasticDAO({
      host: this.es.host,
      port: this.es.port,
      index: this.es.index,
      type: key
    });
    this.updates[key] = this.aggs[key].updates;
  }
}

/**
* Retreives one object from the database (e.g. a campaign), does all the aggregations and indexes them in elastic
*/
Production.prototype.aggregateAndIndex = function(aggregation, id, done) {
  log.debug('Aggregating and Indexing :', aggregation, id);
  var that = this;
  var obj;
  async.waterfall([
    function(cb) {
      if (!that.aggDAOs[aggregation])
        return cb(new Error('Aggregation not found'));
      that.aggDAOs[aggregation].getObjectById(id, cb);
    }, function(object, cb) {
      that.aggDAOs[aggregation].aggregateObject(object, cb);
    }, function(object, cb) {
      obj = object;
      that.elasticDAOs[aggregation].save(object, id, cb);
    }, function(result, cb) {
      if (!that.updates[aggregation])
        return cb(null, [result]);
      async.map(Object.keys(that.updates[aggregation]), function(key, done) {
        that.aggregateAndIndex(key, obj[that.updates[aggregation][key]], done);
      }, function(err, results) {
        console.log(results);
        if (err) return cb(err);
        results = _.flatten(results);
        results.push(result);
        cb(null, results);
      });
    }
  ], function(err, result){
    if (err) return done(err);
    done(null, result);
  });
}

/**
* Retreives all objects from the database (e.g. all campaigns), aggregates over all of them and indexes them in elastic
*/
Production.prototype.aggregateAndIndexAll = function(aggregation, drop, done) {
  if (typeof drop === 'function') {
    done = drop;
    drop = false;
  }
  log.debug('Aggregating and Indexing all documents :', aggregation);
  var that = this;
  async.waterfall([
    function(cb) {
      if (!that.aggDAOs[aggregation])
        return cb(new Error('Aggregation not found'));
      if (drop)
        that.elasticDAOs[aggregation].deleteMapping(cb);
      else
        cb(null, {});
    }, function(result, cb) {
      that.elasticDAOs[aggregation].putMapping(that.elasticDAOs[aggregation].makeMapping(that.aggs[aggregation].searchable_fields), cb);
    }, function(result, cb) {
      that.aggDAOs[aggregation].getAll(cb);
    }, function(objects, fields, cb) {
      log.debug('Got', objects.length, 'objects');
      that.aggDAOs[aggregation].aggregateAllObjects(objects, cb);
    }, function(objects, cb) {
      that.elasticDAOs[aggregation].bulk(objects, cb);
    }
  ], function(err) {
    if(err) return done(err);
    done();
  });
}

/**
* Makes a mapping for each comma separated field
*/
Production.prototype._mapping = function(aggregation) {
  var mapping = {};
  mapping[aggregation] = {
    properties: {}
  }
  var agg = this.aggs[aggregation];
  if (agg.commaSeparatedFields) {
    agg.commaSeparatedFields.forEach(function(field) {
      mapping[aggregation].properties[field] = {
        type: "string",
        analyzer: "default"
      }
    });
  }
  return mapping;
}

/**
* Uses the ElasticDAO to initialize the index
* @see ElasticDAO#putAnalyzer
*/
Production.prototype.initializeIndex = function(drop, callback) {
  if (typeof drop === 'function') {
    callback = drop;
    drop = false;
  }
  var keys = Object.keys(this.elasticDAOs);
  if (keys.length < 1)
    return callback(new Error('No aggregation found, you probably have an error in the settings.json'));
  var key = keys[0];
  if (drop) {
    var self = this;
    this.elasticDAOs[key].deleteIndex(function(err, result) {
      self.elasticDAOs[key].putAnalyzer(callback);
    });
  }
  else {
    this.elasticDAOs[key].putAnalyzer(callback);
  }
}

/**
* Test purposes only, changes the DAOs in the Production object
*/
Production.prototype.setDAOs = function(aggDAOs, elasticDAOs, aggs) {
  this.aggs = aggs;
  this.aggDAOs = aggDAOs;
  this.elasticDAOs = elasticDAOs;
}

module.exports = exports = Production;
