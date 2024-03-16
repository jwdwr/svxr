<script lang="ts">
	import { onMount } from 'svelte';
	import type { Scene } from 'aframe';
	import Portal3d from './Portal3d.svelte';
	import '$lib/aframe/htmlImage/html-button';

	export let label = 'Button';

	let buttonElement: HTMLButtonElement;

	$: console.log('button', buttonElement?.getBoundingClientRect());

	let aScene: Scene | null = null;
	onMount(() => {
		aScene = document.querySelector('a-scene');
	});
</script>

<Portal3d>
	<a-entity
		position="-0.22 0.085 -0.29"
		html-button="width: 0.035; height: 0.01; depth: 0.005; radiusCorner: 0.003; smoothness: 15; color: #7BC8A4; hoverColor: #fff"
		style="--width:0.035; --height:0.01"
		><div class="label">{label}</div>
	</a-entity>
</Portal3d>

<style global>
	.label {
		background-color: #7bc8a4;
		width: calc(var(--width) * 1600px);
		height: calc(var(--height) * 1600px);
		max-width: calc(var(--width) * 1600px);
		max-height: calc(var(--height) * 1600px);
		overflow: hidden;
		display: flex;
		place-content: center;
		place-items: center;
	}
	.label:hover {
		font-weight: bold;
	}
</style>
