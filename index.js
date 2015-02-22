'use strict';

var config = require('./config');
var Db = require('./lib/db');
var Proxy = require('./lib/proxy');
var express = require('express');
var couchops = require('./couchops');
var uuid = require('uuid');
var _ = require('lodash');

var nano = require('nano')(config.remoteCouch);
var usersdb = null;

nano.auth(config.username, config.password, function(err, body, headers) {
    if (err) {
        console.log(err);
        return;
    }

    if (headers && headers['set-cookie']) {
        console.log('authenticated successfully');
        createUsersDatabase(headers['set-cookie']);
    } else {
        console.log('something went wrong');
    }
});

function createUsersDatabase(authCookie) {
    console.log('checking the user database');

    nano.db.get(config.usersDatabase, function(err, body) {
        if (err) {
            console.log(err);
            return;
        }

        console.log(body);
    });

    // usersdb = require('nano')({
    //     url: config.remoteCouch + '/' + config.usersdb,
    //     cookie: 'AuthSession=' + authCookie
    // });

    // usersdb.get()
}

// function registerEndpoints(app) {

//     app.get('/', function(req, res) {
//         return res.sendStatus(200);
//     });

//     app.put('/users', function(req, res, next) {
//         if (!req.body.username || !req.body.password) {
//             return res.status(400).send('username and password are required');
//         }

//         db.exists(req.body.username, function(err, exists) {
//             if (err) {
//                 return next(err)
//             }

//             if (exists) {
//                 return res.status(409).send('username already exists');
//             } else {
//                 var dbname =
//             }
//         })
//     });

//     app.listen(process.env.PORT || 5050);

// }
