/**
 *

    <tr><td>alpha:</td><td><div id="alpha" class="bar"></div></td></tr>
    <tr><td>beta:</td><td><div id="beta" class="bar"></div></td></tr>
    <tr><td>gamma:</td><td><div id="gamma" class="bar"></div></td></tr>
    <tr><td>a1:</td><td><div id="a1" class="bar"></div></td></tr>
    <tr><td>ro:</td><td><div id="ro" class="bar"></div></td></tr>

 */
class Orientator {
  constructor() {
    // LAY FLAT ON TABLE
    // event.alpha Z - left right spin turn (0 north at top of device)
    // event.beta  X - front back lift
    // event.gamma Y - left right lift
    // See: https://developer.mozilla.org/en-US/docs/Web/Guide/Events/Orientation_and_motion_data_explained
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
      },
      false
    );

    window.addEventListener('devicemotion', event => {
      // m/s^2
      document.getElementById('a1').innerHTML =
        event.acceleration.x +
        ', ' +
        Math.round(event.acceleration.y) +
        ', ' +
        Math.round(event.acceleration.z);

      // Degrees per second
      document.getElementById('ro').innerHTML =
        Math.round(event.rotationRate.alpha) +
        ', ' +
        Math.round(event.rotationRate.beta) +
        ', ' +
        Math.round(event.rotationRate.gamma);
    });
  }
}

const orientator = new Orientator();
