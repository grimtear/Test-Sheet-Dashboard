/**
 * useAudit Hook
 * 
 * Custom React hooks for accessing and managing audit logs
 */

import { useQuery } from '@tanstack/react-query';

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

export interface AuditLog {
    id: string;
    userId: string | null;
    userEmail: string;
    userName: string | null;
    action: AuditAction;
    entity: AuditEntity;
    entityId: string | null;
    changes: string | null;
    oldValues: string | null;
    newValues: string | null;
    ipAddress: string | null;
    userAgent: string | null;
    endpoint: string | null;
    method: string | null;
    description: string | null;
    severity: AuditSeverity;
    timestamp: number;
    createdAt: number;
}

export interface AuditLogFilters {
    userId?: string;
    action?: AuditAction;
    entity?: AuditEntity;
    entityId?: string;
    severity?: AuditSeverity;
    startDate?: number;
    endDate?: number;
    search?: string;
    page?: number;
    limit?: number;
}

/**
 * Get audit logs with filtering and pagination
 */
export function useAuditLogs(filters: AuditLogFilters = {}) {
    return useQuery({
        queryKey: ['auditLogs', filters],
        queryFn: async () => {
            const params = new URLSearchParams();

            Object.entries(filters).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== '') {
                    params.append(key, String(value));
                }
            });

            const res = await fetch(`/api/audit/logs?${params.toString()}`, {
                credentials: 'include',
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to fetch audit logs');
            }

            return res.json();
        },
        staleTime: 30000, // 30 seconds
    });
}

/**
 * Get audit statistics
 */
export function useAuditStats(options: {
    userId?: string;
    startDate?: number;
    endDate?: number;
} = {}) {
    return useQuery({
        queryKey: ['auditStats', options],
        queryFn: async () => {
            const params = new URLSearchParams();

            Object.entries(options).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    params.append(key, String(value));
                }
            });

            const res = await fetch(`/api/audit/stats?${params.toString()}`, {
                credentials: 'include',
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to fetch audit statistics');
            }

            return res.json();
        },
        staleTime: 60000, // 1 minute
    });
}

/**
 * Get audit history for a specific entity
 */
export function useEntityAuditHistory(
    entity: AuditEntity,
    entityId: string,
    limit: number = 20
) {
    return useQuery({
        queryKey: ['entityAuditHistory', entity, entityId, limit],
        queryFn: async () => {
            const res = await fetch(
                `/api/audit/entity/${entity}/${entityId}?limit=${limit}`,
                { credentials: 'include' }
            );

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to fetch entity audit history');
            }

            return res.json();
        },
        enabled: !!entity && !!entityId,
        staleTime: 30000,
    });
}

/**
 * Get audit logs for a specific user
 */
export function useUserAuditLogs(
    userId: string,
    options: { page?: number; limit?: number } = {}
) {
    return useQuery({
        queryKey: ['userAuditLogs', userId, options],
        queryFn: async () => {
            const params = new URLSearchParams();

            if (options.page) params.append('page', String(options.page));
            if (options.limit) params.append('limit', String(options.limit));

            const res = await fetch(
                `/api/audit/user/${userId}?${params.toString()}`,
                { credentials: 'include' }
            );

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to fetch user audit logs');
            }

            return res.json();
        },
        enabled: !!userId,
        staleTime: 30000,
    });
}

/**
 * Get recent audit activity (last 24 hours)
 */
export function useRecentAuditActivity(limit: number = 50) {
    return useQuery({
        queryKey: ['recentAuditActivity', limit],
        queryFn: async () => {
            const res = await fetch(`/api/audit/recent?limit=${limit}`, {
                credentials: 'include',
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to fetch recent audit activity');
            }

            return res.json();
        },
        staleTime: 30000,
        refetchInterval: 60000, // Refetch every minute for live updates
    });
}

/**
 * Get available audit actions
 */
export function useAuditActions() {
    return useQuery({
        queryKey: ['auditActions'],
        queryFn: async () => {
            const res = await fetch('/api/audit/actions', {
                credentials: 'include',
            });

            if (!res.ok) {
                throw new Error('Failed to fetch audit actions');
            }

            const data = await res.json();
            return data.actions as AuditAction[];
        },
        staleTime: Infinity, // Never refetch (static list)
    });
}

/**
 * Get available audit entities
 */
export function useAuditEntities() {
    return useQuery({
        queryKey: ['auditEntities'],
        queryFn: async () => {
            const res = await fetch('/api/audit/entities', {
                credentials: 'include',
            });

            if (!res.ok) {
                throw new Error('Failed to fetch audit entities');
            }

            const data = await res.json();
            return data.entities as AuditEntity[];
        },
        staleTime: Infinity, // Never refetch (static list)
    });
}

/**
 * Helper to parse JSON fields from audit logs
 */
export function parseAuditLogChanges(log: AuditLog) {
    return {
        changes: log.changes ? JSON.parse(log.changes) : null,
        oldValues: log.oldValues ? JSON.parse(log.oldValues) : null,
        newValues: log.newValues ? JSON.parse(log.newValues) : null,
    };
}

/**
 * Helper to format audit log timestamp
 */
export function formatAuditTimestamp(timestamp: number) {
    return new Date(timestamp * 1000).toLocaleString();
}

/**
 * Helper to get severity color
 */
export function getSeverityColor(severity: AuditSeverity): string {
    switch (severity) {
        case 'info':
            return 'blue';
        case 'warning':
            return 'yellow';
        case 'error':
            return 'orange';
        case 'critical':
            return 'red';
        default:
            return 'gray';
    }
}

/**
 * Helper to get action icon
 */
export function getActionIcon(action: AuditAction): string {
    switch (action) {
        case 'CREATE':
            return '➕';
        case 'UPDATE':
            return '✏️';
        case 'DELETE':
            return '🗑️';
        case 'LOGIN':
            return '🔓';
        case 'LOGOUT':
            return '🔒';
        case 'VIEW':
            return '👁️';
        case 'EXPORT':
            return '📤';
        case 'SEARCH':
            return '🔍';
        default:
            return '📋';
    }
}
