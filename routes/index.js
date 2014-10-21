var express = require('express');
var router = express.Router();

/* GET informations page. */
router.get('/', function(req, res) {
  var info = {
    name: "elastic-api",
    version: "0.1.0"
  }
  res.end(JSON.stringify(info, null, '\t'));
});

module.exports = router;
