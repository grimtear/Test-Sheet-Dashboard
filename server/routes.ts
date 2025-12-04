import type { Express } from "express";
import { createServer, type Server } from "http";
// import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./simpleAuth";
// import { insertTestSheetSchema, insertTestItemSchema } from "@shared/schema";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";
import { db } from "./db";
import { testSheets } from "@shared/schema";

// Simple storage for development
const memoryData = {
  users: new Map(),
  testSheets: new Map(),
  testItems: new Map(),
};

// Helper function to generate technology reference number
// Format: TS[Number][Date Time] e.g., TS391703-11-2025 13:07
function generateTechReference(): string {
  const now = new Date();
  const randomNum = Math.floor(Math.random() * 10000);
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');

  return `TS${randomNum}${day}-${month}-${year} ${hours}:${minutes}`;
}// Helper function to generate admin reference number
// Format: [UserInitials][Number]-[PlantName]-[SiteCode][Timestamp]
// e.g., CG01-CSM S64-Zi12441640
function generateAdminReference(
  firstName: string,
  lastName: string,
  userNumber: number,
  plantName: string,
  customer: string
): string {
  const initials = `${firstName[0].toUpperCase()}${lastName[0].toUpperCase()}`;
  const userRef = `${initials}${String(userNumber).padStart(2, '0')}`;

  // Extract site code from customer name (first 2 letters)
  const siteCode = customer.substring(0, 2).toUpperCase();

  // Generate timestamp (just digits)
  const timestamp = Date.now().toString().substring(5);

  return `${userRef}-${plantName}-${siteCode}${timestamp}`;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // ==================== AUTH ROUTES ====================

  // Get current user
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Complete user profile
  app.post('/api/auth/complete-profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { firstName, lastName } = req.body;

      if (!firstName || !lastName) {
        return res.status(400).json({ message: "First name and last name are required" });
      }

      const user = await storage.updateUserProfile(userId, firstName, lastName);
      res.json(user);
    } catch (error: any) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: error.message || "Failed to update profile" });
    }
  });

  // ==================== TEST SHEET ROUTES ====================

  // Create test sheet
  app.post('/api/test-sheets', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (!user.firstName || !user.lastName) {
        return res.status(400).json({ message: "Please complete your profile first" });
      }

      // Validate request body
      const validationSchema = insertTestSheetSchema.extend({
        testItems: z.array(insertTestItemSchema.omit({ testSheetId: true })),
      });

      const validationResult = validationSchema.safeParse(req.body);
      if (!validationResult.success) {
        const error = fromZodError(validationResult.error);
        return res.status(400).json({ message: error.message });
      }

      const data = validationResult.data;
      const testItemsData = data.testItems;

      // Generate reference numbers
      const techReference = generateTechReference();
      const adminReference = generateAdminReference(
        user.firstName,
        user.lastName,
        user.userNumber,
        data.plantName,
        data.customer
      );

      // Create test sheet
      const testSheet = await storage.createTestSheet({
        ...data,
        userId,
        techReference,
        adminReference,
        startTime: new Date(),
      });

      // Create test items
      if (testItemsData && testItemsData.length > 0) {
        await storage.createTestItems(
          testItemsData.map(item => ({
            ...item,
            testSheetId: testSheet.id,
          }))
        );
      }

      res.json(testSheet);
    } catch (error: any) {
      console.error("Error creating test sheet:", error);
      res.status(500).json({ message: error.message || "Failed to create test sheet" });
    }
  });

  // Get all test sheets for user
  app.get('/api/test-sheets', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const sheets = await storage.getUserTestSheets(userId);
      res.json(sheets);
    } catch (error: any) {
      console.error("Error fetching test sheets:", error);
      res.status(500).json({ message: error.message || "Failed to fetch test sheets" });
    }
  });

  // Get recent test sheets
  app.get('/api/test-sheets/recent', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const sheets = await storage.getRecentTestSheets(userId, 5);
      res.json(sheets);
    } catch (error: any) {
      console.error("Error fetching recent test sheets:", error);
      res.status(500).json({ message: error.message || "Failed to fetch recent test sheets" });
    }
  });

  // Get all test sheets (from all users) - shared dashboard
  app.get('/api/test-sheets/all', isAuthenticated, async (req: any, res) => {
    try {
      // Fetch all test sheets from database
      const allSheets = await db.query.testSheets.findMany({
        orderBy: (t, { desc }) => [desc(t.startTime)],
      });

      // Filter out sensitive info if needed, convert to plain objects
      const sheets = allSheets.map(sheet => ({
        ...sheet,
        startTime: sheet.startTime || 0,
      }));

      res.json(sheets);
    } catch (error: any) {
      console.error("Error fetching all test sheets:", error);
      res.status(500).json({ message: error.message || "Failed to fetch test sheets" });
    }
  });

  // Get test sheet stats
  app.get('/api/test-sheets/stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const stats = await storage.getTestSheetStats(userId);
      res.json(stats);
    } catch (error: any) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ message: error.message || "Failed to fetch stats" });
    }
  });

  // Get single test sheet with items
  app.get('/api/test-sheets/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;

      const sheet = await storage.getTestSheet(id);
      if (!sheet) {
        return res.status(404).json({ message: "Test sheet not found" });
      }

      // Verify ownership
      if (sheet.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const testItems = await storage.getTestItemsBySheetId(id);

      res.json({
        ...sheet,
        testItems,
      });
    } catch (error: any) {
      console.error("Error fetching test sheet:", error);
      res.status(500).json({ message: error.message || "Failed to fetch test sheet" });
    }
  });

  // Update test sheet
  app.patch('/api/test-sheets/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;

      const sheet = await storage.getTestSheet(id);
      if (!sheet) {
        return res.status(404).json({ message: "Test sheet not found" });
      }

      // Verify ownership
      if (sheet.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const updated = await storage.updateTestSheet(id, req.body);
      res.json(updated);
    } catch (error: any) {
      console.error("Error updating test sheet:", error);
      res.status(500).json({ message: error.message || "Failed to update test sheet" });
    }
  });

  // Delete test sheet
  app.delete('/api/test-sheets/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;

      const sheet = await storage.getTestSheet(id);
      if (!sheet) {
        return res.status(404).json({ message: "Test sheet not found" });
      }

      // Verify ownership
      if (sheet.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      await storage.deleteTestSheet(id);
      res.json({ message: "Test sheet deleted successfully" });
    } catch (error: any) {
      console.error("Error deleting test sheet:", error);
      res.status(500).json({ message: error.message || "Failed to delete test sheet" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
