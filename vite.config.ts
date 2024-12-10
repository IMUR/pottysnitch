import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { fileURLToPath, URL } from 'url';

export default defineConfig({
	plugins: [sveltekit()],
	build: {
		sourcemap: true
	},
	optimizeDeps: {
		include: ['maplibre-gl']
	},
	envPrefix: 'VITE_PUBLIC_',
	ssr: {
		noExternal: ['maplibre-gl']
	},
	resolve: {
		alias: {
			$lib: fileURLToPath(new URL('./src/lib', import.meta.url))
		}
	},
	// Enable dev tools and source maps
	define: {
		'process.env.NODE_ENV': '"development"',
		'import.meta.env.DEV': 'true'
	}
});
