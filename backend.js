'use strict';

var Backend = function(opts) {
    this._nano = require('nano')(opts.remoteCouch);
    this._couchAdmin = require('couchdb-api').srv(opts.remoteCouch);
    this._username = opts.username;
    this._password = opts.password;
    this._usersDatabase = opts.usersDatabase;
    this._userMetadata = null;
    this._remoteCouch = opts.remoteCouch;
};

Backend.prototype._authenticate = function(cb) {
    var self = this;

    self._nano.auth(self._username, self._password, function(err, body, headers) {
        if (err) {
            return;
        }

        if (headers && headers['set-cookie']) {
            var authCookie = headers['set-cookie'];

            self._nano = require('nano')({
                url: self._remoteCouch,
                cookie: authCookie
            });

            self._couchAdmin.auth = [self._username, self._password];

            cb();
        } else {
            cb(new Error('could not authenticate'));
        }
    });
};

Backend.prototype._createUserDbIfNotExists = function(cb) {
    var self = this;

    self._nano.db.get(self._usersDatabase, function(err, exists) {
        var notFound = err && err.headers && err.headers.statusCode === 404;

        if (exists) {
            cb();
        } else if (notFound) {
            self._nano.db.create(self._usersDatabase, function(err) {
                cb(err);
            });
        } else {
            cb(err);
        }
    });
};

Backend.prototype._assignUserToDb = function(dbname, username, cb) {
    var self = this;

    self._couchAdmin.db(dbname).security({
        couchdb_auth_only: true, // cloudant specific i think
        members: {
            names: [username]
        }
    }, cb);
};

Backend.prototype._createUserMetadata = function(user, cb) {
    var self = this;

    self._userMetadata.insert(user, user.username, cb);
};

Backend.prototype.createUser = function(user, cb) {
    var self = this;

    self._couchAdmin.register(user.dbusername, user.password, function(err) {
        if (err) {
            return cb(err);
        }

        self._assignUserToDb(user.dbusername, user.username, function(err) {
            if (err) {
                cb(err);
            }

            self._createUserMetadata(user, cb);
        });
    });
};

Backend.prototype.createDatabase = function(dbname, cb) {
    var self = this;

    self._nano.db.create(dbname, function(err) {
        cb(err, dbname);
    });
};

Backend.prototype.getUser = function(username, cb) {
    var self = this;

    self._userMetadata.get(username, function(err, user) {
        console.log(err, user);
        if (err && err.headers && err.headers.statusCode !== 404) {
            return cb(err);
        } else if (user) {
            return cb(null, user);
        } else {
            return cb(null);
        }
    });
};

Backend.prototype.initialize = function(cb) {
    var self = this;


    function handleAuthentication(err) {
        if (err) {
            return cb(err);
        }

        self._userMetadata = self._nano.use(self._usersDatabase);

        self._createUserDbIfNotExists(cb);
    }

    self._authenticate(handleAuthentication);
};

module.exports = Backend;
