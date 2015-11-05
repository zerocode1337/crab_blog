var Db = require('./db.js');
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
function User(user){
	this.name = user.name;
	this.password = user.password;
	this.email = user.email;
	this.photo = "/images/photo.jpg";
	this.crabEditor = 1;  //1表示默认(kindEditor) 2表示markdown
	this.info = null;
	this.index = null;
};

module.exports = User;

// save user's infomation
User.prototype.save = function(callback){
	var user = {
		name: this.name,
		password: this.password,
		email: this.email,
		photo: this.photo,
		crabEditor: this.crabEditor,
		info : this.info,
		index: this.index
	};
	//open database
	pool.acquire(function(err,mongodb){
		if(err){
			return callback(err);
		}
		// read user set
		mongodb.collection('users',function(err,collection){
			if(err){
				pool.release(mongodb);
				return callback(err);
			}
			//insert user's info to set
			collection.insert(user,{
				safe: true
			//}, function(err,user){
			//	console.log(user.ops[0].name);
			//	mongodb.close();
			//	if(err){
			//		return callback(err);
			//	}
			//	callback(null,user.ops[0].name); //success!
			//});
				}, function(err,user){
				pool.release(mongodb);
				if(err){
					return callback(err);
				}
				callback(null,user); //success!
			});
		});
		
	});
};
User.update = function(user,callback){
	pool.acquire(function(err,mongodb){
		if(err){
			return callback(err);
		}
		mongodb.collection('users',function(err,collection){
			if(err){
				pool.release(mongodb);
				return callback(err);
			}
			collection.update({
				'name': user.name
			},{$set:{
				'email': user.email,
				'password': user.password,
				'photo': user.photo,
				'crabEditor': user.editor,
				'info': user.info,
				'index': user.index
			}},function(err){
				pool.release(mongodb);
				if(err){
					return callback(err);
				}
				callback(null);
			});
		});
	});
}

//read user's infomation
User.get = function(name,callback){
	pool.acquire(function(err,mongodb){
		if(err){
			return callback(err);
		}
		// read users set
		mongodb.collection('users', function(err,collection){
			if(err){
				pool.release(mongodb);
				return callback(err);
			}
			//search name 
			collection.findOne({
				name:name
			},function(err,user){
				pool.release(mongodb);
				if(err){
					return callback(err);
				}
				callback(null,user);
			});
		});
	});
};
