var mysql = require('../../config/mysql');
var elastic = require('../../models/elasticsearch/inserter');
var async = require('async');
var nconf = require('../../config/config');
var log = require('log4js').getLogger('Metrics Aggregation Routes');
var aggSchemes = nconf.get("metricsAggSchemes");
aggSchemes.find = function(name){
    for(var i in this){
        if(this[i].aggregationName === name){
            return this[i];
        }
    }
    return null;
}

function begin(prodId,aggName,callback){
    var connection = mysql(prodId);
    aggregate(prodId,aggName,connection,function(err){
        if(err) callback(err);
        callback(err);
    });
}

function aggregate(prodId,aggName,connection,callback){
    var data = aggSchemes.find(aggName);
    if(!data){
        cb(new Error('Aggregation name ' + aggName + ' unknown'));
    }
    var aggregateTo = data.aggregateTo;
    var path = data.pathToMetrics;
    log.info("Aggregating all ids for ",aggName);
    async.waterfall([function(cb){
        var id = aggregateTo.name+"."+aggregateTo.id;
        var table = aggregateTo.name;
        var query = "SELECT "+id+" FROM " + table;
        connection.query(query, cb);
    },function(rows,fields,cb){
        var count = 0;
        async.eachSeries(rows,function(row,cb){
            ++count;
            log.debug("Doing " + count + " on " + rows.length);
            insertEntry(prodId,aggName,row.id,cb);
        },function(err){
            if(err) callback(err);
            callback();
        });
     }], function(err){
        if(err) callback(err);
        log.info("Ended aggregating all ids for ",aggName);
        callback();
     });
}

function insertEntry(prodId,aggName,id,cb){
    var data = aggSchemes.find(aggName);
    if(!data){
        return cb(new Error('Aggregation name ' + aggName + ' unknown'));
    }
    var es = nconf.get("productions")[prodId].elasticsearch;
    es.type = data.aggregationName;
    var connection = mysql(prodId);
    var aggregateTo = data.aggregateTo;
    var path = data.pathToMetrics;
    var metrics = getMetrics(path);
    var timeName = getTimeName(path);

    var result = {
        "id": id
    };
    var query = buildQuery(aggregateTo,id,path,connection);
    connection.query(query, function(err,rows,fields){
        if(err) return cb(err);
        for(var i in rows){
            buildResult(rows[i],result,metrics,timeName);
        }
        elastic.insert(es,result,result.id, function(err, res) {
            if(err) cb(err);
            else{
                delete rows;
                delete docs;
                delete result;
                cb();
            }
        });
    });
}

function buildQuery(aggregateTo,id,path,connection){
    var idName = aggregateTo.name + "." + aggregateTo.id;
    var select = "SELECT " + idName;
    var from = "FROM " + aggregateTo.name + "\n";
    var result = buildSelectFrom(select,from,aggregateTo,path);
    var where = "WHERE " + idName + " = " + connection.escape(id);

    return result.select + "\n" + result.from + "\n" + where;
}

function buildSelectFrom(select,from,parent,child){
    from += "INNER JOIN " + child.name + " ";
    from += "ON " + child.name +"."+child.parentLink + " = " + parent.name +"."+parent.id;
    from += '\n';
    if(child.child){
        return buildSelectFrom(select,from,child,child.child);
    } else {
        if(child.metrics && child.dateRangeAttribute){
            select += ", " + child.name + "." + child.dateRangeAttribute;
            for(var i in child.metrics){
                select += ", " + child.name + "." + child.metrics[i];
            }
            return {select:select,from:from};
        } else {
            throw new Error("metrics and/or dateRangeAttribute are not specified at the end of the path\n"+JSON.stringify(child,undefined,2));
        }
    }
}

function getMetrics(path){
    var pointer = path;
    while(pointer.child){
        pointer = pointer.child;
    }
    return pointer.metrics;
}

function getTimeName(path){
    var pointer = path;
    while(pointer.child){
        pointer = pointer.child;
    }
    return pointer.dateRangeAttribute;
}

function buildResult(row,result,metrics,timeName){
    var datetime = row[timeName];
    var year = datetime.getFullYear();
    var month = datetime.getMonth();
    var day = datetime.getDate();
    var pointer = result;
    
    pointer = findSub(pointer,"year",year,metrics);
    addMetrics(pointer,row,metrics);

    pointer = findSub(pointer,"month",month,metrics);
    addMetrics(pointer,row,metrics);

    pointer = findSub(pointer,"day",day,metrics);
    addMetrics(pointer,row,metrics);
}

function addMetrics(pointer,row,metrics){
     for(var i in metrics){
        pointer.metrics[metrics[i]] += row[metrics[i]];
    }
}

function findSub(pointer,name,value,metrics){
    if(!pointer[name+"_range"])
        pointer[name+"_range"] = [];
    pointer = pointer[name+"_range"];
    var found = false;
    for(var i in pointer){
        if(pointer[i][name] === value){
            pointer = pointer[i];
            found = true;
            break;
        }
    }
    if(!found){
        var object = {
            "metrics": {}
        };

        object[name] = value;

        for(var i in metrics){
            object.metrics[metrics[i]] = 0;
        }
        pointer.push(object);
        pointer = object;
    }

    return pointer;
}

module.exports = exports = {
    indexAll: begin,
    indexOne: insertEntry
};