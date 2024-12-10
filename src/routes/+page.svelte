<script lang="ts">
	import MapView from '../lib/components/Map/MapView.svelte';
	import LocationSearch from '../lib/components/Search/LocationSearch.svelte';

	let userLocation = $state<{ longitude: number; latitude: number } | null>(null);
	let isLocating = $state(false);
	let isBrowser = $state(false);

	const defaultLocation = {
		longitude: -118.2437,
		latitude: 34.0522
	};

	console.log('Page script initializing...');

	// Set initial location to default
	userLocation = defaultLocation;

	// Check for browser environment
	$effect(() => {
		console.log('Checking browser environment...');
		isBrowser = typeof window !== 'undefined';
		console.log('isBrowser:', isBrowser);
	});

	async function requestLocation() {
		console.log('Location request initiated');
		if (isLocating || !isBrowser) return;
		isLocating = true;

		try {
			const position = await new Promise<GeolocationPosition>((resolve, reject) => {
				navigator.geolocation.getCurrentPosition(resolve, reject, {
					timeout: 5000,
					maximumAge: 30000
				});
			});

			userLocation = {
				longitude: position.coords.longitude,
				latitude: position.coords.latitude
			};
			console.log('Location updated:', userLocation);
		} catch (error) {
			console.warn('Geolocation failed:', error);
		} finally {
			isLocating = false;
		}
	}
</script>

<div class="relative h-screen w-full">
	<MapView {userLocation} />
	<div class="absolute left-1/2 top-4 z-10 -translate-x-1/2">
		<LocationSearch {userLocation} />
	</div>
	{#if isBrowser && !isLocating}
		<button
			class="absolute bottom-4 right-4 z-10 rounded-lg bg-white px-4 py-2 shadow-lg hover:bg-gray-100"
			onclick={requestLocation}
		>
			Use My Location
		</button>
	{/if}
</div>
