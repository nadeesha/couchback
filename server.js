'use strict';

var express = require('express');
var bodyParser = require('body-parser');
var expressWinston = require('express-winston');
var logger = require('./lib/logger');
var winston = require('winston');

var middleware = require('./middleware/validation');
var userController = require('./controllers/user');

exports.start = function(backend, port) {
    var app = express();
    app.use(bodyParser.json());

    app.use(expressWinston.logger({
        transports: [
            new winston.transports.Console({
                json: false,
                colorize: true
            })
        ],
        meta: false,
        msg: 'HTTP {{req.method}} {{req.url}} {{res.statusCode}}',
        colorStatus: true
    }));

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

    app.use(expressWinston.errorLogger({
        transports: [
            new winston.transports.Console({
                json: false,
                colorize: true
            })
        ]
    }));

    logger.info('Server started on port %s.', port);

    app.listen(port);
};
