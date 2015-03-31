'use strict';

exports.hasCredentials = function hasCredentials(req, res, next) {
    if (!req.body.username || !req.body.password) {
        return res.status(400).send('username and password are required');
    } else {
        next();
    }
};