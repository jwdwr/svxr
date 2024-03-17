<script lang="ts">
	import '$lib/aframe/keyboard/aframe-keyboard.min.js';
	export let is3d = false;
</script>

{#if is3d}
	<a-scene
		renderer="maxCanvasWidth: 3000; maxCanvasHeight: 3000"
		xr-mode-ui="XRMode: xr"
		keyboard-shortcuts="enterVR: false"
		id="main-scene"
	>
		<a-entity id="objects" position="0 1.6 0"> <slot /></a-entity>
		<a-entity id="cameraRig">
			<a-camera id="camera" wasd-controls="enabled: false"> </a-camera>
			<a-entity id="mouseCursor" cursor="rayOrigin: mouse" raycaster="objects: .collidable"
			></a-entity>
			<a-entity laser-controls raycaster="objects: .collidable;"></a-entity>
		</a-entity>
	</a-scene>
{:else}
	<slot />
{/if}
