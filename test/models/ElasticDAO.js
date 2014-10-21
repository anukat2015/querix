var should = require('should');
var sinon = require('sinon');

var fakeRequest;

describe('ElasticDAO', function() {
  before(function() {
    var superagent = require('superagent');
    sinon.stub(superagent, 'put', function(url) {
      fakeRequest.url = url;
      return fakeRequest;
    });
    sinon.stub(superagent, 'post', function(url) {
      fakeRequest.url = url;
      return fakeRequest;
    });
    sinon.stub(superagent, 'del', function(url) {
      fakeRequest.url = url;
      return fakeRequest;
    })
  });
  describe('#save', function() {
    it('should save a document on elastic', function(done) {
      var ElasticDAO = require('../../models/ElasticDAO');
      fakeRequest = {
        send: function(data) {
          this.data = data;
          return this;
        },
        set: function() {
          return this;
        },
        end: function(cb) {
          cb(null, "result");
        }
      };
      var document = {
        "some": "fields",
        "number": 10
      };
      var dao = new ElasticDAO({
        host: 'localhost',
        port: 1111,
        index: 'truc',
        type: 'text'
      });
      dao.save(document, 0, function(err, result) {
        if (err) throw err;
        result.should.equal('result');
        fakeRequest.url.should.equal('localhost:1111/truc/text/0');
        var json = JSON.parse(fakeRequest.data);
        json.should.exist;
        json.some.should.equal('fields');
        json.number.should.equal(10);
        done();
      });
    });
  });

  describe('#bulk', function() {
    it('should bulk send documents to elastic', function(done) {
      var ElasticDAO = require('../../models/ElasticDAO');
      fakeRequest = {
        send: function(data) {
          this.data = data;
          return this;
        },
        set: function() {
          return this;
        },
        end: function(cb) {
          cb(null, {body: {errors: false}});
        }
      };
      var documents =  [{
        "some": "fields",
        "number": 10
      }, {
        "an": "other",
        "document": "with fields"
      }];
      var dao = new ElasticDAO({
        host: 'localhost',
        port: 1111,
        index: 'truc',
        type: 'text'
      });
      dao.bulk(documents, function(err) {
        if (err) throw err;
        fakeRequest.url.should.equal('localhost:1111/_bulk');
        fakeRequest.data.should.exist;
        done();
      });
    });
  });

  describe('#putMapping', function() {
    it('should send the correct mapping', function(done) {
      var ElasticDAO = require('../../models/ElasticDAO');
      fakeRequest = {
        send: function(data) {
          this.data = data;
          return this;
        },
        end: function(cb) {
          cb(null, this.data);
        }
      }
      var dao = new ElasticDAO({
        host: 'localhost',
        port: 1111,
        index: 'truc',
        type: 'text'
      });
      dao.putMapping("fakeMapping", function(err, result) {
        if (err) throw err;
        result.should.equal("fakeMapping");
        fakeRequest.url.should.equal('localhost:1111/truc/_mapping/text');
        done();
      });
    });
  });

  describe('#makeMapping', function() {
    it('should create the correct mapping', function() {
      var ElasticDAO = require('../../models/ElasticDAO');
      var dao = new ElasticDAO({
        host: 'localhost',
        port: 1111,
        index: 'truc',
        type: 'text'
      });
      var mapping = dao.makeMapping(['test1', 'test2']);
      mapping.text.properties.test1.type.should.equal('string');
      mapping.text.properties.test1.fields.lowercase.analyzer.should.equal('split_on_comma_lowercase');
      mapping.text.properties.test2.type.should.equal('string');
      mapping.text.properties.test2.fields.lowercase.analyzer.should.equal('split_on_comma_lowercase');
    });
  });

  describe('#deleteMapping', function() {
    it('should delete the correct mapping', function(done) {
      var ElasticDAO = require('../../models/ElasticDAO');
      fakeRequest = {
        end: function(cb) {
          cb(null, {status: 200});
        }
      }
      var dao = new ElasticDAO({
        host: 'localhost',
        port: 1111,
        index: 'truc',
        type: 'text'
      });
      dao.deleteMapping(function(err, result) {
        if (err) throw err;
        fakeRequest.url.should.equal('localhost:1111/truc/text/');
        done();
      });
    });
  });

  describe('#deleteIndex', function() {
    it('should delete the correct index', function(done) {
      var ElasticDAO = require('../../models/ElasticDAO');
      fakeRequest = {
        end: function(cb) {
          cb(null, {status: 200});
        }
      }
      var dao = new ElasticDAO({
        host: 'localhost',
        port: 1111,
        index: 'truc',
        type: 'text'
      });
      dao.deleteIndex(function(err, result) {
        if (err) throw err;
        fakeRequest.url.should.equal('localhost:1111/truc');
        done();
      });
    });
  });

  describe('#putAnalyzer', function() {
    it('should put an analyzer in the right index', function(done) {
      var ElasticDAO = require('../../models/ElasticDAO');
      fakeRequest = {
        send: function(data) {
          this.data = data;
          return this;
        },
        end: function(cb) {
          cb(null, this.data);
        }
      }
      var dao = new ElasticDAO({
        host: 'localhost',
        port: 1111,
        index: 'truc',
        type: 'text'
      });
      dao.putAnalyzer(function(err, result) {
        result.settings.analysis.analyzer.default.type.should.equal('pattern');
        result.settings.analysis.analyzer.default.pattern.should.equal(',');
        result.settings.analysis.analyzer.default.lowercase.should.equal(false);
        fakeRequest.url.should.equal('localhost:1111/truc');
        done();
      });
    });
  });
});
