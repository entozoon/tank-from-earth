'use strict';
const http = require('http'),
  fs = require('fs'),
  port = 80,
  WebSocket = require('ws'),
  wss = new WebSocket.Server({ port: 8080 }),
  // Super specific, because of old node on the Omega2
  Omega2Gpio = require('./node_modules/omega2-gpio/omega2-gpio'),
  gpio = new Omega2Gpio();
let motors = {};

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
  readFilePromise('./public/manifest.json'),
  readFilePromise('./public/app.css'),
  readFilePromise('./public/app.js'),
  gpio.tests()
]).then(resolutions => {
  //
  // LP298N  Omega
  //    ENA  3
  //    IN1  2
  //    IN4  9
  //    IN3  0
  //    IN4  1
  //    ENB  18 (NB: not all pins are capable of PWM!)
  //
  motors = {
    a: {
      in1: gpio.pin({
        pin: 0,
        debugging: false
      }),
      in2: gpio.pin({
        pin: 1,
        debugging: false
      }),
      enable: gpio.pin({
        pin: 18,
        debugging: false
      })
    },
    b: {
      in1: gpio.pin({
        pin: 2,
        debugging: false
      }),
      in2: gpio.pin({
        pin: 9,
        debugging: false
      }),
      enable: gpio.pin({
        pin: 3,
        debugging: true
      })
    }
  };
  motors.a.in1.set(false);
  motors.a.in2.set(false);
  motors.b.in1.set(false);
  motors.b.in2.set(false);

  let client = resolutions[0],
    manifest = resolutions[1],
    css = resolutions[2],
    js = resolutions[3];

  // Create HTTP server (net is a slimline alternative)
  http
    .createServer(function(request, response) {
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
          console.log('[User request]');
          response.writeHead(200, { 'Content-Type': 'text/html' });
          response.write(client.toString());
          break;
      }

      response.end();
    })
    .listen(port);
  console.log('Listening on http://192.168.3.1:' + port);
});

// WebSocket server for sockets
wss.on('connection', function connection(ws) {
  ws.on('message', function incoming(data) {
    // Keep this block as simple as possible, it'll be spammed like a mawf
    data = JSON.parse(data);

    data.message && console.log(data.message);

    if (!data.motors) return;

    // Let the client do all the calculations; it has the bigger brain.
    // setMotor(motors.a, data.motors.a);
    // setMotor(motors.b, data.motors.b);
    // .. Moreso
    setMotorManual(motors.a, data.motors.a);
    setMotorManual(motors.b, data.motors.b);
  });

  ws.send('[Hello from server]');
});

// -100 -> 100
const setMotor = (motor, value) => {
  motor.in1.set(value > 0);
  motor.in2.set(value < 0);

  // Speed
  let speed = Math.abs(value); // 0 -> 100 (either direction)
  motor.enable.pwm({
    // 200 @ 20 is about the min
    frequency: 200, // hz
    duty: speed // increase from 0 -> 100 for speed!
  });
};

// {
//   speed: [0, 100]
//   matrix: e.g. [0, 1]
// }
const setMotorManual = (motor, values) => {
  // Insane laziness here. Not too efficient either,
  // but brapping it in because my theory is that
  // global trash like this is quicker than spawns.
  if (values.matrix[0] != motor.PASSTHESESOMEWHERE) {
    motor.PASSTHESESOMEWHERE = values.matrix[0];
    console.log('Dir change');
    motor.in1.set(values.matrix[0]);
  }

  if (values.matrix[1] != motorDirB) {
    motorDirB = values.matrix[1];
    console.log('Dir change');
    motor.in2.set(values.matrix[1]);
  }

  //console.log(values);

  // Speed
  motor.enable.pwm({
    // 200 @ 20 is about the min
    frequency: 200, // hz
    duty: values.speed // increase from 0 -> 100 for speed!
  });
};
