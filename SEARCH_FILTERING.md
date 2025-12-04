# Search & Filtering System

Complete search and filtering implementation for the TestSheet application with server-side processing, pagination, and advanced filtering capabilities.

## Overview

The search system provides comprehensive filtering and search functionality for test sheets with:

- **Full-text search** across multiple fields
- **Advanced filtering** by customer, plant, vehicle, status, dates, and more
- **Server-side pagination** for efficient handling of large datasets
- **Flexible sorting** by multiple columns with ascending/descending order
- **Quick search** for autocomplete functionality
- **Filter options** dynamically loaded from existing data
- **Statistics dashboard** showing test sheet counts and statuses

## Architecture

### Server-Side Components

1. **Search Service** (`server/services/searchService.ts`)
   - Core search logic with Drizzle ORM
   - Multi-field text search with LIKE queries
   - Advanced filtering with AND/OR conditions
   - Pagination and sorting
   - Statistics aggregation

2. **Search Routes** (`server/routes/searchRoutes.ts`)
   - REST API endpoints for search operations
   - Request validation and error handling
   - JSON response formatting

### Client-Side Components

1. **useSearch Hook** (`client/src/hooks/useSearch.ts`)
   - React hook for search state management
   - TanStack Query integration for caching
   - Pagination helpers
   - Filter update functions

2. **SearchFilters Component** (`client/src/components/SearchFilters.tsx`)
   - Complete UI for search and filtering
   - Responsive design with mobile support
   - Advanced filters panel (collapsible)
   - Pagination controls

## API Endpoints

### POST `/api/search/test-sheets`

Advanced search with filtering, pagination, and sorting.

**Request Body**:

```json
{
  "searchTerm": "string",
  "searchFields": ["customer", "plantName", "vehicleMake"],
  "userId": "string",
  "administrator": "string",
  "technicianName": "string",
  "isDraft": boolean,
  "status": "string",
  "startDateFrom": number,
  "startDateTo": number,
  "endDateFrom": number,
  "endDateTo": number,
  "vehicleMake": "string",
  "vehicleModel": "string",
  "customer": "string",
  "plantName": "string",
  "techReference": "string",
  "adminReference": "string",
  "page": number,
  "pageSize": number,
  "sortBy": "startTime" | "endTime" | "createdAt" | "customer" | "plantName",
  "sortOrder": "asc" | "desc"
}
```

**Response**:

```json
{
  "data": [
    {
      "id": "string",
      "techReference": "string",
      "customer": "string",
      "plantName": "string",
      ...
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "totalRecords": 100,
    "totalPages": 5,
    "hasNextPage": true,
    "hasPreviousPage": false
  },
  "filters": { ... }
}
```

### GET `/api/search/filter-options`

Get all unique values for filter dropdowns.

**Response**:

```json
{
  "customers": ["Customer A", "Customer B"],
  "plantNames": ["Plant 1", "Plant 2"],
  "vehicleMakes": ["Toyota", "Ford"],
  "vehicleModels": ["Model X", "Model Y"],
  "administrators": ["Admin 1", "Admin 2"],
  "technicians": ["Tech 1", "Tech 2"],
  "statuses": ["Test OK", "Failed", "N/A"]
}
```

### GET `/api/search/quick?q=<term>&limit=<number>`

Quick search for autocomplete (minimum 2 characters).

**Query Parameters**:

- `q`: Search term (required, min 2 characters)
- `limit`: Maximum results to return (optional, default 10)

**Response**:

```json
[
  {
    "id": "string",
    "techReference": "string",
    "adminReference": "string",
    "customer": "string",
    "plantName": "string",
    "vehicleMake": "string",
    "vehicleModel": "string",
    "startTime": number
  }
]
```

### GET `/api/search/stats`

Get search statistics.

**Response**:

```json
{
  "total": 150,
  "drafts": 10,
  "completed": 140,
  "passed": 120,
  "failed": 20
}
```

## Usage Examples

### Basic Search

```typescript
import { useSearchTestSheets } from '@/hooks/useSearch';

function TestSheetsList() {
  const { results, pagination, isLoading } = useSearchTestSheets();

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      {results.map(sheet => (
        <div key={sheet.id}>{sheet.techReference}</div>
      ))}
    </div>
  );
}
```

### Search with Filters

```typescript
const {
  results,
  pagination,
  filters,
  updateFilter,
  resetFilters
} = useSearchTestSheets({
  customer: 'Acme Corp',
  isDraft: false,
  sortBy: 'startTime',
  sortOrder: 'desc'
});

// Update a single filter
updateFilter('status', 'Test OK');

// Reset all filters
resetFilters();
```

### Pagination

```typescript
const {
  results,
  pagination,
  nextPage,
  previousPage,
  goToPage
} = useSearchTestSheets();

return (
  <div>
    <button 
      onClick={previousPage}
      disabled={!pagination?.hasPreviousPage}
    >
      Previous
    </button>
    
    <span>
      Page {pagination?.page} of {pagination?.totalPages}
    </span>
    
    <button 
      onClick={nextPage}
      disabled={!pagination?.hasNextPage}
    >
      Next
    </button>
  </div>
);
```

### Quick Search for Autocomplete

```typescript
import { useQuickSearch } from '@/hooks/useSearch';

function SearchAutocomplete() {
  const { searchTerm, setSearchTerm, results, isLoading } = useQuickSearch();

  return (
    <div>
      <input
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Search..."
      />
      {isLoading && <div>Searching...</div>}
      <ul>
        {results.map(result => (
          <li key={result.id}>{result.techReference}</li>
        ))}
      </ul>
    </div>
  );
}
```

### Using SearchFilters Component

```typescript
import SearchFilters from '@/components/SearchFilters';

function TestSheetsPage() {
  const [filteredResults, setFilteredResults] = useState([]);

  return (
    <div>
      <SearchFilters
        onResultsChange={setFilteredResults}
        showPagination={true}
        showStats={true}
      />
      
      <div className="mt-4">
        {filteredResults.map(sheet => (
          <TestSheetCard key={sheet.id} sheet={sheet} />
        ))}
      </div>
    </div>
  );
}
```

### Getting Filter Options

```typescript
import { useFilterOptions } from '@/hooks/useSearch';

function CustomerFilter() {
  const { data: options, isLoading } = useFilterOptions();

  if (isLoading) return <div>Loading...</div>;

  return (
    <select>
      <option value="">All Customers</option>
      {options?.customers?.map(customer => (
        <option key={customer} value={customer}>
          {customer}
        </option>
      ))}
    </select>
  );
}
```

### Statistics Dashboard

```typescript
import { useSearchStats } from '@/hooks/useSearch';

function StatsDashboard() {
  const { data: stats, isLoading } = useSearchStats();

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <div>Total: {stats?.total}</div>
      <div>Completed: {stats?.completed}</div>
      <div>Drafts: {stats?.drafts}</div>
      <div>Passed: {stats?.passed}</div>
      <div>Failed: {stats?.failed}</div>
    </div>
  );
}
```

## Search Capabilities

### Searchable Fields

The full-text search searches across:

- `customer` - Customer name
- `plantName` - Plant/site name
- `vehicleMake` - Vehicle manufacturer
- `vehicleModel` - Vehicle model
- `administrator` - Administrator name
- `technicianName` - Technician name
- `techReference` - Technical reference number
- `adminReference` - Administrative reference
- `serialEsn` - Equipment serial number (ESN)

### Filter Options

**By User**:

- User ID (creator)
- Administrator
- Technician

**By Status**:

- Draft/Completed
- Test status (Test OK, Failed, N/A)

**By Date Range**:

- Start date (from/to)
- End date (from/to)

**By Equipment**:

- Vehicle make
- Vehicle model
- Customer
- Plant name

**By Reference**:

- Technical reference
- Administrative reference

### Sorting Options

Sort by:

- Start time (default)
- End time
- Created at
- Customer name
- Plant name

Order:

- Ascending (oldest/A-Z first)
- Descending (newest/Z-A first)

### Pagination

- Configurable page size (default: 20)
- Page navigation (previous/next)
- Direct page jump
- Total records count
- Total pages calculation

## Performance Optimization

### Server-Side

1. **Database Indexing**:
   - Indexes on frequently searched fields (customer, plantName, startTime)
   - Unique index on techReference

2. **Query Optimization**:
   - Only select needed columns
   - Use parameterized queries
   - Limit result sets with pagination

3. **Conditional Queries**:
   - Only add WHERE clauses for active filters
   - Skip empty/undefined filters

### Client-Side

1. **React Query Caching**:
   - Results cached by filter combination
   - Automatic cache invalidation
   - Background refetching

2. **Debouncing** (recommended for text search):

   ```typescript
   import { useDebouncedValue } from '@/hooks/useDebounce';
   
   const [searchTerm, setSearchTerm] = useState('');
   const debouncedSearch = useDebouncedValue(searchTerm, 300);
   
   useSearchTestSheets({ searchTerm: debouncedSearch });
   ```

3. **Lazy Loading**:
   - Load filter options only when needed
   - Cache filter options for 5 minutes

## Best Practices

### 1. Always Use Pagination

```typescript
// ✅ Good - with pagination
const { results } = useSearchTestSheets({ pageSize: 20 });

// ❌ Bad - no pagination (loads all records)
const allRecords = await db.select().from(testSheets);
```

### 2. Provide User Feedback

```typescript
const { isLoading, error } = useSearchTestSheets();

if (isLoading) return <Spinner />;
if (error) return <ErrorMessage error={error} />;
```

### 3. Debounce Text Search

```typescript
// Prevent API call on every keystroke
const debouncedSearch = useDebouncedValue(searchTerm, 300);
```

### 4. Reset Page on Filter Change

The hook automatically resets to page 1 when filters change, except when explicitly changing the page number.

### 5. Cache Filter Options

Filter options are cached for 5 minutes to reduce database queries.

## Troubleshooting

### No Results Found

**Check**:

1. Are filters too restrictive?
2. Is search term spelled correctly?
3. Are there any test sheets in the database?

**Solution**:

```typescript
// Add a reset button
<button onClick={resetFilters}>Clear All Filters</button>
```

### Slow Search Performance

**Check**:

1. Database indexes exist
2. Page size is reasonable (not too large)
3. Not loading all records at once

**Solution**:

```typescript
// Reduce page size
updateFilter('pageSize', 10);

// Add database indexes
CREATE INDEX idx_customer ON test_sheets(customer);
```

### Search Not Updating

**Check**:

1. React Query cache might be stale
2. Filters not being passed correctly

**Solution**:

```typescript
// Force refetch
const { refetch } = useSearchTestSheets();
refetch();
```

### TypeScript Errors

**Common Issue**: Filter type mismatch

**Solution**:

```typescript
// Use proper types
import type { SearchFilters } from '@/hooks/useSearch';

const filters: SearchFilters = {
  customer: 'Acme',
  page: 1,
  pageSize: 20
};
```

## Testing

### Unit Tests

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { useSearchTestSheets } from '@/hooks/useSearch';

test('search returns results', async () => {
  const { result } = renderHook(() => useSearchTestSheets({
    customer: 'Test Customer'
  }));

  await waitFor(() => {
    expect(result.current.results).toHaveLength(10);
  });
});
```

### Integration Tests

```typescript
test('search API endpoint', async () => {
  const response = await fetch('/api/search/test-sheets', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ customer: 'Acme' })
  });

  const data = await response.json();
  expect(data.pagination.totalRecords).toBeGreaterThan(0);
});
```

## Future Enhancements

Potential improvements for future versions:

1. **Saved Searches**: Allow users to save common filter combinations
2. **Export Results**: Export filtered results to CSV/Excel
3. **Advanced Date Filters**: This week, last month, custom ranges
4. **Fuzzy Search**: Tolerate spelling mistakes
5. **Full-Text Search**: Use SQLite FTS5 for better text search
6. **Search History**: Remember recent searches
7. **Bulk Operations**: Select and perform actions on filtered results
8. **Custom Columns**: Let users choose which columns to display

## Related Files

- `server/services/searchService.ts` - Search logic
- `server/routes/searchRoutes.ts` - API endpoints
- `client/src/hooks/useSearch.ts` - React hooks
- `client/src/components/SearchFilters.tsx` - UI component
- `shared/schema.ts` - Database schema

## Support

For issues or questions:

1. Check this documentation
2. Verify database indexes exist
3. Check browser console for errors
4. Review server logs for API errors
5. Test with simpler filters first
