import { json, type RequestHandler } from '@sveltejs/kit';
// import { createClient } from '@deepgram/sdk';
// import { DEEPGRAM_API_KEY, DEEPGRAM_PROJECT_ID } from '$env/static/private';

export const GET: RequestHandler = async () => {
	try {
		throw new Error('Not implemented');
		/*
		if (process.env.NODE_ENV !== 'production') {
			return json({ data: DEEPGRAM_API_KEY }, { status: 200 });
		}

		const deepgram = createClient(DEEPGRAM_API_KEY);

		const { result, error } = await deepgram.manage.createProjectKey(DEEPGRAM_PROJECT_ID, {
			time_to_live_in_seconds: 10,
			comment: 'Transcription key',
			scopes: ['usage:write']
		});
*/
		if (result) {
			return json({ data: result.key }, { status: 200 });
		} else if (error) {
			throw new Error(error.message);
		} else {
			throw new Error('Unknown error');
		}
	} catch (e) {
		console.error(e);
		return json({ error: 'Error creating transcription key' }, { status: 500 });
	}
};
