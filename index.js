'use strict';

var config = require('./config');
var express = require('express');
var uuid = require('uuid');
var _ = require('lodash');
var bodyParser = require('body-parser');
var bcrypt = require('bcrypt');
var logger = require('morgan');

var couchAdmin = require('couchdb-api').srv(config.remoteCouch);
var nano = require('nano')(config.remoteCouch);
var usersDb;

nano.auth(config.username, config.password, function(err, body, headers) {
    if (err) {
        console.log(err);
        return;
    }

    if (headers && headers['set-cookie']) {
        console.log('authenticated successfully');

        var authCookie = headers['set-cookie'];
        nano = require('nano')({
            url: config.remoteCouch,
            cookie: authCookie
        });
        usersDb = nano.use(config.usersDatabase);
        couchAdmin.auth = [config.username, config.password];

        checkUsersDb(startServer);
    } else {
        console.log('something went wrong');
    }
});

function checkUsersDb(cb) {
    console.log('checking the user database');

    nano.db.get(config.usersDatabase, function(err) {
        if (err && err.headers && err.headers.statusCode === 404) {
            createUsersDb(cb);
        } else if (err) {
            console.log(err);
            return;
        }

        // users db exists
        cb();
    });
}

function createUsersDb(cb) {
    nano.db.create(config.usersDatabase, function(err) {
        if (err) {
            console.log(err);
            return;
        }

        cb();
    });
}

function startServer() {
    console.log('starting server...');

    var app = express();
    app.use(bodyParser.json());
    app.use(logger('tiny'));

    function hasCredentials(req, res, next) {
        if (!req.body.username || !req.body.password) {
            return res.status(400).send('username and password are required');
        } else {
            next();
        }
    }

    app.get('/', function(req, res) {
        return res.sendStatus(200);
    });

    app.post('/users', hasCredentials, function(req, res, next) {
        usersDb.get(req.body.username, validateUserCreation);

        function validateUserCreation(err, exists) {
            if (err && err.headers && err.headers.statusCode !== 404) {
                return next(err);
            }

            if (exists) {
                return res.status(409).send('username already exists');
            } else {
                // create users own db
                createUserDb(createUser);
            }
        }

        function createUserDb(cb) {
            // ..the database name must begin with a letter
            var dbname = 'd' + uuid.v4();

            nano.db.create(dbname, function(err) {
                cb(err, err ? null : dbname);
            });
        }

        function createUser(err, dbname) {
            if (err) {
                return next(err);
            }

            bcrypt.hash(req.body.password, 8, function(err, hashedPass) {
                var userObj = {
                    username: req.body.username,
                    password: hashedPass,
                    createdOn: Date.now(),
                    dbname: dbname
                };

                createUserInServer(userObj, function() {
                    console.log('user created in server');

                    createUserInUsersDb(userObj);
                });
            });
        }

        function createUserInServer(userObj, cb) {
            couchAdmin.register(req.body.username, req.body.password,
                function(err) {
                    if (err) {
                        return next(err);
                    }

                    assignUserToDb(userObj.dbname, function(err) {
                        if (err) {
                            return next(err);
                        }

                        console.log('user %s assigned to %s',
                            req.body.username, userObj.dbname);

                        cb();
                    });
                });
        }

        function assignUserToDb(dbname, cb) {
            couchAdmin.db(dbname).security({
                couchdb_auth_only: true, // cloudant specific i think
                members: {
                    names: [req.body.username]
                }
            }, cb);
        }

        function createUserInUsersDb(userObj) {
            usersDb.insert(userObj, req.body.username, function(err) {
                if (err) {
                    return next(err);
                }

                return res.status(201).send(
                    _.pick(userObj, ['username', 'createdOn', 'dbname']));
            });
        }
    });

    app.post('/auth', hasCredentials, function(req, res, next) {
        usersDb.get(req.body.username, validateCredentials);

        function validateCredentials(err, user) {
            if (err) {
                return next(err);
            }

            bcrypt.compare(req.body.password, user.password,
                function handleAuth(err, passed) {
                    if (err) {
                        return next(err);
                    }

                    if (passed) {
                        return res.status(200).send(
                            _.pick(user, ['username', 'createdOn', 'dbname']));
                    } else {
                        return res.status(401).end();
                    }
                });
        }
    });

    app.listen(process.env.PORT || 5050);
}
