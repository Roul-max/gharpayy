import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import http from "http";
import { Server as SocketIOServer } from "socket.io";
import compression from "compression";
import helmet from "helmet";
import routes from "./routes/index.js";
import { requestLogger } from "./middleware/requestLogger.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { startQueueSchedulers } from "./queue/schedulers.js";
import { startLeadCaptureQueueWorker } from "./queue/leadCaptureQueue.js";
import { startWorkers } from "./workers/index.js";
import { hasRedis } from "./cache/redis.js";
import { setSocketServer } from "./realtime/socket.js";
import { setupSentry, Sentry } from "./observability/sentry.js";
import { startTracing } from "./observability/tracing.js";
import { logger } from "./observability/logger.js";
import { collectRuntimeMetrics, snapshotMetrics } from "./observability/metrics.js";
import { pool } from "./config/db.js";
import { validateEnv } from "./config/env.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function startServer() {
  validateEnv();
  setupSentry();
  await startTracing();

  const groqKey = process.env.GROQ_API_KEY;
  const maskKey = (value?: string) => {
    if (!value) return null;
    if (value.length <= 8) return `${value.slice(0, 2)}***${value.slice(-2)}`;
    return `${value.slice(0, 4)}***${value.slice(-4)}`;
  };
  logger.info("AI assistant config", {
    has_groq_key: Boolean(groqKey),
    using_key: groqKey ? "GROQ_API_KEY" : "none",
    key_preview: maskKey(groqKey),
    model: process.env.GROQ_MODEL ?? "llama-3.1-70b-versatile",
    base_url: process.env.GROQ_BASE_URL ?? "https://api.groq.com/openai/v1",
    node_env: process.env.NODE_ENV ?? "unknown"
  });

  const app = express();
  app.disable("x-powered-by");
  const httpServer = http.createServer(app);
  const PORT = 3000;
  const allowedOrigins = (process.env.CORS_ORIGINS ?? "http://localhost:5173,http://localhost:3000")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: allowedOrigins,
      methods: ["GET", "POST", "PATCH", "PUT", "DELETE"]
    }
  });
  setSocketServer(io);

  app.use(
    cors({
      origin: (origin, cb) => {
        if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
        return cb(new Error("Origin not allowed by CORS policy"));
      },
      credentials: true
    })
  );
  app.use(
    helmet({
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          "script-src": ["'self'", "https://challenges.cloudflare.com", "https://checkout.razorpay.com"],
          "frame-src": ["'self'", "https://challenges.cloudflare.com", "https://checkout.razorpay.com", "https://api.razorpay.com"],
          "connect-src": ["'self'", "https://challenges.cloudflare.com", "https://api.razorpay.com", "https:", "wss:"],
          "img-src": ["'self'", "data:", "https:"],
          "style-src": ["'self'", "'unsafe-inline'", "https:"],
          "font-src": ["'self'", "data:", "https:"]
        }
      },
      crossOriginResourcePolicy: { policy: "cross-origin" }
    })
  );
  app.use(compression());
  app.use((req, res, next) => {
    req.setTimeout(Number(process.env.REQUEST_TIMEOUT_MS ?? 15000));
    res.setTimeout(Number(process.env.REQUEST_TIMEOUT_MS ?? 15000), () => {
      if (!res.headersSent) {
        res.status(503).json({ error: "Request timed out" });
      }
    });
    next();
  });
  app.use(
    express.json({
      verify: (req: any, _res, buf) => {
        req.rawBody = buf.toString("utf8");
      }
    })
  );
  if ((Sentry as any)?.Handlers?.requestHandler) {
    app.use((Sentry as any).Handlers.requestHandler());
  }
  app.use(requestLogger);

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", request_id: (req as any).requestId ?? null });
  });

  app.get("/api/metrics", async (_req, res) => {
    const metrics = await collectRuntimeMetrics();
    res.json(metrics);
  });

  app.get("/metrics", async (_req, res) => {
    const metrics = await collectRuntimeMetrics();
    res.json(metrics);
  });

  app.use("/api", routes);

  // Centralized error handler
  if ((Sentry as any)?.Handlers?.errorHandler) {
    app.use((Sentry as any).Handlers.errorHandler());
  }
  app.use(errorHandler);

  if (hasRedis()) {
    await startQueueSchedulers();
    startWorkers();
  } else {
    logger.warn("Redis not configured; skipping queue schedulers and workers.");
  }

  startLeadCaptureQueueWorker();

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files from dist in production
    app.use(express.static(path.join(__dirname, "../../dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "../../dist/index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    logger.info("Server started", {
      port: PORT,
      host: "0.0.0.0",
      request_timeout_ms: Number(process.env.REQUEST_TIMEOUT_MS ?? 15000)
    });
  });

  const shutdown = async () => {
    if (pool) await pool.end();
    httpServer.close();
  };
  process.once("SIGINT", () => void shutdown());
  process.once("SIGTERM", () => void shutdown());
}

startServer();
