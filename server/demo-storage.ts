// Demo storage implementation for when database is unavailable
import type { User, Progress, PracticeCall, Material } from "@shared/schema";

// In-memory storage maps
const demoUsers = new Map<string, User>();
const demoProgress = new Map<string, Progress[]>();
const demoCalls = new Map<string, PracticeCall[]>();
const demoMaterials = new Map<string, Material>();

// Helper function to generate unique IDs
function generateId(): string {
  return 'demo-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
}

export const demoStorage = {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    return demoUsers.get(id);
  },

  async getUserByEmail(email: string): Promise<User | undefined> {
    for (const user of demoUsers.values()) {
      if (user.email === email) {
        return user;
      }
    }
    return undefined;
  },

  async createUser(userData: { email: string; passwordHash: string; name?: string; role: "STUDENT" | "TRAINER" | "ADMIN" }): Promise<User> {
    const user: User = {
      id: generateId(),
      email: userData.email,
      passwordHash: userData.passwordHash,
      name: userData.name || null,
      role: userData.role,
      createdAt: new Date()
    };
    demoUsers.set(user.id, user);
    return user;
  },

  async getAllUsers(): Promise<User[]> {
    return Array.from(demoUsers.values());
  },

  // Progress operations
  async getUserProgress(userId: string): Promise<Progress[]> {
    return demoProgress.get(userId) || [];
  },

  async getProgress(userId: string, module: string): Promise<Progress | undefined> {
    const userProgress = demoProgress.get(userId) || [];
    return userProgress.find(p => p.module === module);
  },

  async upsertProgress(progressData: { userId: string; module: string; status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED"; attempts: number; score?: number }): Promise<Progress> {
    const userProgress = demoProgress.get(progressData.userId) || [];
    const existingIndex = userProgress.findIndex(p => p.module === progressData.module);
    
    const progress: Progress = {
      id: generateId(),
      userId: progressData.userId,
      module: progressData.module,
      status: progressData.status,
      attempts: progressData.attempts,
      score: progressData.score || null,
      lastTouched: new Date()
    };

    if (existingIndex >= 0) {
      userProgress[existingIndex] = progress;
    } else {
      userProgress.push(progress);
    }
    
    demoProgress.set(progressData.userId, userProgress);
    return progress;
  },

  // Practice call operations
  async createPracticeCall(callData: { userId: string; scenario: string }): Promise<PracticeCall> {
    const call: PracticeCall = {
      id: generateId(),
      userId: callData.userId,
      scenario: callData.scenario,
      startedAt: new Date(),
      endedAt: null,
      duration: null,
      transcript: null,
      notes: null,
      outcome: null,
      ringgCallId: null,
      audioUrl: null,
      callMetrics: null
    };

    const userCalls = demoCalls.get(callData.userId) || [];
    userCalls.push(call);
    demoCalls.set(callData.userId, userCalls);
    return call;
  },

  async updatePracticeCall(id: string, updates: Partial<PracticeCall>): Promise<PracticeCall> {
    for (const [userId, calls] of demoCalls.entries()) {
      const callIndex = calls.findIndex(c => c.id === id);
      if (callIndex >= 0) {
        calls[callIndex] = { ...calls[callIndex], ...updates };
        return calls[callIndex];
      }
    }
    throw new Error('Practice call not found');
  },

  async getUserPracticeCalls(userId: string): Promise<PracticeCall[]> {
    return demoCalls.get(userId) || [];
  },

  async getPracticeCall(id: string): Promise<PracticeCall | undefined> {
    for (const calls of demoCalls.values()) {
      const call = calls.find(c => c.id === id);
      if (call) return call;
    }
    return undefined;
  }
};