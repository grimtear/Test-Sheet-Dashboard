
import { Router } from 'express';
import { db } from '../db';
import { userLogins, testSheets, users } from '../../shared/schema';
import { sql, desc, count, max } from 'drizzle-orm';
import { getTestSheetStats } from '../googleSheets';

const router = Router();

// Get test sheet statistics for admin analytics
router.get('/test-sheets-stats', async (req, res) => {
    try {
        const stats = await getTestSheetStats();
        res.json(stats);
    } catch (error) {
        console.error('Failed to fetch test sheet stats:', error);
        res.status(500).json({ error: 'Failed to fetch test sheet statistics' });
    }
});

/**
 * Get user activity statistics
 * Returns login count, last login, test sheet count, and last test sheet for each user
 */
router.get('/user-activity', async (req, res) => {
    try {
        // Get unique users with their login stats
        const loginStats = await db
            .select({
                email: userLogins.email,
                firstName: userLogins.firstName,
                lastLogin: sql<number>`COALESCE(MAX(${userLogins.loginTime}), 0)`.as('lastLogin'),
                loginCount: count(userLogins.id).as('loginCount'),
            })
            .from(userLogins)
            .groupBy(userLogins.email, userLogins.firstName);

        // Get test sheet stats for each user
        const testSheetStats = await db
            .select({
                administrator: testSheets.administrator,
                lastTestSheet: sql<number>`COALESCE(MAX(${testSheets.startTime}), 0)`.as('lastTestSheet'),
                testSheetCount: count(testSheets.id).as('testSheetCount'),
            })
            .from(testSheets)
            .groupBy(testSheets.administrator);

        // Combine the data
        const userActivity = loginStats.map(login => {
            const sheets = testSheetStats.find(s =>
                s.administrator?.toLowerCase() === login.firstName?.toLowerCase()
            );

            return {
                email: login.email,
                displayName: login.firstName || login.email?.split('@')[0] || 'Unknown',
                // Convert lastLogin from Unix seconds to JS ms for frontend compatibility
                lastLogin: login.lastLogin ? login.lastLogin * 1000 : null,
                loginCount: login.loginCount,
                lastTestSheet: sheets?.lastTestSheet ? sheets.lastTestSheet * 1000 : null,
                testSheetCount: sheets?.testSheetCount || 0,
            };
        });

        // Sort by last login (most recent first)
        userActivity.sort((a, b) => (b.lastLogin || 0) - (a.lastLogin || 0));

        res.json(userActivity);
    } catch (error) {
        console.error('Failed to fetch user activity:', error);
        res.status(500).json({ error: 'Failed to fetch user activity' });
    }
});

/**
 * Get login statistics
 * Returns today's login count and unique users
 */
router.get('/login-stats', async (req, res) => {
    try {
        const now = Date.now();
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayStartTimestamp = Math.floor(todayStart.getTime() / 1000);

        // Get today's logins
        const todayLogins = await db
            .select({
                email: userLogins.email,
            })
            .from(userLogins)
            .where(sql`${userLogins.loginTime} >= ${todayStartTimestamp}`);

        const uniqueEmails = new Set(todayLogins.map(l => l.email));

        res.json({
            todayCount: todayLogins.length,
            todayUniqueUsers: uniqueEmails.size,
        });
    } catch (error) {
        console.error('Failed to fetch login stats:', error);
        res.status(500).json({ error: 'Failed to fetch login stats' });
    }
});

/**
 * Get test sheet statistics
 * Returns test sheet counts by user and daily breakdown
 */
router.get('/sheets-stats', async (req, res) => {
    try {
        const thirtyDaysAgo = Math.floor((Date.now() - 30 * 24 * 60 * 60 * 1000) / 1000);

        // Get test sheets count for last 30 days by user
        const last30Days = await db
            .select({
                email: users.email,
                count: count(testSheets.id).as('count')
            })
            .from(testSheets)
            .leftJoin(users, sql`${testSheets.administrator} = ${users.firstName}`)
            .where(sql`${testSheets.startTime} > 0 AND ${testSheets.startTime} >= ${thirtyDaysAgo}`)
            .groupBy(users.email, testSheets.administrator);

        // Get daily test sheet counts for the last 30 days by user
        const dailyStats = await db
            .select({
                email: users.email,
                date: sql`strftime('%Y-%m-%d', datetime(${testSheets.startTime}, 'unixepoch')) as date`,
                count: count(testSheets.id).as('count')
            })
            .from(testSheets)
            .leftJoin(users, sql`${testSheets.administrator} = ${users.firstName}`)
            .where(sql`${testSheets.startTime} > 0 AND ${testSheets.startTime} >= ${thirtyDaysAgo}`)
            .groupBy(users.email, sql`date`);

        // Format the daily stats by user email
        const byDay: Record<string, Array<{ date: string; count: number }>> = {};

        dailyStats.forEach(stat => {
            if (!stat.email) return;
            if (!byDay[stat.email]) {
                byDay[stat.email] = [];
            }
            byDay[stat.email].push({
                date: stat.date as string,
                count: stat.count
            });
        });

        res.json({
            last30Days: last30Days.map(stat => ({
                email: stat.email || 'unknown',
                count: stat.count
            })),
            byDay
        });
    } catch (error) {
        console.error('Failed to fetch sheets stats:', error);
        res.status(500).json({ error: 'Failed to fetch sheets statistics' });
    }
});

export default router;
