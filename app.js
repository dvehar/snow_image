var express = require('express');

var app = express();

app.use(express.static('public'));

var exphbs = require('express-handlebars');
app.engine('.hbs', exphbs({defaultLayout: 'default', extname: '.hbs'}));
app.set('view engine', '.hbs');

app.get('/', function (req, res) {
  res.render('index.hbs');
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  console.log('hi kite');
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});