var redis = require("redis"),
    q = require('q'),
    DEFAULT_PORT = 6379,
    DEFAULT_LIFETIME = 1800;


exports.DataProvider = DataProvider;

function DataProvider(config) {
    config = config || {};
    config.lifetime = config.lifetime || DEFAULT_LIFETIME;
    config.encryptionKey = config.encryptionKey || "b4a2e786-0a8e-11e1-900e-f7a46f4c3142";

    config.redis = config.redis || {};
    config.redis.port = config.redis.port || DEFAULT_PORT;
    config.redis.host = config.redis.host || "localhost";

    this.config = config;
    this.data = {};

    this.client = redis.createClient(this.config.redis.port, this.config.redis.host);
    if (this.config.redis.password) {
        this.client.auth(this.config.redis.password);
    }
}

DataProvider.prototype.loadSession = function(req, sessionId) {
    var self = this,
        get = wrap(self.client.get, self.client);

    return q.when(get(sessionId), function(val) {
    	self.data[sessionId] = val ? JSON.parse(val) : {};
        req.session = function(a, b) {
            if (a && b) {
                self.data[sessionId][a] = b;
            } else {
                return self.data[sessionId][a];
            }
        };

        req.session.keys = function() {
            return Object.keys(self.data[sessionId]);
        };
    });
};

DataProvider.prototype.save = function(req, res, sessionId) {
    var self = this,
        set = wrap(self.client.set, self.client),
        expire = wrap(self.client.expire, self.client),
        data = JSON.stringify(self.data[sessionId]);

    delete self.data[sessionId];

    return q.when(set(sessionId, data), function(resSet) {
        return q.when(expire(sessionId, self.config.lifetime), function(resExp) {
        	// this provider does not modify the response
            return undefined;
        });
    });
};


function wrap(nodeAsyncFn, context) {
    return function() {
        var defer = q.defer(),
            args = Array.prototype.slice.call(arguments);

        args.push(function(err, val) {
            if (err !== null) {
                return defer.reject(err);
            }

            return defer.resolve(val);
        });

        nodeAsyncFn.apply(context || {}, args);

        return defer.promise;
    };
}