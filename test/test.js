var request = require('supertest')('http://couchback.dev');
var uuid = require('uuid');

function report (err, res) {
	if (err) {
		console.log(err);
	}
}

request.get('/').expect(200).end(report);

request.post('/users').send({
	username: uuid.v4(),
	password: uuid.v4()
}).expect(function (res) {
	if (res.statusCode !== 201) {
		return 'user creation returned ' + res.statusCode;
	}

	if (!res.body.dbname) {
		return 'user creation did not return dbname: ' + JSON.stringify(res.body.dbname);
	}
}).end(report);