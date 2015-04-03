# What is it?

It's a ligtwight server that acts as a middleware for couchdb administration and user authentication for static front end applications.

# Demo

[Here](http://couchback-demo.divshot.io/). The backend for this demo is deployed [here](https://limitless-refuge-6749.herokuapp.com/).

# Why?

When you build static applications with a couchdb backend and use something like PouchDB for frontend, you will need to create a per-user database, manage user credentials, apply security settings and more. Couchback simplifies all that. You only need to configure Couchback, and it will provide user authentication and security for a Couchdb database that only a paritiuclar user can access, and sync with PouchDB.

# How does it work?

Couchback connects to your CouchDB server and creates a database to hold user metadata (`config.usersDatabase`). It then spins up a web server. You can use the server to create an user, and authenticate the user credentials.

When you create a user, 

1. A new user db is created.
2. A new CouchDB user is created.
3. CouchDB user is added to the new database created.
4. User data is recorded in the metadata database.

When you try to authenticate the user,

1. User credentials are checked against the present values in the metadata table. (Username and salted hash)
2. If successful, a database url is returned.
3. This url can be supplied to PouchDB sync, to sync your front end PouchDB with backend CouchDB.

# Installation

## Setting up the backend
1. Fill up the `config.json` with your Couchdb backend configurations.
2. Deploy the server somewhere.
3. Start it with `npm start`

## Integrating with your front end
1. Include the script `couchback.js` from your server. (ex: http://couchback.dev/couchback.js)

# Usage

Including the `couchback.js` gives you the global `Couchback` namespace.

## Create a user

```js
Couchback.signUp(username, password, [meta], function(err, response) {
    if (!err) {
        console.log('successfully created user');
    }
});
```

The optional meta argument can store any custom metadata you need to, about the user. It's retrieved when you sign in the user, as property `meta` in the login response.

## User sign in and PouchDB sync

```js
Couchback.signIn(username, password, function(err, response) {
    if (!err) {
        console.log('successfully signed in user');
        PouchDB.sync('mydb', response.authUrl, {
            live: true
        });
    }
});
```

# What can I use it for?

To securely connect your static apps' PouchDB to CouchDB, without writing a single line of code for an API, and get rudimentary user administration features.

# The road ahead

Right now, only the most rudimentary user administration features are supported. To make this production ready, we'll need to imporve the API to handle things like password reset, user activation/deactivation, etc.