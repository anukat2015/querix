/**
* Service which aggregates and index objects taken from a mysql database into an elastic database
*/

var log = require('log4js').getLogger('Overview Service');
var config = require('../config/config');
var cproductions = config.get('productions');

var Production = require('../models/Production');

var productions = {};

/**
* Loads all productions in memory, creating the DAOs and sql connections
*/
var startUp = function() {
  for(var key in cproductions) {
    productions[key] = new Production(key, cproductions[key]);
  }
}
startUp();

/**
* Selects a production to aggregate and index documents
* @see models/Production#aggregateAndIndex
*/
var aggregateAndIndex = function(prodId, aggregation, id, done) {
  var prod = productions[prodId];
  if (!prod) return done(new Error('Production not found'));
  prod.aggregateAndIndex(aggregation, id, done);
}

/**
* Selects a production to aggregate and index all documents of a certain type
* @see models/Production#aggregateAndIndexAll
*/
var aggregateAndIndexAll = function(prodId, aggregation, drop, done) {
  if (typeof drop === 'function') {
    done = drop;
    drop = false;
  }
  var prod = productions[prodId];
  if (!prod) return done(new Error('Production not found'));
  prod.aggregateAndIndexAll(aggregation, drop, done);
}

/**
* Initialize the index, and creates the default "split on comma" analyzer
* @see models/Production#initializeIndex
*/
var initializeIndex = function(prodId, drop, done) {
  if (typeof drop === 'function') {
    done = drop;
    drop = false;
  }
  var prod = productions[prodId];
  if (!prod) return done(new Error('Production not found'));
  prod.initializeIndex(drop, done);
}

module.exports = exports = {
  aggregateAndIndex: aggregateAndIndex,
  aggregateAndIndexAll: aggregateAndIndexAll,
  initializeIndex: initializeIndex
};
