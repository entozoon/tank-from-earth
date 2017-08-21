let ready = false,
  splash = document.getElementById('splash'),
  // If this IP is unpredictable, I might send it through from the server - plus it'd be localhost testable then
  connection = new WebSocket('ws://' + window.location.host + ':8080');

splash.addEventListener('click', () => {
  openFullScreen();
  splash.remove();
  ready = true;
});

connection.onopen = () => {
  console.log('[Connected to server]');

  connection.onerror = error => {
    console.log('Error: ' + error);
  };

  connection.onmessage = message => {
    console.log(message.data);
  };

  connection.send(
    JSON.stringify({
      message: '[Hello from client]'
    })
  );

  const tank = robot(connection);

  tank.emit({ message: '[Hello from tank]' });

  // Simple example of how we'll be setting motor speeds:
  // connection.send(
  //   JSON.stringify({
  //     // -100 -> 100
  //     motors: {
  //       a: -20,
  //       b: 20
  //     }
  //   })
  // );

  //
  // Tilting! Do all the calculations and blast the motor data back over to the robut
  //
  window.addEventListener('deviceorientation', event => {
    if (event.absolute) {
      alert('Error: This device uses absolute orientation (ref to earth)..');
      return;
    }
    tank.setOrientation(event);
    console.log(tank.getOrientation());
    tank.emit({
      motors: tank.orientationToMotorSpeeds(tank.getOrientation())
    });
  });

  //
  // Device Orientation Simulation for localhost testing
  //
  if (window.location.host == 'localhost') {
    let orientation = {
      alpha: 0,
      beta: -180,
      gamma: -90
    };
    let flopBeta = false,
      flopGamma = false;
    setInterval(() => {
      // Pan up and down
      flopBeta = orientation.beta >= 180 || orientation.beta <= -180 ? !flopBeta : flopBeta;
      flopGamma = orientation.gamma >= 90 || orientation.gamma <= -90 ? !flopGamma : flopGamma;
      orientation.beta += flopBeta ? 10 : -10;
      orientation.gamma += flopGamma ? 2 : -2;
      tank.setOrientation(orientation);
      tank.emit({
        motors: tank.orientationToMotorSpeeds(tank.getOrientation())
      });
    }, 100);
  }
};

//
// COMPOSITION (better than inheritance, bitches!)
//
const emitter = connection => {
  return {
    emit: message => {
      connection.send(JSON.stringify(message));
    }
  };
};

const mecha = () => {
  return {
    /**
    * orientationToMotorSpeeds
    * @input orientation { alpha: [0 -> 360?], beta: [-180 -> 180], gamma: [-90 -> 90] }
    * @return {a: int, b: int} [-100 -> 100]
    */
    orientationToMotorSpeeds: orientation => {
      console.log(orientation.gamma);

      // Try and CSS flip to math phone auto-rotation, at least for my phone.
      if (orientation.gamma > 29) {
        document.body.className = 'upside-down';
      } else if (orientation.gamma < -29) {
        document.body.className = '';
      }

      document.getElementById('alpha').innerHTML = Math.round(orientation.alpha) + ' &deg;';
      document.getElementById('beta').innerHTML = Math.round(orientation.beta) + ' &deg;';
      document.getElementById('gamma').innerHTML = Math.round(orientation.gamma) + ' &deg;';
      document.getElementById('alpha').style.width = orientation.alpha + 360 + 'px';
      document.getElementById('beta').style.width = orientation.beta + 360 + 'px';
      document.getElementById('gamma').style.width = orientation.gamma + 360 + 'px';

      // Oh boy this is gonna be complex.
      // Tilting left/right affects like, the ratio/dir of power output and forward the speed
      // so..
      // I guess create a vector from the tiltnesses, then convert that to motor outputs?
      // Nah. make it so left/right blasts the motors in that dir at full wack
      // then scale it back depending on tilt?
      // No.. it's not a car. erm.
      // Tilting left/right turns it on the spot, then forward/back increases everything in that dir.
      // Think of it as x and y..
      // y
      // |
      // |
      // |      o
      // |
      // |
      // |____________x
      let y = orientation.gamma / 90 * 100,
        x = orientation.beta / 180 * 100; // -100 -> 100

      let a = 0,
        b = 0;

      // Convert x, y co-ordinate versions of the tilting into a, b motor impulses
      a = x;
      b = -x;

      a += y;
      b += y;
      // Constrain [-100 -> 100]
      a = a > 100 ? 100 : a;
      b = a > 100 ? 100 : b;
      a = a < -100 ? -100 : a;
      b = a < -100 ? -100 : b;

      //
      // VISUALISATION, BABY. Winamp style.
      //
      let point = document.getElementById('graph__point');
      let motorA = document.getElementById('motorA');
      let motorB = document.getElementById('motorB');
      point.style.marginTop = -y + 'px';
      point.style.marginLeft = x + 'px';
      motorA.style.marginTop = -a + 'px';
      motorB.style.marginTop = -b + 'px';
      document.getElementById('motorB_').innerHTML = b;
      document.getElementById('motorA_').innerHTML = a;

      //
      // THIS NEEDS TO BE WAAAAAAAAAY more efficient.
      // The bottleneck is literally just the fast-gpio command.
      // UPDATE: it's not, it's maybe more stuff.
      // - Only send the pwm value when possible, not have server calc dir.
      // - Frameskip, essentially. Find a reasonable max speed for omega2 by measuring how fast pwm() can run, without any console logs. So I guess use a timer (pessimistically).
      //   Then, I guess, fire up a setInterval sending over the current motor speed
      // - Try the above with some different spawn commands, exec/execSync probably quicker.
      //   As from CLI it can run the command basically as fast as imaginable
      //

      return {
        a: Math.round(a),
        b: Math.round(b)
      };
    }
  };
};

const orientator = () => {
  let orientation = {};
  return {
    setOrientation: data => {
      orientation.alpha = data.alpha;
      orientation.beta = data.beta;
      orientation.gamma = data.gamma;

      // document.getElementById('car').style.transform =
      //   'rotate(' + -(this.beta + 90) + 'deg) translateZ(0)';
      // document.getElementById('wheel').style.transform =
      //   'rotate(' + (this.beta - 90) + 'deg) translateZ(0)';
    },
    getOrientation: () => orientation
  };
};

const robot = connection => {
  return Object.assign({}, emitter(connection), orientator(), mecha());
};

openFullScreen = () => {
  var doc = window.document;
  var docEl = doc.documentElement;
  var requestFullScreen =
    docEl.requestFullscreen ||
    docEl.mozRequestFullScreen ||
    docEl.webkitRequestFullScreen ||
    docEl.msRequestFullscreen;
  requestFullScreen.call(docEl);
  if (typeof screen.orientation.lock == 'function') {
    screen.orientation.lock('landscape');
  }
  if (typeof window.screen.lockOrientation == 'function') {
    window.screen.lockOrientation('portrait-primary', 'landscape-primary');
  }
};

// class OrientationalThing {
//   constructor() {
//     // LAY FLAT ON TABLE
//     // event.alpha Z - left right spin turn (0 north at top of device)
//     // event.beta  X - front back lift
//     // event.gamma Y - left right lift
//     // See: https://developer.mozilla.org/en-US/docs/Web/Guide/Events/Orientation_and_motion_data_explained
//     // NOTE: You can also get acceleration in each direction and rotationally. See motion-test.js
//     this.alpha = 0;
//     this.beta = 0;
//     this.gamma = 0;
//
//     if (!window.DeviceOrientationEvent) {
//       return false;
//     }
//
//     window.addEventListener(
//       'deviceorientation',
//       event => {
//         if (event.absolute) {
//           alert('This device uses absolute orientation..');
//           return;
//         }
//         this.alpha = event.alpha;
//         this.beta = event.beta;
//         this.gamma = event.gamma;
//
//         document.getElementById('needle').style.transform =
//           'rotate(' + -(this.beta + 90) + 'deg) translateZ(0)';
//
//         let blob1 = { x: 300, y: 0 },
//           blob2 = {};
//         blob2.x = blob1.x + -this.gamma / 90 * 100;
//         blob2.y = blob1.y + (-this.beta + 20) / 90 * 100;
//         // I don't think there is anything clever here. just mixing gamma and beta well.
//         // Try and get an angle somehow, draw it over the top like a compass
//
//         document.getElementById('blob1').style.left = Math.round(blob1.x) + 'px';
//         document.getElementById('blob1').style.top = Math.round(blob1.y) + 'px';
//         document.getElementById('blob2').style.left = Math.round(blob2.x) + 'px';
//         document.getElementById('blob2').style.top = Math.round(blob2.y) + 'px';
//
//         document.getElementById('blob2dx').innerHTML = Math.round(blob2.x) + 'px';
//         document.getElementById('blob2dy').innerHTML = Math.round(blob2.y) + 'px';
//
//         document.getElementById('direction').style.transform =
//           'rotate(' + -(this.beta + 90) + 'deg) translateZ(0)';
//         document.getElementById('direction').style.height = this.gamma + 'px';
//
//         document.getElementById('car').style.transform =
//           'rotate(' + -(this.beta + 90) + 'deg) translateZ(0)';
//
//         document.getElementById('wheel').style.transform =
//           'rotate(' + (this.beta - 90) + 'deg) translateZ(0)';
//       },
//       false
//     );
//   }
// }

//const orientator = new OrientationalThing();
