var should = require('should');
var sinon = require('sinon');
var fs = require('fs');

var fakeSQL = fs.readFileSync('test/sql/fakeSQL.sql');
var aggFakeSQL = fs.readFileSync('test/sql/aggs/aggFakeSQL.sql');
var fakeCampaign = {
  id: 1,
  name: "test campaign",
  abs_start_date: new Date(),
  abs_end_date: new Date(),
  campaign_success_rate: 100,
  order_state: 'completed',
  state: 'reserved',
  has_alert: false,
  advertiser_name: 'bob',
  advertiser_external_id: 1,
  advertiser_credit_worthiness: 0,
  advertiser_credit_worthiness_external: 0,
  advertiser_id: 1
}

var AggregationDAO = require('../../models/AggregationDAO.js');
var config = require('../../config/config.js');

describe('AggregationDAO', function() {
  before(function() {
    require('../../config/mysql').setConnection('test', {
      query: function(query, params, cb) {
        if (typeof(params) === 'function')
          cb = params;
        if (String(query) === String(fakeSQL).replace(/WHERE ([a-zA-Z_\.]+) = \?/, ''))
          cb(null, [
            fakeCampaign,
            fakeCampaign
          ]);
        else if ((String (query) === String(fakeSQL)) && (params) && (params[0] === 1)) {
          cb(null, [fakeCampaign]);
        }
        else if ((String (query) === String(aggFakeSQL)) && (params) && (params[0] === 1)) {
          cb(null, [{some: "fake information"}]);
        }
        else
          throw new Error('Bad SQL given : '+query);
      }
    });
  });
  describe('#getAll', function() {
    it('should list campaigns', function(done) {
      var dao = new AggregationDAO('test', {
        listSQL: 'test/sql/fakeSQL.sql',
        aggregationSQL: "test/sql/aggs/"
      });
      dao.getAll(function(err, campaigns) {
        if (err) throw err;
        campaigns.length.should.equal(2);
        campaigns[0].id.should.equal(1);
        done();
      });
  	});
  });
  describe('#getObjectById', function() {
    it('should return one campaign', function(done) {
      var dao = new AggregationDAO('test', {
        listSQL: 'test/sql/fakeSQL.sql',
        aggregationSQL: 'test/sql/aggs/'
      });
      dao.getObjectById(1, function(err, campaign) {
        if (err) throw err;
        campaign.should.exist;
        campaign.id.should.equal(1);
        done();
      });
    });
  });
  describe('#aggregateCampaign', function() {
    it('should add aggregated informations to the campaign', function(done) {
      var dao = new AggregationDAO('test', {
        listSQL: 'test/sql/fakeSQL.sql',
        aggregationSQL: 'test/sql/aggs/'
      });
      dao.aggregateObject({id: 1}, function(err, object) {
        if (err) throw(err);
        object.some.should.exist;
        object.some.should.equal("fake information");
        done();
      });
    });
  })
  after(function() {
    require('../../config/mysql').setConnection('test', null);
  });
});
