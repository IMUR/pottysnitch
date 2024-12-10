import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const prerender = true;

// Static GET endpoint for prerendering
export const GET: RequestHandler = async () => {
	return json({ locations: [] });
};
