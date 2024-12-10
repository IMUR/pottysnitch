import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const globals = require('globals');

import typescript from '@typescript-eslint/eslint-plugin';
import parser from '@typescript-eslint/parser';
import prettier from 'eslint-config-prettier';
import svelte from 'eslint-plugin-svelte';

export default [
	{
		ignores: ['build/*', '.svelte-kit/*', 'node_modules/*']
	},
	{
		files: ['**/*.{js,ts}'],
		plugins: {
			'@typescript-eslint': typescript
		},
		languageOptions: {
			parser: parser,
			globals: {
				...globals.browser,
				...globals.es2021
			}
		},
		rules: {
			...typescript.configs.recommended.rules,
			...prettier.rules
		}
	},
	{
		files: ['**/*.svelte'],
		plugins: {
			svelte: svelte
		},
		processor: svelte.processors.svelte,
		languageOptions: {
			parser: require('svelte-eslint-parser'),
			parserOptions: {
				parser: parser,
				sourceType: 'module',
				ecmaVersion: 2020,
				extraFileExtensions: ['.svelte']
			}
		},
		rules: {
			...svelte.configs.recommended.rules,
			...prettier.rules,
			'svelte/valid-compile': ['error', { ignoreWarnings: true }]
		}
	}
];
