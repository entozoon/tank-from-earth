let http = require('http'),
  fs = require('fs'),
  port = 80;

const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080 });

fs.readFile('./public/client.html', function(err, html) {
  if (err) {
    throw err;
  }

  // Net server (or http would be fine) to serve the page
  http
    .createServer(function(request, response) {
      console.log('User connected');

      response.writeHead(200, { 'Content-Type': 'text/html' });
      response.write(html);
      response.end();
    })
    .listen(port);
  console.log('Listening on http://192.168.3.1:' + port);

  // WebSocket server for sockets
  wss.on('connection', function connection(ws) {
    ws.on('message', function incoming(message) {
      console.log(message);
    });

    ws.send('Hello from server!');
  });
});
