'use strict';

var uuid = require('uuid');
var config = require('./config');
var bcrypt = require('bcrypt');
var _ = require('lodash');
var express = require('express');
var bodyParser = require('body-parser');
var logger = require('morgan');

var dbserver = null;
var dbadmin = null;
var userMetadata = null;

function hasCredentials(req, res, next) {
    if (!req.body.username || !req.body.password) {
        return res.status(400).send('username and password are required');
    } else {
        next();
    }
}

function createUser(req, res, next) {
    var userMetadata = dbserver.use(config.usersDatabase);
    userMetadata.get(req.body.username, validateUserCreation);

    function validateUserCreation(err, exists) {
        if (err && err.headers && err.headers.statusCode !== 404) {
            return next(err);
        }

        if (exists) {
            return res.status(409).send('username already exists');
        } else {
            // create users own db
            createUserDb(createUserMetadata);
        }
    }

    function createUserDb(cb) {
        // ..the database name must begin with a letter
        var dbname = 'd' + uuid.v4();

        dbserver.db.create(dbname, function(err) {
            cb(err, err ? null : dbname);
        });
    }

    function createUserMetadata(err, dbname) {
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
        dbadmin.register(req.body.username, req.body.password,
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
        dbadmin.db(dbname).security({
            couchdb_auth_only: true, // cloudant specific i think
            members: {
                names: [req.body.username]
            }
        }, cb);
    }

    function createUserInUsersDb(userObj) {
        userMetadata.insert(userObj, req.body.username, function(err) {
            if (err) {
                return next(err);
            }

            return res.status(201).send(
                _.pick(userObj, ['username', 'createdOn', 'dbname']));
        });
    }
}

function authenticateUser(req, res, next) {
    userMetadata.get(req.body.username, validateCredentials);

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
                    var authResult = _.pick(user, ['username', 'createdOn', 'dbname']);

                    _.extend(authResult, {
                        dburl: config.remoteCouch + '/' + user.dbname
                    });

                    return res.status(200).send(authResult);
                } else {
                    return res.status(401).end();
                }
            });
    }
}

function sayOk(req, res) {
    return res.sendStatus(200);
}

exports.start = function(backend, port) {
	dbadmin = backend.admin;
	dbserver = backend.server;
	userMetadata = dbserver.use(config.usersDatabase);

    var app = express();
    app.use(bodyParser.json());
    app.use(logger('tiny'));
    app.locals.backend = backend;

    app.get('/', sayOk);
    app.post('/users', hasCredentials, createUser);
    app.post('/auth', hasCredentials, authenticateUser);

    console.log('server started on port', port);
    app.listen(port);
};
