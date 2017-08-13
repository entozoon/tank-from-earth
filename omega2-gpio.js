'use strict';
let run = require('child_process').spawn;

//
// Test the system
//
// No fast-gpio (unlikely, for Omega2 at least)
run('fast-gpio').on('error', function() {
  console.log(' Oops!\n You must first install fast-gpio');
  process.exit();
});
// Segmentation fault
run('fast-gpio', ['set-output', 11]).on('error', function() {
  console.log(' Oops!\n Using an Omega2? You must update the firmware by running:\n  oupgrade');
  process.exit();
});

class Omega2GPIO {
  constructor() {}
  // set(pin, value) {
  //   run('fast-gpio', ['set', pin, value]);
  // }
  set(value) {}
  pin(pin) {}
}

gpio = new Omega2GPIO();
// gpio.set(11, 1);
// gpio.pin(11).set(1);
let ledPin = gpio.pin(11);
ledPin.set(1);
