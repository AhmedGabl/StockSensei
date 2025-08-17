import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { aiTrainingService } from "./aiService";
import { loginSchema, registerSchema, insertProblemReportSchema, insertGroupSchema, insertGroupMemberSchema } from "@shared/schema";
import bcrypt from "bcrypt";
import { z } from "zod";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import { getChatResponse, analyzePracticeCall } from "./openai";
import type { ChatMessage } from "./openai";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { email, password, name } = registerSchema.parse(req.body);
      
      // Check if user exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);

      // Create user
      const user = await storage.createUser({
        email,
        passwordHash,
        name,
        role: "STUDENT"
      });

      // Initialize progress for all modules
      const modules = ["SOP_1ST_CALL", "SOP_4TH", "SOP_UNIT", "SOP_1ST_MONTH", "VOIP", "SCRM", "CURRICULUM", "REFERRALS"];
      for (const module of modules) {
        await storage.upsertProgress({
          userId: user.id,
          module,
          status: "NOT_STARTED",
          attempts: 0
        });
      }

      // Set session after successful registration and ensure it's saved
      (req as any).session.userId = user.id;
      
      // Force session save for deployment compatibility
      (req as any).session.save((err: any) => {
        if (err) {
          console.error("Session save error:", err);
        }
        res.json({ user: { id: user.id, email: user.email, name: user.name, role: user.role } });
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const isValid = await bcrypt.compare(password, user.passwordHash);
      if (!isValid) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Set session and ensure it's saved
      (req as any).session.userId = user.id;
      console.log("Setting session userId:", { userId: user.id, sessionID: (req as any).sessionID });
      
      // Force session save for deployment compatibility
      (req as any).session.save((err: any) => {
        if (err) {
          console.error("Session save error:", err);
          return res.status(500).json({ message: "Failed to save session" });
        }
        console.log("Session saved successfully for login:", { userId: user.id, sessionID: (req as any).sessionID });
        res.json({ user: { id: user.id, email: user.email, name: user.name, role: user.role } });
      });
    } catch (error) {
      console.error("Login error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    (req as any).session.destroy();
    res.json({ message: "Logged out" });
  });

  // Protected route middleware
  const requireAuth = async (req: any, res: any, next: any) => {
    if (!req.session?.userId) {
      console.log("Auth check failed: No session or userId", { 
        sessionExists: !!req.session, 
        userId: req.session?.userId,
        sessionID: req.sessionID 
      });
      return res.status(401).json({ message: "Authentication required" });
    }
    
    const user = await storage.getUser(req.session.userId);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }
    
    req.user = user;
    next();
  };

  const requireAdmin = async (req: any, res: any, next: any) => {
    if (!req.session?.userId) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    const user = await storage.getUser(req.session.userId);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }
    
    if (user.role !== "ADMIN") {
      return res.status(403).json({ message: "Admin access required" });
    }
    
    req.user = user;
    next();
  };

  // User routes
  app.get("/api/me", requireAuth, (req: any, res) => {
    const { passwordHash, ...user } = req.user;
    console.log("User authenticated successfully:", { userId: user.id, email: user.email });
    res.json({ user });
  });

  // Progress routes
  app.get("/api/progress", requireAuth, async (req: any, res) => {
    try {
      const progress = await storage.getUserProgress(req.user.id);
      res.json({ progress });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/progress/upsert", requireAuth, async (req: any, res) => {
    try {
      const progressData = {
        userId: req.user.id,
        ...req.body
      };
      
      const updatedProgress = await storage.upsertProgress(progressData);
      res.json({ progress: updatedProgress });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Practice call routes
  app.post("/api/practice-calls/start", requireAuth, async (req: any, res) => {
    try {
      const { scenario } = req.body;
      const practiceCall = await storage.createPracticeCall({
        userId: req.user.id,
        scenario
      });
      
      res.json({ practiceCall });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/practice-calls/complete", requireAuth, async (req: any, res) => {
    try {
      const { id, outcome, notes, scenario } = req.body;
      
      const updatedCall = await storage.updatePracticeCall(id, {
        endedAt: new Date(),
        outcome,
        notes
      });

      // Update progress attempts
      const currentProgress = await storage.getProgress(req.user.id, scenario);
      if (currentProgress) {
        await storage.upsertProgress({
          ...currentProgress,
          attempts: currentProgress.attempts + 1,
          status: outcome === "PASSED" ? "COMPLETED" : "IN_PROGRESS"
        });
      }

      res.json({ practiceCall: updatedCall });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/practice-calls", requireAuth, async (req: any, res) => {
    try {
      const calls = await storage.getUserPracticeCalls(req.user.id);
      res.json({ calls });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Admin quiz management routes
  app.post("/api/admin/tests", requireAdmin, async (req: any, res) => {
    try {
      const test = await storage.createTest({
        ...req.body,
        createdById: req.user.id,
      });
      res.json({ test });
    } catch (error) {
      console.error("Error creating test:", error);
      res.status(500).json({ message: "Failed to create test" });
    }
  });

  app.patch("/api/admin/tests/:id", requireAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const test = await storage.updateTest(id, req.body);
      res.json({ test });
    } catch (error) {
      console.error("Error updating test:", error);
      res.status(500).json({ message: "Failed to update test" });
    }
  });

  app.delete("/api/admin/tests/:id", requireAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.deleteTest(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting test:", error);
      res.status(500).json({ message: "Failed to delete test" });
    }
  });

  app.post("/api/admin/tests/:id/questions", requireAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { text, kind, options } = req.body;
      
      const question = await storage.createQuestion({
        testId: id,
        text,
        kind,
      });

      // Create options for the question
      for (const option of options) {
        await storage.createOption({
          questionId: question.id,
          text: option.text,
          isCorrect: option.isCorrect,
        });
      }

      res.json({ question });
    } catch (error) {
      console.error("Error creating question:", error);
      res.status(500).json({ message: "Failed to create question" });
    }
  });

  // Admin routes
  app.get("/api/admin/users", requireAuth, async (req: any, res) => {
    try {
      // Check if user is admin
      if (req.user.role !== "ADMIN") {
        return res.status(403).json({ message: "Admin access required" });
      }

      const users = await storage.getAllUsers();
      res.json({ users: users.map(user => ({ 
        id: user.id, 
        email: user.email, 
        name: user.name, 
        role: user.role,
        createdAt: user.createdAt 
      }))});
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/admin/users/:userId/progress", requireAuth, async (req: any, res) => {
    try {
      // Check if user is admin
      if (req.user.role !== "ADMIN") {
        return res.status(403).json({ message: "Admin access required" });
      }

      const progress = await storage.getUserProgress(req.params.userId);
      res.json({ progress });
    } catch (error) {
      console.error("Error fetching user progress:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/admin/users/:userId/practice-calls", requireAuth, async (req: any, res) => {
    try {
      // Check if user is admin
      if (req.user.role !== "ADMIN") {
        return res.status(403).json({ message: "Admin access required" });
      }

      const calls = await storage.getUserPracticeCalls(req.params.userId);
      res.json({ calls });
    } catch (error) {
      console.error("Error fetching user practice calls:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Materials routes
  app.get("/api/materials", requireAuth, async (req: any, res) => {
    try {
      const { tags } = req.query;
      const tagArray = tags ? tags.split(',') : undefined;
      const materials = await storage.getMaterials(tagArray);
      res.json({ materials });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/materials/:id", requireAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const material = await storage.updateMaterial(id, updates);
      res.json({ material });
    } catch (error) {
      console.error("Error updating material:", error);
      res.status(500).json({ message: "Failed to update material" });
    }
  });

  app.post("/api/materials", requireAuth, async (req: any, res) => {
    try {
      // Only allow admins to create materials
      if (req.user.role !== "ADMIN") {
        return res.status(403).json({ message: "Admin access required" });
      }

      const material = await storage.createMaterial(req.body);
      res.json({ material });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Object storage routes for file uploads
  app.post("/api/objects/upload", requireAuth, async (req: any, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error getting upload URL:", error);
      res.status(500).json({ error: "Failed to get upload URL" });
    }
  });

  // Material file upload completion
  app.put("/api/materials/file", requireAuth, async (req: any, res) => {
    try {
      if (!req.body.fileURL || !req.body.title || !req.body.type) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const objectStorageService = new ObjectStorageService();
      const filePath = objectStorageService.normalizeObjectEntityPath(req.body.fileURL);
      
      // Try to set ACL policy for the file (may fail if file doesn't exist yet)
      try {
        await objectStorageService.trySetObjectEntityAclPolicy(req.body.fileURL, {
          owner: req.user.id,
          visibility: "public", // Materials should be accessible to all authenticated users
        });
      } catch (aclError: any) {
        console.log("Note: Could not set ACL policy immediately, file may not be fully uploaded yet:", aclError.message);
        // Continue anyway - the file will still be accessible via the direct path
      }

      // Create material record in database
      const material = await storage.createMaterial({
        title: req.body.title,
        description: req.body.description,
        type: req.body.type,
        url: filePath, // Set url field for the material
        filePath,
        fileName: req.body.fileName,
        fileSize: req.body.fileSize,
        tags: req.body.tags || [],
        uploadedBy: req.user.id,
      });

      res.json({ material, filePath });
    } catch (error) {
      console.error("Error processing file upload:", error);
      res.status(500).json({ error: "Failed to process file upload" });
    }
  });

  // Serve uploaded files
  app.get("/objects/:objectPath(*)", requireAuth, async (req: any, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      
      // Check if user can access the file
      const canAccess = await objectStorageService.canAccessObjectEntity({
        objectFile,
        userId: req.user.id,
      });
      
      if (!canAccess) {
        return res.status(403).json({ error: "Access denied" });
      }

      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error serving file:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.status(404).json({ error: "File not found" });
      }
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // Enhanced Materials API routes with video support and soft delete
  app.patch("/api/materials/:id", requireAuth, async (req: any, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      const material = await storage.updateMaterial(id, updates);
      res.json({ material });
    } catch (error) {
      console.error("Error updating material:", error);
      res.status(500).json({ message: "Failed to update material" });
    }
  });

  app.delete("/api/materials/:id", requireAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.deleteMaterial(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting material:", error);
      res.status(500).json({ message: "Failed to delete material" });
    }
  });

  app.post("/api/materials/:id/restore", requireAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const material = await storage.restoreMaterial(id);
      res.json({ material });
    } catch (error) {
      console.error("Error restoring material:", error);
      res.status(500).json({ message: "Failed to restore material" });
    }
  });

  // Material view tracking routes
  app.post("/api/materials/:id/view", requireAuth, async (req: any, res) => {
    try {
      const { id } = req.params;
      const view = await storage.recordMaterialView(id, req.user.id);
      res.json({ view });
    } catch (error) {
      console.error("Error recording material view:", error);
      res.status(500).json({ message: "Failed to record view" });
    }
  });

  app.get("/api/materials/:id/views", requireAuth, async (req: any, res) => {
    try {
      const { id } = req.params;
      const views = await storage.getMaterialViews(id);
      const count = await storage.getMaterialViewCount(id);
      res.json({ views, count });
    } catch (error) {
      console.error("Error getting material views:", error);
      res.status(500).json({ message: "Failed to get views" });
    }
  });

  // Test Management API routes
  app.get("/api/tests", requireAuth, async (req: any, res) => {
    try {
      if (req.user.role === "ADMIN") {
        // Admins can see all tests
        const tests = await storage.getTests(false);
        res.json({ tests });
      } else {
        // Students can only see tests assigned to them
        const assignedTests = await storage.getUserAssignedTests(req.user.id);
        const tests = assignedTests.map(assignment => assignment.test);
        res.json({ tests });
      }
    } catch (error) {
      console.error("Error fetching tests:", error);
      res.status(500).json({ message: "Failed to fetch tests" });
    }
  });

  app.get("/api/tests/:id", requireAuth, async (req: any, res) => {
    try {
      const { id } = req.params;
      const test = await storage.getTest(id);
      
      if (!test) {
        return res.status(404).json({ message: "Test not found" });
      }
      
      // Check if non-admin user has access to this test
      if (req.user.role !== "ADMIN") {
        const assignedTests = await storage.getUserAssignedTests(req.user.id);
        const hasAccess = assignedTests.some(assignment => assignment.testId === id);
        
        if (!hasAccess) {
          return res.status(403).json({ message: "Test not assigned to you" });
        }
      }
      
      const questions = await storage.getTestQuestions(id);
      
      // Hide correct answers from students
      if (req.user.role !== "ADMIN") {
        const sanitizedQuestions = questions.map(question => ({
          ...question,
          options: question.options?.map(option => ({
            ...option,
            isCorrect: undefined // Remove correct answer indicators for students
          }))
        }));
        res.json({ test, questions: sanitizedQuestions });
      } else {
        res.json({ test, questions });
      }
    } catch (error) {
      console.error("Error fetching test:", error);
      res.status(500).json({ message: "Failed to fetch test" });
    }
  });

  app.post("/api/tests", requireAdmin, async (req: any, res) => {
    try {
      const { title, description, questions: questionData } = req.body;
      
      // Create the test
      const test = await storage.createTest({
        title,
        description,
        createdById: req.user.id,
        isPublished: false
      });

      // Create questions and options
      for (const qData of questionData) {
        const question = await storage.createQuestion({
          testId: test.id,
          kind: qData.kind,
          text: qData.text,
          explanation: qData.explanation
        });

        if (qData.options && qData.kind === 'MCQ') {
          for (const optionData of qData.options) {
            await storage.createOption({
              questionId: question.id,
              text: optionData.text,
              isCorrect: optionData.isCorrect
            });
          }
        }
      }

      res.json({ test });
    } catch (error) {
      console.error("Error creating test:", error);
      res.status(500).json({ message: "Failed to create test" });
    }
  });

  app.patch("/api/tests/:id", requireAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      const test = await storage.updateTest(id, updates);
      res.json({ test });
    } catch (error) {
      console.error("Error updating test:", error);
      res.status(500).json({ message: "Failed to update test" });
    }
  });

  app.delete("/api/tests/:id", requireAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.deleteTest(id);
      res.json({ message: "Test deleted successfully" });
    } catch (error) {
      console.error("Error deleting test:", error);
      res.status(500).json({ message: "Failed to delete test" });
    }
  });

  // Test Attempt API routes
  app.get("/api/attempts", requireAuth, async (req: any, res) => {
    try {
      const { testId } = req.query;
      const attempts = await storage.getUserAttempts(req.user.id, testId as string);
      res.json({ attempts });
    } catch (error) {
      console.error("Error fetching attempts:", error);
      res.status(500).json({ message: "Failed to fetch attempts" });
    }
  });

  app.post("/api/tests/:testId/attempt", requireAuth, async (req: any, res) => {
    try {
      const { testId } = req.params;
      
      // Check if non-admin user has access to this test
      if (req.user.role !== "ADMIN") {
        const assignedTests = await storage.getUserAssignedTests(req.user.id);
        const assignment = assignedTests.find(assignment => assignment.testId === testId);
        
        if (!assignment) {
          return res.status(403).json({ message: "Test not assigned to you" });
        }

        // Check if user has exceeded maximum attempts
        const userAttempts = await storage.getUserAttempts(req.user.id, testId);
        const completedAttempts = userAttempts.filter(attempt => attempt.submittedAt !== null);
        console.log(`User ${req.user.id} has ${completedAttempts.length} completed attempts for test ${testId}`);
        
        if (completedAttempts.length >= (assignment.maxAttempts || 3)) {
          return res.status(403).json({ 
            message: `Maximum attempts (${assignment.maxAttempts || 3}) reached for this test` 
          });
        }
        
        // Create new attempt with assignment reference
        const attempt = await storage.createAttempt({
          userId: req.user.id,
          testId,
          assignmentId: assignment.id,
          scorePercent: null
        });

        res.json({ attempt });
      } else {
        // Admin can take any test without assignment
        const attempt = await storage.createAttempt({
          userId: req.user.id,
          testId,
          scorePercent: null
        });

        res.json({ attempt });
      }
    } catch (error) {
      console.error("Error creating attempt:", error);
      res.status(500).json({ message: "Failed to create attempt" });
    }
  });

  app.post("/api/attempts/:attemptId/submit", requireAuth, async (req: any, res) => {
    try {
      const { attemptId } = req.params;
      const { answers: answerData } = req.body;
      
      // Get attempt details to get the test ID
      const attemptData = await storage.getUserAttempts(req.user.id);
      const currentAttempt = attemptData.find(a => a.id === attemptId);
      
      if (!currentAttempt) {
        return res.status(404).json({ message: "Attempt not found" });
      }
      
      // Get test questions for scoring
      const questions = await storage.getTestQuestions(currentAttempt.testId);
      
      // Store answers and calculate score
      let correctAnswers = 0;
      let totalQuestions = answerData.length;
      
      console.log(`Processing ${totalQuestions} answers for attempt ${attemptId}`);
      
      for (const answerItem of answerData) {
        // Store the answer
        await storage.createAnswer({
          attemptId,
          questionId: answerItem.questionId,
          optionId: answerItem.optionId,
          valueBool: answerItem.valueBool
        });
        
        // Find the question for this answer
        const question = questions.find(q => q.id === answerItem.questionId);
        
        if (question) {
          if (question.kind === 'MCQ' && answerItem.optionId) {
            // For MCQ, check if selected option is correct
            const selectedOption = question.options?.find(opt => opt.id === answerItem.optionId);
            if (selectedOption?.isCorrect) {
              correctAnswers++;
              console.log(`Correct answer for MCQ question ${question.id}`);
            }
          } else if (question.kind === 'TRUE_FALSE' && answerItem.valueBool !== null && answerItem.valueBool !== undefined) {
            // For TRUE_FALSE, the correct answer is stored as the first (and only) option's isCorrect value
            const correctAnswer = question.options?.[0]?.isCorrect === true;
            if (answerItem.valueBool === correctAnswer) {
              correctAnswers++;
              console.log(`Correct answer for TRUE_FALSE question ${question.id}`);
            }
          }
        } else {
          console.error(`Question not found for ID: ${answerItem.questionId}`);
        }
      }
      
      const scorePercent = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
      
      console.log(`Test scoring complete: ${correctAnswers}/${totalQuestions} correct (${scorePercent}%)`);
      
      // Update attempt with score and submission time
      const updatedAttempt = await storage.updateAttempt(attemptId, {
        scorePercent,
        submittedAt: new Date()
      });

      // Mark test assignment as completed if this was an assigned test
      if (currentAttempt?.assignmentId) {
        await storage.updateTestAssignment(currentAttempt.assignmentId, {
          isCompleted: true,
          completedAt: new Date()
        });
      }

      // Create or update progress entry for test results
      const testData = await storage.getTest(currentAttempt.testId);
      if (testData) {
        const allUserAttempts = await storage.getUserAttempts(req.user.id);
        const completedTestAttempts = allUserAttempts.filter(attempt => 
          attempt.testId === currentAttempt.testId && attempt.submittedAt !== null
        );
        
        await storage.upsertProgress({
          userId: req.user.id,
          module: `TEST_${testData.id}`,
          score: scorePercent,
          status: scorePercent >= 70 ? "COMPLETED" : "IN_PROGRESS", // 70% passing grade
          attempts: completedTestAttempts.length
        });
      }

      console.log(`Attempt ${attemptId} updated with score ${scorePercent}%`);
      res.json({ attempt: updatedAttempt, scorePercent });
    } catch (error) {
      console.error("Error submitting attempt:", error);
      res.status(500).json({ message: "Failed to submit attempt" });
    }
  });

  // Student Notes API routes
  app.get("/api/users/:userId/notes", requireAuth, async (req: any, res) => {
    try {
      const { userId } = req.params;
      
      // Allow users to fetch their own notes or admins to fetch any user's notes
      if (req.user.id !== userId && req.user.role !== "ADMIN") {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const notes = await storage.getUserNotes(userId);
      res.json({ notes });
    } catch (error) {
      console.error("Error fetching notes:", error);
      res.status(500).json({ message: "Failed to fetch notes" });
    }
  });

  app.post("/api/users/:userId/notes", requireAdmin, async (req: any, res) => {
    try {
      const { userId } = req.params;
      const { body, isVisibleToStudent } = req.body;
      
      const note = await storage.createNote({
        userId,
        authorId: req.user.id,
        body,
        isVisibleToStudent: !!isVisibleToStudent
      });

      res.json({ note });
    } catch (error) {
      console.error("Error creating note:", error);
      res.status(500).json({ message: "Failed to create note" });
    }
  });

  app.delete("/api/notes/:noteId", requireAdmin, async (req: any, res) => {
    try {
      const { noteId } = req.params;
      
      await storage.deleteNote(noteId);
      res.json({ message: "Note deleted successfully" });
    } catch (error) {
      console.error("Error deleting note:", error);
      res.status(500).json({ message: "Failed to delete note" });
    }
  });

  // Test Assignment API routes
  app.get("/api/assigned-tests", requireAuth, async (req: any, res) => {
    try {
      const assignedTests = await storage.getUserAssignedTests(req.user.id);
      res.json({ assignedTests });
    } catch (error) {
      console.error("Error fetching assigned tests:", error);
      res.status(500).json({ message: "Failed to fetch assigned tests" });
    }
  });

  app.get("/api/tests/:testId/assignments", requireAdmin, async (req: any, res) => {
    try {
      const { testId } = req.params;
      const assignments = await storage.getTestAssignments(testId);
      res.json({ assignments });
    } catch (error) {
      console.error("Error fetching test assignments:", error);
      res.status(500).json({ message: "Failed to fetch test assignments" });
    }
  });

  app.post("/api/tests/:testId/assign", requireAdmin, async (req: any, res) => {
    try {
      const { testId } = req.params;
      const { userIds, dueDate } = req.body;
      
      const assignments = [];
      for (const userId of userIds) {
        const assignment = await storage.createTestAssignment({
          testId,
          userId,
          assignedBy: req.user.id,
          dueDate: dueDate ? new Date(dueDate) : null
        });
        assignments.push(assignment);
      }
      
      res.json({ assignments });
    } catch (error) {
      console.error("Error assigning test:", error);
      res.status(500).json({ message: "Failed to assign test" });
    }
  });

  app.delete("/api/test-assignments/:assignmentId", requireAdmin, async (req: any, res) => {
    try {
      const { assignmentId } = req.params;
      await storage.deleteTestAssignment(assignmentId);
      res.json({ message: "Assignment removed successfully" });
    } catch (error) {
      console.error("Error removing assignment:", error);
      res.status(500).json({ message: "Failed to remove assignment" });
    }
  });

  // Student Tasks API routes
  app.get("/api/users/:userId/tasks", requireAdmin, async (req: any, res) => {
    try {
      const { userId } = req.params;
      const { status } = req.query;
      const tasks = await storage.getUserTasks(userId, status as "OPEN" | "DONE");
      res.json({ tasks });
    } catch (error) {
      console.error("Error fetching tasks:", error);
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });

  app.post("/api/users/:userId/tasks", requireAdmin, async (req: any, res) => {
    try {
      const { userId } = req.params;
      const { title, details, dueAt } = req.body;
      
      const task = await storage.createTask({
        userId,
        authorId: req.user.id,
        title,
        details,
        dueAt: dueAt ? new Date(dueAt) : null,
        status: "OPEN"
      });

      res.json({ task });
    } catch (error) {
      console.error("Error creating task:", error);
      res.status(500).json({ message: "Failed to create task" });
    }
  });

  app.patch("/api/tasks/:taskId", requireAdmin, async (req: any, res) => {
    try {
      const { taskId } = req.params;
      const updates = req.body;
      
      // If marking as done, set completion timestamp
      if (updates.status === "DONE" && !updates.completedAt) {
        updates.completedAt = new Date();
      }
      
      const task = await storage.updateTask(taskId, updates);
      res.json({ task });
    } catch (error) {
      console.error("Error updating task:", error);
      res.status(500).json({ message: "Failed to update task" });
    }
  });

  // Deployment health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      environment: process.env.NODE_ENV || "development",
      database: process.env.DATABASE_URL ? "connected" : "missing",
      session: req.session ? "configured" : "missing",
      timestamp: new Date().toISOString(),
      cookies: req.headers.cookie ? "present" : "missing"
    });
  });

  // AI Training API endpoints
  app.post("/api/ai/chat", requireAuth, async (req: any, res) => {
    try {
      const { message, context } = req.body;
      
      if (!message || typeof message !== 'string') {
        return res.status(400).json({ message: "Message is required" });
      }
      
      const response = await aiTrainingService.generateChatResponse(message, context);
      res.json({ response });
    } catch (error) {
      console.error("AI Chat Error:", error);
      res.status(500).json({ message: "Failed to generate response" });
    }
  });

  app.post("/api/ai/roleplay", requireAuth, async (req: any, res) => {
    try {
      const { message, scenario, conversationHistory = [] } = req.body;
      
      if (!message || !scenario) {
        return res.status(400).json({ message: "Message and scenario are required" });
      }
      
      const response = await aiTrainingService.generateRoleplayResponse(
        message, 
        scenario, 
        conversationHistory
      );
      res.json({ response });
    } catch (error) {
      console.error("AI Roleplay Error:", error);
      res.status(500).json({ message: "Failed to generate response" });
    }
  });

  // Training Module API routes
  app.get("/api/modules", requireAuth, async (req: any, res) => {
    try {
      const modules = await storage.getTrainingModules();
      res.json({ modules });
    } catch (error) {
      console.error("Error fetching modules:", error);
      res.status(500).json({ message: "Failed to fetch modules" });
    }
  });

  app.post("/api/modules", requireAdmin, async (req: any, res) => {
    try {
      const { title, description, isEnabled, orderIndex, scenarios, estimatedDuration } = req.body;
      
      const module = await storage.createTrainingModule({
        title,
        description,
        isEnabled: isEnabled ?? true,
        orderIndex: orderIndex ?? 0,
        scenarios: scenarios || [],
        estimatedDuration: estimatedDuration ?? 30
      });

      res.json({ module });
    } catch (error) {
      console.error("Error creating module:", error);
      res.status(500).json({ message: "Failed to create module" });
    }
  });

  app.patch("/api/modules/:id", requireAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      const module = await storage.updateTrainingModule(id, updates);
      res.json({ module });
    } catch (error) {
      console.error("Error updating module:", error);
      res.status(500).json({ message: "Failed to update module" });
    }
  });

  app.delete("/api/modules/:id", requireAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      
      await storage.deleteTrainingModule(id);
      res.json({ message: "Module deleted successfully" });
    } catch (error) {
      console.error("Error deleting module:", error);
      res.status(500).json({ message: "Failed to delete module" });
    }
  });

  app.post("/api/modules/reorder", requireAdmin, async (req: any, res) => {
    try {
      const { moduleOrders } = req.body;
      
      await storage.reorderTrainingModules(moduleOrders);
      res.json({ message: "Modules reordered successfully" });
    } catch (error) {
      console.error("Error reordering modules:", error);
      res.status(500).json({ message: "Failed to reorder modules" });
    }
  });

  // Problem Report routes
  app.get("/api/problem-reports", requireAuth, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      let reports;
      if (user.role === "ADMIN") {
        // Admins can see all reports
        reports = await storage.getProblemReports();
      } else {
        // Students can only see their own reports
        reports = await storage.getUserProblemReports(user.id);
      }

      res.json({ reports });
    } catch (error) {
      console.error("Error fetching problem reports:", error);
      res.status(500).json({ message: "Failed to fetch problem reports" });
    }
  });

  app.post("/api/problem-reports", requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const data = insertProblemReportSchema.parse({
        ...req.body,
        userId
      });

      const report = await storage.createProblemReport(data);
      res.json({ report });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating problem report:", error);
      res.status(500).json({ message: "Failed to create problem report" });
    }
  });

  app.patch("/api/problem-reports/:id", requireAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      const report = await storage.updateProblemReport(id, updates);
      res.json({ report });
    } catch (error) {
      console.error("Error updating problem report:", error);
      res.status(500).json({ message: "Failed to update problem report" });
    }
  });

  app.delete("/api/problem-reports/:id", requireAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      
      await storage.deleteProblemReport(id);
      res.json({ message: "Problem report deleted successfully" });
    } catch (error) {
      console.error("Error deleting problem report:", error);
      res.status(500).json({ message: "Failed to delete problem report" });
    }
  });

  // AI Chat API routes
  app.post("/api/chat", requireAuth, async (req: any, res) => {
    try {
      const { messages } = req.body;
      
      if (!Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ message: "Messages array is required" });
      }

      // Validate message format
      for (const msg of messages) {
        if (!msg.role || !msg.content) {
          return res.status(400).json({ message: "Each message must have role and content" });
        }
      }

      const response = await getChatResponse(messages);
      res.json({ message: response });
    } catch (error) {
      console.error("AI Chat error:", error);
      res.status(500).json({ message: "Failed to get AI response" });
    }
  });

  // AI Practice Call Analysis API
  app.post("/api/analyze-call", requireAuth, async (req: any, res) => {
    try {
      const { transcript } = req.body;
      
      if (!transcript || typeof transcript !== 'string') {
        return res.status(400).json({ message: "Transcript is required" });
      }

      const analysis = await analyzePracticeCall(transcript);
      res.json(analysis);
    } catch (error) {
      console.error("AI Analysis error:", error);
      res.status(500).json({ message: "Failed to analyze practice call" });
    }
  });

  // Group Management API routes
  app.get("/api/groups", requireAdmin, async (req: any, res) => {
    try {
      const groups = await storage.getGroups();
      res.json({ groups });
    } catch (error) {
      console.error("Error fetching groups:", error);
      res.status(500).json({ message: "Failed to fetch groups" });
    }
  });

  app.get("/api/groups/:id", requireAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const group = await storage.getGroup(id);
      
      if (!group) {
        return res.status(404).json({ message: "Group not found" });
      }
      
      res.json({ group });
    } catch (error) {
      console.error("Error fetching group:", error);
      res.status(500).json({ message: "Failed to fetch group" });
    }
  });

  app.post("/api/groups", requireAdmin, async (req: any, res) => {
    try {
      const data = insertGroupSchema.parse(req.body);
      const group = await storage.createGroup(data);
      res.json({ group });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating group:", error);
      res.status(500).json({ message: "Failed to create group" });
    }
  });

  app.patch("/api/groups/:id", requireAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      const group = await storage.updateGroup(id, updates);
      res.json({ group });
    } catch (error) {
      console.error("Error updating group:", error);
      res.status(500).json({ message: "Failed to update group" });
    }
  });

  app.delete("/api/groups/:id", requireAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.deleteGroup(id);
      res.json({ message: "Group deleted successfully" });
    } catch (error) {
      console.error("Error deleting group:", error);
      res.status(500).json({ message: "Failed to delete group" });
    }
  });

  app.post("/api/groups/:id/members", requireAdmin, async (req: any, res) => {
    try {
      const { id: groupId } = req.params;
      const { userIds, role = "MEMBER" } = req.body;
      
      if (!Array.isArray(userIds) || userIds.length === 0) {
        return res.status(400).json({ message: "userIds array is required" });
      }
      
      const members = [];
      for (const userId of userIds) {
        const member = await storage.addGroupMember({
          groupId,
          userId,
          role
        });
        members.push(member);
      }
      
      res.json({ members });
    } catch (error) {
      console.error("Error adding group members:", error);
      res.status(500).json({ message: "Failed to add group members" });
    }
  });

  app.delete("/api/groups/:groupId/members/:userId", requireAdmin, async (req: any, res) => {
    try {
      const { groupId, userId } = req.params;
      await storage.removeGroupMember(groupId, userId);
      res.json({ message: "Member removed successfully" });
    } catch (error) {
      console.error("Error removing group member:", error);
      res.status(500).json({ message: "Failed to remove group member" });
    }
  });

  app.get("/api/users/:userId/groups", requireAuth, async (req: any, res) => {
    try {
      const { userId } = req.params;
      
      // Allow users to fetch their own groups or admins to fetch any user's groups
      if (req.user.id !== userId && req.user.role !== "ADMIN") {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const groups = await storage.getUserGroups(userId);
      res.json({ groups });
    } catch (error) {
      console.error("Error fetching user groups:", error);
      res.status(500).json({ message: "Failed to fetch user groups" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
