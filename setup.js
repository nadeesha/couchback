'use strict';

var Db = require('./lib/db');
var config = require('./config');

module.exports = function(cb) {
    var db = new Db(config.remoteCouch);

    var usersDbName = config.appName + '-' + config.usersDatabase;

    db.exists(usersDbName, function(err, hasDb) {
        if (err) {
            return cb(err);
        }

        if (hasDb) {
            cb();
        } else {
            db.create(usersDbName, cb);
        }
    });
};
