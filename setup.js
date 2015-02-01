'use strict';

var Db = require('./lib/db');
var config = require('./config');

module.exports = function (cb) {
    var cookie, db;

    db = new Db('https://' + config.couchHost);

    console.log('authenticating admin...');

    db.authenticate(config.username, config.password, function (err, cookies) {
        if (err) {
            return cb(err);
        } else {
            console.log('admin authenticated successfully...')
        }

        cookie = cookies[0];
        checkUsersDb();
    });

    function checkUsersDb() {
        var usersDbName = config.appName + '-' + config.usersDatabase;

        db.exists(usersDbName, function(err, hasDb) {
            if (err) {
                return finalizeSetup(err);
            }

            if (!hasDb) {
                console.log('users db is not there...');
                db.create(usersDbName, finalizeSetup);
            } else {
                console.log('users db is already there...');
                finalizeSetup();
            }
        });
    }

    function finalizeSetup(err) {
        console.log('finalizing setup...');
        cb(err, cookie);
    }
};
