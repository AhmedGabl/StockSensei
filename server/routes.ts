import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { loginSchema, registerSchema } from "@shared/schema";
import bcrypt from "bcrypt";
import { z } from "zod";

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

      res.json({ user: { id: user.id, email: user.email, name: user.name, role: user.role } });
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

      // Set session
      (req as any).session.userId = user.id;

      res.json({ user: { id: user.id, email: user.email, name: user.name, role: user.role } });
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

  const httpServer = createServer(app);
  return httpServer;
}
