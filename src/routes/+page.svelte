<script lang="ts">
	import MapView from '$lib/components/Map/MapView.svelte';
	import LocationSearch from '$lib/components/Search/LocationSearch.svelte';
</script>

<div class="relative">
	<MapView />
	<div class="absolute top-4 left-1/2 -translate-x-1/2 z-10">
		<LocationSearch />
	</div>
</div>
