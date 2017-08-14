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

fs.readFile('./server-test.html', function(err, html) {
  if (err) {
    throw err;
  }
  http
    .createServer(function(request, response) {
      if (request.url == '/ledon') {
        led(1);
      }
      if (request.url == '/ledoff') {
        led(0);
      }
      response.writeHeader(200, { 'Content-Type': 'text/html' });
      response.write(html);
      response.end();
    })
    .listen(80);
  console.log('listening on http://192.168.3.1');
});
