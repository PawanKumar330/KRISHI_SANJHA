import express from "express";
import { ZodError } from "zod";
import { authRouter } from "./routes/auth.js";
import { usersRouter } from "./routes/users.js";
import { locationsRouter } from "./routes/locations.js";

export function createApp() {
  const app = express();
  app.use(express.json({ limit: "1mb" }));

  app.get("/health", (_req, res) => res.json({ status: "ok", district: "Jamui" }));

  app.use("/api/v1/auth", authRouter);
  app.use("/api/v1/users", usersRouter);
  app.use("/api/v1/locations", locationsRouter);

  app.use((_req, res) => res.status(404).json({ error: "Not found" }));

  app.use(
    (
      err: Error & { status?: number; code?: string },
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction,
    ) => {
      if (err instanceof ZodError) {
        return res.status(400).json({ error: "Validation failed", details: err.flatten() });
      }
      if (err.code === "23505") return res.status(409).json({ error: "Duplicate record" });
      const status = err.status ?? 500;
      if (status >= 500) console.error(err);
      return res.status(status).json({ error: status >= 500 ? "Internal server error" : err.message });
    },
  );

  return app;
}
