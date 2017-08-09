var http = require('http');
var fs = require('fs');

var ledFle = '/sys/class/leds/onion:amber:system/brightness';

function led(onOff) {
    fs.writeFile(ledFle, onOff, function(err) {
        if (err) {
            return console.log(err);
        }
    });
}

function handleRequest(req, res) {
    if (req.url == '/ledon') {
        led(1);
    }
    if (req.url == '/ledoff') {
        led(0);
    }
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.write('<h1>LED SWITCH</h1>');
    res.write('<a href="/ledon">[ON]</a> | <a href="/ledoff">[OFF]</a> ');
    res.end();
}

var server = http.createServer(handleRequest);

server.listen(8081, function() {
    console.log('listening for http on port 8081');
});
