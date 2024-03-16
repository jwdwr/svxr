<script lang="ts">
	import Component3d from '$lib/components/Component3d.svelte';
	import Scene3d from '$lib/components/Scene3d.svelte';
	import { generateAndRender } from '$lib/generator/generator';
	import { onMount } from 'svelte';
	import Microphone from 'virtual:icons/lucide/mic';
	import '$lib/aframe/depthImage/depth-image';
	import Button3d from '$lib/components/Button3d.svelte';

	let showComponent = false;
	let is3d = true;

	let text: string = '';
	let speaking = false;

	let pagePosition: [number, number, number] = [0, 0, -0.3];
	/*
	onMount(() => {
		const scene = document.querySelector('a-scene');
		const camera = document.getElementById('camera')!;
		const page = document.getElementById('page')!;

		setTimeout(() => {
			const cameraPosition = camera.object3D.position;
			console.log('enter', cameraPosition);

			const pagePos = {
				x: cameraPosition!.x,
				y: cameraPosition!.y,
				z: cameraPosition!.z - 0.3
			};

			page.setAttribute('position', pagePos);
		});
		scene.addEventListener('enter-vr', function () {
			setTimeout(() => {
				const cameraPosition = camera.object3D.position;
				console.log('enter', cameraPosition);

				const pagePos = {
					x: cameraPosition!.x,
					y: cameraPosition!.y,
					z: cameraPosition!.z - 0.3
				};

				page.setAttribute('position', pagePos);
			}, 1000);
		});
	});
*/
	let objUrl: string | undefined = undefined;
	async function generate() {
		objUrl = await generateAndRender(text);
		showComponent = !showComponent;
		console.log('clicked', showComponent);
	}

	async function getTranscribeToken(): Promise<string> {
		const response = await fetch('/api/transcribe/token', {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json'
			}
		});
		const { data } = (await response.json()) as { data: string };
		return data;
	}

	async function speak() {
		speaking = true;
		const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

		const token = await getTranscribeToken();
		const mediaRecorder = new MediaRecorder(stream);
		const socket = new WebSocket('wss://api.deepgram.com/v1/listen', ['token', token]);

		socket.onmessage = (message) => {
			const received = JSON.parse(message.data);
			const transcript = received.channel.alternatives[0].transcript;
			if (transcript && received.is_final) {
				text = transcript;
				mediaRecorder.stop();
				socket.close();
				speaking = false;
			}
		};

		socket.onerror = (error) => {
			console.error(error);
		};

		mediaRecorder.addEventListener('dataavailable', (event) => {
			if (event.data.size > 0 && socket.readyState == 1) {
				socket.send(event.data);
			}
		});
		mediaRecorder.start(250);
	}
</script>

<button on:click={() => (is3d = !is3d)}>Toggle 3D</button>

<Scene3d {is3d}>
	{#if objUrl}
		<a-entity
			obj-model={`obj: url(${objUrl})`}
			position="0 1.5 -0.5"
			rotation="0 180 0"
			scale="0.5 0.5 0.5"
		></a-entity>
	{/if}
	{#if showComponent}
		<Component3d position={[0, 0, -0.2]} {is3d} height={0.1} width={0.1} draggable>
			<div id="component">test outer</div>
		</Component3d>
	{/if}
	<Component3d position={pagePosition} {is3d} height={0.3} width={0.5} id="page">
		<div id="page">
			<p>What do you want to see?</p>
			<div class="speak-input">
				<div class="input" contenteditable bind:innerText={text}></div>
				<button class="speak" class:speaking on:click={speak}><Microphone /></button>
			</div>
			<Button3d onClick={generate} label="Click"></Button3d>
		</div>
	</Component3d>
</Scene3d>

<style>
	#page {
		font-family: Arial, Helvetica, sans-serif;
		background-color: black;
		color: white;
		height: 100%;
		padding: 8px;
	}

	#component {
		background-color: darkslateblue;
		color: white;
		height: 100%;
		display: flow-root;
		display: flex;
		place-content: center;
		place-items: center;
	}

	.speak-input {
		position: relative;
		width: fit-content;
	}

	.speak {
		position: absolute;
		right: 0;
		top: -2px;
		border: none;
		cursor: pointer;
		border-radius: 999em;
		height: 32px;
		width: 32px;
		display: flex;
		place-content: center;
		place-items: center;
		background-color: transparent;
		&:hover {
			background-color: rgba(0, 0, 0, 0.5);
		}
	}

	.speak.speaking {
		background-color: rgba(0, 0, 0, 0.5);

		color: green;
	}
	.input {
		border: 1px solid #000000;
		color: black;
		min-width: 160px;
		width: fit-content;
		margin: 0;
		padding: 4px;
		background-color: #ffffff;
		-webkit-appearance: none;
	}
</style>
