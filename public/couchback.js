(function(Couchback, document) {
    'use strict';

    var scripts = document.getElementsByTagName('script');
    var src = scripts[scripts.length - 1].src;

    function ajax(url, postBody, callbackFunction) {
        var getRequest = function() {
            if (window.XMLHttpRequest) {
                return new XMLHttpRequest();
            }
            return false;
        };

        var request = getRequest();

        var stateChange = function() {
            if (request.readyState === 4) {
                callbackFunction(request);
            }
        };

        if (callbackFunction) {
            postBody = JSON.stringify(postBody);
            callbackFunction = callbackFunction;
        } else {
            callbackFunction = postBody;
            postBody = null;
        }

        if (request) {
            var req = request;
            req.onreadystatechange = stateChange;

            if (postBody) {
                req.open('POST', url, true);
                req.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
                req.setRequestHeader('Content-Type', 'application/json');
            } else {
                req.open('GET', url, true);
            }

            req.send(postBody);
        }
    }

    function addCredentialsToUrl (url, username, password) {
        var split = url.split('://');
        return [].concat(split[0], '://', username, ':', password, '@', split[1]).join('');
    }

    Couchback.host = src.match(new RegExp('https?://[^/]*'))[0];

    Couchback.signUp = function(username, password, meta, cb) {
        if (!cb && typeof meta === 'function') {
            cb = meta;
            meta = null;
        }

        ajax(Couchback.host + '/users', {
            username: username,
            password: password,
            meta: meta
        }, function(response) {
            if (response.status >= 400) {
                cb(response.responseText);
            } else {
                response.responseText = JSON.parse(response.responseText);
                cb(null, response.responseText);
            }
        });
    };

    Couchback.signIn = function(username, password, cb) {
        ajax(Couchback.host + '/auth', {
            username: username,
            password: password
        }, function(response) {
            if (response.status >= 400) {
                cb(response.responseText);
            } else {
                var res = JSON.parse(response.responseText);
                res.authUrl = addCredentialsToUrl(res.dburl, res.dbusername, password);

                cb(null, res);
            }
        });
    };

})(window.Couchback = window.Couchback || {}, window.document);
