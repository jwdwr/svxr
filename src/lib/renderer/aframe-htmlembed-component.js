import * as AFRAME from 'aframe';
const { THREE } = AFRAME;

if (typeof AFRAME === 'undefined') {
	throw new Error('Component attempted to register before AFRAME was available.');
}

const useCanvas = false;

import { Renderer } from './Renderer';

AFRAME.registerComponent('htmlembed', {
	schema: {
		ppu: {
			type: 'number',
			default: 256
		}
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
		const material = new THREE.MeshBasicMaterial({
			map: texture,
			transparent: true
		});
		const geometry = new THREE.PlaneGeometry();
		const screen = new THREE.Mesh(geometry, material);
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
			console.log('heard mousedown');
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
	resize() {
		this.width = this.renderer.width / this.data.ppu;
		this.height = this.renderer.height / this.data.ppu;
		this.screen.scale.x = Math.max(0.0001, this.width);
		this.screen.scale.y = Math.max(0.0001, this.height);
	},
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
		const localPoint = intersection.point;
		this.el.object3D.worldToLocal(localPoint);
		const w = this.width / 2;
		const h = this.height / 2;
		const x = Math.round((((localPoint.x + w) / this.width) * this.renderer.width) / 4);
		const y = Math.round(((1 - (localPoint.y + h) / this.height) * this.renderer.height) / 4);
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
