'use strict';

var request = require('request').defaults({
    jar: true
});

var Db = function(serverpath) {
    this.serverpath = serverpath;
};

Db.prototype.create = function(dbname, cb) {
    var dbpath = this.serverpath + '/' + dbname;

    console.log('trying to create db at: ' + dbpath);

    var requestOptions = {
        url: dbpath,
        method: 'PUT'
    };

    request(requestOptions, function(err, response, body) {
        cb(err, body);
    });
};

Db.prototype.exists = function(dbname, cb) {
    var requestOptions, dbpath;

    dbpath = this.serverpath + '/' + dbname;

    console.log('checking if db exists at ' + dbpath);

    requestOptions = {
        url: dbpath,
        method: 'GET',
        cookie: {
            'AuthSession': this.sessionCookie
        }
    };

    request(requestOptions, function(err, response) {
        if (response.statusCode === 404) {
            cb(null, false);
        } else if (response.statusCode === 200) {
            cb(null, true);
        } else {
            cb(err);
        }
    });
};

Db.prototype.authenticate = function authenticate(username, password, cb) {
    var requestOptions = {
        url: this.serverpath + '/_session',
        method: 'POST',
        form: {
            username: username,
            password: password
        }
    };

    request(requestOptions, function(err, response) {
        if (err) {
            cb(err);
        } else {
            cb(null, response.headers['set-cookie']);
        }
    });
};

Db.prototype.setAuthValues = function setAuthValues(authValues) {
    this.sessionCookie = authValues.AuthSession;
};

module.exports = Db;