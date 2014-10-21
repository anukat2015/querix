var request = require('superagent');

function findOne(options,id,callback){
	init(options,callback);
	var base_uri = options.host + ':' + options.port + '/' + options.index + '/' + options.type + '/';
	//console.log(base_uri);
	request.get(base_uri+id,function(result) {
		if (result.status >= 400)
			return callback(new Error('Error getting id n°'+id));
		callback(null, result.body._source);
	});
}

function find(options,ids,callback){
	init(options,callback);
	var query = {
		"query":{
			"ids":{
				"values": ids
			}
		},
		"size":3000000
	};
	console.log(query);
	var queryS = JSON.stringify(query);
	var uri = options.host + ':' + options.port + '/' + options.index + '/' + options.type + '/_search';
	request.post(uri)
	.send(queryS)
	.set('Content-Type', 'application/octet-stream')
	.set('Connection', 'close')
	.set('Transfer-Encoding', 'chunked')
	.end(function(result) {
		if (result.status >= 400)
			return callback(new Error('Error getting ids'));
		var final = [];
		for(var i in result.body.hits.hits){
			final.push(result.body.hits.hits[i]._source);
		}
		callback(null, final);
	});
}

function findAll(options,callback){
	init(options,callback);
	var query = {
		"size":3000000
	};
	var queryS = JSON.stringify(query);
	var uri = options.host + ':' + options.port + '/' + options.index + '/' + options.type + '/_search';
	request.post(uri)
	.send(queryS)
	.set('Content-Type', 'application/octet-stream')
	.set('Connection', 'close')
	.set('Transfer-Encoding', 'chunked')
	.end(function(result) {
		if (result.status >= 400)
			return callback(new Error('Error getting ids'));
		var final = [];
		for(var i in result.body.hits.hits){
			final.push(result.body.hits.hits[i]._source);
		}
		callback(null, final);
	});
}

function init(es,callback){
	if(!es.host){
		es.host = 'localhost';
	}
	if(!es.port){
		es.port = '9200';
	}
	if(!es.index || !es.type){
		callback(new Error("Type or Index not given"));
	}
}

exports.findOne = findOne;
exports.find = find;
exports.findAll = findAll;