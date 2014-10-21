var request = require('superagent');

function insert(options,object,id,callback){
	init(options,callback);
	var base_uri = options.host + ':' + options.port + '/' + options.index + '/' + options.type + '/';

	var buf = JSON.stringify(object);
	if(options.verbose){
		console.log('Elastic Request Size : ' + Buffer.byteLength(buf));
	}
	request.put(base_uri+id).send(buf)
		.set('Content-Type', 'application/octet-stream')
		.set('Connection', 'close')
		.set('Transfer-Encoding', 'chunked')
		.end(function(err, result) {
			if (err) return callback(err);
			if(options.verbose){
				console.log('RESULT : '+ result.text);
			}
			if (result.status >= 400)
				return callback(new Error('Error while indexing'));
			callback(null, result);
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

exports.insert = insert;
