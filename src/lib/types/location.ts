/**
 * @description Interface for location submission data
 * @property {Object} properties - Location properties
 * @property {string} properties.name - Location name
 * @property {string} properties.formatted - Formatted address
 * @property {number} properties.lon - Longitude
 * @property {number} properties.lat - Latitude
 */
export interface ILocationSubmission {
	properties: {
		name: string;
		formatted: string;
		lon: number;
		lat: number;
		doorCode?: string;
		address_line1?: string;
		address_line2?: string;
		city?: string;
		state?: string;
		country?: string;
		postcode?: string;
		category?: string;
	};
	metadata?: {
		submitted_at: string;
		status: 'pending' | 'approved' | 'rejected';
	};
}
