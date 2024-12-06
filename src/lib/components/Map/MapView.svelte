<script lang="ts">
	import maplibregl from 'maplibre-gl';
	import type { Map, LngLatLike } from 'maplibre-gl';
	import 'maplibre-gl/dist/maplibre-gl.css';

	interface MapViewProps {
		userLocation: { longitude: number; latitude: number } | null;
	}

	let props = $props();
	let { userLocation } = props satisfies MapViewProps;

	let container: HTMLDivElement;
	let map = $state<Map | null>(null);
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
			if (!import.meta.env.PUBLIC_MAPTILER_API_KEY) {
				throw new Error('MapTiler API key is missing');
			}

			await getUserLocation();

			const mapInstance = new maplibregl.Map({
				container,
				style: `https://api.maptiler.com/maps/streets/style.json?key=${import.meta.env.PUBLIC_MAPTILER_API_KEY}`,
				center: userLocation || [-74.5, 40],
				zoom: 13,
				antialias: true,
				preserveDrawingBuffer: true
			});

			map = mapInstance;

			if (userLocation) {
				new maplibregl.Marker()
					.setLngLat(userLocation)
					.addTo(mapInstance);
			}

			mapInstance.on('load', () => {
				isLoading = false;
				
				if (userLocation) {
					mapInstance.flyTo({
						center: userLocation,
						zoom: 13,
						essential: true
					});
				}
			});

			mapInstance.addControl(new maplibregl.NavigationControl(), 'top-right');
			mapInstance.addControl(new maplibregl.GeolocateControl({
				positionOptions: {
					enableHighAccuracy: true
				},
				trackUserLocation: true
			}), 'top-right');
			mapInstance.addControl(new maplibregl.ScaleControl(), 'bottom-left');
		} catch (err) {
			error = err instanceof Error ? err : new Error('Map initialization failed');
			isLoading = false;
		}
	}

	$effect(() => {
		if (!container) return;
		console.log('Container mounted, initializing map...');
		initMap();
		
		return () => {
			console.log('Cleaning up map...');
			if (map) console.log('Map state before cleanup:', $state.snapshot(map));
			map?.remove();
		};
	});
</script>

<div class="relative w-full h-full" bind:this={container}>
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
		position: absolute;
		inset: 0;
	}
</style> 