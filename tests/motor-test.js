'use strict';
const Omega2GPIO = require('omega2-gpio'),
  gpio = new Omega2GPIO();

let motorA = gpio.pin(0);

console.log('ON');
motorA.set(1);

setTimeout(() => {
  console.log('OFF');
  motorA.set(0);
}, 3000);
