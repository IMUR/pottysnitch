<script lang="ts">
	import maplibregl from 'maplibre-gl';
	import type { Map, LngLatLike } from 'maplibre-gl';
	import 'maplibre-gl/dist/maplibre-gl.css';

	let container: HTMLDivElement;
	let map = $state<Map | null>(null);
	let userLocation = $state<LngLatLike | null>(null);
	let isLoading = $state(true);
	let error = $state<Error | null>(null);

	let isReady = $derived(!!map && !isLoading);

	async function getUserLocation(): Promise<void> {
		if (!navigator.geolocation) {
			throw new Error('Geolocation not supported');
		}

		return new Promise((resolve, reject) => {
			navigator.geolocation.getCurrentPosition(
				(position) => {
					userLocation = [position.coords.longitude, position.coords.latitude];
					resolve();
				},
				(error) => {
					const errorMessage = {
						PERMISSION_DENIED: 'Location permission denied. Please enable location services.',
						POSITION_UNAVAILABLE: 'Location information unavailable. Please try again.',
						TIMEOUT: 'Location request timed out. Please check your connection and try again.'
					}[error.code] || error.message;

					reject(new Error(errorMessage));
				},
				{
					enableHighAccuracy: true,
					timeout: 10000,
					maximumAge: 30000
				}
			);
		});
	}

	async function initMap() {
		try {
			await getUserLocation();

			const mapInstance = new maplibregl.Map({
				container,
				style: {
					version: 8,
					sources: {
						osm: {
							type: 'raster',
							tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
							tileSize: 256,
							attribution: '© OpenStreetMap contributors'
						}
					},
					layers: [{
						id: 'osm',
						type: 'raster',
						source: 'osm',
						minzoom: 0,
						maxzoom: 19
					}]
				},
				center: userLocation ?? [0, 0],
				zoom: 15,
				minZoom: 3,
				maxZoom: 19,
				pitch: 0,
				attributionControl: false
			});

			mapInstance.addControl(new maplibregl.AttributionControl(), 'bottom-right');
			mapInstance.addControl(new maplibregl.NavigationControl(), 'top-right');

			mapInstance.on('load', () => {
				if (userLocation) {
					new maplibregl.Marker()
						.setLngLat(userLocation)
						.addTo(mapInstance);
				}
				map = mapInstance;
				isLoading = false;
			});
		} catch (err) {
			error = err instanceof Error ? err : new Error('Map initialization failed');
			isLoading = false;
		}
	}

	$effect(() => {
		console.log('Container:', container);
		if (!container) return;
		initMap();
		return () => {
			console.log('Cleaning up map');
			map?.remove();
		};
	});
</script>

<div class="relative h-screen w-full" bind:this={container}>
	{#if error}
		<div class="absolute inset-0 flex items-center justify-center bg-gray-50">
			<p class="text-red-600">{error.message}</p>
		</div>
	{:else if isLoading}
		<div class="absolute inset-0 flex items-center justify-center bg-gray-50">
			<p>Loading map...</p>
		</div>
	{/if}
</div>

<style>
	:global(.maplibregl-map) {
		height: 100%;
		width: 100%;
	}

	:global(.maplibregl-canvas-container) {
		height: 100%;
		width: 100%;
	}
</style> 