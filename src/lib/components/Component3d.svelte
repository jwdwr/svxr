<script lang="ts">
	import 'aframe';
	import '../aframe/htmlImage/html-image';
	import '../aframe/draggable/draggable';
	import '../aframe/roundedBox/rounded-box';
	import Portal3d from './Portal3d.svelte';
	export let is3d = false;

	export let position: [number, number, number] = [0, 0, 0];
	export let width = 1;
	export let height = 1;
	export let draggable = false;
	export let id = '';

	const draggableComponent = draggable ? 'draggable' : undefined;

	const [x, y, z] = position;
</script>

{#if is3d}
	<Portal3d>
		<a-entity position={`${x} ${y} ${z}`} {draggableComponent} {id}>
			<a-entity
				rounded-box={`width: ${width + 0.02}; height: ${height + 0.02}; depth: 0.02; radiusCorner: 0.015; smoothness: 15; color: #7BC8A4`}
				id="plane"
				position={`0 0 -0.01`}
				opacity="0.5"
			/>
			<a-entity
				class="screen"
				html-image="width:{width}; height:{height}; depth: 0.01; radiusCorner: 0.01; smoothness: 15; color: #7BC8A4"
				style="--width:{width}; --height:{height}"
			>
				<slot />
			</a-entity>
		</a-entity>
	</Portal3d>
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
		width: calc(var(--width) * 1600px);
		height: calc(var(--height) * 1600px);
		max-width: calc(var(--width) * 1600px);
		max-height: calc(var(--height) * 1600px);
		background-color: transparent;
		border-radius: 16px;
		overflow: hidden;
	}

	.content {
		height: 100%;
		display: flow-root;
	}
</style>
