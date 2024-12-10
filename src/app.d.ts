/// <reference types="vite/client" />

declare global {
	interface ImportMetaEnv extends Partial<ImportMetaEnv> {
		readonly VITE_PUBLIC_GEOAPIFY_API_KEY: string;
		readonly VITE_PUBLIC_MAPTILER_API_KEY: string;
	}

	interface ImportMeta {
		readonly env: ImportMetaEnv;
	}
}

export {};
