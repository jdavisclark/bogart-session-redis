var redis = require("redis"),
    q = require('q'),
    DEFAULT_PORT = 6379,
    DEFAULT_LIFETIME = 1800;

function DataProvider(config) {
    config = config || {};

    config.lifetime = config.lifetime || DEFAULT_LIFETIME;
    this.lifetime = config.lifetime;

    config.port = config.port || DEFAULT_PORT;
    config.host = config.host || "localhost";

    this.data = {};

    this.client = redis.createClient(config.port, config.host);
    if (config.password) {
        this.client.auth(config.password);
    }
}

DataProvider.prototype.loadSession = function(req, sessionId) {
    var self = this,
        get = wrap(self.client.get, self.client);

    return q.when(get(sessionId), function(val) {
    	self.data[sessionId] = val ? JSON.parse(val) : {};
        return self.data[sessionId];
    });
};

DataProvider.prototype.save = function(req, res, sessionId) {
    var self = this,
        set = wrap(self.client.set, self.client),
        expire = wrap(self.client.expire, self.client),
        data = JSON.stringify(self.data[sessionId]);

    delete self.data[sessionId];

    return q.when(set(sessionId, data), function(resSet) {
        return q.when(expire(sessionId, self.lifetime), function(resExp) {
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

DataProvider.DataProvider = DataProvider;

module.exports = DataProvider;
