/**
 * useSearch Hook
 * 
 * Custom React hook for searching and filtering test sheets
 * with pagination, sorting, and real-time updates
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useCallback } from 'react';

export interface SearchFilters {
    searchTerm?: string;
    searchFields?: string[];
    userId?: string;
    administrator?: string;
    technicianName?: string;
    isDraft?: boolean;
    status?: string;
    startDateFrom?: number;
    startDateTo?: number;
    endDateFrom?: number;
    endDateTo?: number;
    vehicleMake?: string;
    vehicleModel?: string;
    customer?: string;
    plantName?: string;
    techReference?: string;
    adminReference?: string;
    page?: number;
    pageSize?: number;
    sortBy?: 'startTime' | 'endTime' | 'createdAt' | 'customer' | 'plantName';
    sortOrder?: 'asc' | 'desc';
}

export interface SearchResult {
    data: any[];
    pagination: {
        page: number;
        pageSize: number;
        totalRecords: number;
        totalPages: number;
        hasNextPage: boolean;
        hasPreviousPage: boolean;
    };
    filters: SearchFilters;
}

/**
 * Search test sheets with advanced filtering
 */
export function useSearchTestSheets(initialFilters: SearchFilters = {}) {
    const [filters, setFilters] = useState<SearchFilters>({
        page: 1,
        pageSize: 20,
        sortBy: 'startTime',
        sortOrder: 'desc',
        ...initialFilters,
    });

    const { data, isLoading, error, refetch } = useQuery<SearchResult>({
        queryKey: ['/api/search/test-sheets', filters],
        queryFn: async () => {
            const response = await fetch('/api/search/test-sheets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(filters),
                credentials: 'include',
            });

            if (!response.ok) {
                throw new Error('Failed to search test sheets');
            }

            return response.json();
        },
    });

    // Update a single filter
    const updateFilter = useCallback(<K extends keyof SearchFilters>(
        key: K,
        value: SearchFilters[K]
    ) => {
        setFilters(prev => ({
            ...prev,
            [key]: value,
            page: key === 'page' ? (value as number) : 1, // Reset to page 1 when changing filters
        } as SearchFilters));
    }, []);

    // Update multiple filters at once
    const updateFilters = useCallback((newFilters: Partial<SearchFilters>) => {
        setFilters(prev => ({
            ...prev,
            ...newFilters,
            page: newFilters.page ?? 1, // Reset to page 1 unless explicitly set
        }));
    }, []);

    // Reset all filters
    const resetFilters = useCallback(() => {
        setFilters({
            page: 1,
            pageSize: 20,
            sortBy: 'startTime',
            sortOrder: 'desc',
        });
    }, []);

    // Pagination helpers
    const goToPage = useCallback((page: number) => {
        setFilters(prev => ({ ...prev, page }));
    }, []);

    const nextPage = useCallback(() => {
        if (data?.pagination.hasNextPage) {
            setFilters(prev => ({ ...prev, page: (prev.page || 1) + 1 }));
        }
    }, [data?.pagination.hasNextPage]);

    const previousPage = useCallback(() => {
        if (data?.pagination.hasPreviousPage) {
            setFilters(prev => ({ ...prev, page: Math.max((prev.page || 1) - 1, 1) }));
        }
    }, [data?.pagination.hasPreviousPage]);

    // Sorting helpers
    const setSort = useCallback((
        sortBy: SearchFilters['sortBy'],
        sortOrder: SearchFilters['sortOrder'] = 'desc'
    ) => {
        setFilters(prev => ({ ...prev, sortBy, sortOrder, page: 1 }));
    }, []);

    const toggleSortOrder = useCallback(() => {
        setFilters(prev => ({
            ...prev,
            sortOrder: prev.sortOrder === 'asc' ? 'desc' : 'asc',
            page: 1,
        }));
    }, []);

    return {
        // Data
        results: data?.data || [],
        pagination: data?.pagination,

        // State
        filters,
        isLoading,
        error,

        // Actions
        updateFilter,
        updateFilters,
        resetFilters,
        refetch,

        // Pagination
        goToPage,
        nextPage,
        previousPage,

        // Sorting
        setSort,
        toggleSortOrder,
    };
}

/**
 * Get filter options for dropdowns
 */
export function useFilterOptions() {
    return useQuery({
        queryKey: ['/api/search/filter-options'],
        queryFn: async () => {
            const response = await fetch('/api/search/filter-options', {
                credentials: 'include',
            });

            if (!response.ok) {
                throw new Error('Failed to get filter options');
            }

            return response.json();
        },
        staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    });
}

/**
 * Quick search for autocomplete
 */
export function useQuickSearch(enabled: boolean = true) {
    const [searchTerm, setSearchTerm] = useState('');

    const { data, isLoading } = useQuery({
        queryKey: ['/api/search/quick', searchTerm],
        queryFn: async () => {
            if (!searchTerm || searchTerm.trim().length < 2) {
                return [];
            }

            const response = await fetch(
                `/api/search/quick?q=${encodeURIComponent(searchTerm)}&limit=10`,
                { credentials: 'include' }
            );

            if (!response.ok) {
                throw new Error('Failed to perform quick search');
            }

            return response.json();
        },
        enabled: enabled && searchTerm.trim().length >= 2,
    });

    return {
        searchTerm,
        setSearchTerm,
        results: data || [],
        isLoading,
    };
}

/**
 * Get search statistics
 */
export function useSearchStats() {
    return useQuery({
        queryKey: ['/api/search/stats'],
        queryFn: async () => {
            const response = await fetch('/api/search/stats', {
                credentials: 'include',
            });

            if (!response.ok) {
                throw new Error('Failed to get search statistics');
            }

            return response.json();
        },
        staleTime: 60 * 1000, // Cache for 1 minute
        refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    });
}
