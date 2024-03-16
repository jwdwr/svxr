import * as AFRAME from 'aframe';
const { THREE } = AFRAME;

if (typeof AFRAME === 'undefined') {
	throw new Error('Component attempted to register before AFRAME was available.');
}

const useCanvas = false;

import { HTMLImage } from './HTMLImage';
import { RoundedBoxFlat } from '../roundedBox/RoundedBoxFlat';

AFRAME.registerComponent('html-button', {
	schema: {
		width: { type: 'number', default: 5 },
		height: { type: 'number', default: 4 },
		depth: { type: 'number', default: 0.1 },
		radiusCorner: { type: 'number', default: 0.05 },
		smoothness: { type: 'number', default: 10 },
		uStartQuadr: { type: 'number', default: 2 },
		color: { type: 'color', default: '#000' },
		hoverColor: { type: 'color', default: '#888' }
	},
	init: function () {
		const htmlImage = new HTMLImage(
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
		this.htmlImage = htmlImage;
		const texture = new THREE.Texture(htmlImage.img);
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
				color: this.data.color,
				transparent: true
			}),
			new THREE.MeshStandardMaterial({
				color: this.data.color,
				transparent: true
			})
		];
		const screen = new THREE.Mesh(geometry, materials);
		this.el.setObject3D('screen', screen);
		this.screen = screen;

		this.el.addEventListener('raycaster-intersected', (evt) => {
			this.raycaster = evt.detail.el;
			const materials = this.screen.material;
			materials[0].color.set(this.data.hoverColor);
			materials[1].color.set(this.data.hoverColor);
			materials[2].color.set(this.data.hoverColor);
			this.el.object3D.scale.z = 0.8;
		});
		this.el.addEventListener('raycaster-intersected-cleared', () => {
			this.htmlImage.listener.clearHover();
			this.raycaster = null;
			const materials = this.screen.material;
			materials[0].color.set(this.data.color);
			materials[1].color.set(this.data.color);
			materials[2].color.set(this.data.color);
			this.el.object3D.scale.z = 1;
		});
		this.el.addEventListener('mousedown', (evt) => {
			if (evt instanceof CustomEvent) {
				this.htmlImage.listener.mousedown(this.lastX, this.lastY);
			} else {
				evt.stopPropagation();
			}
			this.el.object3D.scale.z = 0.5;
		});
		this.el.addEventListener('mouseup', (evt) => {
			if (evt instanceof CustomEvent) {
				this.htmlImage.listener.mouseup(this.lastX, this.lastY);
			} else {
				evt.stopPropagation();
			}
			this.el.object3D.scale.z = 1;
		});
	},
	forceRender() {
		this.htmlImage.forceRender();
	},
	tick: function () {},
	remove: function () {
		this.el.removeObject3D('screen');
	}
});
