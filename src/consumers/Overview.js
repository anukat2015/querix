var amqp = require('amqp');
var service = require('../services/overview');
var rabbit = require('querix_utils/rabbit');

var log = require('log4js').getLogger('Overview Consumer');

var Overview = function(prod, config) {
  var self = this;
  this.rabbit = rabbit(prod);
  this.prod = prod;
  this.config = config;
  this.rabbit.on('ready', function() {
    self.rabbit.queue(config.queue, {}, function(queue) {
      self.queue = queue;
      queue.subscribe({
        ack: true,
        prefetchCount: config.bulk_size
      }, self._hook.bind(self));
    });
  });
};

Overview.prototype._hook = function(message, headers, deliveryInfo, messageObject) {
  var data;
  try {
    data = JSON.parse(message.data);
  } catch(e) {
    messageObject.acknowledge();
    log.error(e);
    return;
  }
  if (!data.type || !data.id) {
    messageObject.acknowledge();
    return log.error(new Error('Message content invalid'));
  }
  log.debug('Request indexation of', data.type,'with id',data.id);
  service.aggregateAndIndex(this.prod, data.type, data.id, function(err, results) {
    messageObject.acknowledge();
    if (err) return log.error(err);
    log.debug('Message Processed (Output:',results.text,')')
  });
};

module.exports = exports = Overview;
