import AFRAME from 'aframe';
const { THREE } = AFRAME;

AFRAME.registerShader('fake3dShader', {
	schema: {
		originalImage: { type: 'map' },
		depthImage: { type: 'map' },
		cameraPos: { type: 'vec3' }
	},

	vertexShader: `
		varying vec2 vUv;
		varying vec3 vWorldPosition;

		void main() {
			vUv = uv;
			vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
			gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
		}
	`,

	fragmentShader: `
		uniform sampler2D originalImage;
		uniform sampler2D depthImage;
		varying vec2 vUv;
		varying vec3 vWorldPosition;

		void main() {
			vec3 rayDirection = normalize(vWorldPosition - cameraPosition);

			vec4 depth = texture2D(depthImage, vUv);
			vec2 offset = rayDirection.xy * 0.05 * depth.r;
			gl_FragColor = texture2D(originalImage, vUv + offset);
		}
	`
});

AFRAME.registerComponent('fake3d', {
	schema: {
		originalImage: { type: 'selector' },
		depthImage: { type: 'selector' }
	},

	init: async function () {
		const originalTexture = await new Promise((resolve) =>
			new THREE.TextureLoader().load(this.data.originalImage.src, resolve)
		);
		const depthTexture = await new Promise((resolve) =>
			new THREE.TextureLoader().load(this.data.depthImage.src, resolve)
		);

		this.material = new THREE.ShaderMaterial({
			uniforms: {
				originalImage: { value: originalTexture },
				depthImage: { value: depthTexture },
				cameraPos: { value: new THREE.Vector3() }
			},
			vertexShader: AFRAME.shaders.fake3dShader.Shader.prototype.vertexShader,
			fragmentShader: AFRAME.shaders.fake3dShader.Shader.prototype.fragmentShader
		});

		// create plane mesh with shader material
		const geometry = new THREE.PlaneGeometry(0.2, 0.3);
		const mesh = new THREE.Mesh(geometry, this.material);
		mesh.layers.set(0);
		this.el.setObject3D('mesh', mesh);
	},

	tick: function () {
		if (!this.material) return;
		const cameraPosition = document.querySelector('a-camera').object3D.position;
		this.material.uniforms.cameraPos.value.copy(cameraPosition);
		var averageIPD = 0.064; // Average IPD in meters

		var leftEyePosition = new THREE.Vector3().copy(cameraPosition);
		leftEyePosition.x -= averageIPD / 2;

		var rightEyePosition = new THREE.Vector3().copy(cameraPosition);
		rightEyePosition.x += averageIPD / 2;
	}
});
