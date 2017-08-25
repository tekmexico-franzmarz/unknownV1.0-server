var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var mongoose = require('mongoose');
mongoose.Promise = global.Promise;

var passport = require("passport");
var LocalStrategy = require('passport-local').Strategy;
var FacebookStrategy=require("passport-facebook").Strategy;

var login = require('./routes/login');
var fbLogin = require('./routes/fb-login');
var twLogin = require('./routes/tw-login');
var register = require('./routes/register');
var users = require('./routes/users');
var chat = require('./routes/chat');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');


app.use(require('express-session')({
  secret: 'chatserver',
  resave: true,
  saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());
require('./config/passport')(passport);

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '../../Client-V1.0.0/dist')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../../Client-V1.0.0/dist/index.html'));
});

app.use('/api/login', login);
app.use('/api/fb-login', fbLogin);
app.use('/api/tw-login', twLogin);
app.use('/api/register', register);
app.use('/api/users', users);
app.use('/api/chat', chat);

// passport config
var User = require('./models/UserSchema');
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

//mongoose.connect('mongodb://localhost/chatDB-v1')
mongoose.connect('mongodb://localhost/unknown-v1')
  .then(() => console.log('connection successful'))
  .catch((err) => console.error(err));

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;