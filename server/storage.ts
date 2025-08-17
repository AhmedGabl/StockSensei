import { 
  users, progress, practiceCalls, materials, tests, questions, options, attempts, answers, notes, tasks, testAssignments, trainingModules, problemReports, groups, groupMembers, materialViews,
  type User, type InsertUser, type Progress, type InsertProgress, type PracticeCall, type InsertPracticeCall, 
  type Material, type InsertMaterial, type Test, type InsertTest, type Question, type InsertQuestion,
  type Option, type InsertOption, type Attempt, type InsertAttempt, type Answer, type InsertAnswer,
  type Note, type InsertNote, type Task, type InsertTask, type TestAssignment, type InsertTestAssignment,
  type TrainingModule, type InsertTrainingModule, type ProblemReport, type InsertProblemReport,
  type Group, type InsertGroup, type GroupMember, type InsertGroupMember, type MaterialView, type InsertMaterialView
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, isNull, or, sql } from "drizzle-orm";

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
  updateMaterial(id: string, updates: Partial<Material>): Promise<Material>;
  deleteMaterial(id: string): Promise<void>; // Soft delete
  restoreMaterial(id: string): Promise<Material>;
  
  // Material view operations
  recordMaterialView(materialId: string, userId: string): Promise<MaterialView>;
  getMaterialViews(materialId: string): Promise<MaterialView[]>;
  getMaterialViewCount(materialId: string): Promise<number>;

  // Test operations
  getTests(publishedOnly?: boolean): Promise<Test[]>;
  getTest(id: string): Promise<Test | undefined>;
  createTest(test: InsertTest): Promise<Test>;
  updateTest(id: string, updates: Partial<Test>): Promise<Test>;
  
  // Question operations
  getTestQuestions(testId: string): Promise<(Question & { options?: Option[] })[]>;
  createQuestion(question: InsertQuestion): Promise<Question>;
  
  // Option operations
  createOption(option: InsertOption): Promise<Option>;
  
  // Attempt operations
  getUserAttempts(userId: string, testId?: string): Promise<Attempt[]>;
  createAttempt(attempt: InsertAttempt): Promise<Attempt>;
  updateAttempt(id: string, updates: Partial<Attempt>): Promise<Attempt>;
  getBestScore(userId: string, testId: string): Promise<number | null>;
  
  // Answer operations
  createAnswer(answer: InsertAnswer): Promise<Answer>;
  getAttemptAnswers(attemptId: string): Promise<Answer[]>;
  
  // Note operations
  getUserNotes(userId: string): Promise<Note[]>;
  createNote(note: InsertNote): Promise<Note>;
  deleteNote(noteId: string): Promise<void>;
  
  // Task operations
  getUserTasks(userId: string, status?: "OPEN" | "DONE"): Promise<Task[]>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: string, updates: Partial<Task>): Promise<Task>;
  
  // Test Assignment operations
  getUserAssignedTests(userId: string): Promise<(TestAssignment & { test: Test })[]>;
  getTestAssignments(testId: string): Promise<(TestAssignment & { user: User })[]>;
  createTestAssignment(assignment: InsertTestAssignment): Promise<TestAssignment>;
  updateTestAssignment(id: string, updates: Partial<TestAssignment>): Promise<TestAssignment>;
  deleteTestAssignment(id: string): Promise<void>;
  
  // Training Module operations
  getTrainingModules(): Promise<TrainingModule[]>;
  createTrainingModule(module: InsertTrainingModule): Promise<TrainingModule>;
  updateTrainingModule(id: string, updates: Partial<TrainingModule>): Promise<TrainingModule>;
  deleteTrainingModule(id: string): Promise<void>;
  reorderTrainingModules(moduleOrders: { id: string; orderIndex: number }[]): Promise<void>;

  // Problem Report operations
  getProblemReports(): Promise<(ProblemReport & { user: Pick<User, 'name' | 'email'> })[]>;
  getUserProblemReports(userId: string): Promise<ProblemReport[]>;
  createProblemReport(report: InsertProblemReport): Promise<ProblemReport>;
  updateProblemReport(id: string, updates: Partial<ProblemReport>): Promise<ProblemReport>;
  deleteProblemReport(id: string): Promise<void>;

  // Group operations
  getGroups(): Promise<(Group & { memberCount: number })[]>;
  getGroup(id: string): Promise<(Group & { members: (GroupMember & { user: User })[] }) | undefined>;
  createGroup(group: InsertGroup): Promise<Group>;
  updateGroup(id: string, updates: Partial<Group>): Promise<Group>;
  deleteGroup(id: string): Promise<void>;
  addGroupMember(member: InsertGroupMember): Promise<GroupMember>;
  removeGroupMember(groupId: string, userId: string): Promise<void>;
  getUserGroups(userId: string): Promise<(GroupMember & { group: Group })[]>;
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
    // Build the conditions
    let conditions = [isNull(materials.deletedAt)];
    
    // Add tag filtering
    if (tags && tags.length > 0) {
      const tagConditions = tags.map(tag => 
        sql`${materials.tags} @> ${JSON.stringify([tag])}`
      );
      const tagFilter = or(...tagConditions);
      if (tagFilter) {
        conditions.push(tagFilter);
      }
    }
    
    return await db.select().from(materials)
      .where(and(...conditions))
      .orderBy(desc(materials.createdAt));
  }

  async createMaterial(materialData: InsertMaterial): Promise<Material> {
    const [material] = await db
      .insert(materials)
      .values(materialData)
      .returning();
    return material;
  }

  async updateMaterial(id: string, updates: Partial<Material>): Promise<Material> {
    const [material] = await db
      .update(materials)
      .set(updates)
      .where(eq(materials.id, id))
      .returning();
    return material;
  }

  async deleteMaterial(id: string): Promise<void> {
    await db
      .update(materials)
      .set({ deletedAt: new Date() })
      .where(eq(materials.id, id));
  }

  async restoreMaterial(id: string): Promise<Material> {
    const [material] = await db
      .update(materials)
      .set({ deletedAt: null })
      .where(eq(materials.id, id))
      .returning();
    return material;
  }

  // Test operations
  async getTests(publishedOnly = false): Promise<Test[]> {
    if (publishedOnly) {
      return await db.select().from(tests)
        .where(eq(tests.isPublished, true))
        .orderBy(desc(tests.createdAt));
    }
    
    return await db.select().from(tests).orderBy(desc(tests.createdAt));
  }

  async getTest(id: string): Promise<Test | undefined> {
    const [test] = await db.select().from(tests).where(eq(tests.id, id));
    return test || undefined;
  }

  async createTest(testData: InsertTest): Promise<Test> {
    const [test] = await db
      .insert(tests)
      .values(testData)
      .returning();
    return test;
  }

  async deleteTest(testId: string): Promise<void> {
    // Delete all related data first
    await db.delete(answers).where(eq(answers.questionId, testId));
    await db.delete(attempts).where(eq(attempts.testId, testId));
    await db.delete(options).where(eq(options.questionId, testId));
    await db.delete(questions).where(eq(questions.testId, testId));
    await db.delete(testAssignments).where(eq(testAssignments.testId, testId));
    await db.delete(tests).where(eq(tests.id, testId));
  }

  async updateTest(id: string, updates: Partial<Test>): Promise<Test> {
    const [test] = await db
      .update(tests)
      .set(updates)
      .where(eq(tests.id, id))
      .returning();
    return test;
  }

  // Question operations  
  async getTestQuestions(testId: string): Promise<(Question & { options?: Option[] })[]> {
    const questionsWithOptions = await db
      .select({
        question: questions,
        option: options,
      })
      .from(questions)
      .leftJoin(options, eq(options.questionId, questions.id))
      .where(eq(questions.testId, testId))
      .orderBy(questions.createdAt);

    // Group options by question
    const questionMap = new Map<string, Question & { options: Option[] }>();
    
    for (const row of questionsWithOptions) {
      if (!questionMap.has(row.question.id)) {
        questionMap.set(row.question.id, {
          ...row.question,
          options: [],
        });
      }
      
      if (row.option) {
        questionMap.get(row.question.id)!.options.push(row.option);
      }
    }
    
    return Array.from(questionMap.values());
  }

  async createQuestion(questionData: InsertQuestion): Promise<Question> {
    const [question] = await db
      .insert(questions)
      .values(questionData)
      .returning();
    return question;
  }

  // Option operations
  async createOption(optionData: InsertOption): Promise<Option> {
    const [option] = await db
      .insert(options)
      .values(optionData)
      .returning();
    return option;
  }

  // Attempt operations
  async getUserAttempts(userId: string, testId?: string): Promise<Attempt[]> {
    if (testId) {
      return await db.select().from(attempts)
        .where(and(eq(attempts.userId, userId), eq(attempts.testId, testId)))
        .orderBy(desc(attempts.startedAt));
    }
    
    return await db.select().from(attempts)
      .where(eq(attempts.userId, userId))
      .orderBy(desc(attempts.startedAt));
  }

  async createAttempt(attemptData: InsertAttempt): Promise<Attempt> {
    const [attempt] = await db
      .insert(attempts)
      .values(attemptData)
      .returning();
    return attempt;
  }

  async updateAttempt(id: string, updates: Partial<Attempt>): Promise<Attempt> {
    const [attempt] = await db
      .update(attempts)
      .set(updates)
      .where(eq(attempts.id, id))
      .returning();
    return attempt;
  }

  async getBestScore(userId: string, testId: string): Promise<number | null> {
    const result = await db
      .select({ scorePercent: attempts.scorePercent })
      .from(attempts)
      .where(and(
        eq(attempts.userId, userId),
        eq(attempts.testId, testId)
      ))
      .orderBy(desc(attempts.scorePercent))
      .limit(1);
    
    return result[0]?.scorePercent || null;
  }

  // Answer operations
  async createAnswer(answerData: InsertAnswer): Promise<Answer> {
    const [answer] = await db
      .insert(answers)
      .values(answerData)
      .returning();
    return answer;
  }

  async getAttemptAnswers(attemptId: string): Promise<Answer[]> {
    return await db
      .select()
      .from(answers)
      .where(eq(answers.attemptId, attemptId));
  }

  // Note operations
  async getUserNotes(userId: string): Promise<Note[]> {
    return await db
      .select()
      .from(notes)
      .where(eq(notes.userId, userId))
      .orderBy(desc(notes.createdAt));
  }

  async createNote(noteData: InsertNote): Promise<Note> {
    const [note] = await db
      .insert(notes)
      .values(noteData)
      .returning();
    return note;
  }

  async deleteNote(noteId: string): Promise<void> {
    await db
      .delete(notes)
      .where(eq(notes.id, noteId));
  }

  // Task operations
  async getUserTasks(userId: string, status?: "OPEN" | "DONE"): Promise<Task[]> {
    if (status) {
      return await db.select().from(tasks)
        .where(and(eq(tasks.userId, userId), eq(tasks.status, status)))
        .orderBy(desc(tasks.createdAt));
    }
    
    return await db.select().from(tasks)
      .where(eq(tasks.userId, userId))
      .orderBy(desc(tasks.createdAt));
  }

  async createTask(taskData: InsertTask): Promise<Task> {
    const [task] = await db
      .insert(tasks)
      .values(taskData)
      .returning();
    return task;
  }

  async updateTask(id: string, updates: Partial<Task>): Promise<Task> {
    const [task] = await db
      .update(tasks)
      .set(updates)
      .where(eq(tasks.id, id))
      .returning();
    return task;
  }

  // Test Assignment operations
  async getUserAssignedTests(userId: string): Promise<(TestAssignment & { test: Test })[]> {
    return await db
      .select({
        id: testAssignments.id,
        testId: testAssignments.testId,
        userId: testAssignments.userId,
        assignedBy: testAssignments.assignedBy,
        assignedAt: testAssignments.assignedAt,
        dueDate: testAssignments.dueDate,
        isCompleted: testAssignments.isCompleted,
        completedAt: testAssignments.completedAt,
        maxAttempts: testAssignments.maxAttempts,
        test: tests
      })
      .from(testAssignments)
      .innerJoin(tests, eq(testAssignments.testId, tests.id))
      .where(eq(testAssignments.userId, userId))
      .orderBy(desc(testAssignments.assignedAt));
  }

  async getTestAssignments(testId: string): Promise<(TestAssignment & { user: User })[]> {
    return await db
      .select({
        id: testAssignments.id,
        testId: testAssignments.testId,
        userId: testAssignments.userId,
        assignedBy: testAssignments.assignedBy,
        assignedAt: testAssignments.assignedAt,
        dueDate: testAssignments.dueDate,
        isCompleted: testAssignments.isCompleted,
        completedAt: testAssignments.completedAt,
        maxAttempts: testAssignments.maxAttempts,
        user: users
      })
      .from(testAssignments)
      .innerJoin(users, eq(testAssignments.userId, users.id))
      .where(eq(testAssignments.testId, testId))
      .orderBy(desc(testAssignments.assignedAt));
  }

  async createTestAssignment(assignmentData: InsertTestAssignment): Promise<TestAssignment> {
    const [assignment] = await db
      .insert(testAssignments)
      .values(assignmentData)
      .returning();
    return assignment;
  }

  async updateTestAssignment(id: string, updates: Partial<TestAssignment>): Promise<TestAssignment> {
    const [assignment] = await db
      .update(testAssignments)
      .set(updates)
      .where(eq(testAssignments.id, id))
      .returning();
    return assignment;
  }

  async deleteTestAssignment(id: string): Promise<void> {
    await db
      .delete(testAssignments)
      .where(eq(testAssignments.id, id));
  }

  // Training Module operations
  async getTrainingModules(): Promise<TrainingModule[]> {
    return await db.select().from(trainingModules).orderBy(trainingModules.orderIndex);
  }

  async createTrainingModule(module: InsertTrainingModule): Promise<TrainingModule> {
    const [created] = await db.insert(trainingModules).values(module).returning();
    return created;
  }

  async updateTrainingModule(id: string, updates: Partial<TrainingModule>): Promise<TrainingModule> {
    const [updated] = await db
      .update(trainingModules)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(trainingModules.id, id))
      .returning();
    return updated;
  }

  async deleteTrainingModule(id: string): Promise<void> {
    await db.delete(trainingModules).where(eq(trainingModules.id, id));
  }

  async reorderTrainingModules(moduleOrders: { id: string; orderIndex: number }[]): Promise<void> {
    for (const { id, orderIndex } of moduleOrders) {
      await db
        .update(trainingModules)
        .set({ orderIndex, updatedAt: new Date() })
        .where(eq(trainingModules.id, id));
    }
  }

  // Problem Report operations
  async getProblemReports(): Promise<(ProblemReport & { user: Pick<User, 'name' | 'email'> })[]> {
    return await db
      .select({
        id: problemReports.id,
        userId: problemReports.userId,
        title: problemReports.title,
        description: problemReports.description,
        category: problemReports.category,
        priority: problemReports.priority,
        status: problemReports.status,
        adminNotes: problemReports.adminNotes,
        resolvedBy: problemReports.resolvedBy,
        resolvedAt: problemReports.resolvedAt,
        createdAt: problemReports.createdAt,
        updatedAt: problemReports.updatedAt,
        user: {
          name: users.name,
          email: users.email
        }
      })
      .from(problemReports)
      .leftJoin(users, eq(problemReports.userId, users.id))
      .orderBy(desc(problemReports.createdAt));
  }

  async getUserProblemReports(userId: string): Promise<ProblemReport[]> {
    return await db
      .select()
      .from(problemReports)
      .where(eq(problemReports.userId, userId))
      .orderBy(desc(problemReports.createdAt));
  }

  async createProblemReport(report: InsertProblemReport): Promise<ProblemReport> {
    const [created] = await db.insert(problemReports).values(report).returning();
    return created;
  }

  async updateProblemReport(id: string, updates: Partial<ProblemReport>): Promise<ProblemReport> {
    const [updated] = await db
      .update(problemReports)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(problemReports.id, id))
      .returning();
    return updated;
  }

  async deleteProblemReport(id: string): Promise<void> {
    await db.delete(problemReports).where(eq(problemReports.id, id));
  }

  // Group operations
  async getGroups(): Promise<(Group & { memberCount: number })[]> {
    return await db
      .select({
        id: groups.id,
        name: groups.name,
        description: groups.description,
        createdAt: groups.createdAt,
        memberCount: sql<number>`count(${groupMembers.id})::int`
      })
      .from(groups)
      .leftJoin(groupMembers, eq(groups.id, groupMembers.groupId))
      .groupBy(groups.id)
      .orderBy(groups.name);
  }

  async getGroup(id: string): Promise<(Group & { members: (GroupMember & { user: User })[] }) | undefined> {
    const [group] = await db.select().from(groups).where(eq(groups.id, id));
    if (!group) return undefined;

    const members = await db
      .select({
        id: groupMembers.id,
        groupId: groupMembers.groupId,
        userId: groupMembers.userId,
        role: groupMembers.role,
        joinedAt: groupMembers.joinedAt,
        user: {
          id: users.id,
          email: users.email,
          name: users.name,
          role: users.role,
          passwordHash: users.passwordHash,
          createdAt: users.createdAt
        }
      })
      .from(groupMembers)
      .innerJoin(users, eq(groupMembers.userId, users.id))
      .where(eq(groupMembers.groupId, id))
      .orderBy(users.name);

    return { ...group, members };
  }

  async createGroup(group: InsertGroup): Promise<Group> {
    const [created] = await db.insert(groups).values(group).returning();
    return created;
  }

  async updateGroup(id: string, updates: Partial<Group>): Promise<Group> {
    const [updated] = await db
      .update(groups)
      .set(updates)
      .where(eq(groups.id, id))
      .returning();
    return updated;
  }

  async deleteGroup(id: string): Promise<void> {
    await db.delete(groups).where(eq(groups.id, id));
  }

  async addGroupMember(member: InsertGroupMember): Promise<GroupMember> {
    const [created] = await db.insert(groupMembers).values(member).returning();
    return created;
  }

  async removeGroupMember(groupId: string, userId: string): Promise<void> {
    await db
      .delete(groupMembers)
      .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId)));
  }

  async getUserGroups(userId: string): Promise<(GroupMember & { group: Group })[]> {
    return await db
      .select({
        id: groupMembers.id,
        groupId: groupMembers.groupId,
        userId: groupMembers.userId,
        role: groupMembers.role,
        joinedAt: groupMembers.joinedAt,
        group: {
          id: groups.id,
          name: groups.name,
          description: groups.description,
          createdAt: groups.createdAt
        }
      })
      .from(groupMembers)
      .innerJoin(groups, eq(groupMembers.groupId, groups.id))
      .where(eq(groupMembers.userId, userId))
      .orderBy(groups.name);
  }

  // Material view operations
  async recordMaterialView(materialId: string, userId: string): Promise<MaterialView> {
    try {
      // Try to create a new view record
      const [view] = await db
        .insert(materialViews)
        .values({ materialId, userId })
        .returning();
      return view;
    } catch (error) {
      // If it already exists, update the viewed_at timestamp
      const [view] = await db
        .update(materialViews)
        .set({ viewedAt: new Date() })
        .where(and(eq(materialViews.materialId, materialId), eq(materialViews.userId, userId)))
        .returning();
      return view;
    }
  }

  async getMaterialViews(materialId: string): Promise<MaterialView[]> {
    return await db
      .select()
      .from(materialViews)
      .where(eq(materialViews.materialId, materialId))
      .orderBy(desc(materialViews.viewedAt));
  }

  async getMaterialViewCount(materialId: string): Promise<number> {
    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(materialViews)
      .where(eq(materialViews.materialId, materialId));
    return result.count;
  }

  // Quiz/Test operations
  async createTest(data: Omit<Test, 'id' | 'createdAt'>): Promise<Test> {
    const [test] = await db
      .insert(tests)
      .values(data)
      .returning();
    return test;
  }

  async getTests(includeUnpublished = false): Promise<Test[]> {
    const query = db.select().from(tests);
    
    if (!includeUnpublished) {
      query.where(eq(tests.isPublished, true));
    }
    
    return await query.orderBy(desc(tests.createdAt));
  }

  async getTest(id: string): Promise<Test | null> {
    const [test] = await db
      .select()
      .from(tests)
      .where(eq(tests.id, id));
    return test || null;
  }

  async updateTest(id: string, updates: Partial<Test>): Promise<Test> {
    const [test] = await db
      .update(tests)
      .set(updates)
      .where(eq(tests.id, id))
      .returning();
    return test;
  }

  async deleteTest(id: string): Promise<void> {
    await db.delete(tests).where(eq(tests.id, id));
  }

  async createQuestion(data: Omit<Question, 'id'>): Promise<Question> {
    const [question] = await db
      .insert(questions)
      .values(data)
      .returning();
    return question;
  }

  async getTestQuestions(testId: string): Promise<Question[]> {
    return await db
      .select()
      .from(questions)
      .where(eq(questions.testId, testId))
      .orderBy(questions.id);
  }

  async createOption(data: Omit<Option, 'id'>): Promise<Option> {
    const [option] = await db
      .insert(options)
      .values(data)
      .returning();
    return option;
  }

  async getQuestionOptions(questionId: string): Promise<Option[]> {
    return await db
      .select()
      .from(options)
      .where(eq(options.questionId, questionId))
      .orderBy(options.id);
  }
}

export const storage = new DatabaseStorage();
