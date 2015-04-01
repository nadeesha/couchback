'use strict';

var Backend = require('./lib/backend');
var logger = require('./lib/logger');

var server = require('./server');
var config = require('./config');

var backend = new Backend({
    remoteCouch: config.remoteCouch,
    username: config.username,
    password: config.password,
    usersDatabase: config.usersDatabase
});

logger.info('Initializing the backend at %s.', config.remoteCouch);

backend.initialize(function(err) {
    if (err) {
        throw new Error(err);
    }

    logger.info('Backend initialized. Starting Server.');

    server.start(backend, process.env.PORT || 5050);
});