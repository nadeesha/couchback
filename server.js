'use strict';

var express = require('express');
var bodyParser = require('body-parser');
var logger = require('morgan');

var middleware = require('./middleware/validation');
var UserController = require('./controllers/user');

exports.start = function(backend, port) {
    var userController = new UserController(backend);

    var app = express();
    app.use(bodyParser.json());
    app.use(logger('tiny'));
    app.use(express.static(__dirname + '/public'));

    app.use(function allowCors(req, res, next) {
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
        res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
        next();
    });

    // begin routes

    app.get('/', function (req, res) {
        res.sendStatus(200);
    });

    // routes > user

    app.post('/users',
        middleware.hasCredentials,
        userController.create);

    app.post('/auth',
        middleware.hasCredentials,
        userController.authenticate);

    // end routes

    console.log('server started on port', port);

    app.listen(port);
};
