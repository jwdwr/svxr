import AFRAME from 'aframe';

AFRAME.registerComponent('spin', {
	schema: {
		speed: { default: 1 } // Degrees per second
	},

	tick: function (time, timeDelta) {
		let rotation = this.el.getAttribute('rotation');
		rotation.y += (this.data.speed * timeDelta) / 10; // Rotate around Y-axis
		this.el.setAttribute('rotation', rotation);
	}
});
