<script lang="ts">
	import maplibregl from 'maplibre-gl';
	import type { Map } from 'maplibre-gl';
	import type { ILocationSubmission } from '../../types/location';

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

	let activePopup: maplibregl.Popup | null = $state(null);

	$effect(() => {
		if (!map) return;

		map.on('click', () => {
			activePopup?.remove();
			activePopup = null;
		});
	});

	$effect(() => {
		if (!container || !userLocation) return;

		isLoading = true;

		fetchLocations()
			.then(() => {
				console.log('Locations fetched, initializing map...');

				try {
					const mapInstance = new maplibregl.Map({
						container,
						style: `https://api.maptiler.com/maps/streets/style.json?key=${import.meta.env.VITE_PUBLIC_MAPTILER_API_KEY}`,
						center: [userLocation.longitude, userLocation.latitude],
						zoom: 13
					});

					mapInstance.on('error', (e) => {
						console.error('Map error:', e);
						error = new Error(e.error?.message || 'Map error occurred');
						isLoading = false;
					});

					map = mapInstance;

					mapInstance.on('load', () => {
						console.log('Map loaded successfully');
						isLoading = false;

						addLocationMarkers();
						addUserMarker();

						mapInstance.addControl(new maplibregl.NavigationControl(), 'top-right');
						mapInstance.addControl(
							new maplibregl.GeolocateControl({
								positionOptions: {
									enableHighAccuracy: true
								},
								trackUserLocation: true
							}),
							'top-right'
						);
						mapInstance.addControl(new maplibregl.ScaleControl(), 'bottom-left');
					});
				} catch (err) {
					console.error('Error initializing map:', err);
					error = err instanceof Error ? err : new Error('Failed to initialize map');
					isLoading = false;
				}
			})
			.catch((err) => {
				console.error('Error in map initialization chain:', err);
				error = err instanceof Error ? err : new Error('Failed to initialize map');
				isLoading = false;
			});

		return () => {
			console.log('Cleaning up map...');
			map?.remove();
		};
	});

	async function fetchLocations() {
		try {
			console.log('Fetching locations...');
			const response = await fetch('/api/locations');
			if (!response.ok) throw new Error('Failed to fetch locations');
			locations = await response.json();
			console.log('Locations fetched:', locations);
		} catch (err) {
			console.error('Error fetching locations:', err);
			error = err instanceof Error ? err : new Error('Failed to fetch locations');
			isLoading = false;
		}
	}

	function addLocationMarkers() {
		if (!map || !locations.length) return;

		locations.forEach((location) => {
			const marker = new maplibregl.Marker();
			marker.setLngLat([location.properties.lon, location.properties.lat]).setPopup(
				new maplibregl.Popup({ offset: 25 }).setHTML(
					`<div class="p-2">
							<strong>${location.properties.name}</strong>
							<p>${location.properties.formatted}</p>
						</div>`
				)
			);

			marker.addTo(map!);
		});
	}

	function addUserMarker() {
		if (!map || !userLocation) return;

		new maplibregl.Marker({
			color: '#4A90E2',
			scale: 1.2
		})
			.setLngLat([userLocation.longitude, userLocation.latitude])
			.setPopup(
				new maplibregl.Popup({ offset: 25 }).setHTML(
					'<div class="p-2"><strong>Your Location</strong></div>'
				)
			)
			.addTo(map);
	}
</script>

<div bind:this={container} class="h-full w-full cursor-default select-none">
	{#if isLoading}
		<div class="absolute inset-0 z-50 flex items-center justify-center bg-white bg-opacity-75">
			<div class="text-lg">Loading map...</div>
		</div>
	{/if}

	{#if error}
		<div class="absolute inset-0 z-50 flex items-center justify-center bg-white bg-opacity-75">
			<div class="rounded bg-white p-4 text-red-500 shadow">
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

	:global(.maplibregl-popup) {
		@apply max-w-sm;
	}

	:global(.maplibregl-popup-content) {
		@apply rounded-lg p-0 shadow-lg;
	}

	:global(.door-code-container) {
		@apply relative;
	}

	:global(.door-code-text) {
		@apply inline-block rounded px-2 py-1 hover:bg-gray-100;
	}

	:global(.door-code-input) {
		@apply w-full rounded-md border border-gray-300 px-3 py-1 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500;
	}
</style>
