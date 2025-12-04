// ...existing code...
import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth, isAuthenticated } from "./simpleAuth";
import { appendTestSheetRow, getSheetsSummary } from "./googleSheets";
import pdfRoutes from "./routes/pdfRoutes";
import searchRoutes from "./routes/searchRoutes";
import notificationRoutes from "./routes/notificationRoutes";
import auditRoutes from "./routes/auditRoutes";
import adminRoutes from "./routes/adminRoutes";
import { closeBrowser } from "./services/pdfService";
import auditService from "./services/auditService";
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';
import fs from "fs";
import path from "path";

// Simple in-memory storage for development
const testSheets = new Map();
const testItems = new Map();

function generateId() {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

export function registerRoutes(app: Express): Server {
    // Return all test sheets from Google Sheets
    app.get("/api/test-sheets/all", isAuthenticated, async (_req, res) => {
        try {
            const { fetchAllRows } = await import("./googleSheets");
            const rows = await fetchAllRows();
            // Find indexes for relevant columns
            const createdAtIdx = 0; // Timestamp column (format: DD-MM-YYYY HH:mm:ss)
            const techRefIdx = 2; // adminReference
            const customerIdx = 7;
            const plantIdx = 8;
            const idIdx = 13; // userId (simulate as id)
            // Parse rows
            const sheets = rows.map((r, i) => {
                const dateStr = r[createdAtIdx] || "";
                const [d, m, y, h, min, s] = dateStr.match(/\d+/g) || [];
                if (!(d && m && y && h && min && s)) return null;
                const ts = new Date(`${y}-${m}-${d}T${h}:${min}:${s}`).getTime();
                if (!isFinite(ts) || ts <= 0) return null;
                return {
                    id: r[idIdx] || `sheet-${i}`,
                    techReference: r[techRefIdx] || "",
                    customer: r[customerIdx] || "",
                    plantName: r[plantIdx] || "",
                    createdAt: ts,
                };
            }).filter(s => s && typeof s.createdAt === 'number' && isFinite(s.createdAt) && s.createdAt > 0);
            res.json(sheets);
        } catch (error) {
            console.error("Error fetching all test sheets (Sheets):", error);
            res.status(500).json({ error: "Failed to fetch all test sheets" });
        }
    });
    // Development-only: Bulk insert test sheets with selectable date range
    app.post("/api/dev/bulk-insert-test-sheets", isAuthenticated, async (req, res) => {
        try {
            const { startDate, endDate, count = 20 } = req.body;
            const start = startDate ? new Date(startDate).getTime() : Date.now() - 30 * 24 * 60 * 60 * 1000;
            const end = endDate ? new Date(endDate).getTime() : Date.now();
            if (isNaN(start) || isNaN(end) || start > end) {
                return res.status(400).json({ error: "Invalid date range" });
            }
            const sheets = [];
            for (let i = 0; i < count; i++) {
                const timestamp = start + Math.floor(((end - start) * i) / (count - 1));
                const id = generateId();
                const testSheet = {
                    id,
                    userId: (req.session as any).userId || "dev-user",
                    techReference: `TS${Math.floor(Math.random() * 100000)}-${formatDate(timestamp)}`,
                    customer: `Customer ${i + 1}`,
                    plantName: `Plant ${((i % 5) + 1)}`,
                    createdAt: timestamp,
                    updatedAt: timestamp,
                    startTime: timestamp,
                };
                testSheets.set(id, testSheet);
                sheets.push(testSheet);
            }
            res.json({ inserted: sheets.length, sheets });
        } catch (error) {
            console.error("Bulk insert error:", error);
            res.status(500).json({ error: "Bulk insert failed" });
        }
    });
    // Get total test sheets created by each user (by email)
    app.get("/api/test-sheets/user-totals", isAuthenticated, async (_req: import("express").Request, res: import("express").Response) => {
        try {
            // Count sheets by user email (prefer sheet.email, fallback to userId)
            const totals: Record<string, number> = {};
            for (const sheet of testSheets.values()) {
                const email = sheet?.email || sheet?.userId || "Unknown";
                totals[email] = (totals[email] || 0) + 1;
            }
            res.json(totals);
        } catch (error) {
            console.error("Error fetching user sheet totals:", error);
            res.status(500).json({ error: "Failed to fetch user sheet totals" });
        }
    });

    // Get single test sheet by adminReference (Job Card)
    app.get("/api/test-sheets/job-card/:adminReference", isAuthenticated, async (req: import("express").Request, res: import("express").Response) => {
        try {
            const { adminReference } = req.params;
            // Find the sheet with matching adminReference
            const sheet = Array.from(testSheets.values()).find((s: any) => s.adminReference === adminReference);
            if (!sheet) {
                return res.status(404).json({ error: "Test sheet not found" });
            }
            res.json(sheet);
        } catch (error) {
            console.error("Error fetching test sheet by adminReference:", error);
            res.status(500).json({ error: "Failed to fetch test sheet" });
        }
    });

    // Helper for formatting date for techReference
    function formatDate(ts: number) {
        const d = new Date(ts);
        const pad = (n: number) => n.toString().padStart(2, "0");
        return `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    }
    const server = createServer(app);

    // Setup authentication
    setupAuth(app);

    // Swagger API Documentation
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
        customCss: '.swagger-ui .topbar { display: none }',
        customSiteTitle: 'NAE IT Technology API Docs',
    }));

    // Swagger JSON endpoint
    app.get('/api-docs.json', (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.send(swaggerSpec);
    });

    // PDF Generation Routes
    app.use("/api/pdf", pdfRoutes);

    // Search Routes
    app.use("/api/search", searchRoutes);

    // Notification Routes
    app.use("/api/notifications", notificationRoutes);

    // Audit Routes
    app.use("/api/audit", auditRoutes);

    // Admin Routes
    app.use("/api/admin", isAuthenticated, adminRoutes);

    // Authentication API endpoints (for consistency with frontend)
    app.get("/api/auth/user", isAuthenticated, async (req, res) => {
        try {
            const user = (req.session as any)?.user;
            if (user) {
                res.json(user);
            } else {
                res.status(401).json({ error: "Not authenticated" });
            }
        } catch (error) {
            console.error("Error fetching user:", error);
            res.status(500).json({ error: "Failed to fetch user" });
        }
    });

    app.post("/api/auth/complete-profile", isAuthenticated, async (req, res) => {
        try {
            const { firstName, lastName } = req.body;

            if (!firstName || !lastName) {
                return res.status(400).json({ error: "First name and last name are required" });
            }

            // Update user in session
            const user = (req.session as any)?.user;
            if (user) {
                user.firstName = firstName;
                user.lastName = lastName;
                (req.session as any).user = user;
                res.json(user);
            } else {
                res.status(401).json({ error: "Not authenticated" });
            }
        } catch (error) {
            console.error("Error updating profile:", error);
            res.status(500).json({ error: "Failed to update profile" });
        }
    });

    // Test endpoints (simplified for development)
    app.get("/api/test-sheets", isAuthenticated, async (req, res) => {
        try {
            const userId = (req.session as any).userId;
            const userSheets = Array.from(testSheets.values()).filter((sheet: any) => sheet.userId === userId);
            res.json(userSheets);
        } catch (error) {
            console.error("Error fetching test sheets:", error);
            res.status(500).json({ error: "Failed to fetch test sheets" });
        }
    });

    app.post("/api/test-sheets", isAuthenticated, async (req, res) => {
        try {
            const userId = (req.session as any).userId;
            const user = (req.session as any)?.user;
            const id = generateId();

            const now = Date.now();
            const testSheet = {
                id,
                userId,
                ...req.body,
                createdAt: req.body.createdAt ? req.body.createdAt : now,
                updatedAt: req.body.updatedAt ? req.body.updatedAt : now,
            };

            testSheets.set(id, testSheet);

            // Log audit trail
            await auditService.logTestSheetCreate(
                userId,
                user?.email || 'unknown',
                id,
                testSheet,
                req
            );

            try {
                await appendTestSheetRow(testSheet);
            } catch (e) {
                console.error("Sheets append failed:", e);
                // Do not fail the API if Sheets append fails
            }
            res.json(testSheet);
        } catch (error) {
            console.error("Error creating test sheet:", error);
            res.status(500).json({ error: "Failed to create test sheet" });
        }
    });

    // Get recent test sheets - MUST be before /:id route
    // Use Google Sheets data for recent test sheets
    app.get("/api/test-sheets/recent", isAuthenticated, async (_req, res) => {
        try {
            const { fetchAllRows } = await import("./googleSheets");
            const rows = await fetchAllRows();
            // Find indexes for relevant columns
            const createdAtIdx = 0; // Timestamp column (format: DD-MM-YYYY HH:mm:ss)
            const techRefIdx = 2; // adminReference
            const customerIdx = 7;
            const plantIdx = 8;
            const idIdx = 13; // userId (simulate as id)
            // Parse rows and sort by timestamp
            const sheets = rows.map((r, i) => {
                const dateStr = r[createdAtIdx] || "";
                const [d, m, y, h, min, s] = dateStr.match(/\d+/g) || [];
                let ts = 0;
                if (d && m && y && h && min && s) {
                    ts = new Date(`${y}-${m}-${d}T${h}:${min}:${s}`).getTime();
                }
                return {
                    id: r[idIdx] || `sheet-${i}`,
                    techReference: r[techRefIdx] || "",
                    customer: r[customerIdx] || "",
                    plantName: r[plantIdx] || "",
                    createdAt: ts,
                };
            })
                .filter((s: { createdAt: number }) => s.createdAt)
                .sort((a: { createdAt: number }, b: { createdAt: number }) => b.createdAt - a.createdAt)
                .slice(0, 5);
            res.json(sheets);
        } catch (error) {
            console.error("Error fetching recent test sheets (Sheets):", error);
            res.status(500).json({ error: "Failed to fetch recent test sheets" });
        }
    });

    // Get test sheet stats - MUST be before /:id route
    // Use in-memory testSheets for per-user dashboard stats
    app.get("/api/test-sheets/stats", isAuthenticated, async (_req, res) => {
        try {
            const { fetchAllRows } = await import("./googleSheets");
            const rows = await fetchAllRows();

            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const getStartOfWeek = (date: Date, weekStartsOn: number) => {
                const d = new Date(date);
                d.setHours(0, 0, 0, 0);
                const day = d.getDay();
                const diff = (day - weekStartsOn + 7) % 7;
                d.setDate(d.getDate() - diff);
                return d;
            };
            const weekStart = getStartOfWeek(now, 0); // Sunday

            const parseCreatedAt = (s: string): Date | null => {
                if (!s) return null;
                const nums = s.match(/\d+/g) || [];
                if (nums.length < 5) return null;
                const [dd, mm, yyyy, HH, MM, SS] = nums.map(Number);
                const d = new Date(yyyy, mm - 1, dd, HH, MM, SS ?? 0);
                return isNaN(d.getTime()) ? null : d;
            };

            let total = 0;
            let thisMonth = 0;
            let recent = 0;
            const recentByDayMap = new Map<string, number>();

            for (const r of rows) {
                const createdStr = String(r[0] || "");
                const d = parseCreatedAt(createdStr);
                if (!d) continue;
                total++;
                if (d >= startOfMonth && d <= now) thisMonth++;
                if (d >= weekStart && d <= now) {
                    recent++;
                    const key = d.toISOString().split('T')[0];
                    recentByDayMap.set(key, (recentByDayMap.get(key) || 0) + 1);
                }
            }

            res.json({
                total,
                thisMonth,
                recent,
                weekStartTs: weekStart.getTime(),
                weekStartISO: weekStart.toISOString(),
                recentByDay: Array.from(recentByDayMap.entries()).map(([date, count]) => ({ date, count })),
            });
        } catch (error) {
            console.error("Error fetching stats (Sheets):", error);
            res.status(500).json({ error: "Failed to fetch stats" });
        }
    });

    // Get single test sheet by ID - MUST be after specific routes
    app.get("/api/test-sheets/:id", isAuthenticated, async (req, res) => {
        try {
            const { id } = req.params;
            const sheet = testSheets.get(id);

            if (!sheet) {
                return res.status(404).json({ error: "Test sheet not found" });
            }

            res.json(sheet);
        } catch (error) {
            console.error("Error fetching test sheet:", error);
            res.status(500).json({ error: "Failed to fetch test sheet" });
        }
    });

    // Health check endpoint
    app.get("/api/health", (req, res) => {
        res.json({ status: "ok", timestamp: new Date().toISOString() });
    });

    // Save generated PDF to a local folder on Windows host
    // Body: { filename: string, dataUrl: string } where dataUrl is a data:image/png;base64 or data:application/pdf;base64
    app.post("/api/save-pdf", isAuthenticated, async (req, res) => {
        try {
            const { filename, dataUrl } = req.body || {};
            if (!filename || !dataUrl || typeof filename !== 'string' || typeof dataUrl !== 'string') {
                return res.status(400).json({ error: "filename and dataUrl are required" });
            }
            // Sanitize filename and ensure .pdf extension
            const safeName = filename.replace(/[^A-Za-z0-9-_\.]/g, "_");
            const finalName = safeName.toLowerCase().endsWith('.pdf') ? safeName : `${safeName}.pdf`;

            // Strip data URL prefix if present
            const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
            const buffer = Buffer.from(base64, 'base64');

            // Ensure target directory exists
            const targetDir = process.env.TS_SAVE_DIR || 'D:/Database/TestSheet';
            await fs.promises.mkdir(targetDir, { recursive: true });
            const outPath = path.join(targetDir, finalName);
            await fs.promises.writeFile(outPath, buffer);
            res.json({ ok: true, path: outPath.replace(/\\/g, '/') });
        } catch (error) {
            console.error("Error saving PDF:", error);
            res.status(500).json({ error: "Failed to save PDF" });
        }
    });

    // Summary from Google Sheets: total rows and counts grouped by plant name
    app.get("/api/google-sheets/summary", isAuthenticated, async (_req, res) => {
        try {
            const summary = await getSheetsSummary();
            res.json(summary);
        } catch (error) {
            console.error("Error reading sheets summary:", error);
            res.status(500).json({ error: "Failed to read sheets summary" });
        }
    });

    return server;
}
