'use strict';

var express = require('express');
var bodyParser = require('body-parser');
var httpLogger = require('morgan');
var logger = require('./lib/logger');
var uuid = require('uuid');

var middleware = require('./middleware/validation');
var userController = require('./controllers/user');

exports.start = function(backend, port) {
    var app = express();
    app.use(bodyParser.json());

    // TODO: change to winston middleware
    app.use(httpLogger('tiny'));

    app.use(express.static(__dirname + '/public'));

    app.use(function allowCors(req, res, next) {
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
        res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
        next();
    });

    app.use(function insertBackend(req, res, next) {
        req.backend = backend;
        next();
    });

    // begin routes

    app.get('/', function(req, res) {
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

    app.use(function(err, req, res, next) {
        var errorCode = uuid.v4();

        logger.error('Unhandler error %s', errorCode);
        logger.error(err);

        res.status(500).send({
            message: 'Undefined server error',
            code: errorCode
        });
    });

    logger.info('Server started on port %s.', port);

    app.listen(port);
};
