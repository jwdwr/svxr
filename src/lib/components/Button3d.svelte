<script lang="ts">
	import { onMount } from 'svelte';
	import type { Scene } from 'aframe';
	import Portal3d from './Portal3d.svelte';
	import '$lib/aframe/textbox/textbox';

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
		rounded-box="width: 0.035; height: 0.01; depth: 0.005;radiusCorner: 0.001; smoothness: 15; color: #7BC8A4"
	></a-entity>
	<a-text position="-0.22 0.084 -0.285" width="0.2" wrapCount="10" align="center" value={label}
	></a-text></Portal3d
>

<style global>
	button:hover {
		font-weight: bold;
	}
</style>
