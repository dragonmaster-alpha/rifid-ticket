var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var bodyParser = require('body-parser');
var session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const rateLimit = require("express-rate-limit");
const xss = require('xss-clean');
const mongoSanitize = require('express-mongo-sanitize');



var logger = require('morgan');
const helmet = require('helmet')
const fileUpload = require('express-fileupload');

const api = require('./functions')

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var companiesRouter = require('./routes/companies');
var projectsRouter = require('./routes/projects');
var ticketsRouter = require('./routes/tickets');
var tasksRouter = require('./routes/tasks');
var contactsRouter = require('./routes/contacts');
var crmRouter = require('./routes/crm');
var uploadsRouter = require('./routes/uploads');




var User = require('./models/users');


var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/rfid', { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex:true, useFindAndModify: false });


/*
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
*/

passport.serializeUser(function(user, done) {
    done(null, user.id);
});
passport.deserializeUser(function(id, done) {
    User.findOne({
        _id: id
    }, '-password -salt', function(err, user) {
        done(err, user);
    });
});

passport.use(new LocalStrategy({
  usernameField: 'email',
  passwordField: 'passowrd'
}, function verify(email, password, done) {
    User.findOne({
       email: email.toLowerCase()
    }, function(err, user) {
        // This is how you handle error
        if (err) return done(err);
        // When user is not found
        if (!user) return done(null, false);
        // When password is not correct
        if (api.encrypt(password) != user.password) return done(null, false);

        //console.log(user.active)
        if (user.active == false) return done(null, "inactive");
        // When all things are good, we return the user
      
        return done(null, user);
     });
}));




var app = express();

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 400 // limit each IP to 100 requests per windowMs
});





app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// configuring uploads

app.use(helmet());
app.use(limiter);
app.use(xss());
app.use(mongoSanitize());


app.use(logger('dev'));
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(fileUpload());
//app.use(bodyParser.json());
//app.use(bodyParser.urlencoded({ extended: true }));

app.use(session({ cookie: { maxAge: 60*60*1000 }, 
                  secret: 'rfidEgyptBEMak',
                  resave: true, 
                  saveUninitialized: true,
                  name: 'RFIDEgyptUser',
                  store: new MongoStore({ mongooseConnection: mongoose.connection }),
                }));


// Make sure this comes after the express session   
app.use(passport.initialize());
app.use(passport.session());


app.use(express.static(path.join(__dirname, 'public')));
app.use(require('connect-flash')());
app.use(function (req, res, next) {
  res.locals.messages = require('express-messages')(req, res);
  next();
});


app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/tickets', ticketsRouter);
app.use('/companies', companiesRouter);
app.use('/projects', projectsRouter);
app.use('/crm', crmRouter);
app.use('/contacts', contactsRouter);
app.use('/tasks', tasksRouter);
app.use('/upload', uploadsRouter);


console.log('here');

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
