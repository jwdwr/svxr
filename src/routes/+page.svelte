<script lang="ts">
	import Component3d from '$lib/components/Component3d.svelte';
	import Scene3d from '$lib/components/Scene3d.svelte';
	import { generateAndRender } from '$lib/generator/generator';
	import { onMount } from 'svelte';
	import Microphone from 'virtual:icons/lucide/mic';
	import '$lib/aframe/depthImage/depth-image';
	import '$lib/aframe/spin/spin';
	import Button3d from '$lib/components/Button3d.svelte';

	let loading = false;
	let is3d = false;

	let text: string = 'Enter prompt';
	let speaking = false;

	let pagePosition: [number, number, number] = [0, 0, -0.3];

	onMount(() => {
		const scene = document.querySelector('a-scene');
		const camera = document.getElementById('camera')!;
		const page = document.getElementById('objects')!;

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

	let objUrl: string | undefined = undefined;
	async function generate() {
		if (!is3d) {
			return alert('Please enter 3D mode to generate an object');
		}
		loading = true;
		objUrl = await generateAndRender(text);
		loading = false;
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

	document.addEventListener('a-keyboard-update', (e) => {
		console.log(e);
		text += e.detail.value;
	});

	let showKeyboard = false;
	let inputActive = false;

	const startInput = () => {
		text = '';
		showKeyboard = true;
		inputActive = true;
	};

	const toggle3d = () => {
		is3d = !is3d;
		const scene = document.querySelector('a-scene');
		if (!is3d) {
			scene.exitVR();
		}
	};
</script>

<div class="page">
	<Scene3d {is3d}>
		{#if is3d && showKeyboard}
			<a-entity
				id="keyboard"
				a-keyboard
				position="-0.19 -0.15 -0.25"
				scale="0.8 0.8 0.8"
				rotation="-20 0 0"
			></a-entity>
		{/if}
		{#if objUrl}
			<a-entity
				obj-model={`obj: url(${objUrl})`}
				position="0.11 0.05 -0.2"
				rotation="0 180 0"
				scale="0.05 0.05 0.05"
				spin
			></a-entity>
		{/if}
		<Component3d position={pagePosition} {is3d} height={0.3} width={0.5} id="page">
			<div id="page">
				<div class="mesh">
					<div class="mesh-generator">
						<div>Generate an object</div>
						<div class="speak-input">
							<div
								class="input"
								on:click={startInput}
								contenteditable
								bind:innerText={text}
								class:inputActive
							>
								<span>|</span>
							</div>
							<!--<button class="speak" class:speaking on:click={speak}><Microphone /></button>-->
						</div>
						<Button3d {is3d} onClick={generate} label="Generate"></Button3d>
					</div>
					<div class="mesh-arrow">→</div>
					<div class="mesh-display">
						<div class="mesh-message">
							{#if !objUrl}
								Your object will appear here
							{/if}
						</div>
					</div>
				</div>
				<div class="bottom">
					<button on:click={toggle3d} class="button-3d">
						{#if !is3d}Enter{:else}Exit{/if} 3D
					</button>
				</div>
			</div>
		</Component3d>
		{#if loading}
			<Component3d position={[0, -0.05, -0.2]} {is3d} height={0.05} width={0.1} draggable>
				<div id="component">Loading...</div>
			</Component3d>
		{/if}
	</Scene3d>
</div>

<style>
	:global(body) {
		margin: 0;
		padding: 0;
		height: 100vh;
	}

	.page {
		display: flex;
		place-content: center;
		place-items: center;
		background-color: #eee;
		height: 100vh;
	}
	#page {
		font-family: Arial, Helvetica, sans-serif;
		background-color: black;
		color: white;
		height: 100%;
		padding: 8px;
		display: flex;
		flex-direction: column;
		gap: 64px;
		place-items: center;
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

	.mesh,
	.bottom {
		display: flex;
		height: 200px;
		justify-content: space-between;
		width: 100%;
	}

	.bottom {
		display: flex;
		place-content: center;
		place-items: center;
	}

	.mesh-generator {
		width: 200px;
		display: flex;
		flex-direction: column;
		gap: 16px;
		place-content: center;
		place-items: center;
		height: 200px;
		padding: 16px;
	}

	.mesh-arrow {
		display: flex;
		place-content: center;
		place-items: center;
		font-size: 5em;
		width: 200px;
	}

	.mesh-display {
		height: 160px;
		width: 200px;
		padding: 16px;
		display: flex;
		text-align: center;
	}

	.mesh-message {
		border: 1px solid white;
		width: 100%;
		height: 100%;
		display: flex;
		place-content: center;
		padding: 16px;
		place-items: center;
		text-align: center;
		border-radius: 8px;
	}

	.input {
		border: 1px solid #fff;
		color: white;
		min-width: 160px;
		width: fit-content;
		margin: 0;
		padding: 4px;
		background-color: black;
		border-radius: 8px;
		-webkit-appearance: none;
		text-align: center;
	}

	.inputActive {
		border: 1px solid #7bc8a4;
	}

	.button-3d {
		background-color: aqua;
		border: none;
		padding: 16px;
		border-radius: 4px;
		font-size: 1.5em;
	}

	.button-3d:hover {
		background-color: aquamarine;
		cursor: pointer;
	}
</style>
