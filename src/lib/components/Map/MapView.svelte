<script lang="ts">
	import maplibregl from 'maplibre-gl';
	import type { Map, LngLatLike } from 'maplibre-gl';
	import 'maplibre-gl/dist/maplibre-gl.css';
	import type { ILocationSubmission } from '$lib/types/location';

	interface MapViewProps {
		userLocation: { longitude: number; latitude: number } | null;
	}

	let props = $props();
	let { userLocation } = props satisfies MapViewProps;

	let container: HTMLDivElement;
	let map = $state<Map | null>(null);
	let isLoading = $state(true);
	let error = $state<Error | null>(null);
	let locations = $state<ILocationSubmission[]>([]);
	let mapLoaded = $state(false);

	let isReady = $derived(!!map && !isLoading);

	// Watch for both map loaded state and user location
	$effect(() => {
		if (!map || !mapLoaded || !userLocation) return;
		
		// Add/update user location marker
		new maplibregl.Marker({ 
			color: '#4A90E2',
			scale: 1.2
		})
		.setLngLat([userLocation.longitude, userLocation.latitude])
		.setPopup(new maplibregl.Popup({ offset: 25 })
			.setHTML('<div class="p-2"><strong>Your Location</strong></div>'))
		.addTo(map);

		// Fly to user location
		map.flyTo({
			center: [userLocation.longitude, userLocation.latitude],
			zoom: 13,
			essential: true
		});
	});

	async function fetchLocations() {
		try {
			const response = await fetch('/api/locations');
			if (!response.ok) throw new Error('Failed to fetch locations');
			locations = await response.json();
		} catch (err) {
			console.error('Error fetching locations:', err);
			error = err instanceof Error ? err : new Error('Failed to fetch locations');
		}
	}

	async function initMap() {
		if (!container) return;

		try {
			// Always start with a default view
			const mapInstance = new maplibregl.Map({
				container,
				style: `https://api.maptiler.com/maps/streets/style.json?key=${import.meta.env.PUBLIC_MAPTILER_API_KEY}`,
				center: [-118.2437, 34.0522], // Los Angeles default
				zoom: 10
			});

			map = mapInstance;

			mapInstance.on('load', () => {
				isLoading = false;
				mapLoaded = true;
			});

			// Add location markers
			locations.forEach(location => {
				const marker = new maplibregl.Marker({ 
					color: '#FF0000',
					scale: 1
				})
				.setLngLat([location.properties.lon, location.properties.lat])
				.addTo(mapInstance);

				const popup = new maplibregl.Popup({ offset: 25 })
					.setHTML(`
						<div class="p-2">
							<h3 class="font-bold">${location.properties.name || 'Unnamed Location'}</h3>
							<p class="text-sm">${location.properties.formatted}</p>
							${location.properties.doorCode ? `
								<p class="text-sm mt-2">
									<span class="font-semibold">Door Code:</span> ${location.properties.doorCode}
								</p>
							` : ''}
						</div>
					`);

				marker.setPopup(popup);
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
		
		fetchLocations().then(() => {
			console.log('Locations fetched, initializing map...');
			initMap();
		});
		
		return () => {
			console.log('Cleaning up map...');
			map?.remove();
		};
	});
</script>

<div 
	bind:this={container} 
	class="w-full h-full cursor-default select-none"
>
	{#if isLoading}
		<div class="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-50">
			<div class="text-lg">Loading map...</div>
		</div>
	{/if}

	{#if error}
		<div class="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-50">
			<div class="text-red-500 p-4 bg-white rounded shadow">
				<p class="font-bold">Error loading map:</p>
				<p>{error.message}</p>
			</div>
		</div>
	{/if}
</div>

<style>
	:global(.maplibregl-popup-content) {
		@apply rounded-lg shadow-lg;
	}

	:global(.maplibregl-canvas-container) {
		cursor: grab;
	}

	:global(.maplibregl-canvas-container:active) {
		cursor: grabbing;
	}

	:global(.maplibregl-marker) {
		cursor: pointer;
	}

	:global(.maplibregl-popup-close-button) {
		@apply p-1;
	}
</style> 