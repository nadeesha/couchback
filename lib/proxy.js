'use strict';

var http = require('http');
var server = http.createServer();

var Proxy = function(host, cookie) {
    this.cookie = cookie;
    this.host = host;
};

Proxy.prototype.start = function(port) {
    var self = this;

    server.on('request', function(serverReq,
        serverResp) {

        var opts, clientReq, handle;

        handle = setTimeout(function() {
            serverResp.writeHead(500, {});
            serverResp.end('dammit');
        }, 5000);

        serverReq.headers.host = self.host;
        serverReq.headers.Cookie = self.cookie;

        opts = {
            host: self.host,
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

        clientReq.end();
    });

    server.listen(port);
};

module.exports = Proxy;
