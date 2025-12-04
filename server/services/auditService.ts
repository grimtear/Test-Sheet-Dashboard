/**
 * Audit Service
 * 
 * Comprehensive audit logging for tracking all data changes,
 * user actions, and system events with full context.
 */

import { db } from '../db';
import { auditLogs, users, type InsertAuditLog } from '@shared/schema';
import { eq, desc, and, gte, lte, like, or, sql } from 'drizzle-orm';
import type { Request } from 'express';

export type AuditAction =
    | 'CREATE'
    | 'UPDATE'
    | 'DELETE'
    | 'LOGIN'
    | 'LOGOUT'
    | 'VIEW'
    | 'EXPORT'
    | 'SEARCH';

export type AuditEntity =
    | 'test_sheets'
    | 'users'
    | 'test_items'
    | 'test_templates'
    | 'audit_logs';

export type AuditSeverity = 'info' | 'warning' | 'error' | 'critical';

export interface AuditLogOptions {
    userId?: string;
    userEmail: string;
    userName?: string;
    action: AuditAction;
    entity: AuditEntity;
    entityId?: string;
    changes?: Record<string, any>;
    oldValues?: Record<string, any>;
    newValues?: Record<string, any>;
    description?: string;
    severity?: AuditSeverity;
    ipAddress?: string;
    userAgent?: string;
    endpoint?: string;
    method?: string;
    req?: Request;
}

/**
 * Create an audit log entry
 */
export async function createAuditLog(options: AuditLogOptions) {
    try {
        const {
            userId,
            userEmail,
            userName,
            action,
            entity,
            entityId,
            changes,
            oldValues,
            newValues,
            description,
            severity = 'info',
            ipAddress,
            userAgent,
            endpoint,
            method,
            req,
        } = options;

        // Extract request metadata if request object provided
        const ip = ipAddress || req?.ip || req?.socket?.remoteAddress;
        const ua = userAgent || req?.get('user-agent');
        const ep = endpoint || req?.path;
        const mt = method || req?.method;

        const auditLog: InsertAuditLog = {
            userId: userId || null,
            userEmail,
            userName: userName || null,
            action,
            entity,
            entityId: entityId || null,
            changes: changes ? JSON.stringify(changes) : null,
            oldValues: oldValues ? JSON.stringify(oldValues) : null,
            newValues: newValues ? JSON.stringify(newValues) : null,
            ipAddress: ip || null,
            userAgent: ua || null,
            endpoint: ep || null,
            method: mt || null,
            description: description || null,
            severity,
            timestamp: Math.floor(Date.now() / 1000),
        };

        const result = await db.insert(auditLogs).values(auditLog).returning();

        console.log(`📋 Audit: ${action} ${entity}${entityId ? ` (${entityId})` : ''} by ${userEmail}`);

        return result[0];
    } catch (error) {
        console.error('Failed to create audit log:', error);
        // Don't throw - audit logging should never break the main flow
        return null;
    }
}

/**
 * Log test sheet creation
 */
export async function logTestSheetCreate(
    userId: string,
    userEmail: string,
    testSheetId: string,
    testSheetData: Record<string, any>,
    req?: Request
) {
    return createAuditLog({
        userId,
        userEmail,
        action: 'CREATE',
        entity: 'test_sheets',
        entityId: testSheetId,
        newValues: testSheetData,
        description: `Created test sheet: ${testSheetData.techReference}`,
        severity: 'info',
        req,
    });
}

/**
 * Log test sheet update
 */
export async function logTestSheetUpdate(
    userId: string,
    userEmail: string,
    testSheetId: string,
    oldData: Record<string, any>,
    newData: Record<string, any>,
    req?: Request
) {
    // Calculate changes
    const changes: Record<string, any> = {};
    for (const key in newData) {
        if (newData[key] !== oldData[key]) {
            changes[key] = {
                from: oldData[key],
                to: newData[key],
            };
        }
    }

    return createAuditLog({
        userId,
        userEmail,
        action: 'UPDATE',
        entity: 'test_sheets',
        entityId: testSheetId,
        changes,
        oldValues: oldData,
        newValues: newData,
        description: `Updated test sheet: ${newData.techReference || testSheetId}`,
        severity: 'info',
        req,
    });
}

/**
 * Log test sheet deletion
 */
export async function logTestSheetDelete(
    userId: string,
    userEmail: string,
    testSheetId: string,
    testSheetData: Record<string, any>,
    req?: Request
) {
    return createAuditLog({
        userId,
        userEmail,
        action: 'DELETE',
        entity: 'test_sheets',
        entityId: testSheetId,
        oldValues: testSheetData,
        description: `Deleted test sheet: ${testSheetData.techReference || testSheetId}`,
        severity: 'warning',
        req,
    });
}

/**
 * Log user login
 */
export async function logUserLogin(
    userId: string,
    userEmail: string,
    userName: string,
    req?: Request
) {
    return createAuditLog({
        userId,
        userEmail,
        userName,
        action: 'LOGIN',
        entity: 'users',
        entityId: userId,
        description: `User logged in: ${userName} (${userEmail})`,
        severity: 'info',
        req,
    });
}

/**
 * Log user logout
 */
export async function logUserLogout(
    userId: string,
    userEmail: string,
    userName: string,
    req?: Request
) {
    return createAuditLog({
        userId,
        userEmail,
        userName,
        action: 'LOGOUT',
        entity: 'users',
        entityId: userId,
        description: `User logged out: ${userName} (${userEmail})`,
        severity: 'info',
        req,
    });
}

/**
 * Log data export
 */
export async function logDataExport(
    userId: string,
    userEmail: string,
    exportType: string,
    entityCount: number,
    req?: Request
) {
    return createAuditLog({
        userId,
        userEmail,
        action: 'EXPORT',
        entity: 'test_sheets',
        description: `Exported ${entityCount} ${exportType} records`,
        severity: 'info',
        req,
    });
}

/**
 * Log search operation
 */
export async function logSearch(
    userId: string,
    userEmail: string,
    searchQuery: string,
    resultCount: number,
    req?: Request
) {
    return createAuditLog({
        userId,
        userEmail,
        action: 'SEARCH',
        entity: 'test_sheets',
        description: `Searched: "${searchQuery}" (${resultCount} results)`,
        severity: 'info',
        changes: { query: searchQuery, results: resultCount },
        req,
    });
}

/**
 * Get audit logs with pagination and filters
 */
export async function getAuditLogs(options: {
    userId?: string;
    action?: AuditAction;
    entity?: AuditEntity;
    entityId?: string;
    severity?: AuditSeverity;
    startDate?: number; // Unix timestamp
    endDate?: number;   // Unix timestamp
    search?: string;
    page?: number;
    limit?: number;
}) {
    const {
        userId,
        action,
        entity,
        entityId,
        severity,
        startDate,
        endDate,
        search,
        page = 1,
        limit = 50,
    } = options;

    // Build where conditions
    const conditions = [];

    if (userId) {
        conditions.push(eq(auditLogs.userId, userId));
    }

    if (action) {
        conditions.push(eq(auditLogs.action, action));
    }

    if (entity) {
        conditions.push(eq(auditLogs.entity, entity));
    }

    if (entityId) {
        conditions.push(eq(auditLogs.entityId, entityId));
    }

    if (severity) {
        conditions.push(eq(auditLogs.severity, severity));
    }

    if (startDate) {
        conditions.push(gte(auditLogs.timestamp, startDate));
    }

    if (endDate) {
        conditions.push(lte(auditLogs.timestamp, endDate));
    }

    if (search) {
        conditions.push(
            or(
                like(auditLogs.userEmail, `%${search}%`),
                like(auditLogs.userName, `%${search}%`),
                like(auditLogs.description, `%${search}%`),
                like(auditLogs.entityId, `%${search}%`)
            )!
        );
    }

    // Query with pagination
    const offset = (page - 1) * limit;

    const logs = await db
        .select()
        .from(auditLogs)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(auditLogs.timestamp))
        .limit(limit)
        .offset(offset);

    // Get total count
    const [countResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(auditLogs)
        .where(conditions.length > 0 ? and(...conditions) : undefined);

    const total = Number(countResult.count);

    return {
        logs,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
            hasMore: page * limit < total,
        },
    };
}

/**
 * Get audit statistics
 */
export async function getAuditStats(options: {
    userId?: string;
    startDate?: number;
    endDate?: number;
}) {
    const { userId, startDate, endDate } = options;

    const conditions = [];

    if (userId) {
        conditions.push(eq(auditLogs.userId, userId));
    }

    if (startDate) {
        conditions.push(gte(auditLogs.timestamp, startDate));
    }

    if (endDate) {
        conditions.push(lte(auditLogs.timestamp, endDate));
    }

    // Total logs
    const [totalResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(auditLogs)
        .where(conditions.length > 0 ? and(...conditions) : undefined);

    // Logs by action
    const actionStats = await db
        .select({
            action: auditLogs.action,
            count: sql<number>`count(*)`,
        })
        .from(auditLogs)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .groupBy(auditLogs.action);

    // Logs by entity
    const entityStats = await db
        .select({
            entity: auditLogs.entity,
            count: sql<number>`count(*)`,
        })
        .from(auditLogs)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .groupBy(auditLogs.entity);

    // Logs by severity
    const severityStats = await db
        .select({
            severity: auditLogs.severity,
            count: sql<number>`count(*)`,
        })
        .from(auditLogs)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .groupBy(auditLogs.severity);

    // Most active users
    const topUsers = await db
        .select({
            userEmail: auditLogs.userEmail,
            userName: auditLogs.userName,
            count: sql<number>`count(*)`,
        })
        .from(auditLogs)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .groupBy(auditLogs.userEmail, auditLogs.userName)
        .orderBy(desc(sql`count(*)`))
        .limit(10);

    return {
        total: Number(totalResult.count),
        byAction: actionStats.map(s => ({ action: s.action, count: Number(s.count) })),
        byEntity: entityStats.map(s => ({ entity: s.entity, count: Number(s.count) })),
        bySeverity: severityStats.map(s => ({ severity: s.severity, count: Number(s.count) })),
        topUsers: topUsers.map(u => ({
            email: u.userEmail,
            name: u.userName,
            count: Number(u.count),
        })),
    };
}

/**
 * Get recent activity for a specific entity
 */
export async function getEntityAuditHistory(
    entity: AuditEntity,
    entityId: string,
    limit: number = 20
) {
    const logs = await db
        .select()
        .from(auditLogs)
        .where(
            and(
                eq(auditLogs.entity, entity),
                eq(auditLogs.entityId, entityId)
            )
        )
        .orderBy(desc(auditLogs.timestamp))
        .limit(limit);

    return logs;
}

/**
 * Clean up old audit logs
 * 
 * @param daysToKeep Number of days to keep logs (default: 90)
 */
export async function cleanupOldAuditLogs(daysToKeep: number = 90) {
    const cutoffDate = Math.floor(Date.now() / 1000) - (daysToKeep * 24 * 60 * 60);

    const result = await db
        .delete(auditLogs)
        .where(lte(auditLogs.timestamp, cutoffDate));

    console.log(`🧹 Cleaned up audit logs older than ${daysToKeep} days`);

    return result;
}

export default {
    createAuditLog,
    logTestSheetCreate,
    logTestSheetUpdate,
    logTestSheetDelete,
    logUserLogin,
    logUserLogout,
    logDataExport,
    logSearch,
    getAuditLogs,
    getAuditStats,
    getEntityAuditHistory,
    cleanupOldAuditLogs,
};
