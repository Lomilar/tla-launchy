const webpush = require('web-push');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors')
const app = express();
app.use(cors());
app.use(bodyParser.json());
const fs = require('fs');

// VAPID keys should only be generated only once.
var vapidKeys = null;

if (fs.existsSync("vapid.json")) {
    vapidKeys = JSON.parse(fs.readFileSync("vapid.json"));
} else {
    vapidKeys = webpush.generateVAPIDKeys();
    fs.writeFileSync("vapid.json", JSON.stringify(vapidKeys));
}

webpush.setGCMAPIKey('AIzaSyABU0rwGyIGjTMdEH7YMkC0alqBeDabdY4');
webpush.setVapidDetails(
    'mailto:tla-launchy-prototype@adlnet.gov',
    vapidKeys.publicKey,
    vapidKeys.privateKey
);

function unregister(req) {
    var devices = {};
    if (fs.existsSync("devices.json"))
        devices = JSON.parse(fs.readFileSync("devices.json"));
    Object.keys(devices).forEach(function (key) {
        var ary = devices[key];
        for (var i = 0; i < ary.length; i++)
            if (ary[i].endpoint == req.endpoint)
                ary.splice(i, 1);
    });
    fs.writeFileSync("devices.json", JSON.stringify(devices, null, 2));
}

function register(req) {
    unregister(req);
    var devices = {};
    if (fs.existsSync("devices.json"))
        devices = JSON.parse(fs.readFileSync("devices.json"));
    if (devices[req.subject] === undefined)
        devices[req.subject] = [];
    devices[req.subject].push(req);
    fs.writeFileSync("devices.json", JSON.stringify(devices, null, 2));
}

app.post('/whoAmI', function (request, res) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'POST, GET, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    console.log("WhoAmI:");
    console.log(request.body);
    var req = request.body;
    var devices = {};
    if (fs.existsSync("devices.json"))
        devices = JSON.parse(fs.readFileSync("devices.json"));
    Object.keys(devices).forEach(function (key) {
        var ary = devices[key];
        for (var i = 0; i < ary.length; i++)
            if (ary[i].endpoint == req.endpoint) {
                res.set('Content-Type', 'text/plain');
                console.log(ary[i].subject);
                res.send(ary[i].subject);
            }
    });
    if (!res.headersSent) {
        res.set('Content-Type', 'text/plain');
        res.send("Unknown");
    }
});

app.post('/devices', function (request, res) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'POST, GET, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    console.log("Devices:");
    console.log(request.body);
    var req = request.body;
    var devices = {};
    if (fs.existsSync("devices.json"))
        devices = JSON.parse(fs.readFileSync("devices.json"));
    if (devices[req.subject] === undefined)
        devices[req.subject] = [];
    var ary = JSON.parse(JSON.stringify(devices[req.subject]));
    for (var i = 0; i < ary.length; i++) {
        delete ary[i].endpoint;
        delete ary[i].options;
    }
    res.send(JSON.stringify(ary));
    if (!res.headersSent) {
        res.set('Content-Type', 'text/plain');
        res.send("Unknown");
    }
});

app.post('/register', function (request, res) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'POST, GET, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    console.log("Register:");
    console.log(request.body);
    var req = request.body;
    register(req);
    webpush.sendNotification(req, JSON.stringify({
        title: 'Registration successful.'
    })).catch(function (ex) {
        console.log(ex);
    });
    res.send();
});

app.post('/send', function (request, res) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'POST, GET, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    var devices = {};
    console.log("Send:");
    console.log(request.body);
    var req = request.body;
    if (fs.existsSync("devices.json"))
        devices = JSON.parse(fs.readFileSync("devices.json"));
    if (devices[req.subject] === undefined)
        devices[req.subject] = [];
    var ary = devices[req.subject];
    for (var i = 0; i < ary.length; i++)
        webpush.sendNotification(ary[i], JSON.stringify(req)).catch(function (ex) {
            console.log(ex);
        });
    res.send();
});

app.post('/unregister', function (request, res) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'POST, GET, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    console.log("Unregister:");
    console.log(request.body);
    var req = request.body;
    unregister(req);
    webpush.sendNotification(req, JSON.stringify({
        title: 'You will no longer receive messages on this device.'
    })).catch(function (ex) {
        console.log(ex);
    });
    res.send();
});

var server = app.listen(8081, function () {
    var host = server.address().address
    var port = server.address().port
    console.log("TLA-Launchy Service listening at http://%s:%s", host, port)
});
//
//// This is the same output of calling JSON.stringify on a PushSubscription
//const pushSubscription = {
//    "endpoint": "https://gcm-http.googleapis.com/gcm/send",
//    "keys": {
//        "auth": "qLAYRzG9TnUwbprns6H2Ew==",
//        "p256dh": "BILXd-c1-zuEQYXH\\_tc3qmLq52cggfqqTr\\_ZclwqYl6A7-RX2J0NG3icsw..."
//    }
//};
//
