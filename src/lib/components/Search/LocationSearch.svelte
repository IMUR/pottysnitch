<script lang="ts">
    interface SearchResult {
        properties: {
            formatted: string;
            lat: number;
            lon: number;
            address_line1: string;
            address_line2: string;
        };
    }

    let searchInput = $state("");
    let results = $state<SearchResult[]>([]);
    let selectedLocation = $state<SearchResult | null>(null);
    let isLoading = $state(false);
    let error = $state<string | null>(null);

    async function handleInput(e: Event) {
        const target = e.target as HTMLInputElement;
        searchInput = target.value;
        
        if (searchInput.length < 3) {
            results = [];
            return;
        }
        
        isLoading = true;
        error = null;
        
        try {
            console.log('Fetching suggestions for:', $state.snapshot(searchInput));
            const response = await fetch(
                `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(searchInput)}&format=json&apiKey=${import.meta.env.PUBLIC_GEOAPIFY_API_KEY}`
            );
            
            if (!response.ok) throw new Error('Search failed');
            
            const data = await response.json();
            console.log('Search results:', data);
            
            if (data.features) {
                results = data.features;
                console.log('Updated results:', $state.snapshot(results));
            } else {
                results = [];
            }
        } catch (err) {
            error = err instanceof Error ? err.message : 'Search failed';
            results = [];
        } finally {
            isLoading = false;
        }
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
    <div class="relative">
        <input
            type="text"
            value={searchInput}
            oninput={handleInput}
            placeholder="Search for a location..."
            class="w-full p-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            aria-label="Location search"
            aria-expanded={results.length > 0}
            role="combobox"
            aria-controls="search-results"
            aria-autocomplete="list"
        />
        
        {#if isLoading}
            <div class="absolute right-2 top-2" aria-live="polite">
                <span class="loading">Loading...</span>
            </div>
        {/if}
        
        {#if results.length > 0}
            <ul 
                id="search-results"
                class="absolute w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto z-50"
                role="listbox"
            >
                {#each results as result}
                    <li>
                        <button
                            type="button"
                            class="w-full text-left p-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                            onclick={() => selectLocation(result)}
                            onkeydown={(e) => handleKeyDown(e, result)}
                            role="option"
                            aria-selected={selectedLocation === result}
                        >
                            {result.properties.formatted}
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