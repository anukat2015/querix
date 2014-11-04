var log = require('log4js').getLogger('app-rabbit');
var config = require('querix-util/config');

var Overview = require('./consumers/Overview');
var consumers = [];

var productions = config.get('productions');
var rabbit;
for (var prod in productions) {
  if (rabbit = productions[prod].rabbit) {
    consumers.push(new Overview(prod, rabbit));
  }
}

//module.exports = exports = consumers;
