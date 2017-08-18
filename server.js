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
let motors = {};

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

  motors = {
    a: {
      in1: gpio.pin({
        pin: 0,
        debugging: true
      }),
      in2: gpio.pin({
        pin: 1,
        debugging: true
      }),
      enable: gpio.pin({
        pin: 18,
        debugging: true
      })
    },
    a: {
      in1: gpio.pin({
        pin: 4, // ????
        debugging: true
      }),
      in2: gpio.pin({
        pin: 5, // ????
        debugging: true
      }),
      enable: gpio.pin({
        pin: 6, // ????
        debugging: true
      })
    }
  };
  motors.a.in1.set(false);
  motors.a.in2.set(false);
  motors.b.in1.set(false);
  motors.b.in2.set(false);
});

// WebSocket server for sockets
wss.on('connection', function connection(ws) {
  ws.on('message', function incoming(data) {
    data = JSON.parse(data);
    if (data.message) {
      console.log(data.message);
    }

    //
    //  DO SOME MOTOR READY TESTS
    //  ONLY RUN THE SHIT IF LIKE, IT'S READY OR WHATEVER
    //
    //  OR BETTER YET, ONLY CREATE THIS CONNECTION EVENT WHEN THEY'RE INITIALISED
    //

    // Let the client do all the calculations; it has the bigger brain.
    data.motorA && setMotor(motors.a, data.motorA);
    data.motorB && setMotor(motors.b, data.motorA);
  });

  ws.send('Hello from server!');
});

// gpio.tests().then(() => {
//   // errrrr
// });

// -100 -> 100
const setMotor = (motor, value) => {
  // if (value > 0) {
  //   IN3.set(true);
  //   IN4.set(false);
  // } else (value < 0) {
  //   IN3.set(false);
  //   IN4.set(true);
  // } else {
  //   IN3.set(false);
  //   IN4.set(false);
  // }

  // Direction
  motor.a.in1.set(value > 0);
  motor.a.in2.set(value < 0);

  // Speed
  let speed = Math.abs(value / 2); // 0 -> 100 (either direction)
  motor.a.enable.pwm({
    // 200 @ 20 is about the min
    frequency: 200, // hz
    duty: speed // increase from 0 -> 100 for speed!
  });
};
