<script lang="ts">
	export let is3d = false;
</script>

{#if is3d}
	<a-scene>
		<slot />

		<a-entity id="cameraRig">
			<a-camera id="camera"> </a-camera>
			<a-entity id="mouseCursor" cursor="rayOrigin: mouse" raycaster="objects: .screen"></a-entity>
			<a-entity laser-controls raycaster="objects: .screen;"></a-entity>
		</a-entity>
	</a-scene>
{:else}
	<slot />
{/if}
