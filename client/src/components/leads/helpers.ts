import { toast } from "sonner";
import type { Destination } from "@/types/app-types"


export interface DestinationFetchOptions {
    page?: number;
    limit?: number;
    search?: string;
    country?: string;
    is_active?: string;
    featured?: string;
}


// API response interface
export interface DestinationFetchResponse {
    data: Destination[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}


// Helper function to get location string
export const getLocationString = (destination: Destination) => {
    const parts = [destination.city, destination.state, destination.country].filter(Boolean);
    return parts.join(', ');
}


// Helper function to get status from is_active boolean
export const getStatus = (destination: Destination): "active" | "inactive" => {
    return destination.is_active ? "active" : "inactive";
}


export const getStatusColor = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
        case "active":
            return "default"
        case "inactive":
            return "secondary"
        default:
            return "secondary"
    }
}


/**
 * Format price as currency
 */
export function formatPrice(price: number): string {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    }).format(price);
}


// API functions
export const fetchDestinations = async (options?: DestinationFetchOptions): Promise<DestinationFetchResponse> => {
    try {
        let url = '/api/admin/destinations';

        if (options) {
            const params = new URLSearchParams();
            Object.entries(options).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== '') {
                    params.append(key, String(value));
                }
            });

            if (params.toString()) {
                url += `?${params.toString()}`;
            }
        }

        const response = await fetch(url);
        const result = await response.json();


        if (!response.ok) {
            throw new Error(result.error || 'Failed to fetch destinations');
        }


        return {
            data: result.data || [],
            pagination: result.pagination || {
                page: 1,
                limit: 10,
                total: 0,
                totalPages: 0
            }
        };
    } catch (error) {
        toast.error('Failed to fetch destinations');
        throw error;
    }
}


export const deleteDestination = async (id: string): Promise<void> => {
    try {
        const response = await fetch(`/api/admin/destinations/${id}`, {
            method: 'DELETE',
        })


        const result = await response.json();


        if (!response.ok) {
            throw new Error(result.error || 'Failed to delete destination');
        }
    } catch (error) {
        toast.error('Error deleting destination');
        console.error('Error deleting destination:', error);
        throw error;
    }
}