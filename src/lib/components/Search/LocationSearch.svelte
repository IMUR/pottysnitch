<script lang="ts">
    import { GeocoderAutocomplete } from '@geoapify/geocoder-autocomplete';
    import type { GeocoderAutocompleteOptions, LocationType } from '@geoapify/geocoder-autocomplete';
    import type { ILocationSubmission } from '$lib/types/location';

    let props = $props();
    let { userLocation } = props;

    let searchContainer: HTMLDivElement;
    let autocomplete = $state<GeocoderAutocomplete | null>(null);
    let selectedLocation = $state<ILocationSubmission | null>(null);

    $effect(() => {
        if (!searchContainer || autocomplete) return;

        const instance = new GeocoderAutocomplete(
            searchContainer,
            import.meta.env.PUBLIC_GEOAPIFY_API_KEY,
            {
                placeholder: "Search for a location...",
                type: 'amenity' as LocationType,
                limit: 6,
                bias: userLocation ? {
                    proximity: {
                        lon: userLocation.longitude,
                        lat: userLocation.latitude
                    }
                } : undefined
            }
        );

        instance.on('select', (location) => {
            if (location) {
                selectedLocation = {
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

        return () => {
            if (searchContainer) {
                searchContainer.innerHTML = '';
            }
        };
    });

    async function handleSubmit() {
        if (!selectedLocation) return;
        
        try {
            const response = await fetch('/api/locations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(selectedLocation)
            });
            
            if (!response.ok) throw new Error('Failed to save location');
            
            selectedLocation = null;
            if (searchContainer) {
                searchContainer.innerHTML = '';
                // Reinitialize the autocomplete
                autocomplete = null;
            }
        } catch (err) {
            console.error('Failed to submit location:', err);
        }
    }
</script>

<div class="w-full max-w-md mx-auto p-4">
    <div class="relative w-80">
        <div bind:this={searchContainer} class="geocoder-container"></div>
    </div>
    
    {#if selectedLocation}
        <button
            type="button"
            onclick={handleSubmit}
            class="mt-4 w-full bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
            Submit Location
        </button>
    {/if}
</div>

<style>
    :global(.geocoder-container) {
        width: 100%;
    }
    :global(.geoapify-autocomplete-input) {
        width: 100%;
        padding: 0.5rem 1rem;
        border-radius: 0.5rem;
        border: 1px solid #e2e8f0;
        box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
    }
    :global(.geoapify-autocomplete-input:focus) {
        outline: none;
        border-color: #3b82f6;
        box-shadow: 0 0 0 2px rgb(59 130 246 / 0.5);
    }
    :global(.geoapify-autocomplete-items) {
        position: absolute;
        width: 100%;
        margin-top: 0.25rem;
        background-color: white;
        border: 1px solid #e2e8f0;
        border-radius: 0.5rem;
        box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
        max-height: 15rem;
        overflow-y: auto;
        z-index: 50;
    }
</style> 