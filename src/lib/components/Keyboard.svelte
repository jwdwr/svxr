<script lang="ts">
	import { onMount } from 'svelte';
	import Portal3d from './Portal3d.svelte';
	import '$lib/aframe/keyboard/aframe-keyboard.min.js';

	export let onKeyPress = (e: Event) => {};

	onMount(() => document.addEventListener('a-keyboard-update', onKeyPress));
</script>

<Portal3d>
	<a-entity id="keyboard" a-keyboard scale="0.8 0.8 0.8" position="-0.2 -0.18 0" rotation="-20 0 0"
	></a-entity></Portal3d
>
