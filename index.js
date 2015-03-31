'use strict';

var Backend = require('./backend');
var server = require('./server');
var config = require('./config');

var backend = new Backend({
    remoteCouch: config.remoteCouch,
    username: config.username,
    password: config.password,
    usersDatabase: config.usersDatabase
});

backend.initialize(function(err) {
    if (err) {
        throw new Error(err);
    }

    server.start(backend, process.env.PORT || 5050);
});