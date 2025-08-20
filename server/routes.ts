import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { aiTrainingService } from "./aiService";
import { loginSchema, registerSchema, insertProblemReportSchema, insertGroupSchema, insertGroupMemberSchema, submitAttemptSchema, generateTestSchema, qaRequestSchema } from "@shared/schema";
import bcrypt from "bcrypt";
import { z } from "zod";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import { getChatResponse, analyzePracticeCall, scoreShortAnswer } from "./openai";
import type { ChatMessage } from "./openai";
import { fetchRinggCallDetails, fetchRinggCallHistory, syncCallFromRingg, testRinggConnection, startCallRecordingPoll } from "./ringgAI";
import pdfParse from "pdf-parse";
import ffmpeg from "fluent-ffmpeg";
import { promises as fs } from "fs";
import * as fsSync from "fs";
import * as path from "path";
import * as os from "os";

// Function to extract content from uploaded files
async function extractFileContent(fileUrl: string, fileName: string, fileType: string): Promise<string> {
  console.log(`Starting content extraction for ${fileName} (${fileType})`);
  
  try {
    const objectStorageService = new ObjectStorageService();
    
    if (fileType === 'VIDEO') {
      // For video files, use OpenAI Whisper to extract audio transcript
      console.log("Processing video file for transcript extraction");
      
      // Create a temporary file for the video
      const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'video-'));
      const tempVideoPath = path.join(tempDir, fileName);
      const tempAudioPath = path.join(tempDir, 'audio.mp3');
      
      try {
        // Get the video file from object storage
        const videoFile = await objectStorageService.getObjectEntityFile(fileUrl);
        const videoStream = videoFile.createReadStream();
        
        // Save video to temporary file
        const videoBuffer = [];
        for await (const chunk of videoStream) {
          videoBuffer.push(chunk);
        }
        await fs.writeFile(tempVideoPath, Buffer.concat(videoBuffer));
        
        // Extract audio using ffmpeg
        await new Promise((resolve, reject) => {
          ffmpeg(tempVideoPath)
            .output(tempAudioPath)
            .audioCodec('mp3')
            .on('end', resolve)
            .on('error', reject)
            .run();
        });
        
        // Use OpenAI Whisper to transcribe the audio
        const audioBuffer = await fs.readFile(tempAudioPath);
        
        // Create OpenAI instance for transcription
        const OpenAI = require('openai');
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        
        // Create a readable stream for the audio file
        const transcription = await openai.audio.transcriptions.create({
          file: fsSync.createReadStream(tempAudioPath),
          model: "whisper-1",
        });
        
        // Clean up temporary files
        await fs.rm(tempDir, { recursive: true });
        
        return `VIDEO TRANSCRIPT:
File: ${fileName}
Transcribed Content:

${transcription.text}

=== END OF VIDEO TRANSCRIPT ===`;
        
      } catch (error) {
        console.error("Error processing video:", error);
        // Clean up on error
        try {
          await fs.rm(tempDir, { recursive: true });
        } catch {}
        throw error;
      }
      
    } else if (fileType === 'PDF') {
      // For PDF files, extract text content
      console.log("Processing PDF file for text extraction");
      
      try {
        // Get the PDF file from object storage
        const pdfFile = await objectStorageService.getObjectEntityFile(fileUrl);
        const pdfStream = pdfFile.createReadStream();
        
        // Read PDF content into buffer
        const pdfBuffer = [];
        for await (const chunk of pdfStream) {
          pdfBuffer.push(chunk);
        }
        const pdfData = Buffer.concat(pdfBuffer);
        
        // Parse PDF content
        const pdfContent = await pdfParse(pdfData);
        
        return `PDF DOCUMENT CONTENT:
File: ${fileName}
Extracted Text:

${pdfContent.text}

=== END OF PDF CONTENT ===`;
        
      } catch (error) {
        console.error("Error processing PDF:", error);
        throw error;
      }
      
    } else if (fileType === 'POWERPOINT') {
      // For PowerPoint files, we need a different approach since there's no direct parser
      console.log("Processing PowerPoint file - content extraction not fully implemented");
      
      return `POWERPOINT CONTENT:
File: ${fileName}
Type: PowerPoint Presentation

Note: PowerPoint content extraction requires additional implementation.
This file contains presentation slides that should be processed for content extraction.

=== POWERPOINT PROCESSING NEEDED ===`;
      
    } else {
      // For other document types, try to read as text with size limits
      console.log("Processing document as text file");
      
      try {
        const docFile = await objectStorageService.getObjectEntityFile(fileUrl);
        const docStream = docFile.createReadStream();
        
        const docBuffer = [];
        let totalSize = 0;
        const MAX_FILE_SIZE = 1024 * 1024; // 1MB limit for text processing
        
        for await (const chunk of docStream) {
          totalSize += chunk.length;
          
          // Stop reading if file is too large
          if (totalSize > MAX_FILE_SIZE) {
            console.log(`File ${fileName} is too large (${totalSize} bytes), truncating for processing`);
            break;
          }
          
          docBuffer.push(chunk);
        }
        
        const docContent = Buffer.concat(docBuffer).toString('utf-8');
        
        // Additional check - if content is mostly binary/non-text, don't use it
        const printableChars = docContent.replace(/[\x00-\x1F\x7F-\x9F]/g, '').length;
        const printableRatio = printableChars / docContent.length;
        
        if (printableRatio < 0.7) {
          console.log(`File ${fileName} appears to be binary (${printableRatio.toFixed(2)} printable ratio), skipping text extraction`);
          return `DOCUMENT CONTENT:
File: ${fileName}
Note: This file appears to be a binary file (${fileType}) and cannot be processed as text content. Please use appropriate file types for text-based material extraction.

=== CONTENT EXTRACTION SKIPPED ===`;
        }
        
        // Limit content length to prevent token overflow (roughly 100k chars = ~25k tokens)
        const MAX_CONTENT_LENGTH = 100000;
        const truncatedContent = docContent.length > MAX_CONTENT_LENGTH 
          ? docContent.substring(0, MAX_CONTENT_LENGTH) + '\n\n[Content truncated due to length...]'
          : docContent;
        
        return `DOCUMENT CONTENT:
File: ${fileName}
Extracted Content (${docContent.length} chars${docContent.length > MAX_CONTENT_LENGTH ? ', truncated' : ''}):

${truncatedContent}

=== END OF DOCUMENT CONTENT ===`;
        
      } catch (error) {
        console.error("Error processing document:", error);
        throw error;
      }
    }
    
  } catch (error) {
    console.error(`Error extracting content from ${fileName}:`, error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return `ERROR EXTRACTING CONTENT:
File: ${fileName}
Type: ${fileType}

Unable to extract content from this file. Error: ${errorMessage}

=== CONTENT EXTRACTION FAILED ===`;
  }
}

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
      const { scenario, ringgCallId } = req.body;
      
      // Validate input
      if (!scenario || typeof scenario !== 'string') {
        return res.status(400).json({ message: "Scenario is required" });
      }
      
      console.log('Starting practice call for user:', req.user.id, 'with scenario:', scenario);
      
      const practiceCall = await storage.createPracticeCall({
        userId: req.user.id,
        scenario,
        ringgCallId: ringgCallId || undefined
      });
      
      // If we have a Ringg call ID, start polling for recording
      if (ringgCallId) {
        console.log(`Starting recording poll for Ringg call ${ringgCallId}`);
        startCallRecordingPoll(ringgCallId, practiceCall.id);
      }
      
      console.log('Practice call created successfully:', practiceCall.id);
      res.json({ practiceCall });
    } catch (error) {
      console.error('Error creating practice call:', error);
      res.status(500).json({ 
        message: "Internal server error", 
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined 
      });
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
      console.error("Error fetching practice calls:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Admin: Get all practice calls with recordings and transcripts
  app.get("/api/admin/practice-calls", requireAdmin, async (req: any, res) => {
    try {
      const calls = await storage.getAllPracticeCalls();
      res.json({ calls });
    } catch (error) {
      console.error("Error fetching all practice calls:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Sync calls from Ringg AI
  app.post("/api/practice-calls/sync-ringg", requireAuth, async (req: any, res) => {
    try {
      const { ringgCallId, agentId } = req.body;
      
      if (!ringgCallId) {
        return res.status(400).json({ message: "Ringg call ID is required" });
      }

      // Fetch enhanced call details from Ringg AI
      const callDetails = await syncCallFromRingg(ringgCallId);
      if (!callDetails) {
        return res.status(404).json({ message: "Call not found in Ringg AI" });
      }

      // Create or update practice call with Ringg data
      const call = await storage.createOrUpdatePracticeCallFromRingg({
        userId: req.user.id,
        ringgCallId,
        agentId,
        callDetails
      });

      res.json({ call });
    } catch (error) {
      console.error("Error syncing Ringg call:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Start polling for call recording
  app.post("/api/practice-calls/start-recording-poll", requireAuth, async (req: any, res) => {
    try {
      const { ringgCallId, practiceCallId } = req.body;
      
      if (!ringgCallId || !practiceCallId) {
        return res.status(400).json({ message: "Both ringgCallId and practiceCallId are required" });
      }
      
      console.log(`Starting recording poll for call ${ringgCallId} -> practice call ${practiceCallId}`);
      
      // Start the background polling
      startCallRecordingPoll(ringgCallId, practiceCallId);
      
      res.json({ 
        message: "Recording poll started", 
        ringgCallId, 
        practiceCallId,
        note: "Polling will continue in background every 10 seconds for up to 20 attempts" 
      });
    } catch (error) {
      console.error("Error starting recording poll:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Manual poll for specific call recording (for testing)
  app.get("/api/practice-calls/poll-recording/:ringgCallId", requireAuth, async (req: any, res) => {
    try {
      const { ringgCallId } = req.params;
      
      console.log(`Manual polling for recording of call ${ringgCallId}`);
      
      const callDetails = await fetchRinggCallDetails(ringgCallId);
      
      if (!callDetails) {
        return res.status(404).json({ message: "Call not found in Ringg AI" });
      }
      
      res.json({
        ringgCallId,
        hasTranscript: !!callDetails.transcript,
        hasRecording: !!callDetails.recordingUrl,
        status: callDetails.status,
        callDetails
      });
    } catch (error) {
      console.error("Error polling for recording:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Sync call history from Ringg AI (for admins)
  app.post("/api/admin/practice-calls/sync-history", requireAdmin, async (req: any, res) => {
    try {
      const { startDate, endDate, agentId } = req.body;
      
      // Fetch call history from Ringg AI
      const callHistory = await fetchRinggCallHistory({ startDate, endDate, agentId });
      
      let syncedCount = 0;
      for (const call of callHistory.calls || []) {
        try {
          // Try to find the actual user who made the call by participant name, or use admin as fallback
          const participantName = (call as any).callee_name || (call as any).name || call.participant?.name;
          let actualUserId = req.user.id; // Default to admin
          
          if (participantName && participantName !== "Student") {
            // Try to find user by email prefix (if they used their email in call)
            const users = await storage.getAllUsers();
            const foundUser = users.find(u => 
              u.email?.split('@')[0] === participantName || 
              u.name?.toLowerCase().includes(participantName.toLowerCase())
            );
            if (foundUser) {
              actualUserId = foundUser.id;
            }
          }
          
          await storage.createOrUpdatePracticeCallFromRingg({
            userId: actualUserId,
            ringgCallId: call.id,
            agentId: call.agent?.id,
            callDetails: call
          });
          syncedCount++;
        } catch (error) {
          console.error(`Error syncing call ${call.id}:`, error);
        }
      }

      res.json({ 
        message: `Synced ${syncedCount} calls from Ringg AI`,
        totalCalls: callHistory.calls?.length || 0,
        syncedCount 
      });
    } catch (error) {
      console.error("Error syncing call history:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Test Ringg AI connection
  app.get("/api/admin/ringg-test", requireAdmin, async (req: any, res) => {
    try {
      const isConnected = await testRinggConnection();
      res.json({ 
        connected: isConnected,
        message: isConnected ? "Ringg AI connection successful" : "Ringg AI connection failed"
      });
    } catch (error) {
      console.error("Error testing Ringg connection:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // AI Call Evaluation routes
  app.post("/api/practice-calls/:id/evaluate", requireAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      
      const call = await storage.getPracticeCall(id);
      if (!call) {
        return res.status(404).json({ message: "Practice call not found" });
      }
      
      if (!call.transcript || call.transcript.trim() === '') {
        return res.status(400).json({ message: "No transcript available for evaluation" });
      }
      
      if (call.aiEvaluationScore) {
        return res.status(400).json({ message: "Call has already been evaluated" });
      }
      
      const { evaluateCallWithAudio } = await import('./callEvaluator');
      
      const evaluation = await evaluateCallWithAudio(
        call.transcript,
        call.participantName || 'Unknown',
        call.callDuration || '0',
        call.audioRecordingUrl || undefined
      );
      
      await storage.updatePracticeCallEvaluation(id, {
        aiEvaluationScore: evaluation.overallScore,
        toneOfVoiceScore: evaluation.toneOfVoiceScore,
        buildingRapportScore: evaluation.buildingRapportScore,
        showingEmpathyScore: evaluation.showingEmpathyScore,
        handlingSkillsScore: evaluation.handlingSkillsScore,
        knowledgeScore: evaluation.knowledgeScore,
        aiEvaluationFeedback: evaluation.feedback,
        evaluatedAt: new Date()
      });
      
      res.json({ 
        message: "Call evaluation completed",
        evaluation
      });
    } catch (error) {
      console.error("Error evaluating call:", error);
      res.status(500).json({ 
        message: "Failed to evaluate call",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  app.post("/api/admin/practice-calls/batch-evaluate", requireAdmin, async (req: any, res) => {
    try {
      const { callIds } = req.body;
      
      if (!Array.isArray(callIds) || callIds.length === 0) {
        return res.status(400).json({ message: "Call IDs array is required" });
      }
      
      const { evaluateCallWithAudio } = await import('./callEvaluator');
      const results = [];
      
      for (const callId of callIds) {
        try {
          const call = await storage.getPracticeCall(callId);
          
          if (!call || !call.transcript || call.transcript.trim() === '' || call.aiEvaluationScore) {
            results.push({ callId, status: 'skipped', reason: 'No transcript or already evaluated' });
            continue;
          }
          
          const evaluation = await evaluateCallWithAudio(
            call.transcript,
            call.participantName || 'Unknown',
            call.callDuration || '0',
            call.audioRecordingUrl || undefined
          );
          
          await storage.updatePracticeCallEvaluation(callId, {
            aiEvaluationScore: evaluation.overallScore,
            toneOfVoiceScore: evaluation.toneOfVoiceScore,
            buildingRapportScore: evaluation.buildingRapportScore,
            showingEmpathyScore: evaluation.showingEmpathyScore,
            handlingSkillsScore: evaluation.handlingSkillsScore,
            knowledgeScore: evaluation.knowledgeScore,
            aiEvaluationFeedback: evaluation.feedback,
            evaluatedAt: new Date()
          });
          
          results.push({ callId, status: 'evaluated', overallScore: evaluation.overallScore });
        } catch (error) {
          console.error(`Error evaluating call ${callId}:`, error);
          results.push({ callId, status: 'error', error: error instanceof Error ? error.message : 'Unknown error' });
        }
      }
      
      const successful = results.filter(r => r.status === 'evaluated').length;
      const skipped = results.filter(r => r.status === 'skipped').length;
      const errors = results.filter(r => r.status === 'error').length;
      
      res.json({
        message: `Batch evaluation completed: ${successful} evaluated, ${skipped} skipped, ${errors} errors`,
        results,
        summary: { successful, skipped, errors }
      });
    } catch (error) {
      console.error("Error in batch evaluation:", error);
      res.status(500).json({ 
        message: "Failed to batch evaluate calls",
        error: error instanceof Error ? error.message : "Unknown error"
      });
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

  // Get all material views summary (admin only)
  app.get("/api/materials/views", requireAdmin, async (req: any, res) => {
    try {
      const viewsSummary = await storage.getAllMaterialViewsSummary();
      res.json(viewsSummary);
    } catch (error) {
      console.error("Error getting all material views:", error);
      res.status(500).json({ message: "Failed to get material views summary" });
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

  // Tag management routes
  app.get("/api/materials/tags", requireAuth, async (req: any, res) => {
    try {
      const tags = await storage.getAllMaterialTags();
      res.json({ tags });
    } catch (error) {
      console.error("Error getting material tags:", error);
      res.status(500).json({ message: "Failed to get tags" });
    }
  });

  app.post("/api/materials/tags", requireAdmin, async (req: any, res) => {
    try {
      const { name } = req.body;
      if (!name || typeof name !== 'string') {
        return res.status(400).json({ message: "Tag name is required" });
      }
      
      const tag = await storage.createMaterialTag(name.trim().toUpperCase());
      res.json({ tag });
    } catch (error) {
      console.error("Error creating material tag:", error);
      res.status(500).json({ message: "Failed to create tag" });
    }
  });

  app.delete("/api/materials/tags/:name", requireAdmin, async (req: any, res) => {
    try {
      const { name } = req.params;
      await storage.deleteMaterialTag(decodeURIComponent(name));
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting material tag:", error);
      res.status(500).json({ message: "Failed to delete tag" });
    }
  });

  // Enhanced Test Management API routes
  app.get("/api/tests", requireAuth, async (req: any, res) => {
    try {
      if (req.user.role === "ADMIN") {
        // Admins can see all tests
        const tests = await storage.getTests(false);
        res.json({ tests });
      } else {
        // Students see public tests + assigned tests (fixed visibility)
        const { publicTests, assignedTests } = await storage.getStudentVisibleTests(req.user.id);
        res.json({ publicTests, assignedTests });
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
      
      // Enhanced access control: check public tests OR assigned tests
      if (req.user.role !== "ADMIN") {
        const { publicTests, assignedTests } = await storage.getStudentVisibleTests(req.user.id);
        const hasAccess = publicTests.some(t => t.id === id) || assignedTests.some(t => t.id === id);
        
        if (!hasAccess) {
          return res.status(403).json({ message: "Test not accessible to you" });
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

  // Enhanced Test Attempt API routes (new detailed tracking)
  app.post("/api/tests/:testId/submit", requireAuth, async (req: any, res) => {
    try {
      const { testId } = req.params;
      const submissionData = submitAttemptSchema.parse(req.body);
      
      // Check test access and attempt limits for non-admin users
      let assignmentId: string | undefined;
      if (req.user.role !== "ADMIN") {
        const assignedTests = await storage.getUserAssignedTests(req.user.id);
        const assignment = assignedTests.find(a => a.testId === testId);
        
        if (!assignment) {
          return res.status(403).json({ message: "Test not assigned to you" });
        }

        // Check if user has exceeded maximum attempts
        const userAttempts = await storage.getUserAttempts(req.user.id, testId);
        const completedAttempts = userAttempts.filter(attempt => attempt.submittedAt !== null);
        
        if (completedAttempts.length >= (assignment.maxAttempts || 3)) {
          return res.status(403).json({ 
            message: `Maximum attempts (${assignment.maxAttempts || 3}) reached for this test` 
          });
        }

        assignmentId = assignment.id;
      }

      const test = await storage.getTest(testId);
      if (!test) {
        return res.status(404).json({ message: "Test not found" });
      }

      const questions = await storage.getTestQuestions(testId);
      
      // Create enhanced test attempt
      const testAttempt = await storage.createTestAttempt({
        testId,
        userId: req.user.id,
        assignmentId,
        submittedAt: new Date(),
      });

      let totalPoints = 0;
      let earnedPoints = 0;
      const answers = [];

      // Process and score each answer
      for (const answerData of submissionData.answers) {
        const question = questions.find(q => q.id === answerData.questionId);
        if (!question) continue;

        totalPoints += 1; // Each question worth 1 point for simplicity
        
        let answerPayload: any = {};
        let correct = false;
        let awardedPoints = 0;

        if (question.kind === "MCQ" && answerData.optionId) {
          answerPayload = { optionId: answerData.optionId };
          const selectedOption = question.options?.find(o => o.id === answerData.optionId);
          correct = selectedOption?.isCorrect || false;
        } else if (question.kind === "TRUE_FALSE" && answerData.valueBool !== undefined) {
          answerPayload = { valueBool: answerData.valueBool };
          // For TRUE_FALSE, the correct answer should be stored in the first option's isCorrect
          const correctAnswer = question.options?.[0]?.isCorrect;
          correct = answerData.valueBool === correctAnswer;
        } else if (question.kind === "SHORT" && answerData.valueText) {
          answerPayload = { valueText: answerData.valueText };
          
          // For SHORT answers, use AI-powered automatic scoring
          if (test.llmScoringEnabled) {
            try {
              const expectedAnswer = question.options?.[0]?.text || ""; // Expected answer stored in first option
              
              if (expectedAnswer) {
                const score = await scoreShortAnswer(answerData.valueText, expectedAnswer, question.text);
                correct = score.isCorrect;
                awardedPoints = score.score;
                answerPayload.aiScore = score.score;
                answerPayload.aiExplanation = score.explanation;
              }
            } catch (error) {
              console.error("AI scoring failed:", error);
              // Fall back to manual review
              correct = false;
            }
          } else {
            // Manual review required
            correct = false;
          }
        }

        if (correct) {
          awardedPoints = 1;
          earnedPoints += awardedPoints;
        }

        const testAnswer = await storage.createTestAnswer({
          attemptId: testAttempt.id,
          questionId: answerData.questionId,
          answerPayload: JSON.stringify(answerPayload),
          correct,
          awardedPoints,
        });

        answers.push(testAnswer);
      }

      // Calculate score percentage
      const scorePercent = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
      
      // Update attempt with score and scoring method
      const updatedAttempt = await storage.updateTestAttempt(testAttempt.id, {
        scorePercent,
        scorer: 'RULE', // Using rule-based scoring for MCQ/TRUE_FALSE
      });

      // Update test assignment if applicable
      const assignedTests = await storage.getUserAssignedTests(req.user.id);
      const assignment = assignedTests.find(a => a.testId === testId);
      if (assignment) {
        await storage.updateTestAssignment(assignment.id, {
          isCompleted: true,
          completedAt: new Date(),
        });
      }

      res.json({ 
        attempt: updatedAttempt, 
        scorePercent, 
        answers,
        message: "Test submitted successfully" 
      });
    } catch (error) {
      console.error("Error submitting enhanced test attempt:", error);
      res.status(500).json({ message: "Failed to submit test" });
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
      const { userIds, dueDate, maxAttempts = 3 } = req.body;
      
      const assignments = [];
      for (const userId of userIds) {
        const assignment = await storage.createTestAssignment({
          testId,
          userId,
          assignedBy: req.user.id,
          dueDate: dueDate ? new Date(dueDate) : null,
          maxAttempts: Math.max(1, parseInt(maxAttempts) || 3)
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

  // Enhanced Q&A and AI Assistance routes
  app.post("/api/qa/ask", requireAuth, async (req: any, res) => {
    try {
      const { question, context } = req.body;
      
      // Use AI service for Q&A assistance
      const response = await getChatResponse([
        {
          role: "system",
          content: "You are a helpful training assistant for Class Mentors. Provide clear, helpful answers about call center operations, SOPs, and customer service best practices. Keep responses concise and actionable."
        },
        {
          role: "user", 
          content: context ? `Context: ${context}\n\nQuestion: ${question}` : question
        }
      ]);

      res.json({ answer: response });
    } catch (error) {
      console.error("Error processing Q&A request:", error);
      res.status(500).json({ message: "Failed to process question" });
    }
  });

  // AI Test Builder route
  app.post("/api/admin/tests/generate", requireAdmin, async (req: any, res) => {
    try {
      const { topic, materialId, difficulty, questionCount, questionTypes, customPrompt } = req.body;
      
      let materialContent = "";
      let baseTitle = topic || "Generated Test";
      let materialInfo = null;
      
      // If material ID is provided, fetch the material content and extract actual content
      if (materialId) {
        try {
          const materials = await storage.getMaterials();
          const material = materials.find((m: any) => m.id === materialId);
          if (material) {
            materialInfo = material;
            baseTitle = `${material.title} Test`;
            
            // Enhanced content extraction - get comprehensive material content based on type and tags
            let extractedContent = "";
            
            // Generate detailed content based on material title, type, and tags
            const tags = material.tags || [];
            const hasSOPTag = tags.includes('SOP') || tags.includes('sop');
            const hasVOIPTag = tags.includes('VOIP') || tags.includes('voip') || material.title.toLowerCase().includes('voip');
            
            // Try to extract actual file content from the stored material
            let actualFileContent = "";
            if (material.url) {
              try {
                console.log(`Attempting to extract content from file: ${material.url}`);
                console.log(`File type: ${material.type}, Original filename: ${material.fileName}`);
                
                // Extract actual file content using our extraction function
                actualFileContent = await extractFileContent(material.url, material.fileName || material.title, material.type);
                
                console.log(`Extracted file content length: ${actualFileContent.length} characters`);
                
              } catch (fileError) {
                console.error("Error extracting file content:", fileError);
                actualFileContent = ""; // Fall back to tag-based content if file extraction fails
              }
            }
            
            // Use actual file content if available, otherwise fall back to tag-based content
            if (actualFileContent && actualFileContent.length > 100) {
              extractedContent = `=== ACTUAL TRAINING MATERIAL CONTENT ===
File: ${material.fileName || material.title}
Type: ${material.type}

${actualFileContent}

=== END OF MATERIAL CONTENT ===`;
            } else if (hasVOIPTag && hasSOPTag) {
              extractedContent = `This training material covers VOIP (Voice Over Internet Protocol) Standard Operating Procedures for Class Mentors.

=== VOIP SOP TRAINING CONTENT ===

Key Topics Covered:
1. VOIP System Setup and Configuration
   - Initial system requirements and network setup
   - Device configuration and registration procedures
   - Quality of Service (QoS) configuration
   - Bandwidth requirements and optimization

2. Daily Operations Procedures
   - Starting and shutting down VOIP systems
   - User account management and permissions
   - Call routing and forwarding setup
   - Conference call management procedures

3. Troubleshooting Common Issues
   - Audio quality problems (echo, delay, static)
   - Connection failures and network issues
   - Device registration problems
   - Call dropping and connectivity issues

4. Security and Compliance
   - VOIP security best practices
   - Data encryption and privacy protocols
   - Compliance with communication regulations
   - Incident reporting procedures

5. Emergency Procedures
   - System failure response protocols
   - Backup communication methods
   - Escalation procedures for technical issues
   - Service restoration procedures

6. Performance Monitoring
   - Call quality metrics and monitoring
   - System performance indicators
   - User feedback collection and analysis
   - Continuous improvement processes

Class Mentor Specific Responsibilities:
- Ensuring reliable communication for online training sessions
- Managing participant audio/video quality
- Handling technical difficulties during live sessions
- Maintaining professional communication standards
- Documenting and reporting system issues`;

            } else if (hasVOIPTag) {
              extractedContent = `This training material focuses on VOIP (Voice Over Internet Protocol) technology and its application in educational/training environments.

=== VOIP TRAINING CONTENT ===

Core VOIP Concepts:
- How VOIP technology works and its advantages
- Differences between traditional telephony and VOIP
- Network requirements and infrastructure needs
- Cost benefits and scalability advantages

Implementation Guidelines:
- Planning and deploying VOIP systems
- Integration with existing communication infrastructure
- User training and adoption strategies
- Performance optimization techniques

Quality Management:
- Ensuring clear audio and video communication
- Managing bandwidth and network resources
- Monitoring call quality and user experience
- Implementing backup and redundancy measures

Class Mentor Applications:
- Using VOIP for online training delivery
- Managing virtual classroom communications
- Facilitating group discussions and breakout sessions
- Handling technical support during training sessions`;

            } else if (material.type === 'VIDEO') {
              extractedContent = `This is a video training material about ${material.title}.
              
Video Topic: ${material.title}
Content Type: Educational Training Video
Expected Content: The video demonstrates practical procedures and explanations related to ${material.title}.

The video training covers:
- Step-by-step procedures and demonstrations
- Best practices and professional guidelines
- Real-world scenarios and case studies
- Troubleshooting common issues
- Key concepts and terminology`;

            } else if (material.type === 'PDF' || material.type === 'DOCUMENT') {
              extractedContent = `This is a training document about ${material.title}.
              
Document Title: ${material.title}
Content Type: Training Document/Guide
Topics: ${tags.length > 0 ? tags.join(', ') : 'Professional training content'}

The document covers:
- Detailed procedures and protocols
- Professional guidelines and standards
- Technical specifications and requirements
- Step-by-step implementation processes
- Key terminology and definitions
- Compliance and regulatory requirements`;

            } else {
              extractedContent = `Training material: ${material.title}
              
Topics: ${tags.length > 0 ? tags.join(', ') : 'General training content'}
Content: ${material.description || 'Comprehensive training material covering essential concepts and procedures'}

This material provides practical knowledge and guidelines for professional development.`;
            }
            
            // Combine with existing metadata
            materialContent = [
              `=== TRAINING MATERIAL: ${material.title} ===`,
              extractedContent,
              material.description ? `Additional Description: ${material.description}` : '',
              material.tags && material.tags.length > 0 ? `Related Topics: ${material.tags.join(', ')}` : '',
              '',
              '=== QUESTION GENERATION INSTRUCTIONS ===',
              'Create questions that are directly relevant to the content described above.',
              'Focus on practical knowledge that Class Mentors would need to know.',
              'Ensure questions test real understanding, not just memorization.',
              'Include scenario-based questions when appropriate.'
            ].filter(Boolean).join('\n');
            
            console.log(`Processing ${material.type} material: ${material.title}`);
            console.log(`Material tags: ${tags.join(', ')}`);
            console.log(`Generated material context length: ${materialContent.length} characters`);
            console.log(`Material content preview: ${materialContent.substring(0, 200)}...`);
          }
        } catch (error) {
          console.error("Error fetching material:", error);
        }
      }
      
      // Build prompt with custom admin prompt support and enhanced material processing
      let prompt;
      
      // System prompt with enhanced instructions for different question types
      const systemInstructions = `You are an expert test creator for Class Mentor training. Generate comprehensive, practical questions that test real-world knowledge and application.

QUESTION TYPE GUIDELINES:
- MCQ: Create realistic scenarios with 4 plausible options, only one correct
- TRUE_FALSE: Create clear statements that test specific facts or concepts
- SHORT: Create open-ended questions that require 2-3 sentence explanations

For SHORT answer questions, also provide a "correctAnswer" field with the expected answer for automated scoring.

IMPORTANT: Respond with valid JSON only, no markdown code blocks, no extra text. Start directly with { and end with }.`;

      if (materialContent && materialInfo) {
        // Safety check: Estimate token count and truncate if necessary
        // Rough estimation: 1 token ≈ 4 characters for English text
        const MAX_TOKENS = 120000; // Leave some buffer for OpenAI's 128k limit
        const CHARS_PER_TOKEN = 4;
        const MAX_CONTENT_CHARS = MAX_TOKENS * CHARS_PER_TOKEN;
        
        // Calculate current content size
        let contentToUse = materialContent;
        const materialDetailsSize = `TRAINING MATERIAL DETAILS:
Title: ${materialInfo.title}
Type: ${materialInfo.type}
Description: ${materialInfo.description || 'No description available'}
${materialInfo.fileName ? `Original File: ${materialInfo.fileName}` : ''}
${materialInfo.tags && materialInfo.tags.length > 0 ? `Tags: ${materialInfo.tags.join(', ')}` : ''}

MATERIAL CONTENT:
`.length;
        
        const baseInstructionsSize = `Based on the following training material, generate a ${difficulty} difficulty test with ${questionCount} questions. Include these question types: ${questionTypes.join(', ')}.

Create questions that directly test understanding of the concepts, procedures, and specific knowledge presented in this material. Questions should be practical and applicable to real Class Mentor scenarios.`.length;
        
        const availableContentSpace = MAX_CONTENT_CHARS - materialDetailsSize - baseInstructionsSize - 2000; // Buffer for JSON format instructions
        
        if (materialContent.length > availableContentSpace) {
          console.log(`Material content is too large (${materialContent.length} chars). Truncating to ${availableContentSpace} chars to fit within token limits.`);
          contentToUse = materialContent.substring(0, availableContentSpace) + '\n\n[Content truncated to fit within AI processing limits...]';
        }
        
        const basePrompt = `Based on the following training material, generate a ${difficulty} difficulty test with ${questionCount} questions. Include these question types: ${questionTypes.join(', ')}.

TRAINING MATERIAL DETAILS:
Title: ${materialInfo.title}
Type: ${materialInfo.type}
Description: ${materialInfo.description || 'No description available'}
${materialInfo.fileName ? `Original File: ${materialInfo.fileName}` : ''}
${materialInfo.tags && materialInfo.tags.length > 0 ? `Tags: ${materialInfo.tags.join(', ')}` : ''}

MATERIAL CONTENT:
${contentToUse}

Create questions that directly test understanding of the concepts, procedures, and specific knowledge presented in this material. Questions should be practical and applicable to real Class Mentor scenarios.`;

        // Apply custom prompt if provided by admin
        if (customPrompt && customPrompt.trim()) {
          prompt = `${basePrompt}

ADDITIONAL ADMIN INSTRUCTIONS:
${customPrompt}

Please incorporate these specific instructions while maintaining the JSON format below.`;
        } else {
          prompt = basePrompt;
        }

        prompt += `

Format as JSON with this exact structure:
{
  "title": "Descriptive test title based on material",
  "description": "Test description explaining what will be assessed", 
  "questions": [
    {
      "text": "Question text",
      "kind": "MCQ|TRUE_FALSE|SHORT",
      "options": [{"text": "Option text", "isCorrect": boolean}], // for MCQ only
      "correctAnswer": "Expected answer text" // for SHORT and TRUE_FALSE questions
    }
  ]
}`;
      } else {
        const basePrompt = `Generate a ${difficulty} difficulty test about "${topic}" with ${questionCount} questions. Include these question types: ${questionTypes.join(', ')}.

Create practical, real-world questions relevant to Class Mentor training and call center operations.`;

        // Apply custom prompt if provided by admin
        if (customPrompt && customPrompt.trim()) {
          prompt = `${basePrompt}

ADDITIONAL ADMIN INSTRUCTIONS:
${customPrompt}

Please incorporate these specific instructions while maintaining the JSON format below.`;
        } else {
          prompt = basePrompt;
        }

        prompt += `

Format as JSON with this exact structure:
{
  "title": "Descriptive test title",
  "description": "Test description explaining what will be assessed", 
  "questions": [
    {
      "text": "Question text",
      "kind": "MCQ|TRUE_FALSE|SHORT",
      "options": [{"text": "Option text", "isCorrect": boolean}], // for MCQ only
      "correctAnswer": "Expected answer text" // for SHORT and TRUE_FALSE questions
    }
  ]
}`;
      }

      // Log final prompt details for debugging
      console.log(`Final prompt length: ${prompt.length} characters`);
      console.log(`Estimated tokens: ${Math.ceil(prompt.length / 4)} (assuming 4 chars per token)`);
      console.log(`Prompt preview: ${prompt.substring(0, 500)}...`);
      
      const aiResponse = await getChatResponse([
        {
          role: "system",
          content: systemInstructions
        },
        {
          role: "user",
          content: prompt
        }
      ]);

      try {
        console.log("Raw AI response length:", aiResponse.length);
        console.log("Raw AI response:", aiResponse);
        
        // Simple JSON extraction - find the first complete JSON object
        let jsonContent = aiResponse.trim();
        
        // Remove markdown code blocks if present
        if (jsonContent.startsWith('```json')) {
          jsonContent = jsonContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        } else if (jsonContent.startsWith('```')) {
          jsonContent = jsonContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
        }
        
        // Find the first { and try to find a complete JSON
        const firstBrace = jsonContent.indexOf('{');
        if (firstBrace === -1) {
          throw new Error("No JSON object found in AI response");
        }
        
        // Try to find the complete JSON by counting braces
        let braceCount = 0;
        let jsonEnd = -1;
        for (let i = firstBrace; i < jsonContent.length; i++) {
          if (jsonContent[i] === '{') braceCount++;
          if (jsonContent[i] === '}') braceCount--;
          if (braceCount === 0) {
            jsonEnd = i;
            break;
          }
        }
        
        if (jsonEnd === -1) {
          // JSON is incomplete, try to salvage it by finding the last complete question
          console.log("Incomplete JSON detected, attempting to salvage...");
          
          // First, try to find the end of the questions array
          const questionsArrayStart = jsonContent.indexOf('"questions"');
          if (questionsArrayStart !== -1) {
            const arrayStart = jsonContent.indexOf('[', questionsArrayStart);
            if (arrayStart !== -1) {
              // Find the last complete question object
              let questionCount = 0;
              let currentPos = arrayStart + 1;
              let lastValidPos = arrayStart + 1;
              
              while (currentPos < jsonContent.length) {
                // Skip whitespace
                while (currentPos < jsonContent.length && /\s/.test(jsonContent[currentPos])) {
                  currentPos++;
                }
                
                if (currentPos >= jsonContent.length) break;
                
                // Look for start of question object
                if (jsonContent[currentPos] === '{') {
                  let objBraceCount = 0;
                  let objStart = currentPos;
                  
                  // Count through this object
                  while (currentPos < jsonContent.length) {
                    if (jsonContent[currentPos] === '{') objBraceCount++;
                    if (jsonContent[currentPos] === '}') objBraceCount--;
                    currentPos++;
                    
                    if (objBraceCount === 0) {
                      // Found complete question object
                      questionCount++;
                      lastValidPos = currentPos;
                      
                      // Skip potential comma and whitespace
                      while (currentPos < jsonContent.length && 
                             (/\s/.test(jsonContent[currentPos]) || jsonContent[currentPos] === ',')) {
                        currentPos++;
                      }
                      break;
                    }
                  }
                } else {
                  break;
                }
              }
              
              if (questionCount > 0) {
                // Build valid JSON with complete questions
                const beforeQuestions = jsonContent.substring(firstBrace, arrayStart + 1);
                const questionsContent = jsonContent.substring(arrayStart + 1, lastValidPos);
                jsonContent = beforeQuestions + questionsContent + "]\n}";
                console.log(`Salvaged ${questionCount} complete questions`);
              } else {
                throw new Error("No complete questions found in malformed JSON");
              }
            } else {
              throw new Error("Questions array not found in JSON");
            }
          } else {
            throw new Error("Cannot find questions section in JSON response");
          }
        } else {
          jsonContent = jsonContent.substring(firstBrace, jsonEnd + 1);
        }
        
        console.log("Cleaned JSON content:", jsonContent);
        console.log("JSON content length:", jsonContent.length);
        
        // Validate JSON format before parsing
        let testData;
        try {
          testData = JSON.parse(jsonContent);
        } catch (parseError) {
          console.error("JSON parse failed:", parseError);
          console.log("Failed JSON content:", jsonContent);
          throw new Error(`AI response contained invalid JSON: ${parseError instanceof Error ? parseError.message : 'Unknown parsing error'}`);
        }
        
        // Validate required fields
        if (!testData.title || !testData.description || !Array.isArray(testData.questions)) {
          throw new Error("AI response missing required fields (title, description, or questions array)");
        }
        
        if (testData.questions.length === 0) {
          throw new Error("AI response contained no questions");
        }
        
        // Create the test in draft mode with enhanced metadata
        const test = await storage.createTest({
          title: testData.title,
          description: testData.description,
          isPublished: false,
          isDraft: true,
          llmScoringEnabled: questionTypes.includes('SHORT'),
          generationPrompt: customPrompt || null,
          baseMaterialId: materialId || null,
          createdById: req.user.id,
        });

        // Create questions and options with enhanced SHORT answer support
        for (const questionData of testData.questions) {
          const question = await storage.createQuestion({
            testId: test.id,
            text: questionData.text,
            kind: questionData.kind,
            explanation: questionData.explanation || null,
          });

          if (questionData.options && questionData.kind === "MCQ") {
            for (const optionData of questionData.options) {
              await storage.createOption({
                questionId: question.id,
                text: optionData.text,
                isCorrect: optionData.isCorrect,
              });
            }
          } else if (questionData.kind === "TRUE_FALSE") {
            // For TRUE_FALSE, create a single option to store the correct answer
            const correctAnswer = questionData.correctAnswer === true || 
                                 questionData.correctAnswer === "true" || 
                                 questionData.correctAnswer === "True";
            await storage.createOption({
              questionId: question.id,
              text: "True/False Answer",
              isCorrect: correctAnswer,
            });
          } else if (questionData.kind === "SHORT") {
            // For SHORT answers, create an option to store the expected answer for scoring
            if (questionData.correctAnswer) {
              await storage.createOption({
                questionId: question.id,
                text: questionData.correctAnswer,
                isCorrect: true, // This marks it as the reference answer
              });
            }
          }
        }

        res.json({ test, message: "Test generated successfully" });
      } catch (parseError: any) {
        console.error("Failed to parse AI response:", parseError);
        console.error("Raw AI response was:", aiResponse);
        
        // Provide a more helpful error message for incomplete responses
        let errorMessage = "Failed to generate test - AI response was incomplete or malformed";
        if (aiResponse.length < 100) {
          errorMessage = "AI response was too short - please try again with a different topic or simpler requirements";
        } else if (parseError.message?.includes("Unexpected end")) {
          errorMessage = "AI response was cut off during generation - please try again";
        } else if (parseError.message?.includes("Expected")) {
          errorMessage = "AI response had formatting issues - please try again or use simpler requirements";
        }
        
        res.status(500).json({ 
          message: errorMessage,
          suggestion: "Try reducing the number of questions or simplifying the topic",
          error: parseError.message || "Unknown parsing error"
        });
      }
    } catch (error) {
      console.error("Error generating test:", error);
      res.status(500).json({ message: "Failed to generate test" });
    }
  });

  // Enhanced Test Attempt Analytics routes
  app.get("/api/admin/tests/:testId/attempts", requireAdmin, async (req: any, res) => {
    try {
      const { testId } = req.params;
      const attempts = await storage.getTestAttempts(testId);
      res.json({ attempts });
    } catch (error) {
      console.error("Error fetching test attempts:", error);
      res.status(500).json({ message: "Failed to fetch test attempts" });
    }
  });

  app.get("/api/admin/attempts/:attemptId", requireAdmin, async (req: any, res) => {
    try {
      const { attemptId } = req.params;
      const attempt = await storage.getTestAttempt(attemptId);
      
      if (!attempt) {
        return res.status(404).json({ message: "Attempt not found" });
      }

      res.json({ attempt });
    } catch (error) {
      console.error("Error fetching attempt details:", error);
      res.status(500).json({ message: "Failed to fetch attempt details" });
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



  // General chat endpoint for compatibility with existing components
  app.post("/api/chat", requireAuth, async (req: any, res) => {
    try {
      const { messages } = req.body;
      
      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ message: "Messages array is required" });
      }

      // Extract the latest message from the messages array
      const lastMessage = messages[messages.length - 1];
      if (!lastMessage || !lastMessage.content) {
        return res.status(400).json({ message: "Invalid message format" });
      }

      // Build context from previous messages if available
      const context = messages.slice(0, -1).map(msg => `${msg.role}: ${msg.content}`).join('\n');
      
      const response = await getChatResponse([
        ...messages.map(msg => ({
          role: msg.role,
          content: msg.content
        }))
      ]);

      res.json({ message: response, response });
    } catch (error) {
      console.error("Chat Error:", error);
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
      res.json({ response });
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
      const groups = await storage.getAllGroups();
      res.json({ groups });
    } catch (error) {
      console.error("Error fetching groups:", error);
      res.status(500).json({ message: "Failed to fetch groups" });
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

  app.get("/api/groups/:id", requireAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const group = await storage.getGroupById(id);
      
      if (!group) {
        return res.status(404).json({ message: "Group not found" });
      }
      
      res.json({ group });
    } catch (error) {
      console.error("Error fetching group:", error);
      res.status(500).json({ message: "Failed to fetch group" });
    }
  });

  app.put("/api/groups/:id", requireAdmin, async (req: any, res) => {
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
      
      // Handle both single user and multiple users
      const userIdList = Array.isArray(userIds) ? userIds : (req.body.userId ? [req.body.userId] : []);
      
      if (!userIdList || userIdList.length === 0) {
        return res.status(400).json({ message: "userIds or userId is required" });
      }
      
      const members = [];
      for (const userId of userIdList) {
        try {
          const member = await storage.addMemberToGroup(groupId, userId, role);
          members.push(member);
        } catch (error) {
          console.error(`Error adding user ${userId} to group ${groupId}:`, error);
          // Continue with other users even if one fails
        }
      }
      
      res.json({ members, addedCount: members.length, totalRequested: userIdList.length });
    } catch (error) {
      console.error("Error adding group members:", error);
      res.status(500).json({ message: "Failed to add group members" });
    }
  });

  app.delete("/api/groups/:id/members/:userId", requireAdmin, async (req: any, res) => {
    try {
      const { id: groupId, userId } = req.params;
      await storage.removeMemberFromGroup(groupId, userId);
      res.json({ message: "Member removed successfully" });
    } catch (error) {
      console.error("Error removing group member:", error);
      res.status(500).json({ message: "Failed to remove group member" });
    }
  });

  app.get("/api/groups/:id/notes", requireAuth, async (req: any, res) => {
    try {
      const { id } = req.params;
      
      // Check if user has access to this group (admin or group member)
      if (req.user.role !== "ADMIN") {
        const userGroups = await storage.getUserGroups(req.user.id);
        const hasAccess = userGroups.some(membership => membership.groupId === id);
        if (!hasAccess) {
          return res.status(403).json({ message: "Access denied" });
        }
      }
      
      const notes = await storage.getGroupNotes(id);
      res.json({ notes });
    } catch (error) {
      console.error("Error fetching group notes:", error);
      res.status(500).json({ message: "Failed to fetch group notes" });
    }
  });

  app.post("/api/groups/:id/notes", requireAuth, async (req: any, res) => {
    try {
      const { id: groupId } = req.params;
      const { title, body, isAnnouncement = false } = req.body;
      
      // Check if user has access to this group (admin or group member)
      if (req.user.role !== "ADMIN") {
        const userGroups = await storage.getUserGroups(req.user.id);
        const hasAccess = userGroups.some(membership => membership.groupId === groupId);
        if (!hasAccess) {
          return res.status(403).json({ message: "Access denied" });
        }
      }
      
      const note = await storage.createGroupNote({
        groupId,
        authorId: req.user.id,
        title,
        body,
        isAnnouncement: req.user.role === "ADMIN" ? isAnnouncement : false
      });
      
      res.json({ note });
    } catch (error) {
      console.error("Error creating group note:", error);
      res.status(500).json({ message: "Failed to create group note" });
    }
  });

  app.post("/api/group-notes/:id/responses", requireAuth, async (req: any, res) => {
    try {
      const { id: groupNoteId } = req.params;
      const { body } = req.body;
      
      const response = await storage.createGroupNoteResponse({
        groupNoteId,
        authorId: req.user.id,
        body
      });
      
      res.json({ response });
    } catch (error) {
      console.error("Error responding to group note:", error);
      res.status(500).json({ message: "Failed to respond to group note" });
    }
  });

  app.post("/api/groups/:id/assign-test", requireAdmin, async (req: any, res) => {
    try {
      const { id: groupId } = req.params;
      const { testId, dueDate, maxAttempts = 3 } = req.body;
      
      if (!testId) {
        return res.status(400).json({ message: "testId is required" });
      }
      
      // First create the group assignment record
      const groupAssignment = await storage.assignTestToGroup(
        groupId, 
        testId, 
        req.user.id,
        dueDate ? new Date(dueDate) : undefined
      );

      // Then create individual assignments for all group members
      const groupData = await storage.getGroupById(groupId);
      const assignments = [];
      
      if (groupData?.members) {
        for (const member of groupData.members) {
          const assignment = await storage.createTestAssignment({
            testId,
            userId: member.user.id,
            assignedBy: req.user.id,
            dueDate: dueDate ? new Date(dueDate) : null,
            maxAttempts: Math.max(1, parseInt(maxAttempts) || 3)
          });
          assignments.push(assignment);
        }
      }
      
      res.json({ 
        groupAssignment,
        individualAssignments: assignments,
        assignedToMembers: assignments.length
      });
    } catch (error) {
      console.error("Error assigning test to group:", error);
      res.status(500).json({ message: "Failed to assign test to group" });
    }
  });

  app.get("/api/groups/:id/performance", requireAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const performance = await storage.getGroupPerformance(id);
      res.json({ performance });
    } catch (error) {
      console.error("Error fetching group performance:", error);
      res.status(500).json({ message: "Failed to fetch group performance" });
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

  // Activity Logging Routes
  app.post("/api/activity/log", requireAuth, async (req: any, res) => {
    try {
      const activityData = {
        ...req.body,
        userId: req.user?.id
      };
      const activity = await storage.logActivity(activityData);
      res.json({ activity });
    } catch (error) {
      console.error("Error logging activity:", error);
      res.status(500).json({ message: "Failed to log activity" });
    }
  });

  app.get("/api/activity/user/:userId", requireAdmin, async (req: any, res) => {
    try {
      const { userId } = req.params;
      const { limit = 50 } = req.query;
      const activities = await storage.getUserActivityLogs(userId, parseInt(limit));
      res.json({ activities });
    } catch (error) {
      console.error("Error fetching user activities:", error);
      res.status(500).json({ message: "Failed to fetch user activities" });
    }
  });

  app.get("/api/activity/stats/:userId", requireAuth, async (req: any, res) => {
    try {
      const { userId } = req.params;
      // Only allow users to see their own stats, or admins to see any stats
      if (req.user?.role !== "ADMIN" && req.user?.id !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const stats = await storage.getComprehensiveUserStats(userId);
      res.json({ stats });
    } catch (error) {
      console.error("Error fetching user stats:", error);
      res.status(500).json({ message: "Failed to fetch user stats" });
    }
  });

  app.get("/api/activity/type/:type", requireAdmin, async (req: any, res) => {
    try {
      const { type } = req.params;
      const { limit = 100 } = req.query;
      const activities = await storage.getActivityLogsByType(type, parseInt(limit));
      res.json({ activities });
    } catch (error) {
      console.error("Error fetching activities by type:", error);
      res.status(500).json({ message: "Failed to fetch activities" });
    }
  });

  // Enhanced Material Views Routes
  app.get("/api/materials/:id/views", requireAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const views = await storage.getMaterialViews(id);
      const count = await storage.getMaterialViewCount(id);
      res.json({ views, count });
    } catch (error) {
      console.error("Error fetching material views:", error);
      res.status(500).json({ message: "Failed to fetch material views" });
    }
  });

  app.post("/api/materials/:id/view", requireAuth, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { duration, progress } = req.body;
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      const view = await storage.recordMaterialView(id, userId, duration, progress);
      res.json({ view });
    } catch (error) {
      console.error("Error recording material view:", error);
      res.status(500).json({ message: "Failed to record material view" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
