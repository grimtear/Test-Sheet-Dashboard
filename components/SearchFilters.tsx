/**
 * SearchFilters Component
 * 
 * Advanced search and filtering UI for test sheets
 * Provides text search, dropdowns, date ranges, and pagination controls
 */

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, X, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { useSearchTestSheets, useFilterOptions, type SearchFilters as SearchFiltersType } from '@/hooks/useSearch';
import { format } from 'date-fns';

interface SearchFiltersProps {
    onResultsChange?: (results: any[]) => void;
    showPagination?: boolean;
    showStats?: boolean;
    defaultFilters?: Partial<SearchFiltersType>;
}

export function SearchFilters({
    onResultsChange,
    showPagination = true,
    showStats = true,
    defaultFilters = {}
}: SearchFiltersProps) {
    const {
        results,
        pagination,
        filters,
        isLoading,
        updateFilter,
        updateFilters,
        resetFilters,
        refetch,
        nextPage,
        previousPage,
        goToPage,
    } = useSearchTestSheets(defaultFilters);

    const { data: filterOptions } = useFilterOptions();

    const [showAdvanced, setShowAdvanced] = useState(false);

    // Notify parent of results changes
    useEffect(() => {
        if (onResultsChange) {
            onResultsChange(results);
        }
    }, [results, onResultsChange]);

    // Count active filters
    const activeFilterCount = Object.entries(filters).filter(([key, value]) => {
        if (key === 'page' || key === 'pageSize' || key === 'sortBy' || key === 'sortOrder') {
            return false;
        }
        return value !== undefined && value !== '' && value !== null;
    }).length;

    return (
        <div className="space-y-4">
            {/* Main Search Bar */}
            <div className="flex gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="text"
                        placeholder="Search test sheets... (customer, plant, vehicle, reference, serial)"
                        value={filters.searchTerm || ''}
                        onChange={(e) => updateFilter('searchTerm', e.target.value)}
                        className="pl-10"
                    />
                </div>
                <Button
                    variant={showAdvanced ? 'default' : 'outline'}
                    onClick={() => setShowAdvanced(!showAdvanced)}
                >
                    <Filter className="h-4 w-4 mr-2" />
                    Filters
                    {activeFilterCount > 0 && (
                        <Badge variant="secondary" className="ml-2">
                            {activeFilterCount}
                        </Badge>
                    )}
                </Button>
                <Button
                    variant="outline"
                    onClick={() => refetch()}
                    disabled={isLoading}
                >
                    <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                </Button>
                {activeFilterCount > 0 && (
                    <Button
                        variant="ghost"
                        onClick={resetFilters}
                    >
                        <X className="h-4 w-4 mr-2" />
                        Clear
                    </Button>
                )}
            </div>

            {/* Advanced Filters */}
            {showAdvanced && (
                <Card>
                    <CardHeader>
                        <CardTitle>Advanced Filters</CardTitle>
                        <CardDescription>
                            Filter test sheets by multiple criteria
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {/* Customer Filter */}
                            <div className="space-y-2">
                                <Label htmlFor="customer">Customer</Label>
                                <Select
                                    value={filters.customer || ''}
                                    onValueChange={(value) => updateFilter('customer', value || undefined)}
                                >
                                    <SelectTrigger id="customer">
                                        <SelectValue placeholder="All customers" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="">All customers</SelectItem>
                                        {filterOptions?.customers?.map((customer: string) => (
                                            <SelectItem key={customer} value={customer}>
                                                {customer}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Plant Name Filter */}
                            <div className="space-y-2">
                                <Label htmlFor="plantName">Plant Name</Label>
                                <Select
                                    value={filters.plantName || ''}
                                    onValueChange={(value) => updateFilter('plantName', value || undefined)}
                                >
                                    <SelectTrigger id="plantName">
                                        <SelectValue placeholder="All plants" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="">All plants</SelectItem>
                                        {filterOptions?.plantNames?.map((plant: string) => (
                                            <SelectItem key={plant} value={plant}>
                                                {plant}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Vehicle Make Filter */}
                            <div className="space-y-2">
                                <Label htmlFor="vehicleMake">Vehicle Make</Label>
                                <Select
                                    value={filters.vehicleMake || ''}
                                    onValueChange={(value) => updateFilter('vehicleMake', value || undefined)}
                                >
                                    <SelectTrigger id="vehicleMake">
                                        <SelectValue placeholder="All makes" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="">All makes</SelectItem>
                                        {filterOptions?.vehicleMakes?.map((make: string) => (
                                            <SelectItem key={make} value={make}>
                                                {make}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Administrator Filter */}
                            <div className="space-y-2">
                                <Label htmlFor="administrator">Administrator</Label>
                                <Select
                                    value={filters.administrator || ''}
                                    onValueChange={(value) => updateFilter('administrator', value || undefined)}
                                >
                                    <SelectTrigger id="administrator">
                                        <SelectValue placeholder="All administrators" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="">All administrators</SelectItem>
                                        {filterOptions?.administrators?.map((admin: string) => (
                                            <SelectItem key={admin} value={admin}>
                                                {admin}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Technician Filter */}
                            <div className="space-y-2">
                                <Label htmlFor="technician">Technician</Label>
                                <Select
                                    value={filters.technicianName || ''}
                                    onValueChange={(value) => updateFilter('technicianName', value || undefined)}
                                >
                                    <SelectTrigger id="technician">
                                        <SelectValue placeholder="All technicians" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="">All technicians</SelectItem>
                                        {filterOptions?.technicians?.map((tech: string) => (
                                            <SelectItem key={tech} value={tech}>
                                                {tech}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Status Filter */}
                            <div className="space-y-2">
                                <Label htmlFor="status">Test Status</Label>
                                <Select
                                    value={filters.status || ''}
                                    onValueChange={(value) => updateFilter('status', value || undefined)}
                                >
                                    <SelectTrigger id="status">
                                        <SelectValue placeholder="All statuses" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="">All statuses</SelectItem>
                                        <SelectItem value="Test OK">Test OK</SelectItem>
                                        <SelectItem value="Failed">Failed</SelectItem>
                                        <SelectItem value="N/A">N/A</SelectItem>
                                        {filterOptions?.statuses?.filter(
                                            (s: string) => !['Test OK', 'Failed', 'N/A'].includes(s)
                                        ).map((status: string) => (
                                            <SelectItem key={status} value={status}>
                                                {status}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Draft Status */}
                            <div className="space-y-2">
                                <Label htmlFor="isDraft">Draft Status</Label>
                                <Select
                                    value={filters.isDraft === undefined ? '' : filters.isDraft.toString()}
                                    onValueChange={(value) =>
                                        updateFilter('isDraft', value === '' ? undefined : value === 'true')
                                    }
                                >
                                    <SelectTrigger id="isDraft">
                                        <SelectValue placeholder="All sheets" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="">All sheets</SelectItem>
                                        <SelectItem value="false">Completed</SelectItem>
                                        <SelectItem value="true">Drafts</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Sort By */}
                            <div className="space-y-2">
                                <Label htmlFor="sortBy">Sort By</Label>
                                <Select
                                    value={filters.sortBy || 'startTime'}
                                    onValueChange={(value) => updateFilter('sortBy', value as any)}
                                >
                                    <SelectTrigger id="sortBy">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="startTime">Start Time</SelectItem>
                                        <SelectItem value="endTime">End Time</SelectItem>
                                        <SelectItem value="createdAt">Created At</SelectItem>
                                        <SelectItem value="customer">Customer</SelectItem>
                                        <SelectItem value="plantName">Plant Name</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Sort Order */}
                            <div className="space-y-2">
                                <Label htmlFor="sortOrder">Sort Order</Label>
                                <Select
                                    value={filters.sortOrder || 'desc'}
                                    onValueChange={(value) => updateFilter('sortOrder', value as any)}
                                >
                                    <SelectTrigger id="sortOrder">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="desc">Newest First</SelectItem>
                                        <SelectItem value="asc">Oldest First</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Results Summary */}
            {showStats && pagination && (
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div>
                        Showing {pagination.totalRecords === 0 ? 0 : ((pagination.page - 1) * pagination.pageSize + 1)} to{' '}
                        {Math.min(pagination.page * pagination.pageSize, pagination.totalRecords)} of{' '}
                        {pagination.totalRecords} results
                    </div>
                    {isLoading && <div className="text-primary">Loading...</div>}
                </div>
            )}

            {/* Pagination */}
            {showPagination && pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <Button
                        variant="outline"
                        onClick={previousPage}
                        disabled={!pagination.hasPreviousPage || isLoading}
                    >
                        <ChevronLeft className="h-4 w-4 mr-2" />
                        Previous
                    </Button>

                    <div className="flex items-center gap-2">
                        {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                            let pageNum;
                            if (pagination.totalPages <= 5) {
                                pageNum = i + 1;
                            } else if (pagination.page <= 3) {
                                pageNum = i + 1;
                            } else if (pagination.page >= pagination.totalPages - 2) {
                                pageNum = pagination.totalPages - 4 + i;
                            } else {
                                pageNum = pagination.page - 2 + i;
                            }

                            return (
                                <Button
                                    key={pageNum}
                                    variant={pagination.page === pageNum ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => goToPage(pageNum)}
                                    disabled={isLoading}
                                >
                                    {pageNum}
                                </Button>
                            );
                        })}
                    </div>

                    <Button
                        variant="outline"
                        onClick={nextPage}
                        disabled={!pagination.hasNextPage || isLoading}
                    >
                        Next
                        <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                </div>
            )}
        </div>
    );
}

export default SearchFilters;
