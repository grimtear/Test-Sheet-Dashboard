/**
 * Audit Routes
 * 
 * API endpoints for accessing and managing audit logs
 */

import { Router } from 'express';
import auditService from '../services/auditService';
import type { AuditAction, AuditEntity, AuditSeverity } from '../services/auditService';

const router = Router();

/**
 * GET /api/audit/logs
 * Get audit logs with filtering and pagination
 */
router.get('/logs', async (req, res) => {
    try {
        const {
            userId,
            action,
            entity,
            entityId,
            severity,
            startDate,
            endDate,
            search,
            page,
            limit,
        } = req.query;

        const result = await auditService.getAuditLogs({
            userId: userId as string,
            action: action as AuditAction,
            entity: entity as AuditEntity,
            entityId: entityId as string,
            severity: severity as AuditSeverity,
            startDate: startDate ? parseInt(startDate as string) : undefined,
            endDate: endDate ? parseInt(endDate as string) : undefined,
            search: search as string,
            page: page ? parseInt(page as string) : undefined,
            limit: limit ? parseInt(limit as string) : undefined,
        });

        res.json({
            success: true,
            ...result,
        });
    } catch (error) {
        console.error('Error fetching audit logs:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch audit logs',
        });
    }
});

/**
 * GET /api/audit/stats
 * Get audit statistics
 */
router.get('/stats', async (req, res) => {
    try {
        const { userId, startDate, endDate } = req.query;

        const stats = await auditService.getAuditStats({
            userId: userId as string,
            startDate: startDate ? parseInt(startDate as string) : undefined,
            endDate: endDate ? parseInt(endDate as string) : undefined,
        });

        res.json({
            success: true,
            stats,
        });
    } catch (error) {
        console.error('Error fetching audit stats:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch audit statistics',
        });
    }
});

/**
 * GET /api/audit/entity/:entity/:entityId
 * Get audit history for a specific entity
 */
router.get('/entity/:entity/:entityId', async (req, res) => {
    try {
        const { entity, entityId } = req.params;
        const { limit } = req.query;

        const history = await auditService.getEntityAuditHistory(
            entity as AuditEntity,
            entityId,
            limit ? parseInt(limit as string) : undefined
        );

        res.json({
            success: true,
            history,
        });
    } catch (error) {
        console.error('Error fetching entity audit history:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch entity audit history',
        });
    }
});

/**
 * GET /api/audit/user/:userId
 * Get audit logs for a specific user
 */
router.get('/user/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { page, limit } = req.query;

        const result = await auditService.getAuditLogs({
            userId,
            page: page ? parseInt(page as string) : undefined,
            limit: limit ? parseInt(limit as string) : undefined,
        });

        res.json({
            success: true,
            ...result,
        });
    } catch (error) {
        console.error('Error fetching user audit logs:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch user audit logs',
        });
    }
});

/**
 * GET /api/audit/recent
 * Get recent audit activity (last 24 hours)
 */
router.get('/recent', async (req, res) => {
    try {
        const { limit } = req.query;
        const oneDayAgo = Math.floor(Date.now() / 1000) - (24 * 60 * 60);

        const result = await auditService.getAuditLogs({
            startDate: oneDayAgo,
            limit: limit ? parseInt(limit as string) : 50,
        });

        res.json({
            success: true,
            ...result,
        });
    } catch (error) {
        console.error('Error fetching recent audit logs:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch recent audit logs',
        });
    }
});

/**
 * POST /api/audit/cleanup
 * Clean up old audit logs (admin only)
 */
router.post('/cleanup', async (req, res) => {
    try {
        const { daysToKeep } = req.body;

        // Validate daysToKeep
        const days = daysToKeep ? parseInt(daysToKeep) : 90;
        if (days < 7) {
            return res.status(400).json({
                success: false,
                error: 'Cannot delete logs newer than 7 days',
            });
        }

        await auditService.cleanupOldAuditLogs(days);

        res.json({
            success: true,
            message: `Cleaned up audit logs older than ${days} days`,
        });
    } catch (error) {
        console.error('Error cleaning up audit logs:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to clean up audit logs',
        });
    }
});

/**
 * GET /api/audit/actions
 * Get list of all available audit actions
 */
router.get('/actions', (req, res) => {
    const actions: AuditAction[] = [
        'CREATE',
        'UPDATE',
        'DELETE',
        'LOGIN',
        'LOGOUT',
        'VIEW',
        'EXPORT',
        'SEARCH',
    ];

    res.json({
        success: true,
        actions,
    });
});

/**
 * GET /api/audit/entities
 * Get list of all available entities
 */
router.get('/entities', (req, res) => {
    const entities: AuditEntity[] = [
        'test_sheets',
        'users',
        'test_items',
        'test_templates',
        'audit_logs',
    ];

    res.json({
        success: true,
        entities,
    });
});

export default router;
