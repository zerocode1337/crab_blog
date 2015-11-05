var settings = require('../settings');
var Db = require('mongodb').Db;
var Connection = require('mongodb').Connection;
var Server = require('mongodb').Server;

module.exports = function(){
	return new Db(settings.db,new Server(settings.host,settings.port),{
		safe:true, poolSize:1
	});
}
//module.exports = new Db(settings.db,new Server(settings.host,settings.port),{safe:true});

