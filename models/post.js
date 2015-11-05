var Db = require('./db');
var markdown = require('markdown').markdown;
var marked = require('marked');
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
function Post(name,title,tags,post){
	this.name = name;
	this.title = title;
	this.tags = tags;
	this.post = post;
}

module.exports = Post;

//存储文章内容
Post.prototype.save = function(callback){
	//存储时间
	var date = new Date();
	var time = {
		date: date,
		year: date.getFullYear(),
		month: date.getFullYear() + '-' + (date.getMonth() + 1),
		day: date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate(),
		minute: date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate() + " " +		date.getHours() + ":" + (date.getMinutes() < 10 ? '0' + date.getMinutes(): date.getMinutes())
	}
	//存入文章结构
	var post = {
		name: this.name,
		time: time,
		title: this.title,
		tags: this.tags,
		post: this.post,
		comments: [],
		reprint_info:{},
		pv: 0
	};
	//打开数据库
	pool.acquire(function(err,mongodb){
		if(err){
			return callback(err);
		}
		//读取文章集合
		mongodb.collection('posts', function(err,collection){
			if(err){
				pool.release(mongodb);
				return callback(err);
			}
			//将文章插入文章集合
			collection.insert(post,{
				safe: true
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
//获取所有文章
Post.getTen = function(name,page,callback){
	pool.acquire(function(err,mongodb){
		if(err){
			return callback(err);
		}
		//读取文章集合
		mongodb.collection('posts',function(err,collection){
			if(err){
				pool.release(mongodb);
				return callback(err);
			}
			var tags = [];
			collection.distinct('tags', function(err,docs){
				if(err){
					return callback(err);
				}
				var cnt = 0;
				for(var i = 0; i < docs.length; i++){
					if(docs[i] == '')
						continue;
					tags[cnt++] = docs[i];
				}
			});
			var query = {};
			if(name){
				query.name = name;
			}
			//根据query对象查询文章
			collection.count(query,function(err,total){
				collection.find(query,{
					skip: (page-1)*10,
					limit: 10
				}).sort({
					time: -1
				}).toArray(function(err,docs){
					pool.release(mongodb);
					if(err){
						return callback(err);
					}
					//解析markdown为html
					docs.forEach(function(doc){
						//doc.post = markdown.toHTML(doc.post);
						doc.post = doc.post.toString();
						doc.post = marked(doc.post);
					});
					callback(null,docs,total,tags); //success!
				});
			});
		});
	});
};
Post.remove = function(name,day,_id,callback){
	pool.acquire(function(err,mongodb){
		if(err){
			return callback(err);
		}
		mongodb.collection('posts', function(err,collection){
			if(err){
				pool.release(mongodb);
				return callback(err);
			}
			collection.findOne({
				'name': name,
				'time.day': day,
				'_id': new ObjectID(_id)
			}, function(err,doc){
				if(err){
					pool.release(mongodb);
					return callback(err);
				}
				var reprint_from = "";
				if(doc.reprint_info.reprint_from){
					reprint_from = doc.reprint_info.reprint_from;
				}
				if(reprint_from != ""){
					collection.update({
						'name': reprint_from.name,
						'time.day': reprint_from.day,
						'_id': new ObjectID(reprint_from._id)
					},{
						$pull:{
							'reprint_info.reprint_to':{
								'name':name,
								'day': day,
								'title': doc.title
							}
						}
					},function(err){
						if(err){
							pool.release(mongodb);
							return callback(err);
						}
					});
				}
				collection.remove({
					'name': name,
					'time.day': day,
					'_id': new ObjectID(_id),
				},{w:1} ,function(err){
					pool.release(mongodb);
					if(err){
						return callback(err);
					}
					callback(null);
				});
			});
		});
	});
};
Post.getTag = function(tag,page,callback){
	pool.acquire(function(err,mongodb){
		if(err){
			return callback(err);
		}
		mongodb.collection('posts',function(err,collection){
			if(err){
				pool.release(mongodb);
				return callback(err);
			}
			collection.count({"tags":tag},function(err,total){
				collection.find({
					"tags": tag
				},{
					"_id": 1,
					"name": 1,
					"time": 1,
					"title": 1,
					"pv": 1,
					"comments": 1
				},{
					skip: (page-1)*10,
					limit: 10
				}).sort({
					time:-1
				}).toArray(function(err,docs){
					pool.release(mongodb);
					if(err){
						return callback(err);
					}
					callback(null,docs,total);
				});
			});
		});
	});
};
Post.update = function(name,day,_id,post,callback){
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
			},{$set:{
				'post': post   //×××××××××××××××××××××××××刘坑待填,更新文章名
			}}, function(err){
				pool.release(mongodb);
				if(err){
					return callback(err);
				}
				callback(null);
			});
		});
	});
};
Post.edit = function(name,day,_id,callback){
	pool.acquire(function(err,mongodb){
		if(err){
			return callback(err);
		}
		mongodb.collection('posts',function(err,collection){
			if(err){
				pool.release(mongodb);
				return callback(err);
			}
			collection.findOne({
				'name': name,
				'time.day': day,
				'_id': new ObjectID(_id)
			}, function(err,doc){
				pool.release(mongodb);
				if(err){
					return callback(err);
				}
				callback(null,doc);
			});
		});
	});
};
//获取一篇文章
Post.getOne = function(name,day,_id,callback){
	//open mongo
	pool.acquire(function(err,mongodb){
		if(err){
			return callback(err);
		}
		//读取posts集合
		mongodb.collection('posts', function(err,collection){
			if(err){
				pool.release(mongodb);
				return callback(err);
			}
			//根据用户名,发表日期及文章名查询
			collection.findOne({
				'name':name,
				'time.day': day,
				'_id': new ObjectID(_id)
			}, function(err,doc){
				if(err){
					pool.release(mongodb);
					return callback(err);
				}
				if(doc){
					doc.post = doc.post.toString();
					doc.post = marked(doc.post);
					collection.update({
						'name': name,
						'time.day': day,
						'_id': new ObjectID(_id)
					},{
						$inc:{'pv':1}
					},function(err){
						pool.release(mongodb);
						if(err){
							return callback(err);
						}
					});
					doc.comments.forEach(function(comment){
						comment.content = comment.content.toString();
						comment.content = marked(comment.content);
					});
					callback(null,doc); //success!
				}else{
					return callback("没有此文章！");
				}
			});
		});
	});
};

Post.getArchive = function(name,callback){
	pool.acquire(function(err,mongodb){
		if(err){
			return callback(err);
		}
		mongodb.collection('posts',function(err,collection){
			if(err){
				pool.release(mongodb);
				return callback(err);
			}
			collection.find({
				"name": name
			},{
				"name":1,
				"time":1,
				"title":1,
				"_id":1
			}).sort({
				time:-1
			}).toArray(function(err,docs){
				pool.release(mongodb);
				if(err){
					return callback(err);
				}
				callback(null,docs);
			});
		});
	});
};

Post.search = function(keyword,page,callback){
	pool.acquire(function(err,mongodb){
		if(err){
			return callback(err);
		}
		mongodb.collection('posts', function(err,collection){
			if(err){
				pool.release(mongodb);
				return callback(err);
			}
			var pattern = new RegExp(keyword,"i");
			collection.count({"title": pattern},function(err,total){
				collection.find({
					"title":pattern
				},{
					skip: (page-1)*10,
					limit: 10
				}).sort({
					time: -1
				}).toArray(function(err,docs){
					pool.release(mongodb);
					if(err){
						return callback(err);
					}
					callback(null,docs,total);
				});
			});
		});
	});
};
Post.reprint = function(reprint_from,reprint_to,callback){
	pool.acquire(function(err,mongodb){
		if(err){
			return callback(err);
		}
		mongodb.collection('posts',function(err,collection){
			if(err){
				pool.release(mongodb);
				return callback(err);
			}
			collection.findOne({
				'name': reprint_from.name,
				'time.day': reprint_from.day,
				'_id': new ObjectID(reprint_from._id)
			}, function(err,doc){
				if(err){
					pool.release(mongodb);
					return callback(err);
				}
				var date = new Date();
				var time = {
					date: date,
					year: date.getFullYear(),
					month: date.getFullYear()+"-"+(date.getMonth()+1),
					day: date.getFullYear()+"-"+(date.getMonth()+1)+"-"+date.getDate(),
					minute: date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate() + " " +		date.getHours() + ":" + (date.getMinutes() < 10 ? '0' + date.getMinutes(): date.getMinutes())
				}
				delete doc._id;
				doc.name = reprint_to.name;
				doc.time = time;
				doc.title = (doc.title.search(/[转载]/) > -1)? doc.title:"[转载]"+doc.title;
				doc.comments = [];
				doc.reprint_info = {"reprint_from":reprint_from};
				doc.pv = 0;
				collection.update({
					'_id': new ObjectID(reprint_from._id)
				},{
					$push:{
						'reprint_info.reprint_to':{
							'name':doc.name,
							'day': time.day,
							'title': doc.title
						}
					}
				},function(err){
					if(err){
						pool.release(mongodb);
						return callback(err);
					}
				});
				collection.insert(doc,{
					safe:true
				},function(err,post){
					pool.release(mongodb);
					if(err){
						return callback(err);
					}
					callback(err,post.ops[0]);
				});
			});
		});
	});
};
