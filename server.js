"use strict";

const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
require("dotenv").config();
const { v2: cloudinary } = require("cloudinary");

const ROOT = __dirname;
const DATA_FILE = path.join(ROOT, "data", "words.json");
const AUDIO_DIR = path.join(ROOT, "audio");
const MAX_AUDIO_BYTES = 5 * 1024 * 1024;
const PORT = Number(process.env.PORT || 4173);
const ADMIN_KEY = process.env.ADMIN_KEY || "sabda";
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});
const AUDIO_TYPES = {
  "audio/mpeg": "mp3",
  "audio/mp3": "mp3",
  "audio/wav": "wav",
  "audio/x-wav": "wav",
  "audio/wave": "wav",
  "audio/ogg": "ogg",
  "audio/mp4": "m4a",
  "audio/x-m4a": "m4a",
  "audio/webm": "webm"
};
const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".ogg": "audio/ogg",
  ".m4a": "audio/mp4",
  ".webm": "audio/webm"
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

function readAudioBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    let tooLarge = false;
    const chunks = [];
    req.on("data", (chunk) => {
      if (tooLarge) return;
      size += chunk.length;
      if (size > MAX_AUDIO_BYTES) {
        tooLarge = true;
        chunks.length = 0;
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => {
      if (tooLarge) {
        reject(Object.assign(new Error("Audio files must be 5 MB or smaller."), { statusCode: 413 }));
      } else {
        resolve(Buffer.concat(chunks));
      }
    });
    req.on("error", reject);
  });
}

function audioFilePath(audioUrl) {
  const match = String(audioUrl || "").match(/^\/audio\/([a-f0-9]{32}\.(?:mp3|wav|ogg|m4a|webm))$/);
  return match ? path.join(AUDIO_DIR, match[1]) : null;
}

async function removeAudioFile(audioUrl) {
  const filePath = audioFilePath(audioUrl);
  if (filePath) {
    try { await fs.promises.unlink(filePath); }
    catch (error) { if (error.code !== "ENOENT") throw error; }
  }
}

async function removeCloudinaryAudio(publicId) {
  if (!publicId) return;
  await cloudinary.uploader.destroy(publicId, { resource_type: "video", invalidate: true });
}

function uploadCloudinaryAudio(body, extension) {
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    return Promise.reject(Object.assign(new Error("Cloudinary is not configured on the server."), { statusCode: 503 }));
  }
  return new Promise((resolve, reject) => {
    const publicId = crypto.randomBytes(16).toString("hex");
    const stream = cloudinary.uploader.upload_stream({
      resource_type: "video",
      public_id: publicId,
      folder: "sabda-ghar/audio",
      overwrite: false
    }, (error, result) => {
      if (error) return reject(error);
      resolve(result);
    });
    stream.end(body);
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

  const audioMatch = url.pathname.match(/^\/api\/words\/([^/]+)\/doteli\/([^/]+)\/audio$/);
  if (audioMatch) {
    if (req.method !== "POST") return sendJson(res, 405, { error: "Method not allowed." });
    const reviewerUpload = isAdmin(req);
    const communityRecording = req.headers["x-audio-source"] === "recording";
    if (!reviewerUpload && !communityRecording) {
      return sendJson(res, 403, { error: "Reviewer access or a community recording is required." });
    }
    const word = words.find((item) => item.id === audioMatch[1]);
    if (!word) return sendJson(res, 404, { error: "Word not found." });
    const entry = word.doteli.find((item) => item.id === audioMatch[2]);
    if (!entry) return sendJson(res, 404, { error: "Doteli entry not found." });
    const contentType = String(req.headers["content-type"] || "").split(";")[0].toLowerCase();
    const extension = AUDIO_TYPES[contentType];
    if (!extension) return sendJson(res, 415, { error: "Choose an MP3, WAV, OGG, M4A, or WebM audio file." });
    const body = await readAudioBody(req);
    if (!body.length) return sendJson(res, 400, { error: "The audio file is empty." });

    const uploaded = await uploadCloudinaryAudio(body, extension);
    const previousAudioUrl = entry.audioUrl;
    const previousPublicId = entry.audioPublicId;
    entry.audioUrl = uploaded.secure_url;
    entry.audioPublicId = uploaded.public_id;
    entry.audioVerified = reviewerUpload && !communityRecording;
    const audioContributor = String(req.headers["x-audio-contributor"] || "").trim().slice(0, 40);
    if (audioContributor) entry.audioContributor = audioContributor;
    else delete entry.audioContributor;
    try { writeWords(words); }
    catch (error) {
      await removeCloudinaryAudio(uploaded.public_id).catch((cleanupError) => console.error("Could not remove incomplete Cloudinary upload:", cleanupError));
      throw error;
    }
    try {
      if (previousPublicId) await removeCloudinaryAudio(previousPublicId);
      else await removeAudioFile(previousAudioUrl);
    }
    catch (error) { console.error("Could not remove replaced audio file:", error); }
    return sendJson(res, 201, { audioUrl: entry.audioUrl });
  }

  const audioReviewMatch = url.pathname.match(/^\/api\/words\/([^/]+)\/doteli\/([^/]+)\/audio\/verify$/);
  if (audioReviewMatch) {
    if (req.method !== "PATCH") return sendJson(res, 405, { error: "Method not allowed." });
    if (!isAdmin(req)) return sendJson(res, 403, { error: "Reviewer access is required." });
    const word = words.find((item) => item.id === audioReviewMatch[1]);
    if (!word) return sendJson(res, 404, { error: "Word not found." });
    const entry = word.doteli.find((item) => item.id === audioReviewMatch[2]);
    if (!entry) return sendJson(res, 404, { error: "Doteli entry not found." });
    if (!entry.audioUrl) return sendJson(res, 409, { error: "This Doteli entry has no voice recording." });
    entry.audioVerified = true;
    writeWords(words);
    return sendJson(res, 200, entry);
  }

  const doteliMatch = url.pathname.match(/^\/api\/words\/([^/]+)\/doteli(?:\/([^/]+))?$/);
  if (doteliMatch) {
    const word = words.find((item) => item.id === doteliMatch[1]);
    if (!word) return sendJson(res, 404, { error: "Word not found." });

    if (req.method === "POST" && !doteliMatch[2]) {
      const body = await readBody(req);
      const text = String(body.text || "").trim();
      const region = String(body.region || "").trim();
      const contributor = String(body.contributor || "").trim();
      if (!text || !region || !contributor) {
        return sendJson(res, 400, { error: "Enter the Doteli word, district or area, and contributor name." });
      }
      const entry = {
        id: String(Date.now()),
        text,
        region,
        contributor,
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
        const audioUrl = entry.audioUrl;
        const audioPublicId = entry.audioPublicId;
        word.doteli = word.doteli.filter((item) => item.id !== entry.id);
        writeWords(words);
        try {
          if (audioPublicId) await removeCloudinaryAudio(audioPublicId);
          else await removeAudioFile(audioUrl);
        } catch (error) { console.error("Could not remove Doteli audio file:", error); }
        return sendJson(res, 200, { ok: true });
      }
    }
  }

  sendJson(res, 404, { error: "API route not found." });
}

const server = http.createServer(async (req, res) => {
  let url;
  try { url = new URL(req.url, `http://${req.headers.host || "localhost"}`); }
  catch (error) { return sendJson(res, 400, { error: "Invalid request URL." }); }

  if (url.pathname.startsWith("/api/")) {
    try { await handleApi(req, res, url); }
    catch (error) { sendJson(res, error.statusCode || (error instanceof SyntaxError ? 400 : 500), { error: error.message || "Server error." }); }
    return;
  }

  let pathname;
  try { pathname = decodeURIComponent(url.pathname); }
  catch (error) { return sendJson(res, 400, { error: "Invalid URL path." }); }
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
  console.log("Reviewer access is configured.");
});
