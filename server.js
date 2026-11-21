"use strict";

const http = require("http");
const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const DATA_FILE = path.join(ROOT, "data", "words.json");
const PORT = Number(process.env.PORT || 4173);
const ADMIN_KEY = process.env.ADMIN_KEY || "sabda";
const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png"
};

function readWords() {
  return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
}

function writeWords(words) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(words, null, 2) + "\n", "utf8");
}

function sendJson(res, status, data) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  });
  res.end(JSON.stringify(data));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 100000) {
        reject(new Error("Request is too large"));
        req.destroy();
      }
    });
    req.on("end", () => {
      try { resolve(body ? JSON.parse(body) : {}); }
      catch (error) { reject(error); }
    });
  });
}

function norm(value) {
  return String(value || "").toLowerCase().replace(/\s+/g, " ").trim();
}

function isAdmin(req) {
  return req.headers["x-admin-key"] === ADMIN_KEY;
}

async function handleApi(req, res, url) {
  const words = readWords();

  if (req.method === "GET" && url.pathname === "/api/admin/check") {
    return isAdmin(req) ? sendJson(res, 200, { ok: true }) : sendJson(res, 403, { error: "Incorrect reviewer key." });
  }

  if (req.method === "GET" && url.pathname === "/api/stats") {
    const entries = words.flatMap((word) => word.doteli);
    return sendJson(res, 200, {
      totalWords: words.length,
      wordsWithDoteli: words.filter((word) => word.doteli.length).length,
      verifiedEntries: entries.filter((entry) => entry.verified).length,
      contributors: new Set(entries.map((entry) => entry.contributor).filter(Boolean)).size
    });
  }

  if (req.method === "GET" && url.pathname === "/api/words") {
    const query = norm(url.searchParams.get("q"));
    const filtered = query ? words.filter((word) =>
      norm([word.en, word.ne, word.rom, ...word.doteli.map((entry) => entry.text)].join(" "))
        .includes(query)) : words;
    return sendJson(res, 200, filtered);
  }

  if (req.method === "POST" && url.pathname === "/api/words") {
    const body = await readBody(req);
    const en = String(body.en || "").trim();
    const ne = String(body.ne || "").trim();
    const rom = String(body.rom || "").trim();
    if (!en || !ne) return sendJson(res, 400, { error: "English and Nepali words are required." });
    if (words.some((word) => norm(word.en) === norm(en))) {
      return sendJson(res, 409, { error: "That English word already exists." });
    }
    const word = { id: String(Date.now()), en, ne, rom, doteli: [] };
    words.push(word);
    writeWords(words);
    return sendJson(res, 201, word);
  }

  const doteliMatch = url.pathname.match(/^\/api\/words\/([^/]+)\/doteli(?:\/([^/]+))?$/);
  if (doteliMatch) {
    const word = words.find((item) => item.id === doteliMatch[1]);
    if (!word) return sendJson(res, 404, { error: "Word not found." });

    if (req.method === "POST" && !doteliMatch[2]) {
      const body = await readBody(req);
      const text = String(body.text || "").trim();
      if (!text) return sendJson(res, 400, { error: "Enter a Doteli word." });
      const entry = {
        id: String(Date.now()),
        text,
        region: String(body.region || "").trim(),
        contributor: String(body.contributor || "").trim(),
        verified: false
      };
      word.doteli.push(entry);
      writeWords(words);
      return sendJson(res, 201, entry);
    }

    if (doteliMatch[2]) {
      const entry = word.doteli.find((item) => item.id === doteliMatch[2]);
      if (!entry) return sendJson(res, 404, { error: "Doteli entry not found." });
      if (!isAdmin(req)) return sendJson(res, 403, { error: "Reviewer access is required." });
      if (req.method === "PATCH") {
        entry.verified = true;
        writeWords(words);
        return sendJson(res, 200, entry);
      }
      if (req.method === "DELETE") {
        word.doteli = word.doteli.filter((item) => item.id !== entry.id);
        writeWords(words);
        return sendJson(res, 200, { ok: true });
      }
    }
  }

  sendJson(res, 404, { error: "API route not found." });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  if (url.pathname.startsWith("/api/")) {
    try { await handleApi(req, res, url); }
    catch (error) { sendJson(res, error instanceof SyntaxError ? 400 : 500, { error: error.message || "Server error." }); }
    return;
  }

  let pathname = decodeURIComponent(url.pathname);
  if (pathname === "/") pathname = "/index.html";
  const filePath = path.resolve(ROOT, "." + pathname);
  if (filePath !== ROOT && !filePath.startsWith(ROOT + path.sep)) {
    res.writeHead(403); res.end("Forbidden"); return;
  }

  fs.readFile(filePath, (error, data) => {
    if (error) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Not found");
      return;
    }
    res.writeHead(200, {
      "Content-Type": MIME[path.extname(filePath).toLowerCase()] || "application/octet-stream",
      "Cache-Control": "no-cache"
    });
    res.end(data);
  });
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`Sabda Ghar running at http://127.0.0.1:${PORT}`);
  console.log(`Reviewer key: ${ADMIN_KEY}`);
});
