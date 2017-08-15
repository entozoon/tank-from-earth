'use strict';
let http = require('http'),
  fs = require('fs'),
  port = 80;

const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080 });

let readFilePromise = filename => {
  return new Promise((resolve, reject) => {
    fs.readFile(filename, (error, data) => {
      if (error) {
        console.log('Error: ' + error);
        reject(error);
      }
      resolve(data);
    });
  });
};

Promise.all([
  readFilePromise('./public/client.html'),
  readFilePromise('./public/manifest.json')
]).then(resolutions => {
  let client = resolutions[0],
    manifest = resolutions[1];
  // Net server (or http would be fine) to serve the page
  http
    .createServer(function(request, response) {
      console.log('User connected');

      if (request.url == '/manifest.json') {
        console.log(manifest);
        response.write(manifest.toString());
      } else {
        response.writeHead(200, { 'Content-Type': 'text/html' });
        response.write(client.toString());
      }
      response.end();
    })
    .listen(port);
  console.log('Listening on http://192.168.3.1:' + port);
});
// WebSocket server for sockets
wss.on('connection', function connection(ws) {
  ws.on('message', function incoming(message) {
    console.log(message);
  });

  ws.send('Hello from server!');
});
