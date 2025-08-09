import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { aiTrainingService } from "./aiService";
import { loginSchema, registerSchema } from "@shared/schema";
import bcrypt from "bcrypt";
import { z } from "zod";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";

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
      
      // Force session save for deployment compatibility
      (req as any).session.save((err: any) => {
        if (err) {
          console.error("Session save error:", err);
        }
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

  const httpServer = createServer(app);
  return httpServer;
}
