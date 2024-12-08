export interface ILocationSubmission {
    properties: {
        name: string;           // Establishment name
        formatted: string;      // Full formatted address
        lat: number;           
        lon: number;           
        address_line1: string; 
        address_line2?: string;
        city?: string;         
        state?: string;        
        country?: string;      
        postcode?: string;     
        category?: string;     // Type of establishment
    };
    metadata: {
        submitted_at: string;   // ISO timestamp
        status: 'pending';      // Default status for new submissions
    };
} 