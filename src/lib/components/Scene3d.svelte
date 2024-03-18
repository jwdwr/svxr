<script lang="ts">
	import { onMount } from 'svelte';

	onMount(() => {
		const scene = document.querySelector('a-scene');
		const camera = document.getElementById('camera')!;
		const page = document.getElementById('objects')!;

		scene.addEventListener('enter-vr', function () {
			setTimeout(() => {
				const cameraPosition = camera.object3D.position;
				console.log('enter', cameraPosition, page, page.getAttribute('position'));

				const pagePos = {
					x: cameraPosition!.x,
					y: cameraPosition!.y,
					z: cameraPosition!.z - 0.4
				};

				page.setAttribute('position', pagePos);
			}, 100);
		});
	});
</script>

<a-scene
	renderer="maxCanvasWidth: 3000; maxCanvasHeight: 3000"
	xr-mode-ui="XRMode: xr"
	keyboard-shortcuts="enterVR: false"
	id="main-scene"
>
	<a-entity id="objects" position="0 1.6 -0.4"> <slot /></a-entity>
	<a-entity id="cameraRig">
		<a-camera id="camera" wasd-controls="enabled: false"> </a-camera>
		<a-entity laser-controls raycaster="objects: .collidable;"></a-entity>
	</a-entity>
</a-scene>
