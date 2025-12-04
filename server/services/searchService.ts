/**
 * Search Service
 * 
 * Provides comprehensive search and filtering capabilities for test sheets
 * with support for multiple fields, date ranges, and pagination.
 */

import { db } from '../db';
import { testSheets, users } from '@shared/schema';
import { eq, and, or, like, gte, lte, desc, asc, sql } from 'drizzle-orm';

export interface SearchFilters {
    // Text search
    searchTerm?: string;
    searchFields?: string[]; // Fields to search in (customer, plantName, vehicleMake, etc.)

    // User filters
    userId?: string;
    administrator?: string;
    technicianName?: string;

    // Status filters
    isDraft?: boolean;
    status?: string; // Test OK, Failed, etc.

    // Date range filters
    startDateFrom?: number; // Unix timestamp
    startDateTo?: number;
    endDateFrom?: number;
    endDateTo?: number;

    // Equipment filters
    vehicleMake?: string;
    vehicleModel?: string;
    customer?: string;
    plantName?: string;

    // Reference filters
    techReference?: string;
    adminReference?: string;

    // Pagination
    page?: number;
    pageSize?: number;

    // Sorting
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
export async function searchTestSheets(filters: SearchFilters): Promise<SearchResult> {
    const {
        searchTerm,
        searchFields = ['customer', 'plantName', 'vehicleMake', 'vehicleModel', 'administrator', 'technicianName'],
        userId,
        administrator,
        technicianName,
        isDraft,
        status,
        startDateFrom,
        startDateTo,
        endDateFrom,
        endDateTo,
        vehicleMake,
        vehicleModel,
        customer,
        plantName,
        techReference,
        adminReference,
        page = 1,
        pageSize = 20,
        sortBy = 'startTime',
        sortOrder = 'desc'
    } = filters;

    // Build WHERE conditions
    const conditions = [];

    // Text search across multiple fields
    if (searchTerm && searchTerm.trim()) {
        const searchConditions = [];
        const term = `%${searchTerm.trim()}%`;

        if (searchFields.includes('customer')) {
            searchConditions.push(like(testSheets.customer, term));
        }
        if (searchFields.includes('plantName')) {
            searchConditions.push(like(testSheets.plantName, term));
        }
        if (searchFields.includes('vehicleMake')) {
            searchConditions.push(like(testSheets.vehicleMake, term));
        }
        if (searchFields.includes('vehicleModel')) {
            searchConditions.push(like(testSheets.vehicleModel, term));
        }
        if (searchFields.includes('administrator')) {
            searchConditions.push(like(testSheets.administrator, term));
        }
        if (searchFields.includes('technicianName')) {
            searchConditions.push(like(testSheets.technicianName, term));
        }
        if (searchFields.includes('techReference')) {
            searchConditions.push(like(testSheets.techReference, term));
        }
        if (searchFields.includes('adminReference')) {
            searchConditions.push(like(testSheets.adminReference, term));
        }
        if (searchFields.includes('serialEsn')) {
            searchConditions.push(like(testSheets.serialEsn, term));
        }

        if (searchConditions.length > 0) {
            conditions.push(or(...searchConditions));
        }
    }

    // User filter
    if (userId) {
        conditions.push(eq(testSheets.userId, userId));
    }

    // Administrator filter
    if (administrator) {
        conditions.push(like(testSheets.administrator, `%${administrator}%`));
    }

    // Technician filter
    if (technicianName) {
        conditions.push(like(testSheets.technicianName, `%${technicianName}%`));
    }

    // Draft status filter
    if (isDraft !== undefined) {
        conditions.push(eq(testSheets.isDraft, isDraft ? 1 : 0));
    }

    // Test status filter
    if (status) {
        conditions.push(eq(testSheets.Test, status));
    }

    // Date range filters
    if (startDateFrom) {
        conditions.push(gte(testSheets.startTime, startDateFrom));
    }
    if (startDateTo) {
        conditions.push(lte(testSheets.startTime, startDateTo));
    }
    if (endDateFrom && testSheets.endTime) {
        conditions.push(gte(testSheets.endTime, endDateFrom));
    }
    if (endDateTo && testSheets.endTime) {
        conditions.push(lte(testSheets.endTime, endDateTo));
    }

    // Equipment filters
    if (vehicleMake) {
        conditions.push(like(testSheets.vehicleMake, `%${vehicleMake}%`));
    }
    if (vehicleModel) {
        conditions.push(like(testSheets.vehicleModel, `%${vehicleModel}%`));
    }
    if (customer) {
        conditions.push(like(testSheets.customer, `%${customer}%`));
    }
    if (plantName) {
        conditions.push(like(testSheets.plantName, `%${plantName}%`));
    }

    // Reference filters
    if (techReference) {
        conditions.push(like(testSheets.techReference, `%${techReference}%`));
    }
    if (adminReference) {
        conditions.push(like(testSheets.adminReference, `%${adminReference}%`));
    }

    // Combine all conditions
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count
    const countQuery = db
        .select({ count: sql<number>`count(*)` })
        .from(testSheets)
        .where(whereClause);

    const countResult = await countQuery;
    const totalRecords = Number(countResult[0]?.count || 0);

    // Calculate pagination
    const totalPages = Math.ceil(totalRecords / pageSize);
    const offset = (page - 1) * pageSize;

    // Determine sort column
    let sortColumn;
    switch (sortBy) {
        case 'startTime':
            sortColumn = testSheets.startTime;
            break;
        case 'endTime':
            sortColumn = testSheets.endTime;
            break;
        case 'createdAt':
            sortColumn = testSheets.createdAt;
            break;
        case 'customer':
            sortColumn = testSheets.customer;
            break;
        case 'plantName':
            sortColumn = testSheets.plantName;
            break;
        default:
            sortColumn = testSheets.startTime;
    }

    // Build query with pagination and sorting
    const query = db
        .select({
            id: testSheets.id,
            userId: testSheets.userId,
            techReference: testSheets.techReference,
            adminReference: testSheets.adminReference,
            formType: testSheets.formType,
            startTime: testSheets.startTime,
            endTime: testSheets.endTime,
            instruction: testSheets.instruction,
            customer: testSheets.customer,
            plantName: testSheets.plantName,
            vehicleMake: testSheets.vehicleMake,
            vehicleModel: testSheets.vehicleModel,
            vehicleVoltage: testSheets.vehicleVoltage,
            serialEsn: testSheets.serialEsn,
            administrator: testSheets.administrator,
            technicianName: testSheets.technicianName,
            Test: testSheets.Test,
            StatusComment: testSheets.StatusComment,
            isDraft: testSheets.isDraft,
            createdAt: testSheets.createdAt,
            updatedAt: testSheets.updatedAt,
        })
        .from(testSheets)
        .where(whereClause)
        .orderBy(sortOrder === 'asc' ? asc(sortColumn) : desc(sortColumn))
        .limit(pageSize)
        .offset(offset);

    const data = await query;

    return {
        data,
        pagination: {
            page,
            pageSize,
            totalRecords,
            totalPages,
            hasNextPage: page < totalPages,
            hasPreviousPage: page > 1,
        },
        filters,
    };
}

/**
 * Get unique values for filter dropdowns
 */
export async function getFilterOptions() {
    const sheets = await db.select().from(testSheets);

    // Extract unique values
    const customers = [...new Set(sheets.map(s => s.customer).filter(Boolean))].sort();
    const plantNames = [...new Set(sheets.map(s => s.plantName).filter(Boolean))].sort();
    const vehicleMakes = [...new Set(sheets.map(s => s.vehicleMake).filter(Boolean))].sort();
    const vehicleModels = [...new Set(sheets.map(s => s.vehicleModel).filter(Boolean))].sort();
    const administrators = [...new Set(sheets.map(s => s.administrator).filter(Boolean))].sort();
    const technicians = [...new Set(sheets.map(s => s.technicianName).filter(Boolean))].sort();
    const statuses = [...new Set(sheets.map(s => s.Test).filter(Boolean))].sort();

    return {
        customers,
        plantNames,
        vehicleMakes,
        vehicleModels,
        administrators,
        technicians,
        statuses,
    };
}

/**
 * Quick search - simplified search for autocomplete
 */
export async function quickSearch(term: string, limit: number = 10) {
    if (!term || term.trim().length < 2) {
        return [];
    }

    const searchTerm = `%${term.trim()}%`;

    const results = await db
        .select({
            id: testSheets.id,
            techReference: testSheets.techReference,
            adminReference: testSheets.adminReference,
            customer: testSheets.customer,
            plantName: testSheets.plantName,
            vehicleMake: testSheets.vehicleMake,
            vehicleModel: testSheets.vehicleModel,
            startTime: testSheets.startTime,
        })
        .from(testSheets)
        .where(
            or(
                like(testSheets.techReference, searchTerm),
                like(testSheets.adminReference, searchTerm),
                like(testSheets.customer, searchTerm),
                like(testSheets.plantName, searchTerm),
                like(testSheets.vehicleMake, searchTerm),
                like(testSheets.vehicleModel, searchTerm),
                like(testSheets.serialEsn, searchTerm)
            )
        )
        .orderBy(desc(testSheets.startTime))
        .limit(limit);

    return results;
}

/**
 * Get search statistics
 */
export async function getSearchStats() {
    const totalSheets = await db
        .select({ count: sql<number>`count(*)` })
        .from(testSheets);

    const draftSheets = await db
        .select({ count: sql<number>`count(*)` })
        .from(testSheets)
        .where(eq(testSheets.isDraft, 1));

    const completedSheets = await db
        .select({ count: sql<number>`count(*)` })
        .from(testSheets)
        .where(eq(testSheets.isDraft, 0));

    const passedSheets = await db
        .select({ count: sql<number>`count(*)` })
        .from(testSheets)
        .where(eq(testSheets.Test, 'Test OK'));

    const failedSheets = await db
        .select({ count: sql<number>`count(*)` })
        .from(testSheets)
        .where(eq(testSheets.Test, 'Failed'));

    return {
        total: Number(totalSheets[0]?.count || 0),
        drafts: Number(draftSheets[0]?.count || 0),
        completed: Number(completedSheets[0]?.count || 0),
        passed: Number(passedSheets[0]?.count || 0),
        failed: Number(failedSheets[0]?.count || 0),
    };
}
