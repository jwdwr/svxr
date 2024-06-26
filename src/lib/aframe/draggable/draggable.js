import AFRAME from 'aframe';

AFRAME.registerSystem('track-cursor', {
	init: function () {
		this.el.setAttribute('cursor', { rayOrigin: 'mouse' });
	}
});

AFRAME.registerComponent('track-cursor', {
	init: function () {
		this.el.addEventListener('mousedown', (e) => {
			if (this.el.is('raycasted')) {
				this.el.sceneEl.camera.el.setAttribute('look-controls', {
					enabled: false
				});
				this.el.addState('dragging');
			}
		});
		this.el.sceneEl.addEventListener('click', (e) => {
			if (this.el.is('dragging')) {
				this.el.sceneEl.camera.el.setAttribute('look-controls', {
					enabled: true
				});
				this.el.removeState('dragging');
			}
		});
	}
});

AFRAME.registerComponent('drag', {
	dependencies: ['track-cursor'],
	init: function () {
		this.el.setAttribute('cursor', { rayOrigin: 'mouse' });
		this.range = 0;
		this.dist = 0;

		this.el.addEventListener('stateadded', (e) => {
			if (e.detail == 'dragging') {
				this.range = 0;
				this.dist = this.el.object3D.position
					.clone()
					.sub(this.el.sceneEl.camera.el.object3D.position)
					.length();
			}
		});

		const [frame, window] = this.el.object3D.children;

		frame.el.addEventListener('raycaster-intersected', () => {
			this.el.addState('raycasted');
			const frameMaterial = frame.el.getObject3D('mesh').material;
			frameMaterial.opacity = 1;
			frameMaterial.needsUpdate = true;
		});
		window.el.addEventListener('raycaster-intersected', () => {
			const frameMaterial = frame.el.getObject3D('mesh').material;
			frameMaterial.opacity = 0.5;
			frameMaterial.needsUpdate = true;
			this.el.removeState('raycasted');
		});
		window.el.addEventListener('raycaster-intersected-cleared', () => {
			this.el.addState('raycasted');
			const frameMaterial = frame.el.getObject3D('mesh').material;
			frameMaterial.opacity = 1;
			frameMaterial.needsUpdate = true;
		});
		frame.el.addEventListener('raycaster-intersected-cleared', () => {
			this.el.removeState('raycasted');
			const frameMaterial = frame.el.getObject3D('mesh').material;
			frameMaterial.opacity = 0.5;
			frameMaterial.needsUpdate = true;
		});

		this.direction = new AFRAME.THREE.Vector3();
		this.target = new AFRAME.THREE.Vector3();
		document.addEventListener('wheel', (e) => {
			if (e.deltaY < 0) {
				this.range += 0.1;
			} else {
				this.range -= 0.1;
			}
		});
	},
	updateDirection: function () {
		this.direction.copy(this.el.sceneEl.getAttribute('raycaster').direction);
	},
	updateTarget: function () {
		let camera = this.el.sceneEl.camera.el;
		this.target.copy(
			camera.object3D.position
				.clone()
				.add(this.direction.clone().multiplyScalar(this.dist + this.range))
		);
	},
	tick: function () {
		if (this.el.is('dragging')) {
			this.updateDirection();
			this.updateTarget();
			this.el.object3D.position.copy(this.target);
		}
	}
});
