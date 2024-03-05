<script lang="ts">
	import Component3d from '$lib/components/Component3d.svelte';
	import Scene3d from '$lib/components/Scene3d.svelte';

	let showComponent = false;
	let is3d = false;
</script>

<button on:click={() => (is3d = !is3d)}>Toggle 3D</button>

<Scene3d {is3d}>
	<Component3d position={[0, 1.5, -1]} {is3d} height={2} width={2}>
		<div id="page">
			<p>
				This is some example text.{#if showComponent}
					Now we're showing the other component{/if}
			</p>
			<select>
				<option>Option 1</option>
				<option>Option 2</option>
				<option>Option 3</option>
			</select>
			<input type="text" placeholder="hm" />
			<button
				on:click={() => {
					console.log('clicked');
					showComponent = !showComponent;
				}}>Toggle</button
			>
		</div>
	</Component3d>
	{#if showComponent}
		<Component3d position={[0, 1.8, -0.8]} {is3d} height={0.5} width={0.5}>
			<div id="component">Extra text</div>
		</Component3d>
	{/if}
</Scene3d>

<style>
	#page {
		font-family: Arial, Helvetica, sans-serif;
		width: 500px;
		height: 500px;
		background-color: black;
		color: white;
	}

	button:hover {
		font-weight: bold;
	}

	#component {
		background-color: darkslateblue;
		color: white;
		height: 100px;
		width: 100px;
		display: flex;
		place-content: center;
		place-items: center;
	}
</style>
