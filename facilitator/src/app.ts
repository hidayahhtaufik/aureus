/**
 * Hono application factory.
 *
 * The exported `app` is a fully-configured Hono instance with no side effects
 * (no HTTP listener). Tests import `app` directly and call `app.request(...)`
 * to exercise routes without binding a port.
 *
 * `src/index.ts` is the production entry that imports this app and binds it
 * to an actual port via `@hono/node-server`.
 */

import { Hono } from "hono";
import { logger } from "hono/logger";
import { cors } from "hono/cors";

import { supportedRoute } from "./routes/supported.js";
import { verifyRoute } from "./routes/verify.js";
import { settleRoute } from "./routes/settle.js";

export function buildApp(): Hono {
  const app = new Hono();

  // Middleware
  app.use("*", logger());
  app.use("*", cors({ origin: "*" }));

  // Health / project info
  app.get("/", (c) =>
    c.json({
      name: "TalosFacilitator",
      description: "x402 facilitator for Arc Network — by Aureus Protocol",
      version: "0.1.0",
      builder: "auranode.xyz",
      repo: "https://github.com/hidayahhtaufik/aureus",
      endpoints: {
        "GET /": "this info",
        "GET /health": "health check",
        "GET /supported": "supported networks + assets",
        "POST /verify": "verify x402 payment payload",
        "POST /settle": "verify + settle x402 payment payload",
      },
    })
  );

  app.get("/health", (c) => c.json({ ok: true, timestamp: Date.now() }));

  // x402 facilitator routes
  app.route("/supported", supportedRoute);
  app.route("/verify", verifyRoute);
  app.route("/settle", settleRoute);

  // 404 handler
  app.notFound((c) => c.json({ error: "Not found", path: c.req.path }, 404));

  // Error handler
  app.onError((err, c) => {
    console.error("Server error:", err);
    return c.json({ error: "Internal server error", message: err.message }, 500);
  });

  return app;
}

export const app = buildApp();
