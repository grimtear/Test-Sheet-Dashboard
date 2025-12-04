import express from "express";
import memorystore from "memorystore";
import session from "express-session";
import { db } from "./db";
import { users, userLogins } from "@shared/schema";
import { eq } from "drizzle-orm";

// Simple in-memory storage for development
const usersMap = new Map();
const usersByEmail = new Map();

export function setupAuth(app: express.Express) {
    const MemoryStore = memorystore(session);
    app.use(
        session({
            secret: process.env.SESSION_SECRET || "local-dev-secret-change-in-production",
            resave: false,
            saveUninitialized: false,
            store: new MemoryStore({ checkPeriod: 86400000 }), // 24 hours
            cookie: {
                secure: false, // Set to true in production with HTTPS
                maxAge: 24 * 60 * 60 * 1000, // 24 hours
            },
        })
    );

    // Unified login endpoint
    app.post("/api/auth/login", async (req, res) => {
        const { username, email } = req.body;


        if (!username || !email) {
            return res.status(400).json({ error: "Username and email required" });
        }

        // Restrict login to allowed domains
        const allowedDomains = ["@nae.co.za", "@gmail.com"];
        const emailLower = String(email).toLowerCase();
        if (!allowedDomains.some(domain => emailLower.endsWith(domain))) {
            return res.status(403).json({ error: "Email domain not allowed. Only @nae.co.za and @gmail.com accounts can log in." });
        }

        try {
            // Create or get user from database
            let dbUser = await db.query.users.findFirst({
                where: eq(users.email, email),
            });

            if (!dbUser) {
                // Create new user
                const result = await db.insert(users).values({
                    email,
                    firstName: username,
                    createdAt: Math.floor(Date.now() / 1000),
                    updatedAt: Math.floor(Date.now() / 1000),
                }).returning();
                dbUser = result[0];
            }

            // Log the login
            try {
                const ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown';
                const userAgent = req.headers['user-agent'] || 'unknown';

                await db.insert(userLogins).values({
                    userId: dbUser.id,
                    email: dbUser.email || email,
                    firstName: dbUser.firstName || username,
                    loginTime: Math.floor(Date.now() / 1000),
                    ipAddress: String(ipAddress),
                    userAgent: String(userAgent),
                    createdAt: Math.floor(Date.now() / 1000),
                });
            } catch (logError) {
                console.error("Failed to log login:", logError);
                // Continue even if logging fails
            }

            // Set session
            (req.session as any).userId = dbUser.id;
            (req.session as any).user = {
                id: dbUser.id,
                email: dbUser.email,
                firstName: dbUser.firstName,
                lastName: dbUser.lastName,
                createdAt: dbUser.createdAt,
            };

            res.json({ success: true, user: (req.session as any).user });
        } catch (error) {
            // Improved error logging for debugging
            console.error("Login failed with a database error:", error);
            // For development, send error details in response (remove in production)
            res.status(500).json({ error: "Login failed", details: String(error) });
        }
    });

    // Unified logout endpoint
    app.post("/api/auth/logout", (req, res) => {
        req.session.destroy((err) => {
            if (err) {
                return res.status(500).json({ error: "Logout failed" });
            }
            res.json({ success: true });
        });
    });

    // Browser-friendly logout (keep /api/auth/logout for redirect)
    const redirectLogout = (req: express.Request, res: express.Response) => {
        req.session.destroy((_err) => {
            res.redirect("/");
        });
    };
    app.all("/api/auth/logout", redirectLogout);

    // Unified get current user endpoint
    app.get("/api/auth/user", (req, res) => {
        const user = (req.session as any)?.user;
        if (user) {
            res.json(user);
        } else {
            res.status(401).json({ error: "Not authenticated" });
        }
    });
}

export function isAuthenticated(req: express.Request, res: express.Response, next: express.NextFunction) {
    const user = (req.session as any)?.user;
    if (user) {
        req.user = user;
        next();
    } else {
        res.status(401).json({ error: "Authentication required" });
    }
}

// Extend Express Request type
declare global {
    namespace Express {
        interface Request {
            user?: any;
        }
    }
}