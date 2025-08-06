import { users, progress, practiceCalls, materials, type User, type InsertUser, type Progress, type InsertProgress, type PracticeCall, type InsertPracticeCall, type Material, type InsertMaterial } from "@shared/schema";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;

  // Progress operations
  getUserProgress(userId: string): Promise<Progress[]>;
  getProgress(userId: string, module: string): Promise<Progress | undefined>;
  upsertProgress(progress: InsertProgress): Promise<Progress>;

  // Practice call operations
  createPracticeCall(call: InsertPracticeCall): Promise<PracticeCall>;
  updatePracticeCall(id: string, updates: Partial<PracticeCall>): Promise<PracticeCall>;
  getUserPracticeCalls(userId: string): Promise<PracticeCall[]>;

  // Material operations
  getMaterials(tags?: string[]): Promise<Material[]>;
  createMaterial(material: InsertMaterial): Promise<Material>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async getUserProgress(userId: string): Promise<Progress[]> {
    return await db.select().from(progress).where(eq(progress.userId, userId));
  }

  async getProgress(userId: string, module: string): Promise<Progress | undefined> {
    const [prog] = await db
      .select()
      .from(progress)
      .where(and(eq(progress.userId, userId), eq(progress.module, module)));
    return prog || undefined;
  }

  async upsertProgress(progressData: InsertProgress): Promise<Progress> {
    const existing = await this.getProgress(progressData.userId, progressData.module);
    
    if (existing) {
      const [updated] = await db
        .update(progress)
        .set({ ...progressData, lastTouched: new Date() })
        .where(and(eq(progress.userId, progressData.userId), eq(progress.module, progressData.module)))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(progress)
        .values(progressData)
        .returning();
      return created;
    }
  }

  async createPracticeCall(callData: InsertPracticeCall): Promise<PracticeCall> {
    const [call] = await db
      .insert(practiceCalls)
      .values(callData)
      .returning();
    return call;
  }

  async updatePracticeCall(id: string, updates: Partial<PracticeCall>): Promise<PracticeCall> {
    const [updated] = await db
      .update(practiceCalls)
      .set(updates)
      .where(eq(practiceCalls.id, id))
      .returning();
    return updated;
  }

  async getUserPracticeCalls(userId: string): Promise<PracticeCall[]> {
    return await db
      .select()
      .from(practiceCalls)
      .where(eq(practiceCalls.userId, userId))
      .orderBy(desc(practiceCalls.startedAt));
  }

  async getMaterials(tags?: string[]): Promise<Material[]> {
    // TODO: Implement tag filtering with SQL arrays
    return await db.select().from(materials);
  }

  async createMaterial(materialData: InsertMaterial): Promise<Material> {
    const [material] = await db
      .insert(materials)
      .values(materialData)
      .returning();
    return material;
  }
}

export const storage = new DatabaseStorage();
