import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import app from "./server/app.js";

const PORT = 3000;

// Serve frontend in production or Vite middleware in dev
// (This entry point is only used for LOCAL development via `npm run dev`,
// or for hosting on a persistent-server platform other than Vercel.
// Vercel itself uses api/[...path].ts, which imports the same `app`.)
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

