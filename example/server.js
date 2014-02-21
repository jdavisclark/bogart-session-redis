var bogart = require('bogart')
  , RedisStore = require("../lib/index");

var router = bogart.router();
router.get('/', function (req) {
  var session = "<html><body>Session: <br /><ul>";
  req.session.keys().forEach(function(key) {
    session += "<li>"+key+": "+req.session(key)+"</li>";
  });
  session += "</ul>";
  session += "<form method='post'><label>Key <input type='text' name='key' /></label>";
  session += "<label>Value <input type='text' name='value' /></label>"
  session += "<input type='submit' value='Add to Session' />";
  session += "</form></body></html>";

  return bogart.html(session);
});

router.post('/', function (req) {
  req.session(req.params.key, req.params.value);
  return bogart.redirect('/');
});

var app = bogart.app();
app.use(bogart.middleware.session({
  secret: 'my-secret',
  store: new RedisStore({
    lifetime: 600,
    port: 6379,
    host: "localhost"
  })
}));
app.use(bogart.middleware.parseForm());
app.use(router);

app.start(1337);
