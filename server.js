'use strict';
const http = require('http'),
  fs = require('fs'),
  port = 80,
  WebSocket = require('ws'),
  wss = new WebSocket.Server({ port: 8080 }),
  // Super specific, because of old node on the Omega2
  Omega2Gpio = require('./node_modules/omega2-gpio/omega2-gpio'),
  gpio = new Omega2Gpio();

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

// ERGH
let IN3, IN4, ENB;

Promise.all([
  readFilePromise('./public/client.html'),
  readFilePromise('./public/manifest.json'),
  readFilePromise('./public/app.css'),
  readFilePromise('./public/app.js'),
  gpio.tests()
]).then(resolutions => {
  let client = resolutions[0],
    manifest = resolutions[1],
    css = resolutions[2],
    js = resolutions[3];
  // Net server (or http would be fine) to serve the page
  http
    .createServer(function(request, response) {
      console.log('User connected');

      switch (request.url) {
        case '/manifest.json':
          response.write(manifest.toString());
          break;
        case '/app.css':
          response.write(css.toString());
          break;
        case '/app.js':
          response.write(js.toString());
          break;
        default:
          response.writeHead(200, { 'Content-Type': 'text/html' });
          response.write(client.toString());
          break;
      }

      response.end();
    })
    .listen(port);
  console.log('Listening on http://192.168.3.1:' + port);

  //
  // LP298N  Omega
  //    IN3  0
  //    IN4  1
  //    ENB  18 (not all pins are capable of PWM!)
  //

  // ERGHER
  IN3 = gpio.pin({
    pin: 0,
    debugging: true
  });
  IN4 = gpio.pin({
    pin: 1,
    debugging: true
  });
  ENB = gpio.pin({
    pin: 18,
    debugging: true
  });
  IN3.set(false);
  IN4.set(false);
  ENB.set(false);
});

// WebSocket server for sockets
wss.on('connection', function connection(ws) {
  ws.on('message', function incoming(data) {
    data = JSON.parse(data);
    if (data.message) {
      console.log(data.message);
    }
    // Yeah... not like this.
    if (data.motorA) {
      setMotor('A', data.motorA);
    }
    if (data.motorB) {
      setMotor('B', data.motorA);
    }
  });

  ws.send('Hello from server!');
});

gpio.tests().then(() => {
  // This is awful but just cracking on
  // Maybe do some array of the pin objects,
  // {
  //   A: {
  //      up: IN3,
  //      down: IN4
  //      enable: EN1
  //   }
  // }
  // pins[motor].up.setPin(2) ??
  //
});

const setMotor = (motor, value) => {
  if (motor == 'A') {
    IN3.set(true);
    IN4.set(false);
    ENB.pwm({
      // 200 @ 20 is about the min
      frequency: 200, // hz
      duty: 25 // increase from 0 -> 100 for speed!
    });
  }
};
