<script lang="ts">
    import { GeocoderAutocomplete } from '@geoapify/geocoder-autocomplete';
    import type { GeocoderAutocompleteOptions, LocationType } from '@geoapify/geocoder-autocomplete';
    import '@geoapify/geocoder-autocomplete/styles/minimal.css';
    import type { ILocationSubmission } from '$lib/types/location';

    interface LocationSearchProps {
        userLocation: { longitude: number; latitude: number } | null;
    }

    let props = $props();
    let { userLocation } = props satisfies LocationSearchProps;

    let autocompleteContainer: HTMLDivElement;
    let autocomplete = $state<InstanceType<typeof GeocoderAutocomplete> | null>(null);
    let selectedPlace = $state<ILocationSubmission | null>(null);
    let error = $state<string | null>(null);

    $effect(() => {
        if (!autocompleteContainer || autocomplete) return;

        try {
            const instance = new GeocoderAutocomplete(
                autocompleteContainer,
                import.meta.env.PUBLIC_GEOAPIFY_API_KEY,
                {
                    placeholder: 'Search for a location...',
                    type: 'amenity' as LocationType,
                    bias: userLocation ? {
                        proximity: {
                            lon: userLocation.longitude,
                            lat: userLocation.latitude
                        }
                    } : undefined,
                    debounceDelay: 100,
                    skipIcons: true
                }
            );

            instance.on('select', (location) => {
                if (location?.properties) {
                    selectedPlace = {
                        properties: {
                            name: location.properties.name || '',
                            formatted: location.properties.formatted,
                            lat: location.properties.lat,
                            lon: location.properties.lon,
                            address_line1: location.properties.address_line1 || '',
                            address_line2: location.properties.address_line2,
                            city: location.properties.city,
                            state: location.properties.state,
                            country: location.properties.country,
                            postcode: location.properties.postcode,
                            category: location.properties.category
                        },
                        metadata: {
                            submitted_at: new Date().toISOString(),
                            status: 'pending'
                        }
                    };
                }
            });

            autocomplete = instance;
        } catch (err) {
            error = err instanceof Error ? err.message : 'Failed to initialize search';
            console.error('Geocoder initialization error:', err);
        }
    });

    async function handleSubmit() {
        if (!selectedPlace) return;

        try {
            const response = await fetch('/api/locations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(selectedPlace)
            });

            if (!response.ok) {
                throw new Error('Failed to save location');
            }

            selectedPlace = null;
            if (autocompleteContainer) {
                autocompleteContainer.innerHTML = '';
                autocomplete = null;
            }
        } catch (err) {
            error = err instanceof Error ? err.message : 'Failed to save location';
        }
    }
</script>

<div class="w-full max-w-md mx-auto p-4">
    <div class="relative w-full bg-white rounded-lg shadow-lg p-2">
        <div 
            bind:this={autocompleteContainer} 
            class="geocoder-container w-full"
        ></div>
    </div>

    {#if selectedPlace}
        <div class="mt-4">
            <p class="text-sm text-gray-600 mb-2">Selected: {selectedPlace.properties.formatted}</p>
            <button
                type="button"
                onclick={handleSubmit}
                class="w-full bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
                Submit Location
            </button>
        </div>
    {/if}

    {#if error}
        <p class="mt-2 text-red-500 bg-white p-2 rounded" role="alert">{error}</p>
    {/if}
</div>

<style>
    :global(.geocoder-container) {
        width: 100%;
        min-height: 40px;
    }

    :global(.geoapify-autocomplete-input) {
        @apply w-full;
    }

    :global(.geoapify-autocomplete-input input) {
        @apply w-full px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500;
    }

    :global(.geoapify-autocomplete-items) {
        @apply absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg;
    }

    :global(.geoapify-autocomplete-item) {
        @apply px-4 py-2 hover:bg-gray-100 cursor-pointer;
    }
</style> 