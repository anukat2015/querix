/*var should = require('should');
var sinon = require('sinon');

describe('importer', function() {

  before(function() {
    var config = require('../../../config/config');
    var mysql = require('mysql');
    require('../../../config/mysql');
    sinon.stub(config, 'get', function(stuff) {
      return {
        "test": {
          "mysql": {
            "host": "localhost",
            "port": 3306,
            "username": "root",
            "password": "root",
            "database": "test"
          },
          "elasticsearch": {
            "host": "localhost",
            "port": 9200,
            "index": "test"
          }
        }
      };    
    });
    sinon.stub(mysql, 'createConnection', function(data) {
      var query = function(query,callback){
        if(query === "SELECT id FROM adlogix_users_campaigns_selections_conf"){
          var result = [];
          for(var id = 1 ; id <= 3 ; ++id){
            result.push({
              "id": id
            });
          }
          callback(null,result,null);
        }
      }
      return data;
    });
    require('../../../config/mysql').resetConnections();
  });

  it('should return a connection to localhost:3306/test', function() {
    var mysql = require('../../../config/mysql');
    var importer = require('../../../services/metrics/importer');
    var data = {
        "aggregateTo": {
            "name": "adlogix_users_campaigns_selections_conf",
            "id": "id"
        },
        "pathToMetrics": [
            {
                "aggregationName": "metrics_aggregation_test",
                "name": "adlogix_inventory",
                "id": "id",
                "parentLink": "user_campaign_selection_conf_id",
                "child": {
                    "name": "adlogix_inventory_data",
                    "parentLink": "inventory_id",
                    "metrics": [
                        "actual_imps",
                        "budget_net"
                    ],
                    "dateRangeAttribute": "datetime"
                }
            }
        ]
    };
    var productionId = 'test';
    importer(productionId,data);
  });

  after(function() {
    var config = require('../../../config/config');
    var mysql = require('mysql');

    mysql.createConnection.restore();
    config.get.restore();
    require('../../../config/mysql').resetConnections();
  });
});
*/