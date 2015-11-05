var Db = require('./db');
var ObjectID = require('mongodb').ObjectID;
var poolModule = require('generic-pool');
var pool = poolModule.Pool({
	name: 'mongoPool',
	create: function(callback){
		var mongodb = Db();
		mongodb.open(function(err,db){
			callback(err,db);
		});
	},
	destroy: function(mongodb){
		mongodb.close();
	},
	max: 100,
	min: 5,
	idleTimeoutMillis: 30000,
	log: true
});

function Comment(name,day,_id,comment){
	this.name = name;
	this.day = day;
	this._id = _id;
	this.comment = comment;
}

module.exports = Comment;

Comment.prototype.save = function(callback){
	var name = this.name,
		day = this.day,
		_id = this._id,
		comment = this.comment;
	
	pool.acquire(function(err,mongodb){
		if(err){
			return callback(err);
		}
		mongodb.collection('posts', function(err,collection){
			if(err){
				pool.release(mongodb);
				return callback(err);
			}
			collection.update({
				'name': name,
				'time.day': day,
				'_id': new ObjectID(_id)
			},{
				$push:{'comments':comment}
			}, function(err){
				pool.release(mongodb);
				if(err){
					return callback(err);
				}
				callback(null);
			});
		});
	});
};

Comment.remove = function(name,day,_id,time,callback){
	pool.acquire(function(err,mongodb){
		if(err){
			return callback(err);
		}
		mongodb.collection('posts', function(err,collection){
			if(err){
				pool.release(mongodb);
				return callback(err);
			}
			collection.update({
				'name': name,
				'time.day': day,
				'_id': new ObjectID(_id)
			},{"$pull":{
				"comments":{
					"time": time
				}
			}} ,function(err){
				pool.release(mongodb);
				if(err){
					return callback(err);
				}
				callback(null);
			});
		});
	});
};

