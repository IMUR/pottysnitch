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

	async function getIPLocation() {
		try {
			const response = await fetch(
				`https://api.geoapify.com/v1/ipinfo?apiKey=${import.meta.env.VITE_PUBLIC_GEOAPIFY_API_KEY}`
			);
			const data = await response.json();
			return {
				longitude: data.location.longitude,
				latitude: data.location.latitude
			};
		} catch (err) {
			console.warn('IP location failed:', err);
			return defaultLocation;
		}
	}

	async function requestLocation() {
		if (isLocating || userLocation) return;
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
		} catch (error) {
			console.warn('Browser geolocation failed, using IP location');
			userLocation = await getIPLocation();
		} finally {
			isLocating = false;
		}
	}

	// Check for browser environment
	$effect(() => {
		isBrowser = typeof window !== 'undefined';
	});

	// Initial location setup
	$effect(() => {
		if (!userLocation) {
			getIPLocation().then((location) => {
				userLocation = location;
			});
		}
	});
</script>

<div class="relative h-full">
	<MapView {userLocation} />
	<div class="absolute left-1/2 top-4 z-10 -translate-x-1/2">
		<LocationSearch {userLocation} />
	</div>
	{#if isBrowser && !isLocating && typeof navigator !== 'undefined' && navigator.geolocation}
		<button
			class="absolute bottom-4 right-4 z-10 rounded-lg bg-white px-4 py-2 shadow-lg hover:bg-gray-100"
			onclick={requestLocation}
		>
			Use My Location
		</button>
	{/if}
</div>
