<script lang="ts">
	import maplibregl from 'maplibre-gl';
	import type { Map } from 'maplibre-gl';
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

	let activePopup: maplibregl.Popup | null = $state(null);

	$effect(() => {
		if (!map) return;
		
		map.on('click', () => {
			activePopup?.remove();
			activePopup = null;
		});
	});

	$effect(() => {
		if (!map || !mapLoaded || !userLocation) return;
		
		new maplibregl.Marker({ 
			color: '#4A90E2',
			scale: 1.2
		})
		.setLngLat([userLocation.longitude, userLocation.latitude])
		.setPopup(new maplibregl.Popup({ offset: 25 })
			.setHTML('<div class="p-2"><strong>Your Location</strong></div>'))
		.addTo(map);

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
			const mapInstance = new maplibregl.Map({
				container,
				style: `https://api.maptiler.com/maps/streets/style.json?key=${import.meta.env.PUBLIC_MAPTILER_API_KEY}`,
				center: [-118.2437, 34.0522],
				zoom: 10
			});

			map = mapInstance;

			mapInstance.on('load', () => {
				isLoading = false;
				mapLoaded = true;
			});

			locations.forEach((location, index) => {
				const marker = new maplibregl.Marker({ 
					color: '#FF0000',
					scale: 1
				})
				.setLngLat([location.properties.lon, location.properties.lat]);

				const popupContent = document.createElement('div');
				popupContent.className = 'p-2';
				popupContent.innerHTML = `
					<div class="space-y-2">
						<h3 class="font-bold">${location.properties.name || 'Unnamed Location'}</h3>
						<p class="text-sm">${location.properties.formatted}</p>
						<div class="mt-2 door-code-container">
							<span class="door-code-text cursor-pointer text-blue-600 hover:text-blue-800">
								${location.properties.doorCode || 'Add door code'}
							</span>
							<div class="flex rounded-md shadow-sm hidden">
								<input 
									type="text" 
									value="${location.properties.doorCode || ''}"
									placeholder="Enter door code"
									class="door-code-input flex-1 rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
								/>
								<button
									class="ml-2 inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
								>
									Save
								</button>
							</div>
						</div>
					</div>
				`;

				const popup = new maplibregl.Popup({ 
					offset: 25,
					closeButton: true,
					closeOnClick: false,
					anchor: 'bottom'
				})
				.setDOMContent(popupContent);

				// Add marker to map without popup initially
				if (map) marker.addTo(map);

				// Handle marker clicks
				marker.getElement().addEventListener('click', (e) => {
					e.stopPropagation();
					
					// If this popup is already active, do nothing
					if (activePopup === popup) return;
					
					// Remove any existing popup
					if (activePopup) {
						activePopup.remove();
					}
					
					// Set new popup
					activePopup = popup;
					popup.setLngLat([location.properties.lon, location.properties.lat])
						 .addTo(map!);
				});

				// Handle popup close
				popup.on('close', () => {
					if (activePopup === popup) {
						activePopup = null;
					}
				});

				// Add event listeners for popup content
				popup.on('open', () => {
					const container = popupContent.querySelector('.door-code-container');
					const doorCodeText = container?.querySelector('.door-code-text');
					const inputContainer = container?.querySelector('.flex');
					const input = container?.querySelector('.door-code-input') as HTMLInputElement;
					const button = container?.querySelector('button');
					
					if (doorCodeText && inputContainer && input && button) {
						doorCodeText.addEventListener('click', () => {
							doorCodeText.classList.add('hidden');
							inputContainer.classList.remove('hidden');
							input.focus();
						});

						button.onclick = async () => {
							await updateDoorCode(index, input.value);
							doorCodeText.textContent = input.value.trim() || 'Add door code';
							doorCodeText.classList.remove('hidden');
							inputContainer.classList.add('hidden');
						};

						input.addEventListener('keyup', async (e) => {
							if (e.key === 'Enter') {
								await updateDoorCode(index, input.value);
								doorCodeText.textContent = input.value.trim() || 'Add door code';
								doorCodeText.classList.remove('hidden');
								inputContainer.classList.add('hidden');
							} else if (e.key === 'Escape') {
								doorCodeText.classList.remove('hidden');
								inputContainer.classList.add('hidden');
							}
						});
					}
				});
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

	async function updateDoorCode(locationIndex: number, newDoorCode: string) {
		try {
			const location = locations[locationIndex];
			const response = await fetch(`/api/locations?index=${locationIndex}`, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					doorCode: newDoorCode.trim() || undefined
				})
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error || 'Failed to update door code');
			}
			
			locations[locationIndex] = {
				...location,
				properties: {
					...location.properties,
					doorCode: newDoorCode.trim() || undefined
				}
			};
		} catch (err) {
			console.error('Error updating door code:', err);
			error = err instanceof Error ? err : new Error('Failed to update door code');
		}
	}
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

	:global(.maplibregl-popup) {
		@apply max-w-sm;
	}

	:global(.maplibregl-popup-content) {
		@apply rounded-lg shadow-lg p-0;
	}

	:global(.door-code-container) {
		@apply relative;
	}

	:global(.door-code-text) {
		@apply inline-block px-2 py-1 rounded hover:bg-gray-100;
	}

	:global(.door-code-input) {
		@apply w-full px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500;
	}
</style> 