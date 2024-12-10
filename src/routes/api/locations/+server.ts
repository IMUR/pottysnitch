import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { writeFile, mkdir, readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';

export const prerender = true;

export const GET: RequestHandler = async () => {
	return new Response(
		JSON.stringify({
			locations: [] // or some default static data
		}),
		{
			headers: {
				'content-type': 'application/json'
			}
		}
	);
};

export const POST: RequestHandler = async ({ request }) => {
	try {
		const location = await request.json();

		const dataPath = join(process.cwd(), 'data', 'locations.json');

		await mkdir(dirname(dataPath), { recursive: true });

		let locations = [];
		try {
			const existing = await readFile(dataPath, 'utf-8');
			locations = JSON.parse(existing);
		} catch {
			// File doesn't exist yet, use empty array
		}

		locations.push(location);

		await writeFile(dataPath, JSON.stringify(locations, null, 2));

		return json({ success: true });
	} catch {
		console.error('Failed to save location:');
		return json({ error: 'Failed to save location' }, { status: 500 });
	}
};
