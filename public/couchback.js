(function(Couchback) {
    'use strict';

    Couchback.signUp = function(username, password, cb) {
        ajax('/users', {
            username: username,
            password: password
        }, cb);
    };

    Couchback.signIn = function(username, password, cb) {
        ajax('/auth', {
            username: username,
            password: password
        }, cb);
    };

    function ajax(url, postBody, callbackFunction) {
		var stateChange = function() {
            if (this.request.readyState == 4)
                callbackFunction(this.request.responseText);
        };

		var getRequest = function() {
            if (window.XMLHttpRequest) {
                return new XMLHttpRequest();
            }
            return false;
        };

        if (callbackFunction) {
            postBody = postBody;
            callbackFunction = callbackFunction;
        } else {
            callbackFunction = postBody;
            postBody = null;
        }

		var request = getRequest();

        if (request) {
            var req = request;
            req.onreadystatechange = stateChange;

            if (postBody) {
                req.open('POST', url, true);
                req.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
                req.setRequestHeader('Content-type', 'application/json');
                req.setRequestHeader('Connection', 'close');
            } else {
                req.open('GET', url, true);
            }

            req.send(postBody);
        }
    }
})(window.Couchback = window.Couchback || {});
