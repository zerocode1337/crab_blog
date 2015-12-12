var express = require('express');
var router = express.Router();
//验证码相关模块
var ccap = require('ccap');
//md5相关模块
var crypto = require('crypto');
var fs = require('fs');
var User = require('../models/user.js');
var Post = require('../models/post.js');
var Comment = require('../models/comment.js');
var passport = require('passport');
var formidable = require("formidable");

module.exports = function(app){
	app.get('/', function(req,res,next){
		var page = req.query.p?parseInt(req.query.p):1;
		//console.log('p:' + req.query.p + '\n' + 'page:' + page);
		Post.getTen(null,page,function(err,posts,total,tags){
			if(err){
				posts = [];
			}
			res.render('index',{
				user: req.session.user,
				title: 'crabx',
				posts: posts,
				tags: tags,
				page: page,
				isFirstPage: (page-1) == 0,
				isLastPage: ((page-1) * 10 + posts.length) == total,
				photo: req.session.photo,
				success: req.flash('success').toString(),
				error: req.flash('error').toString()
			})
		});
	});
	//验证码模块
	app.get('/getCaptcha', function(req,res,next){
		//设置验证码样式
		var captcha = ccap({
			width:110,
			height:30,
			offset:17,
			quality:100,
			fontsize:24
		});
		var ary = captcha.get();
		//验证码文本内容
		var txt = ary[0];
		//验证码图片buf
		var buf = ary[1];
		req.session.txt = txt;
		console.log(txt);
		console.log(buf);
		console.log("type : " + typeof buf);
		res.set('Content-Type','image/jpeg');
		res.end(buf);
	});
	app.get('/tags/:tag', function(req,res){
		var page = req.query.p?parseInt(req.query.p):1;
		Post.getTag(req.params.tag,page, function(err,posts,total){
			if(err){
				posts = [];
				req.flash('error',err);
				return res.redirect('/');
			}
			res.render('tag',{
				title: req.params.tag,
				posts: posts,
				photo: req.session.photo,
				user: req.session.user,
				page: page,
				isFirstPage: (page-1) == 0,
				isLastPage: ((page-1) * 10 + posts.length) == total,
				success: req.flash('success').toString(),
				error: req.flash('error').toString()
			});
		});
	});
	app.get('/reg', checkNotLogin);
	app.get('/reg', function(req,res,next){
		res.render('reg', {
			user: req.session.user,
			photo:req.session.photo,
			title: 'register',
			success: req.flash('success').toString(),
			error: req.flash('error').toString()
		});
	});
    app.get('/checkName/:name', function(req,res,next){
        var tempname = req.params.name;
        User.get(tempname,function(err,user){
            if(err){
                 req.flash("error",err);
                 res.redirect('/reg');
            }
            if(user){
                 return res.end("denied");
            }else{
                return res.end("okay");
            }
        });
    });
    app.get('/checkVerify/:verify', function(req,res,next){
         var tempverify = req.params.verify.toUpperCase();
         if(tempverify == req.session.txt){
             return res.end("okay");
         }else{
              return res.end("denied");
         }
    });
	app.post('/reg', checkNotLogin);
	app.post('/reg', function(req,res,next){
		var name = req.body.name;
		var password = req.body.password;
		var password_re = req.body['password-repeat'];
		var verify = req.body.verify.toUpperCase();

		console.log("verify " + verify);
		console.log("text: " + req.session.txt);
		//console.log(name + " " + password);
		if(verify != req.session.txt){
			req.flash('error',"验证码不正确!");
			return res.redirect('/reg');
		}
		var md5 = crypto.createHash('md5');
		var password = md5.update(req.body.password).digest('hex');
		var newUser = new User({
			name: name,
			password: password,
			email: req.body.email
		});

		User.get(newUser.name, function(err,user){
			if(err){
				req.flash('error',err);
				return res.redirect('/');
			}
			//console.log("当前user: " +　user);
			if(user){
				req.flash('error','the user repeat!');
				return res.redirect('/reg');
			}
			newUser.save(function(err,user){
				if(err){
					req.flash('error',err);
					return res.redirect('/reg');
				}
				//console.log("before session" + user);
				console.log(user);
				req.session.user = user.ops[0].name;
				req.session.photo = user.ops[0].photo;
				req.session.email = user.ops[0].email;
				req.session.typeEditor = user.ops[0].crabEditor;
				req.session.password = user.ops[0].password;
				req.session.info = user.ops[0].info;
				req.session.index = user.ops[0].index;
				req.flash('success',"register success!");
				res.redirect('/');
			});
		});
	});
	app.get('/login', checkNotLogin);
	app.get('/login', function(req,res,next){
		res.render('login',{
			user: req.session.user,
			title: 'login',
			success: req.flash('success').toString(),
			error: req.flash('error').toString()
		});
	});
	app.post('/login', checkNotLogin);
	app.post('/login', function(req,res,next){
		//生成md5值
		var md5 = crypto.createHash('md5');
		var password = md5.update(req.body.password).digest('hex');
		//检查用户是否存在
		User.get(req.body.name, function(err,user){
			if(err){
				req.flash('error',err);
				return res.direct('/');
			}
			if((!user) || (user.password != password)){
				req.flash('error','用户名或密码错误!');
				return res.redirect('/login');
			}
			req.session.user = user.name;
			req.session.password = user.password;
			req.session.photo = user.photo;
			req.session.email = user.email;
			req.session.typeEditor = user.crabEditor;
			req.session.info = user.info;
			req.session.index = user.index;
			req.flash('success','登录成功!');
			res.redirect('/');
		});
	});
	app.get("/login/github", passport.authenticate("github", {session: false}));
	app.get("/login/github/callback", passport.authenticate("github", {
		session: false,
		failureRedirect: '/login',
		successFlash: '登陆成功！'
	}), function (req, res) {
		User.get(req.user.username, function(err,user){
			if(err){
				req.flash('error',err);
				return res.direct('/');
			}
			if(user){
				req.flash('error','当前用户禁止登陆，可能是用户名与本站冲突！');
				res.redirect('/login');
			}else{
				req.session.user = req.user.username;
				res.redirect('/');
			}
		});
	});


	app.get('/post', checkLogin);
	app.get('/post', function(req,res,next){
		res.render('post', {
			user: req.session.user,
			photo: req.session.photo,
			typeEditor: req.session.typeEditor,
			title: '新随笔',
			success: req.flash('success').toString(),
			error: req.flash('error').toString()
		});
	});
   // app.get('/showImages/:filename' ,function(req,res,next){
   //     var filename = req.params.filename;
   //     console.log(filename);
   //     res.render('showImage', {
   //         title:'图片',
   //         user: req.session.user,
   //         photo:req.session.photo,
   //         file:filename,
   //         success: req.flash('success').toString(),
   //         error: req.flash('error').toString()
   //     });
   // });

    app.get('/showImages/:filename' ,function(req,res,next){
        var filename = req.params.filename;
        fs.readFile('/home/crab_blog/public/files/photos/'+filename+'.jpg', function(err,file){
            if(err){
                req.flash('error',err);
                return res.redirect('back');
            }else{
                res.writeHead(200,{"Content-Type":"image/png"});
                res.write(file,"binary");
                res.end();
            }
        });
    });
	app.get('/test', function(req, res, next) {
		res.render('test', {
			title: '图片上传',
			photo: req.session.photo,
			user: req.session.user,
			success: req.flash('success').toString(),
			error: req.flash('error').toString()
		});
	});

	app.post('/post',checkLogin);
	app.post('/post', function(req,res,next){
		var currenUser = req.session.user;
		if(req.body.title == ''){
			req.flash('error','标题不能为空！');
			return res.redirect('back');
		}
		var tags = [req.body.tag1,req.body.tag2,req.body.tag3];
		var post = new Post(currenUser,req.body.title,tags,req.body.post);
		post.save(function(err){
			if(err){
				req.flash('error',err);
				return res.redirect('/');
			}
			req.flash('success','发布成功!');
			res.redirect('/');
		});
	});
	app.get('/logout', checkLogin);
	app.get('/logout' ,function(req,res,next){
		req.session.user = null;
		req.session.photo = null;
		req.session.typeEditor = null;
		req.session.password = null;
		req.session.info = null;
		req.session.index = null;
		req.session.email = null;
		req.flash('success','登出成功!');
		res.redirect('/');
	});
	app.get('/upload', checkLogin);
	app.get('/upload', function(req,res,next){
		res.render('upload',{
			title: '文件上传',
			user: req.session.user,
			photo:req.session.photo,
			success: req.flash('success').toString(),
			error: req.flash('error').toString()
		});
	});
	app.post('/upload', function(req,res,next){
		req.flash('success','文件上传成功!');
		res.redirect('/upload');
	});
	app.get('/personal', checkLogin);
	app.get('/personal', function(req,res,next){
		res.render('personal', {
			title: '个人中心',
			user: req.session.user,
			photo: req.session.photo,
			typeEditor: req.session.typeEditor,
			email: req.session.email,
			info: req.session.info,
			index: req.session.index,
			success: req.flash('success').toString(),
			error: req.flash('error').toString()
		});
	});
	app.post('/personal', function(req,res,next){
		var settingEmail = req.body.settingsEmail;          //form数据
		settingEditor = req.body.optionsRadios,
			settingPhoto = req.body.settingsTempPhoto,
			settingInfo = req.body.settingsInfo,
			settingIndex = req.body.settingsIndex;
		settingNowPass = req.body.settingsNowPass;
		settingNewPass = req.body.settingsNewPass;
		settingPassAgain = req.body.settingsPassAgain;
		//头像上传功能刘坑待填
		settingPhoto = req.session.photo;
		var NowPassHash = NewPassHash = null;
		if(settingNowPass == undefined && settingNewPass == undefined && settingPassAgain == undefined){
			NowPassHash = req.session.password;
			NewPassHash = req.session.password;
		}else{
			NewPassHash = crypto.createHash('md5').update(settingNewPass).digest('hex');
			NowPassHash = crypto.createHash('md5').update(settingNowPass).digest('hex');
		}
		if(NowPassHash != req.session.password){
			req.flash('error',"当前密码不正确！");
			return res.redirect('back');
		}
		var newUser = new Object();
		newUser.name = req.session.user;
		newUser.password = NewPassHash;
		newUser.email = settingEmail;
		newUser.photo = settingPhoto;
		newUser.editor = settingEditor;
		newUser.info = settingInfo;
		newUser.index = settingIndex;
		User.update(newUser,function(err){
			if(err){
				req.flash('error',err);
				return res.redirect('back');
			}
			req.session.typeEditor = settingEditor;
			req.session.info = settingInfo;
			req.session.index = settingIndex;
			req.session.password = settingNowPass;
			req.session.photo = settingPhoto;
			req.session.password = NewPassHash;
			req.flash('success','修改成功！');
			res.redirect('back');
		});
	});
	app.get('/archive',function(req,res,next){
		var name = req.session.user;
		if(name == null){
			req.flash('error','请登陆！');
			return res.redirect('/login');
		}
		Post.getArchive(name,function(err,posts){
			if(err){
				req.flash('error',err);
				return res.redirect('/');
			}
			res.render('archive',{
				title: '归档',
				posts: posts,
				photo: req.session.photo,
				user: req.session.user,
				success: req.flash('success').toString(),
				error: req.flash('error').toString()
			});
		});
	});
	app.get('/search', function(req,res,next){
		var page = req.query.p?parseInt(req.query.p):1;
		Post.search(req.query.keyword,page,function(err,posts,total){
			if(err){
				posts = [];
				req.flash('error','当前不支持此种查询，请换一种写法！');
				return res.redirect('/');
			}
			res.render('search',{
				title: "SEARCH:" + req.query.keyword,
				posts: posts,
				user: req.session.user,
				photo: req.session.photo,
				page: page,
				isFirstPage: (page-1) == 0,
				isLastPage: ((page-1) * 10 + posts.length) == total,
				success: req.flash('success').toString(),
				error: req.flash('error').toString()
			});
		});
	});
	app.get('/u/:name', function(req,res){
		var page = req.query.p?parseInt(req.query.p):1;
		Post.getTen(req.params.name,page, function(err,posts,total){
			if(err){
				posts = [];
				req.flash('error',err);
				return res.redirect('/');
			}
			User.get(req.params.name,function(err,user){
				if(err){
					req.flash('error',err);
					return res.redirect('/');
				}
				console.log(user);
				res.render('user', {
					title: req.params.name,
					posts: posts,
					page: page,
					isFirstPage: (page-1) == 0,
					isLastPage: ((page-1)*10+posts.length) == total,
					user: req.session.user,
					name: req.params.name,
					photo: req.session.photo,
					index: user.index,
					email: user.email,
					info: user.info,
					success: req.flash('success').toString(),
					error: req.flash('error').toString()
				});
			});
		});
	});
	app.get('/links', function(req,res,next){
		res.render('links', {
			title: 'links',
			user: req.session.user,
			photo: req.session.photo,
			success: req.flash('success').toString(),
			error: req.flash('error').toString()
		});
	});
	app.get('/u/:name/:day/:title', function(req,res,next){
		Post.getOne(req.params.name,req.params.day,req.params.title, function(err,post){
			if(err){
				req.flash('error',err);
				return res.redirect('/');
			}
			res.render('article',{
				title: post.title,
				post: post,
				user: req.session.user,
				photo: req.session.photo,
				success: req.flash('success').toString(),
				error: req.flash('error').toString()
			});
		});
	});
	app.post('/u/:name/:day/:title', function(req,res){
		var date = new Date(),
			time = date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate() + " " + date.getHours() + ":" + (date.getMinutes() < 10 ? '0' + date.getMinutes(): date.getMinutes()) + ":" + (date.getSeconds()<10?'0'+date.getSeconds(): date.getSeconds());

		var comment = {
			name: req.body.name,
			time: time,
			content: req.body.content
		};
		var newComment = new Comment(req.params.name,req.params.day,req.params.title,comment);
		newComment.save(function(err){
			if(err){
				req.flash('error',err);
				return res.redirect('back');
			}
			req.flash('success','留言成功！');
			res.redirect('back');
		});
	});
	//删除评论
	app.get('/removecomment/:name/:day/:title/:time/:comment_name',checkLogin);
	app.get('/removecomment/:name/:day/:title/:time/:comment_name', function(req,res,next){
		if((req.params.name != req.session.user) && (req.params.comment_name != req.session.user)){
			req.flash('error','您无权访问此页面！');
			return res.redirect('back');
		}
		var url = encodeURI('/u/' + req.params.name + '/' + req.params.day + '/' + req.params.title);
		Comment.remove(req.params.name,req.params.day,req.params.title,req.params.time, function(err){
			if(err){
				req.flash('error',err);
				return res.redirect('back');
			}
			req.flash('success','删除成功!');
			res.redirect(url);
		});
	});
	app.get('/remove/:name/:day/:title', checkLogin);
	app.get('/remove/:name/:day/:title', function(req,res,next){
		if(req.params.name != req.session.user){
			req.flash('error','您无权访问此页面！');
			return res.redirect('back');
		}
		Post.remove(req.params.name,req.params.day,req.params.title, function(err){
			if(err){
				req.flash('error',err);
				return res.redirect('back');
			}
			req.flash('success','删除成功!');
			var url = encodeURI('/u/' + req.params.name);
			res.redirect(url);
		})
	});
	app.get('/edit/:name/:day/:title', checkLogin);
	app.get('/edit/:name/:day/:title', function(req,res,next){
		if(req.params.name != req.session.user){
			req.flash('error','您无权访问此页面！');
			return res.redirect('back');
		}
		Post.edit(req.params.name,req.params.day,req.params.title, function(err,post){
			if(err){
				req.flash('error',err);
				return res.redirect('back');
			}
			res.render('edit',{
				title: '编辑',
				post: post,
				user: req.session.user,
				photo: req.session.photo,
				typeEditor: req.session.typeEditor,
				success: req.flash('success').toString(),
				error: req.flash('error').toString()
			});
		});
	});
	app.get('/reprint/:name/:day/:_id',checkLogin);
	app.get('/reprint/:name/:day/:_id', function(req,res,next){
		Post.edit(req.params.name,req.params.day,req.params._id,function(err,post){
			if(err){
				req.flash('error',err);
				return res.redirect('back');
			}
			if(req.session.user == req.params.name){
				req.flash('error','您无法转载自己的文章!');
				return res.redirect('back');
			}
			if(post.reprint_info.reprint_from != undefined && req.session.user == post.reprint_info.reprint_from.name){
				req.flash('error',"您无法转载自己的文章！");
				return res.redirect('back');
			}
			var currenUser = req.session.user,
				reprint_from = {name: post.name, day: post.time.day, title: post.title,_id: post._id},
				reprint_to = {name: currenUser};
			Post.reprint(reprint_from,reprint_to,function(err,post){
				if(err){
					req.flash('error',err);
					return res.redirect('back');
				}
				req.flash('success','转载成功！');
				var url = encodeURI('/u/'+post.name+'/'+post.time.day+'/'+post._id);
				res.redirect(url);
			});
		});
	});
	app.post('/edit/:name/:day/:title', checkLogin);
	app.post('/edit/:name/:day/:title', function(req,res,next){
		var currenUser = req.session.user;
		Post.update(req.params.name,req.params.day,req.params.title,req.body.post, function(err){
			var url = encodeURI('/u/' + req.params.name + '/' + req.params.day + '/' + req.params.title);
			if(err){
				req.flash('error',err);
				return res.redirect(url);
			}
			req.flash('success','修改成功');
			res.redirect(url);
		});
	});

	function checkLogin(req,res,next){
		if(!req.session.user){
			req.flash('error','未登录!');
			return res.redirect('/login');
		}
		next();
	}
	function checkNotLogin(req,res,next){
		if(req.session.user){
			req.flash('error','已登录');
			res.redirect('back');
		}
		next();
	}
};
