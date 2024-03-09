<script lang="ts">
	import 'aframe';
	import '../renderer/aframe-htmlembed-component';
	import '../dragger/aframe-drag-drop';
	export let is3d = false;

	export let position: [number, number, number] = [0, 0, 0];
	export let width = 1;
	export let height = 1;
	export let draggable = false;

	const dragndrop = draggable ? 'dragndrop' : undefined;

	const [x, y, z] = position;
</script>

{#if is3d}
	<a-entity position={`${x} ${y} ${z}`} {dragndrop}>
		<a-box
			depth="0.03"
			id="plane"
			position={`0 0 -0.03001`}
			{width}
			{height}
			color="#7BC8A4"
			opacity="0.5"
		/>
		<a-entity class="screen" htmlembed="ppu: 1500">
			<slot />
		</a-entity>
	</a-entity>
{:else}
	<div class="screen">
		<slot />
	</div>
{/if}

<style global>
	input,
	select,
	textarea {
		border: 1px solid #000000;
		margin: 0;
		background-color: #ffffff;
		-webkit-appearance: none;
	}
	:-webkit-autofill {
		color: #fff !important;
	}
	input[type='checkbox'] {
		width: 20px;
		height: 20px;
		display: inline-block;
	}
	input[type='radio'] {
		width: 20px;
		height: 20px;
		display: inline-block;
		border-radius: 50%;
	}
	input[type='checkbox'][checked],
	input[type='radio'][checked] {
		background-color: #555555;
	}
	a-entity[htmlembed] img {
		display: inline-block;
	}
	a-entity[htmlembed] {
		display: none;
	}
</style>
