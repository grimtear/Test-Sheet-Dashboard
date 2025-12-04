import {
  users,
  testSheets,
  testItems,
  testTemplates,
  type User,
  type UpsertUser,
  type TestSheet,
  type InsertTestSheet,
  type TestItem,
  type InsertTestItem,
  type TestTemplate,
  type InsertTestTemplate,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, sql } from "drizzle-orm";

// Storage interface with all CRUD operations
export interface IStorage {
  // User operations (Required for Auth)
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(userData: Omit<UpsertUser, 'id'>): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserProfile(id: string, firstName: string, lastName: string): Promise<User>;
  getUserCount(userInitials: string): Promise<number>;

  // Test sheet operations
  createTestSheet(sheet: InsertTestSheet): Promise<TestSheet>;
  getTestSheet(id: string): Promise<TestSheet | undefined>;
  getUserTestSheets(userId: string): Promise<TestSheet[]>;
  getRecentTestSheets(userId: string, limit: number): Promise<TestSheet[]>;
  updateTestSheet(id: string, sheet: Partial<InsertTestSheet>): Promise<TestSheet>;
  deleteTestSheet(id: string): Promise<void>;
  getTestSheetStats(userId: string): Promise<{ total: number; thisMonth: number; recent: number }>;

  // Test items operations
  createTestItems(items: InsertTestItem[]): Promise<TestItem[]>;
  getTestItemsBySheetId(sheetId: string): Promise<TestItem[]>;

  // Test template operations
  getDefaultTemplate(): Promise<TestTemplate | undefined>;
  createTemplate(template: InsertTestTemplate): Promise<TestTemplate>;
}

export class DatabaseStorage implements IStorage {
  // User operations (Required for Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(userData: Omit<UpsertUser, 'id'>): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .returning();
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUserProfile(id: string, firstName: string, lastName: string): Promise<User> {
    // Get current user to determine next user number
    const existingUser = await this.getUser(id);
    const initials = `${firstName[0].toUpperCase()}${lastName[0].toUpperCase()}`;

    // Count existing users with same initials to assign next number
    const userNumber = existingUser?.userNumber ||
      await this.getUserCount(initials) + 1;

    const [user] = await db
      .update(users)
      .set({
        firstName,
        lastName,
        userNumber,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async getUserCount(userInitials: string): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(
        sql`CONCAT(UPPER(LEFT(${users.firstName}, 1)), UPPER(LEFT(${users.lastName}, 1))) = ${userInitials}`
      );
    return Number(result[0]?.count || 0);
  }

  // Test sheet operations
  async createTestSheet(sheet: InsertTestSheet): Promise<TestSheet> {
    const [testSheet] = await db
      .insert(testSheets)
      .values(sheet)
      .returning();
    return testSheet;
  }

  async getTestSheet(id: string): Promise<TestSheet | undefined> {
    const [sheet] = await db
      .select()
      .from(testSheets)
      .where(eq(testSheets.id, id));
    return sheet;
  }

  async getUserTestSheets(userId: string): Promise<TestSheet[]> {
    return await db
      .select()
      .from(testSheets)
      .where(eq(testSheets.userId, userId))
      .orderBy(desc(testSheets.startTime));
  }

  async getRecentTestSheets(userId: string, limit: number = 5): Promise<TestSheet[]> {
    return await db
      .select()
      .from(testSheets)
      .where(eq(testSheets.userId, userId))
      .orderBy(desc(testSheets.startTime))
      .limit(limit);
  }

  async updateTestSheet(id: string, sheet: Partial<InsertTestSheet>): Promise<TestSheet> {
    const [updated] = await db
      .update(testSheets)
      .set({
        ...sheet,
        updatedAt: new Date(),
      })
      .where(eq(testSheets.id, id))
      .returning();
    return updated;
  }

  async deleteTestSheet(id: string): Promise<void> {
    await db.delete(testSheets).where(eq(testSheets.id, id));
  }

  async getTestSheetStats(userId: string): Promise<{ total: number; thisMonth: number; recent: number }> {
    // Total count
    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(testSheets)
      .where(eq(testSheets.userId, userId));

    const total = Number(totalResult[0]?.count || 0);

    // This month count
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const monthResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(testSheets)
      .where(
        and(
          eq(testSheets.userId, userId),
          gte(testSheets.startTime, firstDayOfMonth)
        )
      );

    const thisMonth = Number(monthResult[0]?.count || 0);

    // Recent (last 7 days)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const recentResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(testSheets)
      .where(
        and(
          eq(testSheets.userId, userId),
          gte(testSheets.startTime, sevenDaysAgo)
        )
      );

    const recent = Number(recentResult[0]?.count || 0);

    return { total, thisMonth, recent };
  }

  // Test items operations
  async createTestItems(items: InsertTestItem[]): Promise<TestItem[]> {
    if (items.length === 0) return [];
    return await db.insert(testItems).values(items).returning();
  }

  async getTestItemsBySheetId(sheetId: string): Promise<TestItem[]> {
    return await db
      .select()
      .from(testItems)
      .where(eq(testItems.testSheetId, sheetId));
  }

  // Test template operations
  async getDefaultTemplate(): Promise<TestTemplate | undefined> {
    const [template] = await db
      .select()
      .from(testTemplates)
      .where(eq(testTemplates.isDefault, 1));
    return template;
  }

  async createTemplate(template: InsertTestTemplate): Promise<TestTemplate> {
    const [created] = await db
      .insert(testTemplates)
      .values(template)
      .returning();
    return created;
  }
}

export const storage = new DatabaseStorage();
