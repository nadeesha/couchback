'use strict';

var backend = require('./backend');
var server = require('./server');

backend.initialize(function (err, backendConfigs) {
    if (err) {
        throw new Error(err);
    }

    server.start(backendConfigs, process.env.PORT || 5050);
});