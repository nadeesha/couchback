(function(Couchback, PouchDB) {

    var db = new PouchDB('mydb');

    $('#form-signup').submit(function(event) {
        event.preventDefault();

        var username = $('#signup-email').val();
        var password = $('#signup-password').val();

        console.log('signing up...');

        Couchback.signUp(username, password, function(err, response) {
            if (!err) {
                console.log('successfully created user');
                console.log(response);
            }
        });
    });

    $('#form-signin').submit(function(event) {
        event.preventDefault();

        var username = $('#signin-email').val();
        var password = $('#signin-password').val();

        Couchback.signIn(username, password, function(err, response) {
            if (!err) {
                console.log('successfully signed in user');
                console.log(response);

                setUpPouchSync(response.authUrl);
            }
        });
    });

    function setUpPouchSync(url) {
        PouchDB.sync('mydb', url, {
                live: true
            })
            .on('change', function(info) {
                console.log('changed:', info);
            }).on('complete', function(info) {
                console.log('complete:', info);
            }).on('error', function(err) {
                console.log('error:', info);
            });

        $('#put-object').removeClass('hidden');
        $('#put-object-button').click(putRandomObject);
    }

    function putRandomObject() {
        db.put({
            random: Math.random()
        }, Date.now().toString(), function(err, response) {
            console.log(err || response);
        });
    }

})(window.Couchback, window.PouchDB);
