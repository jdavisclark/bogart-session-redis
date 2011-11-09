var bogart = require('./bogart/lib/bogart'),
    DataProvider = require("../lib/index").DataProvider;


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

var sessionConfig = {
  lifetime: 600,
};



var app = bogart.middleware.Session({dataProvider: new DataProvider(sessionConfig)}, bogart.router(config));
bogart.start(app, {port:1337});