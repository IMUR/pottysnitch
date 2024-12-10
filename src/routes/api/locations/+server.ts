import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { writeFile, mkdir, readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import type { ILocationSubmission } from '$lib/types/location';

export const prerender = true;

export const GET: RequestHandler = async () => {
	try {
		const dataPath = join(process.cwd(), 'data', 'locations.json');

		try {
			const existing = await readFile(dataPath, 'utf-8');
			const locations: ILocationSubmission[] = JSON.parse(existing);
			return json(locations);
		} catch {
			// File doesn't exist yet, return empty array
			return json([]);
		}
	} catch {
		console.error('Failed to fetch locations:');
		return json({ error: 'Failed to fetch locations' }, { status: 500 });
	}
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
