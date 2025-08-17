# CM Training Platform - Technical Documentation

## Architecture Overview

The CM Training Platform is a full-stack TypeScript application built with React frontend and Express backend, utilizing PostgreSQL database and multiple AI service integrations.

### Technology Stack

**Frontend:**
- React 18 with TypeScript
- Vite build system with hot reload
- TanStack Query (React Query) v5 for state management
- Radix UI + shadcn/ui component library
- Tailwind CSS for styling
- Wouter for client-side routing
- React Hook Form + Zod for form validation

**Backend:**
- Express.js server with TypeScript
- Drizzle ORM for database operations
- bcrypt for password hashing
- express-session with PostgreSQL store
- CORS middleware for cross-origin requests

**Database:**
- PostgreSQL (Neon Database)
- Connection pooling via @neondatabase/serverless
- Session persistence with connect-pg-simple

**AI Integrations:**
- OpenAI GPT-4o for chat assistant and call analysis
- Ringg AI for voice practice calls
- Botpress for conversational AI (optional)

## Database Schema

### Core Tables

```sql
-- Users table
users {
  id: text (primary key)
  email: text (unique)
  passwordHash: text
  name: text
  role: enum ('STUDENT', 'TRAINER', 'ADMIN')
  createdAt: timestamp
}

-- Progress tracking
progress {
  id: text (primary key)
  userId: text (foreign key -> users.id)
  module: text
  status: enum ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED')
  score: integer (nullable)
  attempts: integer (default 0)
  updatedAt: timestamp
}

-- Practice calls
practiceCalls {
  id: text (primary key)
  userId: text (foreign key -> users.id)
  scenario: text
  outcome: enum ('PASSED', 'IMPROVE', 'N/A') (nullable)
  notes: text (nullable)
  startedAt: timestamp
  completedAt: timestamp (nullable)
}

-- Training modules
trainingModules {
  id: text (primary key)
  title: text
  description: text (nullable)
  isEnabled: boolean (default true)
  orderIndex: integer (default 0)
  createdAt: timestamp
  updatedAt: timestamp
}

-- Materials
materials {
  id: text (primary key)
  name: text
  description: text (nullable)
  url: text
  tags: text[] (array)
  uploadedAt: timestamp
}

-- User notes (admin to student)
userNotes {
  id: text (primary key)
  userId: text (foreign key -> users.id)
  body: text
  isVisibleToStudent: boolean (default false)
  createdAt: timestamp
}

-- Tests and assignments
tests {
  id: text (primary key)
  title: text
  description: text (nullable)
  questions: jsonb
  isEnabled: boolean (default true)
  maxAttempts: integer (nullable)
  createdAt: timestamp
}

-- Test assignments
testAssignments {
  id: text (primary key)
  testId: text (foreign key -> tests.id)
  userId: text (foreign key -> users.id)
  dueDate: timestamp (nullable)
  attempts: integer (default 0)
  lastScore: integer (nullable)
  completedAt: timestamp (nullable)
}

-- Problem reports
problemReports {
  id: text (primary key)
  userId: text (foreign key -> users.id)
  title: text
  description: text
  priority: enum ('LOW', 'MEDIUM', 'HIGH')
  status: enum ('OPEN', 'IN_PROGRESS', 'RESOLVED')
  resolution: text (nullable)
  createdAt: timestamp
  updatedAt: timestamp
}
```

## Backend API Structure

### Authentication Routes

```typescript
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
GET /api/me
```

### Core Data Routes

```typescript
// Progress tracking
GET /api/progress
POST /api/progress
PUT /api/progress/:id

// Practice calls
GET /api/practice-calls
POST /api/practice-calls/start
POST /api/practice-calls/complete

// Training modules
GET /api/modules
POST /api/modules (admin only)
PUT /api/modules/:id (admin only)
DELETE /api/modules/:id (admin only)

// Materials
GET /api/materials
POST /api/materials (admin only)
PUT /api/materials/:id (admin only)
DELETE /api/materials/:id (admin only)

// Tests and assignments
GET /api/tests
GET /api/tests/:id
POST /api/tests (admin only)
GET /api/test-assignments
POST /api/test-assignments (admin only)
POST /api/submit-test

// User management (admin only)
GET /api/users
GET /api/users/:id/notes
POST /api/users/:id/notes
PUT /api/users/:id/notes/:noteId
DELETE /api/users/:id/notes/:noteId
```

### AI Integration Routes

```typescript
// OpenAI integrations
POST /api/chat
POST /api/analyze-call

// Health check
GET /api/health
```

## Frontend Architecture

### Component Hierarchy

```
App.tsx (root)
├── QueryClientProvider
├── TooltipProvider  
├── AuthGuard
│   ├── AuthPage (login/register)
│   └── Main App Pages
│       ├── Dashboard
│       ├── Materials
│       ├── Profile
│       ├── Tests
│       ├── TestTaking
│       └── Admin Pages
│           ├── Admin
│           ├── EnhancedAdmin
│           ├── ModuleAdmin
│           ├── AdminControl
│           └── ProblemReports
```

### Key Components

**Layout Components:**
- `Layout`: Main application wrapper with navigation
- `AuthGuard`: Authentication state management
- `Toaster`: Global notification system

**Feature Components:**
- `PracticeCall`: AI-powered roleplay dialog
- `VoiceWidget`: Ringg AI voice assistant integration
- `AIChatbotContainer`: OpenAI chat assistant
- `ModuleCard`: Training module display
- `MaterialPreview`: File preview system

**UI Components (shadcn/ui):**
- Button, Card, Dialog, Form, Input, Select
- Dropdown, Tooltip, Progress, Badge
- Alert, Accordion, Tabs, Sheet

### State Management

**TanStack Query Configuration:**
```typescript
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
```

**Key Query Keys:**
- `/api/me` - Current user data
- `/api/progress` - User progress tracking
- `/api/modules` - Training modules (refetches every 5s)
- `/api/materials` - Learning resources
- `/api/practice-calls` - Practice call history
- `['/api/users', userId, 'notes']` - User notes

## AI Service Integrations

### OpenAI Integration

**Chat Assistant:**
```typescript
export async function getChatResponse(messages: ChatMessage[]): Promise<string> {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system", 
        content: "You are a helpful AI assistant for Class Mentors training..."
      },
      ...messages
    ],
    max_tokens: 1000,
    temperature: 0.7,
  });

  return response.choices[0]?.message?.content || "I apologize, but I couldn't generate a response.";
}
```

**Practice Call Analysis:**
```typescript
export async function analyzePracticeCall(transcript: string): Promise<CallAnalysis> {
  // OpenAI analysis of practice call performance
  // Returns score and detailed feedback
}
```

### Ringg AI Integration

**Voice Assistant Loading:**
```typescript
const initializeRinggAI = () => {
  // Dynamic CDN loading
  loadAgentsCdn("1.0.3", () => {
    window.loadAgent({
      agentId: process.env.VITE_RINGG_AGENT_ID,
      xApiKey: process.env.VITE_RINGG_X_API_KEY,
      variables: { scenario_id: scenario },
      buttons: { /* custom styling */ }
    });
  });
};
```

## Security Implementation

### Authentication System

**Session Management:**
```typescript
app.use(session({
  store: new (pgSession(session))({
    pool: pgPool,
    tableName: 'session'
  }),
  secret: process.env.SESSION_SECRET || 'dev-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
  }
}));
```

**Password Hashing:**
```typescript
// Registration
const passwordHash = await bcrypt.hash(password, 10);

// Login verification
const isValid = await bcrypt.compare(password, user.passwordHash);
```

**Authentication Middleware:**
```typescript
const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!(req as any).session?.userId) {
    return res.status(401).json({ message: "Authentication required" });
  }
  next();
};
```

## Environment Configuration

### Required Variables
```env
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require
SESSION_SECRET=your-secret-key
OPENAI_API_KEY=sk-your-openai-key
```

### Optional Variables
```env
VITE_RINGG_AGENT_ID=your-ringg-agent-id
VITE_RINGG_X_API_KEY=your-ringg-api-key
VITE_BOTPRESS_BOT_ID=your-botpress-bot-id
VITE_BOTPRESS_CLIENT_ID=your-botpress-client-id
VITE_BOTPRESS_WEBCHAT_HOST=your-botpress-host
VITE_BOTPRESS_MESSAGING_URL=your-botpress-messaging-url
```

## Deployment Architecture

### Production Configuration

**CORS Setup:**
```typescript
app.use(cors({
  origin: [
    /^https:\/\/.*\.replit\.app$/,
    /^https:\/\/.*\.replit\.dev$/,
    'https://replit.com'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

**Build Process:**
```json
{
  "scripts": {
    "build": "vite build && esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist",
    "start": "NODE_ENV=production node dist/index.js"
  }
}
```

### Health Monitoring

**Health Check Endpoint:**
```typescript
app.get("/api/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development"
  });
});
```

## Performance Optimizations

### Database Optimizations
- Connection pooling with Neon Database
- Indexed queries on user_id and module columns
- Efficient session storage with PostgreSQL

### Frontend Optimizations
- TanStack Query caching with infinite stale time
- Selective component re-rendering
- Lazy loading of heavy components
- Optimized bundle splitting with Vite

### Real-time Features
- 5-second polling for module updates
- WebSocket connections for practice calls
- Immediate UI updates with optimistic updates

## Error Handling & Logging

### Backend Error Handling
```typescript
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  res.status(status).json({ message });
  console.error('Server Error:', err);
});
```

### Frontend Error Boundaries
- React Query error handling with toast notifications
- Graceful fallbacks for AI service failures
- Comprehensive form validation with Zod schemas

### Monitoring & Diagnostics
- Express request logging with timestamps
- Database connection monitoring
- AI service availability checks
- Session persistence verification

---

*This technical documentation provides comprehensive details for developers, system administrators, and technical stakeholders working with the CM Training Platform.*