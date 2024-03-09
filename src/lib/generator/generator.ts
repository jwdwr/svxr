import { client } from '@gradio/client';

export async function generateAndRender(prompt: string): Promise<string> {
	const app = await client('hansyan/perflow-triposr', {});
	const result = await app.predict(
		'/render',
		((await app.predict('/generate', [prompt, '0'])) as { data: unknown[] }).data
	);

	return (result as { data: { url: string }[] }).data[0].url;
}
