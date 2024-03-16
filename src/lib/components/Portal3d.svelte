<script lang="ts">
	import { onMount, onDestroy } from 'svelte';

	let ref: HTMLElement;

	let mounted = false;

	onMount(() => {
		const scene = document.querySelector('#objects');
		if (scene) {
			scene.insertBefore(ref, null);
			mounted = true;
		}
	});

	onDestroy(() => {
		if (ref?.parentNode) {
			ref.parentNode?.removeChild(ref);
		}
	});
</script>

<a-entity class="portal">
	<a-entity bind:this={ref}>
		{#if mounted}
			<slot />
		{/if}
	</a-entity>
</a-entity>
