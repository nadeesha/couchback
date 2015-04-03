'use strict';

var logger = require('../lib/logger');
var uuid = require('uuid');
var bcrypt = require('bcrypt');
var _ = require('lodash');
var config = require('../config');

var controller = {};

controller.create = function(req, res, next) {
    logger.debug('Querying for user %s', req.body.username);

    req.backend.getUser(req.body.username, function(err, user) {
        if (err) {
            return next(err);
        } else if (user) {
            return res.status(409).send({
                message: 'username already exists'
            });
        } else {
            createUserDb();
        }
    });

    function createUserDb() {
        // ..the database name must begin with a letter
        var dbname = 'd' + uuid.v4();

        logger.debug('Creating new user database %s', dbname);

        req.backend.createDatabase(dbname, function(err) {
            if (err) {
                return next(err);
            } else {
                logger.debug('User database created %s', dbname);

                var user = {
                    username: req.body.username,
                    salt: bcrypt.genSaltSync(10),
                    password: req.body.password,
                    createdOn: Date.now(),
                    dbname: dbname,
                    dbusername: 'u' + uuid.v4(),
                    meta: req.body.meta
                };

                createUser(user);
            }
        });
    }

    function createUser(user) {
        logger.debug('Creating user account for %s', user.username);

        req.backend.createUser(user, function(err) {
            if (err) {
                return next(err);
            } else {
                return res.status(201).send(
                    _.pick(user, ['username', 'createdOn', 'dbname']));
            }
        });
    }
};

controller.authenticate = function authenticateUser(req, res, next) {
    var username = req.body.username;
    var pass = req.body.password;

    req.backend.getUser(username, function(err, user) {
        if (err) {
            return next(err);
        }

        if (!user) {
            return res.sendStatus(401);
        }

        req.backend.authenticateUser(username, pass, function (err, passed) {
            if (err) {
                return next(err);
            }

            if (passed) {
                var authResult = _.pick(user, [
                    'username', 'createdOn', 'dbname', 'dbusername', 'meta'
                ]);

                _.extend(authResult, {
                    dburl: config.remoteCouch + '/' + user.dbname
                });

                return res.status(200).send(authResult);
            } else {
                return res.status(401).end();
            }
        });
    });
};

module.exports = controller;
