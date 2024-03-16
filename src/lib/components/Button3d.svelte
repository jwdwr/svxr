<script lang="ts">
	import Portal3d from './Portal3d.svelte';
	import '$lib/aframe/htmlImage/html-button';
	import { getContext } from 'svelte';

	export let label = 'Button';
	export let onClick = () => {};

	const { screenWidth, screenHeight, pixelDensity } = {
		screenHeight: 0.3,
		screenWidth: 0.5,
		pixelDensity: 1600
	};
	let x = 0,
		y = 0,
		width = 0,
		height = 0;

	let buttonElement: HTMLButtonElement;

	$: rect = buttonElement?.getBoundingClientRect();

	$: if (rect && screenWidth && screenHeight && pixelDensity) {
		console.log(rect);
		const buttonWidth = rect.width / pixelDensity;
		const buttonHeight = rect.height / pixelDensity;
		const buttonX = rect.x / pixelDensity;
		const buttonY = buttonElement.offsetTop / pixelDensity;
		console.log(buttonElement.offsetTop, buttonY);

		width = buttonWidth;
		height = buttonHeight;
		console.log({ width, height });

		x = buttonX + buttonWidth / 2 - screenWidth / 2;
		y = screenHeight / 2 - buttonY - buttonHeight / 2;
	}

	addEventListener('mousedown', (e) => {
		if (e.target.className.includes('container')) {
			console.log(e);
			onClick();
			e.stopPropagation();
		}
	});
</script>

<button class="label" bind:this={buttonElement}>
	{label}
</button>
<Portal3d>
	<a-entity
		position={`${x} ${y} -0.293`}
		html-button={`width: ${width}; height: ${height}; depth: 0.005; radiusCorner: 0.002; smoothness: 15; color: #7BC8A4; hoverColor: #fff`}
		style="--width:${width}; --height: ${height}"
		class="container"
		><div class="label">{label}</div>
	</a-entity>
</Portal3d>

<style global>
	.container {
		background-color: #7bc8a4;
		min-width: calc(var(--width) * 1600px);
		min-height: calc(var(--height) * 1600px);
		max-width: calc(var(--width) * 1600px);
		max-height: calc(var(--height) * 1600px);
		overflow: hidden;
	}
	.label {
		width: 80px;
		height: 30px;
		background-color: #7bc8a4;
		display: flex;
		place-content: center;
		place-items: center;
		font-size: 0.9em;
		border-radius: 8px;
	}
	.label:hover {
		font-weight: bold;
	}
</style>
