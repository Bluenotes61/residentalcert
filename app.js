var express = require('express');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var staticFolder = require('static');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var busboy = require('connect-busboy');
var usermw = require("./helpers/user.js");  
var config = require("./config.js")
    
var app = express();     

var server = app.listen(config.server.port, function() {
  console.log('Listening on port %d', server.address().port);
});      
   
app.set('views', __dirname + '/views');
app.set('view engine', 'html');
app.set('layout', 'layout');
app.engine('html', require('hogan-express'));

app.use(bodyParser()); 
app.use(busboy());
app.use(methodOverride());
app.use(cookieParser()); 
app.use(session({
  secret:'En bevarad hemlighet', 
  resave:true, 
  saveUninitialized:true
}));
app.use(express.static(__dirname + '/public'));
 
app.use(usermw());
app.use(require('./controllers'));  
  
  
/// catch 404 and forwarding to error handler
app.use(function(req, res, next) { 
  var err = new Error('Not Found');
  err.status = 404;
  next(err); 
});

 
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
