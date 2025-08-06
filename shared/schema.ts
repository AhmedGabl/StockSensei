import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, pgEnum, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const roleEnum = pgEnum("role", ["STUDENT", "TRAINER", "ADMIN"]);
export const progressStatusEnum = pgEnum("progress_status", ["NOT_STARTED", "IN_PROGRESS", "COMPLETED"]);
export const practiceCallOutcomeEnum = pgEnum("practice_call_outcome", ["PASSED", "IMPROVE", "N/A"]);
export const materialTypeEnum = pgEnum("material_type", ["PDF", "POWERPOINT", "VIDEO", "SCRIPT", "DOCUMENT"]);

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name"),
  role: roleEnum("role").notNull().default("STUDENT"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const progress = pgTable("progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  module: text("module").notNull(), // "SOP_1ST_CALL" | "SOP_4TH" | "VOIP" | "SCRM" | "CURRICULUM" | "REFERRALS"
  score: integer("score"),
  status: progressStatusEnum("status").notNull().default("NOT_STARTED"),
  attempts: integer("attempts").notNull().default(0),
  lastTouched: timestamp("last_touched").notNull().default(sql`now()`),
});

export const practiceCalls = pgTable("practice_calls", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  scenario: text("scenario").notNull(),
  startedAt: timestamp("started_at").notNull().default(sql`now()`),
  endedAt: timestamp("ended_at"),
  notes: text("notes"),
  outcome: practiceCallOutcomeEnum("outcome"),
});

export const materials = pgTable("materials", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  type: materialTypeEnum("type").notNull(),
  url: text("url"),
  filePath: text("file_path"), // Object storage file path
  fileName: text("file_name"), // Original filename
  fileSize: integer("file_size"), // File size in bytes
  tags: text("tags").array().notNull().default(sql`'{}'::text[]`),
  uploadedBy: varchar("uploaded_by").references(() => users.id),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  progress: many(progress),
  practiceCalls: many(practiceCalls),
}));

export const progressRelations = relations(progress, ({ one }) => ({
  user: one(users, {
    fields: [progress.userId],
    references: [users.id],
  }),
}));

export const practiceCallsRelations = relations(practiceCalls, ({ one }) => ({
  user: one(users, {
    fields: [practiceCalls.userId],
    references: [users.id],
  }),
}));

export const materialsRelations = relations(materials, ({ one }) => ({
  uploader: one(users, {
    fields: [materials.uploadedBy],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertProgressSchema = createInsertSchema(progress).omit({
  id: true,
  lastTouched: true,
});

export const insertPracticeCallSchema = createInsertSchema(practiceCalls).omit({
  id: true,
  startedAt: true,
});

export const insertMaterialSchema = createInsertSchema(materials).omit({
  id: true,
  createdAt: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertProgress = z.infer<typeof insertProgressSchema>;
export type Progress = typeof progress.$inferSelect;
export type InsertPracticeCall = z.infer<typeof insertPracticeCallSchema>;
export type PracticeCall = typeof practiceCalls.$inferSelect;
export type InsertMaterial = z.infer<typeof insertMaterialSchema>;
export type Material = typeof materials.$inferSelect;

// Auth schemas
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const registerSchema = loginSchema.extend({
  name: z.string().min(1),
});

export type LoginRequest = z.infer<typeof loginSchema>;
export type RegisterRequest = z.infer<typeof registerSchema>;
