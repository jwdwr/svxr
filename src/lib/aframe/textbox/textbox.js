import AFRAME from 'aframe';
const { THREE } = AFRAME;

AFRAME.registerComponent('text-box', {
	schema: {
		text: { type: 'string', default: 'Hello, World!' },
		color: { type: 'color', default: '#000' },
		width: { type: 'number', default: 0.25 },
		height: { type: 'number', default: 0.1 },
		depth: { type: 'number', default: 0.1 }
	},

	init: function () {
		var data = this.data;
		var el = this.el;

		// Create geometry
		var geometry = new THREE.BoxGeometry(data.width, data.height, data.depth);

		// Create material
		var material = new THREE.MeshBasicMaterial({ color: data.color });

		// Create mesh
		var mesh = new THREE.Mesh(geometry, material);

		// Add mesh to the entity
		el.setObject3D('mesh', mesh);

		// Create text
		var textEntity = document.createElement('a-text');
		textEntity.setAttribute('value', data.text);
		textEntity.setAttribute('align', 'center');
		textEntity.setAttribute('color', 'white');
		textEntity.setAttribute('position', '0 0 0.06');
		textEntity.setAttribute('geometry', 'primitive: plane; width: 0.25; height: 0.1;');
		el.appendChild(textEntity);
	}
});
