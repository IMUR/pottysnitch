import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	optimizeDeps: {
		include: ['maplibre-gl']
	},
	ssr: {
		noExternal: ['maplibre-gl']
	},
	define: {
		'import.meta.env.PUBLIC_MAPTILER_API_KEY': JSON.stringify("iCZxhJbOaaYuKNttr71A"),
		'import.meta.env.PUBLIC_GEOAPIFY_API_KEY': JSON.stringify("d65bf55763ea4818a59b44912c09c9aa")
	}
});
