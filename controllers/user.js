'use strict';

var uuid = require('uuid').v4();
var bcrypt = require('bcrypt');
var _ = require('lodash');
var config = require('../config');

var UserController = function(backend) {
    this.backend = backend;
};

UserController.prototype.create = function(req, res, next) {
    var self = this;

    self.backend.getUser(req.body.username, function(err, user) {
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

        self.backend.createDatabase(dbname, function(err) {
            if (err) {
                return next(err);
            } else {
                bcrypt.hash(req.body.password, 8, function(err, hashedPass) {
                    var user = {
                        username: req.body.username,
                        password: hashedPass,
                        createdOn: Date.now(),
                        dbname: dbname
                    };

                    createUser(user);
                });
            }
        });
    }

    function createUser(user) {
        self.backend.createUser(user, function(err) {
            if (err) {
                return next(err);
            }

            return res.status(201).send(
                _.pick(user, ['username', 'createdOn', 'dbname']));
        });
    }
};

UserController.prototype.authenticate = function authenticateUser(req, res, next) {
    var self = this;

    self.backend.getUser(req.body.username, function(err, user) {
        if (err) {
            return next(err);
        }

        bcrypt.compare(req.body.password, user.password, function (err, passed) {
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
    });
};