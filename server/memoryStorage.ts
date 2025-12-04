// Simple in-memory storage implementation
// This is for development purposes - data will be lost when server restarts

import {
    type User,
    type UpsertUser,
    type TestSheet,
    type InsertTestSheet,
    type TestItem,
    type InsertTestItem,
    type TestTemplate,
    type InsertTestTemplate,
} from "@shared/schema";

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

export class MemoryStorage implements IStorage {
    private users: Map<string, User> = new Map();
    private testSheets: Map<string, TestSheet> = new Map();
    private testItems: Map<string, TestItem> = new Map();
    private testTemplates: Map<string, TestTemplate> = new Map();
    private usersByEmail: Map<string, string> = new Map(); // email -> userId mapping

    constructor() {
        // Create default template
        const defaultTemplate: TestTemplate = {
            id: 'default-template',
            name: 'Default Tests',
            testNames: JSON.stringify(['GPS', 'GSM', 'Ignition', 'Power Supply', 'Communication Test', 'System Diagnostic']),
            isDefault: 1,
            createdAt: Math.floor(Date.now() / 1000),
            updatedAt: Math.floor(Date.now() / 1000),
        };
        this.testTemplates.set(defaultTemplate.id, defaultTemplate);
    }

    private generateId(): string {
        return Math.random().toString(36).substring(2) + Date.now().toString(36);
    }

    // User operations
    async getUser(id: string): Promise<User | undefined> {
        return this.users.get(id);
    }

    async getUserByEmail(email: string): Promise<User | undefined> {
        const userId = this.usersByEmail.get(email);
        if (userId) {
            return this.users.get(userId);
        }
        return undefined;
    }

    async createUser(userData: Omit<UpsertUser, 'id'>): Promise<User> {
        const id = this.generateId();
        const user: User = {
            id,
            userNumber: this.users.size + 1,
            ...userData,
            createdAt: Math.floor(Date.now() / 1000),
            updatedAt: Math.floor(Date.now() / 1000),
        };

        this.users.set(id, user);
        if (user.email) {
            this.usersByEmail.set(user.email, id);
        }

        return user;
    }

    async upsertUser(userData: UpsertUser): Promise<User> {
        if (userData.id && this.users.has(userData.id)) {
            const existingUser = this.users.get(userData.id)!;
            const updatedUser: User = {
                ...existingUser,
                ...userData,
                updatedAt: Math.floor(Date.now() / 1000),
            };
            this.users.set(userData.id, updatedUser);
            return updatedUser;
        } else {
            return this.createUser(userData);
        }
    }

    async updateUserProfile(id: string, firstName: string, lastName: string): Promise<User> {
        const user = this.users.get(id);
        if (!user) {
            throw new Error('User not found');
        }

        const updatedUser: User = {
            ...user,
            firstName,
            lastName,
            updatedAt: Math.floor(Date.now() / 1000),
        };

        this.users.set(id, updatedUser);
        return updatedUser;
    }

    async getUserCount(userInitials: string): Promise<number> {
        return Array.from(this.users.values()).filter(user =>
            user.firstName?.startsWith(userInitials) || user.lastName?.startsWith(userInitials)
        ).length;
    }

    // Test sheet operations
    async createTestSheet(sheet: InsertTestSheet): Promise<TestSheet> {
        const id = this.generateId();
        const testSheet: TestSheet = {
            id,
            ...sheet,
            createdAt: Math.floor(Date.now() / 1000),
            updatedAt: Math.floor(Date.now() / 1000),
        };

        this.testSheets.set(id, testSheet);
        return testSheet;
    }

    async getTestSheet(id: string): Promise<TestSheet | undefined> {
        return this.testSheets.get(id);
    }

    async getUserTestSheets(userId: string): Promise<TestSheet[]> {
        return Array.from(this.testSheets.values())
            .filter(sheet => sheet.userId === userId)
            .sort((a, b) => b.createdAt - a.createdAt);
    }

    async getRecentTestSheets(userId: string, limit: number = 5): Promise<TestSheet[]> {
        const userSheets = await this.getUserTestSheets(userId);
        return userSheets.slice(0, limit);
    }

    async updateTestSheet(id: string, sheet: Partial<InsertTestSheet>): Promise<TestSheet> {
        const existing = this.testSheets.get(id);
        if (!existing) {
            throw new Error('Test sheet not found');
        }

        const updated: TestSheet = {
            ...existing,
            ...sheet,
            updatedAt: Math.floor(Date.now() / 1000),
        };

        this.testSheets.set(id, updated);
        return updated;
    }

    async deleteTestSheet(id: string): Promise<void> {
        this.testSheets.delete(id);
        // Also delete related test items
        for (const [itemId, item] of this.testItems.entries()) {
            if (item.testSheetId === id) {
                this.testItems.delete(itemId);
            }
        }
    }

    async getTestSheetStats(userId: string): Promise<{ total: number; thisMonth: number; recent: number }> {
        const userSheets = await this.getUserTestSheets(userId);
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfMonthTimestamp = Math.floor(startOfMonth.getTime() / 1000);

        return {
            total: userSheets.length,
            thisMonth: userSheets.filter(sheet => sheet.createdAt >= startOfMonthTimestamp).length,
            recent: Math.min(userSheets.length, 5),
        };
    }

    // Test items operations
    async createTestItems(items: InsertTestItem[]): Promise<TestItem[]> {
        const createdItems: TestItem[] = [];

        for (const item of items) {
            const id = this.generateId();
            const testItem: TestItem = {
                id,
                ...item,
                createdAt: Math.floor(Date.now() / 1000),
            };

            this.testItems.set(id, testItem);
            createdItems.push(testItem);
        }

        return createdItems;
    }

    async getTestItemsBySheetId(sheetId: string): Promise<TestItem[]> {
        return Array.from(this.testItems.values())
            .filter(item => item.testSheetId === sheetId)
            .sort((a, b) => a.createdAt - b.createdAt);
    }

    // Test template operations
    async getDefaultTemplate(): Promise<TestTemplate | undefined> {
        return Array.from(this.testTemplates.values()).find(template => template.isDefault === 1);
    }

    async createTemplate(template: InsertTestTemplate): Promise<TestTemplate> {
        const id = this.generateId();
        const testTemplate: TestTemplate = {
            id,
            ...template,
            createdAt: Math.floor(Date.now() / 1000),
            updatedAt: Math.floor(Date.now() / 1000),
        };

        this.testTemplates.set(id, testTemplate);
        return testTemplate;
    }
}

export const storage = new MemoryStorage();