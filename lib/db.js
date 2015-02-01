'use strict';

var request = require('request').defaults({
    jar: true
});

module.exports = function(serverpath) {

    var sessionCookie;

    function create(dbname, cb) {
        var dbpath = serverpath + '/' + dbname;

        console.log('trying to create db at: ' + dbpath);

        var requestOptions = {
            url: dbpath,
            method: 'PUT'
        };

        request(requestOptions, function(err, response, body) {
            cb(err, body);
        });
    }

    function exists(dbname, cb) {
        var dbpath = serverpath + '/' + dbname;

        console.log('checking if db exists at ' + dbpath);

        var requestOptions = {
            url: dbpath,
            method: 'GET',
            cookie: {
                'AuthSession': 'sessionCookie'
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
    }

    function authenticate(username, password, cb) {
        var requestOptions = {
            url: serverpath + '/_session',
            method: 'POST',
            form: {
                username: username,
                password: password
            }
        };

        request(requestOptions, function (err, response) {
            if (err) {
                cb(err);
            } else {
                cb(null, response.headers['set-cookie']);
            }
        });
    }

    function setAuthValues (authValues) {
        sessionCookie = authValues.AuthSession;
    }

    return {
        create: create,
        exists: exists,
        authenticate: authenticate,
        setAuthValues: setAuthValues
    };

};
