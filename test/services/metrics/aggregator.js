/*var should = require('should');
var sinon = require('sinon');

describe('aggregate metrics', function() {
  before(function() {
    var config = require('../../config/config');
    var mysql = require('mysql');
    require('../../config/mysql');
    sinon.stub(config, 'get', function(stuff) {
      return {
        "test": {
          "mysql": {
            "host": "localhost",
            "port": 3306,
            "username": "test",
            "password": "",
            "database": "test"
          }
        }
      }
    });
    sinon.stub(mysql, 'createConnection', function(data) {
      return data;
    });
    require('../../config/mysql').resetConnections();
  });

  it('should return a connection to localhost:3306/test', function() {
    var config = require('../../config/config');
    var mysql = require('../../config/mysql');

    var connection = mysql('test');
    connection.should.exist;
    connection.host.should.be.equal('localhost');
    connection.port.should.be.equal(3306);
    connection.user.should.be.equal('root');
    connection.password.should.be.equal('root');
    connection.database.should.be.equal('test');
  });

  after(function() {
    var config = require('../../config/config');
    var mysql = require('mysql');

    sinon.assert.calledOnce(config.get);
    sinon.assert.calledOnce(mysql.createConnection);

    mysql.createConnection.restore();
    config.get.restore();
    require('../../config/mysql').resetConnections();
  });
});
*/