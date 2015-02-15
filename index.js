'use strict';

var config = require('./config');
var Db = require('./lib/db');
var Proxy = require('./lib/proxy');

var db = new Db(config.remoteCouch);
db.authenticate(config.username, config.password, startProxy);

function startProxy(err, cookies) {
    if (err) {
        return console.log(err);
    }

    var authCookie = cookies[0];

    console.log('admin authenticated successfully...');

    var port = process.env.PORT || 5050;
    var proxy = new Proxy(config.couchHost, authCookie);

    console.log('proxy starting on port %s...', port);
    proxy.start(port);
}
