import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),

	kit: {
		adapter: adapter({
			fallback: '404.html',
			strict: false
		}),
		paths: {
			base: process.env.NODE_ENV === 'production' ? '/pottysnitch' : ''
		},
		appDir: 'app',
		prerender: {
			handleMissingId: 'ignore',
			entries: ['*', '/api/locations']
		}
	},

	compilerOptions: {
		dev: true,
		enableSourcemap: true
	}
};

export default config;
