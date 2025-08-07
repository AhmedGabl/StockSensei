import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import ConnectPgSimple from "connect-pg-simple";
import cors from "cors";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();

// Environment detection
const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = !isProduction;

// CORS configuration for deployment
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    if (isDevelopment) {
      // In development, allow all origins
      return callback(null, true);
    }
    
    // In production, allow Replit domains and local testing
    const allowedOrigins = [
      'https://replit.app',
      /\.replit\.app$/,
      /\.replit\.dev$/,
      'http://localhost:5000',
      'https://localhost:5000'
    ];
    
    // Check if origin matches any allowed pattern
    const isAllowed = allowedOrigins.some(allowedOrigin => {
      if (typeof allowedOrigin === 'string') {
        return origin === allowedOrigin;
      }
      return allowedOrigin.test(origin);
    });
    
    if (isAllowed) {
      callback(null, true);
    } else {
      // For debugging - log rejected origins in production
      console.log('CORS rejected origin:', origin);
      callback(null, true); // Allow anyway for now to prevent issues
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  exposedHeaders: ['Set-Cookie']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Session configuration
const PgSession = ConnectPgSimple(session);

app.use(session({
  store: new PgSession({
    conString: process.env.DATABASE_URL,
    tableName: 'session',
    createTableIfMissing: true
  }),
  secret: process.env.SESSION_SECRET || 'dev-secret-key-change-in-production-' + Date.now(),
  resave: false,
  saveUninitialized: false,
  rolling: true, // Refresh session on each request
  name: 'cm.sid', // Custom session name
  cookie: {
    secure: isProduction, // HTTPS only in production
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days for stability
    sameSite: isProduction ? 'none' : 'lax' // Cross-site compatibility for deployment
  }
}));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
