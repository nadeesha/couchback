'use strict';

var request = require('supertest')('http://couchback.dev');
var uuid = require('uuid');
var _ = require('lodash');

function report(err) {
    if (err) {
        console.log(err);
    }
}

request.get('/').expect(200).end(report);

var user = {
    username: uuid.v4(),
    password: uuid.v4()
}

request.post('/users').send(user).expect(function(res) {
    if (res.statusCode !== 201) {
        return 'user creation returned ' + res.statusCode;
    }

    if (!res.body.dbname) {
        return 'user creation did not return dbname: ' +
            JSON.stringify(res.body.dbname);
    }
}).end(testLogin);

function testLogin() {
    var fakeUser = _.clone(user);
    fakeUser.password = 'foobarbaz';
    request.post('/auth').send(user).expect(200).end(report);
    request.post('/auth').send(fakeUser).expect(401).end(report);
}
