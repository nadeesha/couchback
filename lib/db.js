'use strict';

var request = require('request');

module.exports = function(serverpath) {

    function create(dbname, cb) {
        var dbpath = serverpath + '/' + dbname;

        console.log('trying to create db at: ' + dbpath);

        var requestOptions = {
            url: dbpath,
            method: 'PUT'
        };

        request(requestOptions, function(err, response, body) {
            cb(err, body);
        });
    };

    function exists(dbname, cb) {
    	var dbpath = serverpath + '/' + dbname;

    	var requestOptions = {
    		url: dbpath,
    		method: 'GET'
    	}

    	request(requestOptions, function (err, response, body) {
    		if (response.statusCode === 404) {
    			cb(null, false);
    		} else if (response.statusCode === 200) {
    			cb(null, true);
    		} else {
    			console.error(response);
    			cb(err);
    		}
    	});
    }

    return {
    	create: create,
    	exists: exists
    }

}
