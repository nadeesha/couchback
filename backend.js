'use strict';

var config = require('./config');
var nano = require('nano')(config.remoteCouch);
var couchAdmin = require('couchdb-api').srv(config.remoteCouch);

function authenticate(cb) {
    nano.auth(config.username, config.password, function(err, body, headers) {
        if (err) {
            console.log(err);
            return;
        }

        if (headers && headers['set-cookie']) {
            var authCookie = headers['set-cookie'];

            nano = require('nano')({
                url: config.remoteCouch,
                cookie: authCookie
            });
            couchAdmin.auth = [config.username, config.password];

            cb();
        } else {
            cb(new Error('could not authenticate'));
        }
    });
}

function createUserDbIfNotExists(cb) {
    nano.db.get(config.usersDatabase, function(err, exists) {
        var notFound = err && err.headers && err.headers.statusCode === 404;

        if (exists) {
            cb();
        } else if (notFound) {
            nano.db.create(config.usersDatabase, function(err) {
                cb(err);
            });
        } else {
            cb(err);
        }
    });
}

exports.initialize = function(cb) {
    authenticate(handleAuthentication);

    function handleAuthentication(err) {
        if (err) {
            return cb(err);
        }

        createUserDbIfNotExists(function(err) {
            cb(err, {
                server: nano,
                admin: couchAdmin
            });
        });
    }
};
