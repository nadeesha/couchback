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

var authenticate = function(cb) {
    var self = this;

    self._nano.auth(self._username, self._password, function(err, body, headers) {
        if (err) {
            console.log(err);
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

var createUserDbIfNotExists = function(cb) {
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

var assignUserToDb = function(dbname, username, cb) {
    var self = this;

    self._couchAdmin.db(dbname).security({
        couchdb_auth_only: true, // cloudant specific i think
        members: {
            names: [username]
        }
    }, cb);
};

var createUserMetadata = function(user, cb) {
    var self = this;

    self._userMetadata.insert(user, user.username, cb);
};

Backend.prototype.createUser = function(user, cb) {
    var self = this;

    self._couchAdmin.register(user.username, user.password, function(err) {
        if (err) {
            return cb(err);
        }

        assignUserToDb.call(self, user.dbname, user.username, function(err) {
            if (err) {
                cb(err);
            }

            createUserMetadata.call(self, user, cb);
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

        createUserDbIfNotExists.call(self, cb);
    }

    authenticate.call(self, handleAuthentication);
};

module.exports = Backend;
