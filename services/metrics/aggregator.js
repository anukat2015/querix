var elastic = require('../../models/elasticsearch/finder');
var async = require('async');
var nconf = require('../../config/config');
var aggSchemes = nconf.get("metricsAggSchemes");
aggSchemes.find = function(name){
    for(var i in this){
        if(this[i].aggregationName === name){
            return this[i];
        }
    }
    return null;
};

function getIdMetrics(productionId,type,id,options,cb){
	getIdsMetrics(productionId,type,[id],options,function(err,res){
		if(err) cb(err);
		else {
			cb(null, res[0]);
		}
	});
}


function getIdsMetrics(productionId,type,ids,options,cb){
	var metrics = options["metrics"];
	var from = options["from"];
	var to = options["to"];

	if(from === null || from === undefined){
		from = new Date('1970-01-01');
	} else {
		from = new Date(from);
	}
	if(to === null || to === undefined){
		var future = (new Date()).getFullYear() + 1;
		to = new Date(future+"-12-31");
	} else {
		to = new Date(to);
	}
	if(metrics === null || metrics === undefined){
		metrics = getMetrics(aggSchemes.find(type).pathToMetrics);
	}

	var result = [];
	var es = nconf.get("productions")[productionId].elasticsearch;
    es.type = type;
	elastic.find(es,ids,function(err, docs) {
		if(err) cb(err);
		else{
			for(var i in docs){
				var doc = docs[i];
				var temp = processDoc(doc,from,to,metrics);
        		temp["id"] = doc.id;
        		result.push(temp);
			}
			cb(null,result);
		}
	});
}

function processDoc(doc,from,to,metrics){
	var result = {};
	for(var i in metrics){
		result[metrics[i]] = 0;
	}
	
	var years = doc.year_range;
	englobedYears(from,to,years,result,metrics);
	return result;
}

function englobedYears(from,to,years,result,metrics){
	for(var i in years){
		var year = years[i].year;
		var startYear = new Date(year+"-01-01");
		var endYear = new Date(year+"-12-31");

		var conditionP = from >= startYear && from <= endYear;
		conditionP = conditionP || (to >= startYear && to <= endYear);
		
		if(from <= startYear && to >= endYear){
			for(var j in metrics){
				var m = metrics[j];
				result[m] += years[i].metrics[m];
			}
		}
		else if(conditionP){
			englobedMonths(from,to,years[i].month_range,year,result,metrics)
		}
	}
}

function englobedMonths(from,to,months,year,result,metrics){
	for(var i in months){
		var month = months[i].month + 1;
		var start = new Date(year+"-"+month+"-01");
		var end = new Date(year+"-"+month+"-"+daysInMonth(month,year));

		var conditionP = from >= start && from <= end;
		conditionP = conditionP || (to >= start && to <= end);
		if(from <= start && to >= end){
			for(var j in metrics){
				var m = metrics[j];
				result[m] += months[i].metrics[m];
			}
		}
		else if(conditionP){
			englobedDays(from,to,months[i].day_range,month,year,result,metrics);
		}
	}
}

function englobedDays(from,to,days,month,year,result,metrics){
	for(var i in days){
		var day = days[i].day;
		var start = new Date(year+"-"+month+"-"+day);
		var end = new Date(year+"-"+month+"-"+day);
		var condition = from <= start && to >= end;
		if(from.getFullYear() === year && from.getMonth()){
			condition = condition || (from.getDate() <= day);
		}
		if(to.getFullYear() === year && to.getMonth()){
			condition = condition || (to.getDate() >= day);
		}
		if(condition){
			for(var j in metrics){
				var m = metrics[j];
				result[m] += days[i].metrics[m];
			}
		}
	}
}

function daysInMonth(month,year) {
    return new Date(year, month, 0).getDate();
}

function getMetrics(path){
    var pointer = path;
    while(pointer.child){
        pointer = pointer.child;
    }
    return pointer.metrics;
}

var mysql = require('../../config/mysql');
//test();
function test(){
	var prodId = "rcs";
	var connection = mysql(prodId);
	var metrics = ["actual_imps", "budget_net"];
	var from = new Date("1970-01-01");
	var to = new Date('2015-01-01');
	var options = {
		from:from,
		to:to,
		metrics: metrics
	};
	async.waterfall([function(callback){
	        var query = "SELECT id, name FROM adlogix_users_campaigns_selections_conf";
	        connection.query(query, callback);
	    }, function(rows,fields,callback){
	    	var ids = [];
	    	for(var i in rows){
	    		ids.push(rows[i].id);
	    	}
	    	getIdsMetrics(prodId,"test",ids,options, function(err,result){
	    		if(err) callback(err);
	    		console.log(result.length);
	    		compare(prodId,result,metrics,from,to,callback);
			});
	    }],function(err){
	    	if(err) throw err;
	    }
	);
}

function compare(prodId,results,metrics,from,to,cb){
	console.log("begin compare")
	var fromQ = dateToString(from);
	var toQ = dateToString(to);
	var connection = mysql(prodId);
	async.eachSeries(results,function(entry,callback){
		var id = entry.id;
		var query = "SELECT dip.id as id,dip.name as name";
		for(var i in metrics){
			query += ",SUM("+metrics[i]+') AS '+metrics[i];
		}
		query += "\n";
		query += "FROM adlogix_users_campaigns_selections_conf dip\n";
		query += "INNER JOIN adlogix_inventory ai ON ai.user_campaign_selection_conf_id = dip.id\n"
		query += "INNER JOIN adlogix_inventory_data aid ON ai.id = aid.inventory_id\n";
		query += "WHERE dip.id="+id+"\n";
		if(from && to){
			query += "AND datetime BETWEEN '"+fromQ+"' AND '"+toQ + "'";
		}
		connection.query(query,function(err,rows,fields){
			for(var i in metrics){
				var m = metrics[i];
				var indexed = entry[m];
				var sqled = rows[0][m];
				if(indexed !== sqled){
					if(!(sqled === null && indexed === 0)){
						var diff = (sqled-indexed)/sqled;
						if(diff > 1/100 || (sqled === null && indexed !== 0)){
							console.log("For id n°"+id+" the metric " + m +" is not correct");
							console.log(JSON.stringify({index:indexed,sql:sqled},undefined,2));
							console.log("Difference "+(100*diff)+"%");
							console.log(query);
						}
					}
				} 
			}
			callback();
		});
	},function(err){
		console.log("Finished compare");
		cb();
	});
}

function dateToString(date){
	return date.getFullYear()+'-'+(date.getMonth()+1)+'-'+date.getDate();
}

module.exports = exports = {
	getIdsMetrics: getIdsMetrics,
	getIdMetrics: getIdMetrics
};