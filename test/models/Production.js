var should = require('should');
var sinon = require('sinon');

var Production = require('../../models/Production');
var prod;

describe('Production', function() {
  describe('#aggregateAndIndex', function() {
    it('should grab a document from mysql, aggregate it and index it in elastic search', function(done) {
      prod = new Production('test', {});
      prod.setDAOs({
        'test': {
          getObjectById: function(id, cb) {
            id.should.equal(1);
            cb(null, {'key': 'value'});
          },
          aggregateObject: function(object, cb) {
            object.key.should.equal('value');
            cb(null, {'key': 'value', 'key2': 'value2'});
          }
        }
      }, {
        'test': {
          save: function(object, id, cb) {
            object.key.should.equal('value');
            object.key2.should.equal('value2');
            id.should.equal(1);
            cb(null, {});
          }
        }
      });
      prod.aggregateAndIndex('test', 1, done);
    });

    it('should grab all documents from mysql, aggregate them and index them in elastic search', function(done) {
      prod = new Production('test', {});
      prod.setDAOs({
        'test': {
          getAll: function(cb) {
            cb(null, [{'key': 'value'},{'key3': 'value3'}], 'nothing to see here');
          },
          aggregateObject: function(object, cb) {

          },
          aggregateAllObjects: function(objects, cb) {
            objects.forEach(function(object) {
              if (object.key === 'value')
                object.key2 = 'value2';
              else if (object.key3 === 'value3')
                object.key4 = 'value4';
              else
                throw new Error('Incorrect object passed to aggregate Object');
            });
            cb(null, objects);
          }
        }
      }, {
        'test': {
          bulk: function(objects, cb) {
            objects.length.should.equal(2);
            objects[0].key.should.equal('value');
            objects[0].key2.should.equal('value2');
            objects[1].key3.should.equal('value3');
            objects[1].key4.should.equal('value4');
            cb();
          },
          deleteMapping: function(cb) {
            cb(null, "result ok");
          },
          putMapping: function(mapping, cb) {
            cb(null, mapping);
          },
          makeMapping: function() {
            return {};
          }
        }
      }, {
        "test": {}
      });
      prod.aggregateAndIndexAll('test', done);
    });
  });

  describe('#_mapping', function() {
    it('should return the correct mapping', function() {
      prod = new Production('test', {});
      prod.setDAOs({}, {}, {
        "test": {
          "commaSeparatedFields": ['test1', 'test2']
        }
      })
      var mapping = prod._mapping('test');
      mapping.test.properties.test1.type.should.equal('string');
      mapping.test.properties.test1.analyzer.should.equal('default');
      mapping.test.properties.test2.type.should.equal('string');
      mapping.test.properties.test2.analyzer.should.equal('default');
    });
  });
});
