import express, { type Request, Response, NextFunction } from "express";
import cookieParser from "cookie-parser";
import { registerRoutes } from "./simpleRoutes";
import { setupVite, serveStatic, log } from "./vite";
import { closeBrowser } from "./services/pdfService";
import {
  helmetConfig,
  apiLimiter,
  securityHeaders,
  sanitizeInput,
  validateRequest,
  generateCsrfToken,
} from "./middleware/security";

const app = express();

// Security middleware - Applied first
app.use(securityHeaders);
app.use(helmetConfig);
app.use(cookieParser());
app.use(generateCsrfToken);

declare module 'http' {
  interface IncomingMessage {
    rawBody: unknown
  }
}
app.use(express.json({
  limit: '150mb',
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: false, limit: '150mb' }));

// Apply security validations
app.use(validateRequest);
app.use(sanitizeInput);

// Rate limiting for API routes
app.use('/api', apiLimiter);

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
  try {
    const server = await registerRoutes(app);

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      console.error("Express error:", err);
      res.status(status).json({ message });
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
    // Other ports are firewalled. Default to 5002 if not specified.
    // this serves both the API and the client.
    // It is the only port that is not firewalled.
    const port = parseInt(process.env.PORT || '5002', 10);
    const host = process.env.HOST || '0.0.0.0'; // Listen on all network interfaces

    server.on('error', (err: any) => {
      if (err && err.code === 'EADDRINUSE') {
        console.error(`Port ${port} is already in use. Set PORT to a free port (e.g., 5003) and restart.`);
        process.exit(1);
      } else {
        throw err;
      }
    });

    server.listen(port, host, () => {
      log(`serving on port ${port}`);
      log(`Global:   http://192.168.1.194:${port}`);
      log(`Network:  http://192.168.1.194:${port}`);
    });

    // Keep the process alive
    process.on('SIGTERM', async () => {
      console.log('SIGTERM received, shutting down gracefully');
      await closeBrowser();
      server.close(() => {
        process.exit(0);
      });
    });

    process.on('SIGINT', async () => {
      console.log('SIGINT received, shutting down gracefully');
      await closeBrowser();
      server.close(() => {
        process.exit(0);
      });
    });

  } catch (error) {
    console.error("Server startup error:", error);
    process.exit(1);
  }
})();
