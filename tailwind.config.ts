import forms from '@tailwindcss/forms';
import type { Config } from 'tailwindcss';

export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],

	theme: {
		extend: {
			zIndex: {
				'100': '100'
			}
		}
	},

	plugins: [forms],

	important: true
} satisfies Config;
