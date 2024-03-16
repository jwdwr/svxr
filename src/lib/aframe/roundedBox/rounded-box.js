import AFRAME from 'aframe';
import { RoundedBoxFlat } from './RoundedBoxFlat';
const { THREE } = AFRAME;

AFRAME.registerComponent('rounded-box', {
	schema: {
		width: { type: 'number', default: 5 },
		height: { type: 'number', default: 4 },
		depth: { type: 'number', default: 0.01 },
		radiusCorner: { type: 'number', default: 1 },
		smoothness: { type: 'number', default: 4 },
		uStartQuadr: { type: 'number', default: 2 },
		color: { type: 'color', default: '#000' },
		opacity: { type: 'number', default: 1 }
	},
	init: function () {
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
			new THREE.MeshStandardMaterial({
				color: this.data.color,
				transparent: true,
				opacity: this.data.opacity
			}),
			new THREE.MeshStandardMaterial({
				color: this.data.color,
				transparent: true,
				opacity: this.data.opacity
			}),
			new THREE.MeshStandardMaterial({
				color: this.data.color,
				transparent: true,
				opacity: this.data.opacity
			})
		];

		const mesh = new THREE.Mesh(geometry, materials);
		this.el.setObject3D('mesh', mesh);
	}
});
