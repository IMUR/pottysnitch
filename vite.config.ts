import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	build: {
		sourcemap: true
	},
	optimizeDeps: {
		include: ['maplibre-gl']
	},
	ssr: {
		noExternal: ['maplibre-gl']
	},
	define: {
		'import.meta.env.PUBLIC_MAPTILER_API_KEY': JSON.stringify(
			process.env.VITE_PUBLIC_MAPTILER_API_KEY
		),
		'import.meta.env.PUBLIC_GEOAPIFY_API_KEY': JSON.stringify(
			process.env.VITE_PUBLIC_GEOAPIFY_API_KEY
		),
		'process.env.NODE_ENV': JSON.stringify('development')
	}
});
