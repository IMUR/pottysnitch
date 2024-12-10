<script lang="ts">
	import MapView from '../lib/components/Map/MapView.svelte';
	import LocationSearch from '../lib/components/Search/LocationSearch.svelte';

	let userLocation = $state<{ longitude: number; latitude: number } | null>(null);

	$effect(() => {
		if (userLocation) return;

		if (!navigator.geolocation) {
			console.error('Geolocation not supported');
			return;
		}

		navigator.geolocation.getCurrentPosition(
			(position) => {
				userLocation = {
					longitude: position.coords.longitude,
					latitude: position.coords.latitude
				};
			},
			(error) => {
				console.error('Failed to get user location:', error);
			},
			{
				enableHighAccuracy: true,
				timeout: 10000,
				maximumAge: 30000
			}
		);
	});
</script>

<div class="relative h-full">
	<MapView {userLocation} />
	<div class="absolute left-1/2 top-4 z-10 -translate-x-1/2">
		<LocationSearch {userLocation} />
	</div>
</div>
