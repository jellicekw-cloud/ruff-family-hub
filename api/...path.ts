import app from "../server/app";

// Vercel's Node.js runtime accepts an Express app directly as a request handler
// (it has the same (req, res) signature Node's http server expects).
// This single catch-all file handles every request under /api/*, e.g.
// /api/health, /api/gemini/recipe-finder, /api/gemini/pantry-parser, etc.
// — Express's own internal routing (defined in server/app.ts) takes it from there.
export default app;

