<script lang="ts">
	import 'aframe';
	import '../aframe/aframe-htmlembed-component';
	import '../aframe/aframe-drag-drop';
	import '../aframe/rounded-box';
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
		<a-entity
			rounded-box={`width: ${width + 0.05}; height: ${height + 0.05}; depth: 0.02; radiusCorner: 0.07; smoothness: 15`}
			id="plane"
			position={`0 0 -0.01`}
			color="#7BC8A4"
			opacity="0.5"
		/>
		<a-entity
			class="screen"
			htmlembed="width:{width}; height:{height}; depth: 0.01"
			{width}
			{height}
			style="--width:{width}; --height:{height}; depth: 0.01"
		>
			<slot />
		</a-entity>
	</a-entity>
{:else}
	<div class="screen" style="--width:{width}; --height:{height}">
		<div class="content">
			<slot />
		</div>
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

	.screen {
		width: calc(var(--width) * 600px);
		height: calc(var(--height) * 600px);
		max-width: calc(var(--width) * 600px);
		max-height: calc(var(--height) * 600px);
		background-color: transparent;
		border-radius: 16px;
		overflow: hidden;
	}

	.content {
		height: 100%;
		display: flow-root;
	}
</style>
