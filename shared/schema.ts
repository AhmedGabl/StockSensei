import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, pgEnum, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const roleEnum = pgEnum("role", ["STUDENT", "TRAINER", "ADMIN"]);
export const progressStatusEnum = pgEnum("progress_status", ["NOT_STARTED", "IN_PROGRESS", "COMPLETED"]);
export const practiceCallOutcomeEnum = pgEnum("practice_call_outcome", ["PASSED", "IMPROVE", "N/A"]);
export const materialTypeEnum = pgEnum("material_type", ["PDF", "POWERPOINT", "VIDEO", "SCRIPT", "DOCUMENT"]);
export const questionTypeEnum = pgEnum("question_type", ["MCQ", "TRUE_FALSE"]);
export const taskStatusEnum = pgEnum("task_status", ["OPEN", "DONE"]);

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
  sizeBytes: integer("size_bytes"), // Added for new requirements
  posterUrl: text("poster_url"), // For video thumbnails
  deletedAt: timestamp("deleted_at"), // For soft delete
  tags: text("tags").array().notNull().default(sql`'{}'::text[]`),
  uploadedBy: varchar("uploaded_by").references(() => users.id),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

// Tests system
export const tests = pgTable("tests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  isPublished: boolean("is_published").notNull().default(false),
  createdById: varchar("created_by_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const questions = pgTable("questions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  testId: varchar("test_id").notNull().references(() => tests.id, { onDelete: "cascade" }),
  kind: questionTypeEnum("kind").notNull(),
  text: text("text").notNull(),
  explanation: text("explanation"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const options = pgTable("options", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  questionId: varchar("question_id").notNull().references(() => questions.id, { onDelete: "cascade" }),
  text: text("text").notNull(),
  isCorrect: boolean("is_correct").notNull().default(false),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

// Test Assignments - which tests are assigned to which students
export const testAssignments = pgTable("test_assignments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  testId: varchar("test_id").notNull().references(() => tests.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  assignedBy: varchar("assigned_by").notNull().references(() => users.id),
  assignedAt: timestamp("assigned_at").notNull().default(sql`now()`),
  dueDate: timestamp("due_date"),
  isCompleted: boolean("is_completed").notNull().default(false),
  completedAt: timestamp("completed_at"),
});

export const attempts = pgTable("attempts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  testId: varchar("test_id").notNull().references(() => tests.id),
  assignmentId: varchar("assignment_id").references(() => testAssignments.id),
  scorePercent: integer("score_percent"),
  startedAt: timestamp("started_at").notNull().default(sql`now()`),
  submittedAt: timestamp("submitted_at"),
});

export const answers = pgTable("answers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  attemptId: varchar("attempt_id").notNull().references(() => attempts.id, { onDelete: "cascade" }),
  questionId: varchar("question_id").notNull().references(() => questions.id),
  optionId: varchar("option_id").references(() => options.id), // For MCQ
  valueBool: boolean("value_bool"), // For TRUE_FALSE
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

// Notes and Tasks system
export const notes = pgTable("notes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  authorId: varchar("author_id").notNull().references(() => users.id),
  body: text("body").notNull(),
  isVisibleToStudent: boolean("is_visible_to_student").notNull().default(false),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const trainingModules = pgTable("training_modules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  isEnabled: boolean("is_enabled").notNull().default(true),
  orderIndex: integer("order_index").notNull().default(0),
  scenarios: text("scenarios").array().notNull().default(sql`'{}'::text[]`),
  estimatedDuration: integer("estimated_duration").notNull().default(30), // in minutes
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const tasks = pgTable("tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  authorId: varchar("author_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  details: text("details"),
  dueAt: timestamp("due_at"),
  status: taskStatusEnum("status").notNull().default("OPEN"),
  completedAt: timestamp("completed_at"),
  completionComment: text("completion_comment"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  progress: many(progress),
  practiceCalls: many(practiceCalls),
  uploadedMaterials: many(materials),
  createdTests: many(tests),
  attempts: many(attempts),
  testAssignments: many(testAssignments, { relationName: "user_assignments" }),
  assignedTests: many(testAssignments, { relationName: "assigned_tests" }),
  notes: many(notes, { relationName: "user_notes" }),
  authoredNotes: many(notes, { relationName: "authored_notes" }),
  tasks: many(tasks, { relationName: "user_tasks" }),
  authoredTasks: many(tasks, { relationName: "authored_tasks" }),
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

export const testsRelations = relations(tests, ({ one, many }) => ({
  createdBy: one(users, {
    fields: [tests.createdById],
    references: [users.id],
  }),
  questions: many(questions),
  attempts: many(attempts),
  assignments: many(testAssignments),
}));

export const testAssignmentsRelations = relations(testAssignments, ({ one }) => ({
  test: one(tests, {
    fields: [testAssignments.testId],
    references: [tests.id],
  }),
  user: one(users, {
    fields: [testAssignments.userId],
    references: [users.id],
  }),
  assignedBy: one(users, {
    fields: [testAssignments.assignedBy],
    references: [users.id],
  }),
}));

export const questionsRelations = relations(questions, ({ one, many }) => ({
  test: one(tests, {
    fields: [questions.testId],
    references: [tests.id],
  }),
  options: many(options),
  answers: many(answers),
}));

export const optionsRelations = relations(options, ({ one, many }) => ({
  question: one(questions, {
    fields: [options.questionId],
    references: [questions.id],
  }),
  answers: many(answers),
}));

export const attemptsRelations = relations(attempts, ({ one, many }) => ({
  user: one(users, {
    fields: [attempts.userId],
    references: [users.id],
  }),
  test: one(tests, {
    fields: [attempts.testId],
    references: [tests.id],
  }),
  answers: many(answers),
}));

export const answersRelations = relations(answers, ({ one }) => ({
  attempt: one(attempts, {
    fields: [answers.attemptId],
    references: [attempts.id],
  }),
  question: one(questions, {
    fields: [answers.questionId],
    references: [questions.id],
  }),
  option: one(options, {
    fields: [answers.optionId],
    references: [options.id],
  }),
}));

export const notesRelations = relations(notes, ({ one }) => ({
  user: one(users, {
    fields: [notes.userId],
    references: [users.id],
    relationName: "user_notes",
  }),
  author: one(users, {
    fields: [notes.authorId],
    references: [users.id],
    relationName: "authored_notes",
  }),
}));

export const tasksRelations = relations(tasks, ({ one }) => ({
  user: one(users, {
    fields: [tasks.userId],
    references: [users.id],
    relationName: "user_tasks",
  }),
  author: one(users, {
    fields: [tasks.authorId],
    references: [users.id],
    relationName: "authored_tasks",
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

export const insertTestSchema = createInsertSchema(tests).omit({
  id: true,
  createdAt: true,
});

export const insertQuestionSchema = createInsertSchema(questions).omit({
  id: true,
  createdAt: true,
});

export const insertOptionSchema = createInsertSchema(options).omit({
  id: true,
  createdAt: true,
});

export const insertAttemptSchema = createInsertSchema(attempts).omit({
  id: true,
  startedAt: true,
});

export const insertAnswerSchema = createInsertSchema(answers).omit({
  id: true,
  createdAt: true,
});

export const insertNoteSchema = createInsertSchema(notes).omit({
  id: true,
  createdAt: true,
});

export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  createdAt: true,
});

export const insertTestAssignmentSchema = createInsertSchema(testAssignments).omit({
  id: true,
  assignedAt: true,
});

export const insertTrainingModuleSchema = createInsertSchema(trainingModules).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
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
export type InsertTest = z.infer<typeof insertTestSchema>;
export type Test = typeof tests.$inferSelect;
export type InsertQuestion = z.infer<typeof insertQuestionSchema>;
export type Question = typeof questions.$inferSelect;
export type InsertOption = z.infer<typeof insertOptionSchema>;
export type Option = typeof options.$inferSelect;
export type InsertAttempt = z.infer<typeof insertAttemptSchema>;
export type Attempt = typeof attempts.$inferSelect;
export type InsertAnswer = z.infer<typeof insertAnswerSchema>;
export type Answer = typeof answers.$inferSelect;
export type InsertNote = z.infer<typeof insertNoteSchema>;
export type Note = typeof notes.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Task = typeof tasks.$inferSelect;
export type InsertTestAssignment = z.infer<typeof insertTestAssignmentSchema>;
export type TestAssignment = typeof testAssignments.$inferSelect;
export type TrainingModule = typeof trainingModules.$inferSelect;
export type InsertTrainingModule = z.infer<typeof insertTrainingModuleSchema>;

// Auth schemas
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const registerSchema = loginSchema.extend({
  name: z.string().min(1),
});

// Test creation schema with nested questions and options
export const createTestSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  questions: z.array(z.object({
    kind: z.enum(["MCQ", "TRUE_FALSE"]),
    text: z.string().min(1),
    explanation: z.string().optional(),
    options: z.array(z.object({
      text: z.string().min(1),
      isCorrect: z.boolean(),
    })).optional(), // Only for MCQ
  })).min(1),
});

// Test attempt submission schema
export const submitAttemptSchema = z.object({
  answers: z.array(z.object({
    questionId: z.string(),
    optionId: z.string().optional(), // For MCQ
    valueBool: z.boolean().optional(), // For TRUE_FALSE
  })),
});

export type LoginRequest = z.infer<typeof loginSchema>;
export type RegisterRequest = z.infer<typeof registerSchema>;
export type CreateTestRequest = z.infer<typeof createTestSchema>;
export type SubmitAttemptRequest = z.infer<typeof submitAttemptSchema>;
