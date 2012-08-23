[![build status](https://secure.travis-ci.org/jdc0589/bogart-session-redis.png)](http://travis-ci.org/jdc0589/bogart-session-redis)
Redis provider(s) for the Bogart "Session" JSGI middleware.

## Example:
```javascript
var bogart = require('bogart'),
    DataProvider = require("bogart-session-redis").DataProvider;

var config = function(show, create, update, destroy) {
  show('/', function(req) {
    req.session("foo", "bar");

    var session = "Session: <br /><ul>";
    req.session.keys().forEach(function(key) {
      session += "<li>"+key+": "+req.session(key)+"</li>";
    });
    session += "</ul>";

    return bogart.html(session);
  });
};

var dataProviderConfig = {
  lifetime: 600,
  redis: {
    port: 6379,
    host: "localhost"
  }
};

var sessionConfig = {
  options: {
    idProvider: {
      encryptionKey: "330e2e6e-0a94-11e1-9db7-935b9f6cc277"
    }
  },
  dataProvider: new DataProvider(dataProviderConfig)
};

var app = bogart.middleware.Session(sessionConfig, bogart.router(config));
bogart.start(app, {port:1337});
```