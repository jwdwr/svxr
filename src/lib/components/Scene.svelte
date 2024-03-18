<script lang="ts">
	import Scene3d from './Scene3d.svelte';
	export let is3d = false;
</script>

{#if is3d}
	<Scene3d><slot /></Scene3d>
{:else}
	<slot />
{/if}
