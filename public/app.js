let ready = false,
  splash = document.getElementById('splash'),
  // If this IP is unpredictable, I might send it through from the server - plus it'd be localhost testable then
  connection = new WebSocket('ws://127.0.0.1:8080');

splash.addEventListener('click', () => {
  //openFullScreen();
  splash.remove();
  ready = true;
});

connection.onopen = () => {
  console.log('Connected');

  connection.onerror = error => {
    console.log('Error: ' + error);
  };

  connection.onmessage = message => {
    console.log(message.data);
  };

  connection.send('Hello from client!');
};

class OrientationalThing {
  constructor() {
    // LAY FLAT ON TABLE
    // event.alpha Z - left right spin turn (0 north at top of device)
    // event.beta  X - front back lift
    // event.gamma Y - left right lift
    // See: https://developer.mozilla.org/en-US/docs/Web/Guide/Events/Orientation_and_motion_data_explained
    // NOTE: You can also get acceleration in each direction and rotationally. See motion-test.js
    this.alpha = 0;
    this.beta = 0;
    this.gamma = 0;

    if (!window.DeviceOrientationEvent) {
      return false;
    }

    window.addEventListener(
      'deviceorientation',
      event => {
        if (event.absolute) {
          alert('This device uses absolute orientation..');
          return;
        }
        this.alpha = event.alpha;
        this.beta = event.beta;
        this.gamma = event.gamma;

        document.getElementById('alpha').innerHTML = Math.round(this.alpha) + ' &deg;';
        document.getElementById('beta').innerHTML = Math.round(this.beta) + ' &deg;';
        document.getElementById('gamma').innerHTML = Math.round(this.gamma) + ' &deg;';
        document.getElementById('alpha').style.width = this.alpha + 360 + 'px';
        document.getElementById('beta').style.width = this.beta + 360 + 'px';
        document.getElementById('gamma').style.width = this.gamma + 360 + 'px';

        document.getElementById('needle').style.transform =
          'rotate(' + -(this.beta + 90) + 'deg) translateZ(0)';

        let blob1 = { x: 300, y: 0 },
          blob2 = {};
        blob2.x = blob1.x + -this.gamma / 90 * 100;
        blob2.y = blob1.y + (-this.beta + 20) / 90 * 100;
        // I don't think there is anything clever here. just mixing gamma and beta well.
        // Try and get an angle somehow, draw it over the top like a compass

        document.getElementById('blob1').style.left = Math.round(blob1.x) + 'px';
        document.getElementById('blob1').style.top = Math.round(blob1.y) + 'px';
        document.getElementById('blob2').style.left = Math.round(blob2.x) + 'px';
        document.getElementById('blob2').style.top = Math.round(blob2.y) + 'px';

        document.getElementById('blob2dx').innerHTML = Math.round(blob2.x) + 'px';
        document.getElementById('blob2dy').innerHTML = Math.round(blob2.y) + 'px';

        document.getElementById('direction').style.transform =
          'rotate(' + -(this.beta + 90) + 'deg) translateZ(0)';
        document.getElementById('direction').style.height = this.gamma + 'px';

        document.getElementById('car').style.transform =
          'rotate(' + -(this.beta + 90) + 'deg) translateZ(0)';

        document.getElementById('wheel').style.transform =
          'rotate(' + (this.beta - 90) + 'deg) translateZ(0)';
      },
      false
    );
  }
}

//const orientator = new OrientationalThing();

//
// COMPOSITION (better than inheritance)
//
const speaker = state => ({
  speak: () => console.log(state.motto)
});

const orientator = state => {
  let orientation = {};
  return {
    setOrientation: data => {
      orientation.alpha = data.alpha;
      orientation.beta = data.beta;
      orientation.gamma = data.gamma;
    },
    getOrientation: () => orientation
  };
};

const robot = motto => {
  let state = {
    motto: motto
  };
  return Object.assign({}, speaker(state), orientator(state));
};

const tank = robot('Go fuck ya sen4!');

tank.speak();

window.addEventListener('deviceorientation', event => {
  if (event.absolute) {
    alert('Error: This device uses absolute orientation (ref to earth)..');
    return;
  }
  tank.setOrientation(event);
});

tank.setOrientation({
  alpha: 1,
  beta: 2,
  gamma: 3
});

console.log(tank.getOrientation());

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
