var express = require('express');
var docserver = require('./lib/docserver');
var dir = require('node-dir');

var app = express();
var database = {};

function initializeWebServer(callback) {
    var port = process.env.PORT || 8080
    app.set('port', port);

    app.use(docserver({
        cache: false,
        dir: __dirname + '/wiki',
        url: '/wiki/',
        passthrough: ['.css', '.js', '.png', '.jpg', '.jpeg', '.gif', '.txt', '.json']
    }));

    app.use('/wiki-edit', express.static('editor'));
    app.use('/shared', express.static('shared'));

    app.listen(app.get('port'), function () {
        console.log("Web server booted and running on " + port);
        callback(null);
    });
}

function initializeDatabase(callback) {
    dir.readFiles(__dirname + '/database', {
        match: /.json$/,
        shortName: true
    }, function (err, content, name, next) {
        if (err) throw err;
        var jsonObj = JSON.parse(content);
        name = name.replace('.json', '');
        if (name) {
            if (database[name] !== undefined) {
                console.error('Tried to load database element "' + name + '", but it already exists.');
            } else {
                database[name] = jsonObj;
                console.log('Loaded database element: ', name);
            }
        }
        next();
    }, function (err, files) {
        if (err) throw err;
        console.log('finished reading files:', files);
        console.log('Database initialized: ', database);
        callback(null, database);
    });
}

initializeDatabase(function() {});
initializeWebServer(function() {});

global.database = database;