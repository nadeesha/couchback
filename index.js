'use strict';

var setup = require('./setup');
var http = require('http');
var config = require('./config');
var colors = require('colors/safe');

setup(function(err, authCookie) {
    if (err) {
        console.log(err);
        return;
    } else {
        console.log('setup successful...');
    }

    startProxy(authCookie);
});

function startProxy(authCookie) {
    var server = http.createServer();

    server.on('request', function(serverReq,
        serverResp) {

        var host = config.couchHost,
            opts, clientReq, handle;

        handle = setTimeout(function() {
            serverResp.writeHead(500, {});
            serverResp.end('dammit');
        }, 5000);

        serverReq.headers.host = host;
        serverReq.headers.Cookie = authCookie;

        opts = {
            host: host,
            path: serverReq.url,
            headers: serverReq.headers
        };

        clientReq = http.request(opts);

        clientReq.on('response', function(clientResp) {

            serverResp.writeHead(clientResp.statusCode, clientResp.headers);

            clientResp.on('data', function(data) {
                serverResp.write(data);
            });

            clientResp.on('end', function() {
                clearTimeout(handle);
                serverResp.end();
            });

        });

        console.log(colors.green(serverReq.method) + ' ' + serverReq.url);

        clientReq.end();
    });

    server.listen(5050);
}