import AFRAME from 'aframe';
const { THREE } = AFRAME;

AFRAME.registerShader('depth', {
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
		uniform vec3 cameraPos;

		varying vec2 vUv;
		varying vec3 vWorldPosition;

		void main() {
			vec3 rayDirection = normalize(vWorldPosition - cameraPos);

			vec4 depth = texture2D(depthImage, vUv);
			vec2 offset = rayDirection.xy * 0.1 * depth.r;
			gl_FragColor = texture2D(originalImage, vUv + offset);
		}
	`
});

AFRAME.registerComponent('depth-image', {
	schema: {
		originalImage: { type: 'selector' },
		depthImage: { type: 'selector' },
		cameraPos: { type: 'vec3' }
	},

	init: async function () {
		const originalTexture = await new Promise((resolve) =>
			new THREE.TextureLoader().load(this.data.originalImage.src, resolve)
		);
		const depthTexture = await new Promise((resolve) =>
			new THREE.TextureLoader().load(this.data.depthImage.src, resolve)
		);

		this.baseMaterial = new THREE.ShaderMaterial({
			uniforms: {
				originalImage: { value: originalTexture },
				depthImage: { value: depthTexture },
				cameraPos: { value: new THREE.Vector3() }
			},
			vertexShader: AFRAME.shaders.depth.Shader.prototype.vertexShader,
			fragmentShader: AFRAME.shaders.depth.Shader.prototype.fragmentShader
		});

		this.leftMaterial = this.baseMaterial.clone();

		this.rightMaterial = this.baseMaterial.clone();

		// create plane mesh with shader material
		const geometry = new THREE.PlaneGeometry(0.2, 0.3);

		const baseMesh = new THREE.Mesh(geometry, this.baseMaterial);
		baseMesh.layers.set(0);

		const leftMesh = new THREE.Mesh(geometry, this.leftMaterial);
		leftMesh.layers.set(1);

		const rightMesh = new THREE.Mesh(geometry, this.rightMaterial);
		rightMesh.layers.set(2);

		const group = new THREE.Group();
		this.el.setObject3D('mesh', group);
		this.el.object3D.add(baseMesh);
		this.el.object3D.add(leftMesh);
		this.el.object3D.add(rightMesh);
	},

	tick: function () {
		if (!this.baseMaterial) return;

		const cameraPosition = document.querySelector('a-camera').object3D.position;
		this.baseMaterial.uniforms.cameraPos.value.copy(cameraPosition);

		var averageIPD = 0.064;

		var leftEyePosition = new THREE.Vector3().copy(cameraPosition);
		leftEyePosition.x -= averageIPD / 2;
		this.leftMaterial.uniforms.cameraPos.value.copy(leftEyePosition);

		var rightEyePosition = new THREE.Vector3().copy(cameraPosition);
		rightEyePosition.x += averageIPD / 2;
		this.rightMaterial.uniforms.cameraPos.value.copy(rightEyePosition);
	}
});
