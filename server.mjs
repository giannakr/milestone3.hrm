/**
 * Minimal Node server for Cursor publish + local/dev.
 * Serves the static careers site and /api/hubspot/* routes.
 * Reads HUBSPOT_ACCESS_TOKEN from the environment only (never client-exposed).
 *
 * GitHub Pages cannot run this process — static pages use mock fallback there.
 */

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { checkConnection, getRecruitingData } from "./lib/hubspot.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = __dirname;
const PORT = Number(process.env.PORT) || 3000;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".md": "text/markdown; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
};

function sendJson(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  res.end(payload);
}

function safeJoin(root, requestPath) {
  const decoded = decodeURIComponent(requestPath.split("?")[0]);
  const cleaned = decoded.replace(/^\/+/, "") || "index.html";
  if (cleaned.includes("\0") || cleaned.split("/").some((p) => p === "..")) {
    return null;
  }
  const abs = path.normalize(path.join(root, cleaned));
  if (!abs.startsWith(root)) return null;
  return abs;
}

async function handleApi(req, res, url) {
  if (req.method !== "GET" && req.method !== "HEAD") {
    sendJson(res, 405, { ok: false, error: "Method not allowed" });
    return;
  }

  if (url.pathname === "/api/hubspot/status") {
    const status = await checkConnection();
    sendJson(res, status.ok || status.mode === "mock" ? 200 : 502, status);
    return;
  }

  if (url.pathname === "/api/hubspot/recruiting") {
    const data = await getRecruitingData();
    sendJson(res, 200, data);
    return;
  }

  sendJson(res, 404, { ok: false, error: "Not found" });
}

function serveStatic(req, res, url) {
  let filePath = safeJoin(ROOT, url.pathname === "/" ? "/index.html" : url.pathname);
  if (!filePath) {
    res.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Bad request");
    return;
  }

  // Never serve env files or server internals as static downloads.
  const base = path.basename(filePath);
  if (
    base.startsWith(".env") ||
    filePath === path.join(ROOT, "server.mjs") ||
    filePath.startsWith(path.join(ROOT, "lib") + path.sep)
  ) {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Not found");
    return;
  }

  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Not found");
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    const type = MIME[ext] || "application/octet-stream";
    res.writeHead(200, { "Content-Type": type });
    if (req.method === "HEAD") {
      res.end();
      return;
    }
    fs.createReadStream(filePath).pipe(res);
  });
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
    if (url.pathname.startsWith("/api/hubspot")) {
      await handleApi(req, res, url);
      return;
    }
    serveStatic(req, res, url);
  } catch (err) {
    sendJson(res, 500, {
      ok: false,
      error: "Server error",
      message: err && err.message ? err.message : "Unknown error",
    });
  }
});

server.listen(PORT, "0.0.0.0", () => {
  const mode = process.env.HUBSPOT_ACCESS_TOKEN ? "live-capable" : "mock";
  console.log(`prova-careers listening on http://127.0.0.1:${PORT} (${mode})`);
});
