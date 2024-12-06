<script lang="ts">
    let debounceTimer: ReturnType<typeof setTimeout>;
    const DEBOUNCE_MS = 300;
    const MAX_RESULTS = 6;

    interface SearchResult {
        properties: {
            formatted: string;
            lat: number;
            lon: number;
            address_line1: string;
            address_line2: string;
            city?: string;
            country?: string;
            state?: string;
            country_code?: string;
        };
    }

    let searchInput = $state("");
    let results = $state<SearchResult[]>([]);
    let selectedLocation = $state<SearchResult | null>(null);
    let isLoading = $state(false);
    let error = $state<string | null>(null);

    function handleInput(e: Event) {
        const target = e.target as HTMLInputElement;
        searchInput = target.value;
        
        if (searchInput.length < 3) {
            results = [];
            return;
        }
        
        if (debounceTimer) clearTimeout(debounceTimer);
        
        isLoading = true;
        error = null;
        
        debounceTimer = setTimeout(() => {
            fetch(
                `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(searchInput)}&format=json&apiKey=${import.meta.env.PUBLIC_GEOAPIFY_API_KEY}&limit=${MAX_RESULTS}`
            )
                .then(response => {
                    if (!response.ok) throw new Error('Search failed');
                    return response.json();
                })
                .then(data => {
                    console.log('Raw search response:', data);
                    if (data.features) {
                        results = data.features.slice(0, MAX_RESULTS);
                        console.log('Processed results:', results);
                    } else {
                        results = [];
                    }
                })
                .catch(err => {
                    error = err instanceof Error ? err.message : 'Search failed';
                    results = [];
                })
                .finally(() => {
                    isLoading = false;
                });
        }, DEBOUNCE_MS);
    }

    function selectLocation(result: SearchResult) {
        selectedLocation = result;
        searchInput = result.properties.formatted;
        results = [];
    }

    function handleKeyDown(event: KeyboardEvent, result: SearchResult) {
        if (event.key === 'Enter' || event.key === ' ') {
            selectLocation(result);
        }
    }

    async function handleSubmit() {
        if (!selectedLocation) return;
        
        const locationData = {
            formatted: selectedLocation.properties.formatted,
            coordinates: {
                lat: selectedLocation.properties.lat,
                lon: selectedLocation.properties.lon
            },
            address: {
                line1: selectedLocation.properties.address_line1,
                line2: selectedLocation.properties.address_line2
            },
            timestamp: new Date().toISOString()
        };

        try {
            const response = await fetch('/api/locations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(locationData)
            });
            
            if (!response.ok) throw new Error('Failed to save location');
            
            searchInput = "";
            selectedLocation = null;
            results = [];
            
        } catch (err) {
            error = err instanceof Error ? err.message : 'Failed to save location';
        }
    }
</script>

<div class="w-full max-w-md mx-auto p-4">
    <div class="relative w-80">
        <input
            type="text"
            placeholder="Search locations..."
            class="w-full px-4 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            oninput={handleInput}
            value={searchInput}
        />
        
        {#if isLoading}
            <div class="absolute right-3 top-2.5">
                <div class="animate-spin h-5 w-5 border-2 border-blue-500 rounded-full border-t-transparent"></div>
            </div>
        {/if}
        
        {#if results.length > 0}
            <ul 
                class="absolute w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto z-50"
                role="listbox"
            >
                {#each results as result}
                    <li>
                        <button
                            type="button"
                            class="w-full text-left px-4 py-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                            onclick={() => selectLocation(result)}
                        >
                            <div class="font-medium">{result.properties.formatted}</div>
                            {#if result.properties.city && result.properties.country}
                                <div class="text-sm text-gray-600">
                                    {result.properties.city}, {result.properties.country}
                                </div>
                            {/if}
                        </button>
                    </li>
                {/each}
            </ul>
        {/if}
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
    
    {#if error}
        <p class="mt-2 text-red-500" role="alert">{error}</p>
    {/if}
</div> 