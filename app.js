var express = require('express');

var app = express();

app.use(express.static('public'));

var exphbs = require('express-handlebars');
app.engine('.hbs', exphbs({defaultLayout: 'default', extname: '.hbs'}));
app.set('view engine', '.hbs');

var fs = require('fs');
var gitCommit = '';
fs.readFile( __dirname + '/.VERSION', function (err, data) {
  if (err) {
    console.log('error reading .VERSION: ' + err);
    gitCommit = '???';
  }
  gitCommit = data.toString().trim();
});

app.get('/', function (req, res) {
  res.render('index.hbs', {
    'packageVersion': process.env.npm_package_version,
    'gitCommit': gitCommit
  });
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

var port = process.env.PORT || 3000;
app.listen(port, function () {
  console.log('Example app listening on port ' +  port);
});
