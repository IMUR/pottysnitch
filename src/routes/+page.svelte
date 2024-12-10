<script lang="ts">
	import MapView from '../lib/components/Map/MapView.svelte';
	import LocationSearch from '../lib/components/Search/LocationSearch.svelte';

	let userLocation = $state<{ longitude: number; latitude: number } | null>(null);

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

	$effect(() => {
		async function fetchLocation() {
			if (userLocation) return;

			if (!navigator.geolocation) {
				console.warn('Geolocation not supported, using IP location');
				userLocation = await getIPLocation();
				return;
			}

			try {
				const position = await new Promise<GeolocationPosition>((resolve, reject) => {
					navigator.geolocation.getCurrentPosition(resolve, reject, {
						enableHighAccuracy: false,
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
			}
		}

		fetchLocation();
	});
</script>

<div class="relative h-full">
	<MapView {userLocation} />
	<div class="absolute left-1/2 top-4 z-10 -translate-x-1/2">
		<LocationSearch {userLocation} />
	</div>
</div>
