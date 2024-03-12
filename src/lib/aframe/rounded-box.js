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
		uStartQuadr: { type: 'number', default: 2 }
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
				color: 0xdddddd,
				transparent: true,
				opacity: 0.5
			}),
			new THREE.MeshStandardMaterial({
				color: 0xdddddd,
				transparent: true,
				opacity: 0.5
			}),
			new THREE.MeshStandardMaterial({
				color: 0xdddddd,
				transparent: true,
				opacity: 0.5
			})
		];

		const mesh = new THREE.Mesh(geometry, materials);
		this.el.setObject3D('mesh', mesh);
	}
});
