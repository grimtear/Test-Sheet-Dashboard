/**
 * Search API Routes
 * 
 * REST endpoints for searching and filtering test sheets
 */

import { Router } from 'express';
import { searchTestSheets, getFilterOptions, quickSearch, getSearchStats } from '../services/searchService';

const router = Router();

/**
 * POST /api/search/test-sheets
 * 
 * Advanced search with filtering, pagination, and sorting
 * 
 * Body:
 * {
 *   searchTerm?: string,
 *   searchFields?: string[],
 *   userId?: string,
 *   isDraft?: boolean,
 *   status?: string,
 *   startDateFrom?: number,
 *   startDateTo?: number,
 *   customer?: string,
 *   plantName?: string,
 *   page?: number,
 *   pageSize?: number,
 *   sortBy?: string,
 *   sortOrder?: 'asc' | 'desc'
 * }
 */
router.post('/test-sheets', async (req, res) => {
    try {
        const filters = req.body;
        const result = await searchTestSheets(filters);
        res.json(result);
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({
            error: 'Failed to search test sheets',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

/**
 * GET /api/search/filter-options
 * 
 * Get all unique values for filter dropdowns
 */
router.get('/filter-options', async (req, res) => {
    try {
        const options = await getFilterOptions();
        res.json(options);
    } catch (error) {
        console.error('Filter options error:', error);
        res.status(500).json({
            error: 'Failed to get filter options',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

/**
 * GET /api/search/quick?q=<term>&limit=<number>
 * 
 * Quick search for autocomplete (minimum 2 characters)
 */
router.get('/quick', async (req, res) => {
    try {
        const term = req.query.q as string;
        const limit = parseInt(req.query.limit as string) || 10;

        if (!term || term.trim().length < 2) {
            return res.json([]);
        }

        const results = await quickSearch(term, limit);
        res.json(results);
    } catch (error) {
        console.error('Quick search error:', error);
        res.status(500).json({
            error: 'Failed to perform quick search',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

/**
 * GET /api/search/stats
 * 
 * Get search statistics (total, drafts, completed, passed, failed)
 */
router.get('/stats', async (req, res) => {
    try {
        const stats = await getSearchStats();
        res.json(stats);
    } catch (error) {
        console.error('Stats error:', error);
        res.status(500).json({
            error: 'Failed to get statistics',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

export default router;
