var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var multer = require('multer');

var session = require('express-session');
var MongoStore = require('connect-mongo')(session);

var routes = require('./routes/index');
var users = require('./routes/users');
var settings = require('./settings');
var flash = require('connect-flash');

var fs = require('fs');
var accessLog = fs.createWriteStream('access.log',{flags:'a'});
var errorLog = fs.createWriteStream('error.log',{flags:'a'});
var app = express();

var passport = require('passport');
var GithubStragegy = require('passport-github').Strategy;

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(flash());

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(logger({stream:accessLog}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(function(err,req,res,next){
	var meta = '[' + new Date() + ']' + req.url + '\n';
	errorLog.write(meta + err.stack + '\n');
	next();
});

app.use(session({
	secret: settings.cookieSecret,
	key: settings.db,
	cookie: {maxAge:1000*60*20},
	store: new MongoStore({
		db:settings.db,
		host:settings.host,
		port:settings.port
	})
}));

app.use(multer({
	dest: './public/files/photos',
	rename: function(fieldname,filename){
		return filename;
	}
}));

//使用kevin' 改写的模板
//app.use('/', routes);
//app.use('/users', users);

app.use(passport.initialize());

routes(app);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

passport.use(new GithubStragegy({
	clientID: "83f9b7c9c85e87e23518",
	clientSecret: "b9d90129534aa6d6fcf95a60c5698cddd842cc9b",
	callbackURL: "http://localhost:3000/login/github/callback"

},function(accessToken, refreshToken, profile, done){
	done(null,profile);
}));

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
