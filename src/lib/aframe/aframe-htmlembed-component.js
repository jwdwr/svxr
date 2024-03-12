import * as AFRAME from 'aframe';
const { THREE } = AFRAME;

if (typeof AFRAME === 'undefined') {
	throw new Error('Component attempted to register before AFRAME was available.');
}

const useCanvas = false;

import { Renderer } from '../renderer/Renderer';
import { RoundedBoxFlat } from './RoundedBoxFlat';

AFRAME.registerComponent('htmlembed', {
	schema: {
		width: { type: 'number', default: 5 },
		height: { type: 'number', default: 4 },
		depth: { type: 'number', default: 0.1 },
		radiusCorner: { type: 'number', default: 0.05 },
		smoothness: { type: 'number', default: 10 },
		uStartQuadr: { type: 'number', default: 2 }
	},
	init: function () {
		const renderer = new Renderer(
			this.el,
			useCanvas,
			() => {
				if (texture) texture.needsUpdate = true;
			},
			(event, data) => {
				switch (event) {
					case 'resize':
						this.el.emit('resize');
						break;
					case 'rendered':
						this.el.emit('rendered');
						break;
					case 'focusableenter':
						this.el.emit('focusableenter', data);
						break;
					case 'focusableleave':
						this.el.emit('focusableleave', data);
						break;
					case 'inputrequired':
						this.el.emit('inputrequired', data);
						break;
				}
			}
		);
		this.renderer = renderer;
		const texture = new THREE.Texture(renderer.img);
		texture.minFilter = THREE.LinearMipMapLinearFilter; // Or THREE.LinearFilter
		texture.magFilter = THREE.LinearFilter; // Or THREE.LinearFilter
		texture.wrapS = THREE.ClampToEdgeWrapping;
		texture.wrapT = THREE.ClampToEdgeWrapping;

		const data = this.data;
		const geometry = RoundedBoxFlat(
			data.width,
			data.height,
			data.depth,
			data.radiusCorner,
			data.smoothness,
			data.uStartQuadr
		);

		const materials = [
			new THREE.MeshBasicMaterial({
				map: texture,
				transparent: true
			}),
			new THREE.MeshStandardMaterial({
				color: 0xdddddd,
				transparent: true
			}),
			new THREE.MeshStandardMaterial({
				color: 0xdddddd,
				transparent: true
			})
		];
		const screen = new THREE.Mesh(geometry, materials);
		this.el.setObject3D('screen', screen);
		this.screen = screen;

		this.el.addEventListener('raycaster-intersected', (evt) => {
			this.raycaster = evt.detail.el;
		});
		this.el.addEventListener('raycaster-intersected-cleared', () => {
			this.renderer.listener.clearHover();
			this.raycaster = null;
		});
		this.el.addEventListener('mousedown', (evt) => {
			if (evt instanceof CustomEvent) {
				this.renderer.listener.mousedown(this.lastX, this.lastY);
			} else {
				evt.stopPropagation();
			}
		});
		this.el.addEventListener('mouseup', (evt) => {
			if (evt instanceof CustomEvent) {
				this.renderer.listener.mouseup(this.lastX, this.lastY);
			} else {
				evt.stopPropagation();
			}
		});
		this.resize();
	},
	resize() {},
	update() {
		this.resize();
	},
	forceRender() {
		this.renderer.forceRender();
	},
	tick: function () {
		this.resize();
		if (!this.raycaster) {
			return;
		}

		const intersection = this.raycaster.components.raycaster.getIntersection(this.el);
		if (!intersection) {
			return;
		}

		// Get the face normal of the intersected face
		const faceNormal = intersection.face.normal.clone();

		// Transform the face normal to world space
		this.el.object3D.localToWorld(faceNormal);
		const localPoint = intersection.point.clone();
		this.el.object3D.worldToLocal(localPoint);

		const w = this.data.width / 2;
		const h = this.data.height / 2;
		const x = Math.round(((localPoint.x + w) / this.data.width) * this.renderer.innerWidth);
		const y = Math.round(((h - localPoint.y) / this.data.height) * this.renderer.innerHeight);

		if (this.lastX != x || this.lastY != y) {
			this.renderer.listener.mousemove(x, y);
		}
		this.lastX = x;
		this.lastY = y;
	},
	remove: function () {
		this.el.removeObject3D('screen');
	}
});
