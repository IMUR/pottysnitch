// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
	interface ImportMetaEnv {
		PUBLIC_GEOAPIFY_API_KEY: string;
		PUBLIC_MAPTILER_API_KEY: string;
	}
}

export {};
