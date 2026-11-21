// ===== Sabda Ghar front end =====
// Talks to the server API. If the server can’t be reached, it shows the last saved copy.
const $ = (id) => document.getElementById(id);
const CACHE_KEY = "sg-words-cache";
const SAMPLE = [
  { id: "1", en: "water", ne: "पानी", rom: "pani", doteli: [] },
  { id: "2", en: "house", ne: "घर", rom: "ghar", doteli: [] },
  { id: "3", en: "mountain", ne: "पहाड", rom: "pahad", doteli: [] },
  { id: "4", en: "mother", ne: "आमा", rom: "aama", doteli: [] },
];
let words = [];
let allWords = [];
let editingId = null;
let adminKey = sessionStorage.getItem("sg-admin") || "";

// Treat common Devanagari spelling variants as the same when searching.
function norm(s) {
  return String(s || "").toLowerCase()
    .replace(/ी/g, "ि").replace(/ू/g, "ु").replace(/ँ/g, "ं")
    .replace(/[शष]/g, "स").replace(/\s+/g, " ").trim();
}
const searchText = (w) => norm([w.en, w.ne, w.rom, ...(w.doteli || []).map((d) => d.text)].join(" "));
const say = (t) => { $("msg").textContent = t; };
const OFFLINE_MSG = "You seem to be offline. Please try again when you have a connection.";

async function api(path, opts = {}) {
  const headers = { "Content-Type": "application/json" };
  if (adminKey) headers["x-admin-key"] = adminKey;
  const res = await fetch(path, Object.assign({}, opts, { headers }));
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data.error || "Request failed"), { status: res.status });
  return data;
}
const cacheGet = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(CACHE_KEY));
    return Array.isArray(saved) ? saved : [];
  } catch (e) { return []; }
};
const cacheSet = (l) => { try { localStorage.setItem(CACHE_KEY, JSON.stringify(l)); } catch (e) {} };
function offlineWords() {
  let saved = cacheGet();
  if (!saved.length) {
    saved = SAMPLE.map((word) => ({ ...word, doteli: [] }));
    cacheSet(saved);
  }
  return saved;
}

// ----- load data -----
async function loadWords() {
  const q = $("q").value.trim();
  let offline = false;
  try {
    words = await api("/api/words?q=" + encodeURIComponent(q));
    if (!q) { allWords = words; cacheSet(words); }
  } catch (e) {
    offline = true;
    allWords = offlineWords();
    const nq = norm(q);
    words = allWords.filter((w) => !nq || searchText(w).includes(nq));
  }
  $("net").textContent = offline ? "Offline: saved copy" : "Online";
  render();
  loadStats(offline);
}

async function loadStats(offline) {
  let s;
  try { if (offline) throw 0; s = await api("/api/stats"); }
  catch (e) {
    const all = cacheGet(), v = all.flatMap((w) => w.doteli);
    s = { totalWords: all.length, wordsWithDoteli: all.filter((w) => w.doteli.length).length,
          verifiedEntries: v.filter((d) => d.verified).length,
          contributors: new Set(v.map((d) => d.contributor).filter(Boolean)).size };
  }
  const box = $("stats"); box.textContent = "";
  [["words", s.totalWords], ["with Doteli", s.wordsWithDoteli], ["verified", s.verifiedEntries], ["contributors", s.contributors]]
    .forEach(([label, n]) => {
      const d = document.createElement("div");
      const b = document.createElement("b"); b.textContent = n;
      const sp = document.createElement("span"); sp.textContent = label;
      d.append(b, sp); box.appendChild(d);
    });
}

// ----- dictionary list -----
function el(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text !== undefined) n.textContent = text;
  return n;
}
function btn(label, act, wid, vid, extra) {
  const b = el("button", extra || "small", label);
  b.dataset.act = act; b.dataset.wid = wid; if (vid) b.dataset.vid = vid;
  return b;
}

function render() {
  const onlyMissing = $("onlyMissing").checked;
  const list = $("list"); list.textContent = "";
  let shown = 0;

  words.forEach((w) => {
    if (onlyMissing && w.doteli.length) return;
    shown++;
    const li = el("li", "entry");
    li.appendChild(el("div", "en", w.en));

    const r1 = el("div", "row");
    r1.appendChild(el("span", "tag", "Nepali"));
    const ne = el("span", "ne", w.ne); ne.lang = "ne"; r1.appendChild(ne);
    if (w.rom) r1.appendChild(el("span", "rom", w.rom));
    const sp = btn("🔊 Listen", "speak", w.id, "", "small");
    sp.setAttribute("aria-label", "Listen to the Nepali word for " + w.en);
    r1.appendChild(sp);
    li.appendChild(r1);

    const r2 = el("div", "row");
    r2.appendChild(el("span", "tag", "Doteli"));
    const vars = el("div", "variants");
    if (!w.doteli.length) vars.appendChild(el("span", "missing", "Not added yet"));
    w.doteli.forEach((d) => {
      const v = el("div", "variant");
      const t = el("span", "ne", d.text); t.lang = "ne"; v.appendChild(t);
      if (d.region) v.appendChild(el("span", "region", d.region));
      v.appendChild(el("span", d.verified ? "ver" : "com", d.verified ? "✓ Verified" : "Community-added"));
      if (d.contributor) v.appendChild(el("span", "by", "by " + d.contributor));
      if (d.sourceUrl && d.sourceUrl.startsWith("https://incubator.wikimedia.org/wiki/Wt/dty/")) {
        const source = el("a", "source", "Wiktionary source");
        source.href = d.sourceUrl;
        source.target = "_blank";
        source.rel = "noopener noreferrer";
        v.appendChild(source);
      }
      if (typeof d.audioUrl === "string" && d.audioUrl.startsWith("/audio/")) {
        const player = el("audio", "voice-player");
        player.controls = true;
        player.preload = "none";
        player.src = d.audioUrl;
        player.setAttribute("aria-label", "Doteli pronunciation of " + w.en);
        v.appendChild(player);
      }
      if (adminKey) {
        if (!d.verified) v.appendChild(btn("Verify", "verify", w.id, d.id));
        v.appendChild(btn("Remove", "remove", w.id, d.id, "small danger"));
        const uploadLabel = el("label", "audio-upload", d.audioUrl ? "Replace voice recording" : "Attach voice recording");
        const upload = el("input");
        upload.type = "file";
        upload.accept = "audio/mpeg,audio/mp3,audio/wav,audio/x-wav,audio/ogg,audio/mp4,audio/x-m4a,audio/webm,.mp3,.wav,.ogg,.m4a,.webm";
        upload.dataset.act = "audio";
        upload.dataset.wid = w.id;
        upload.dataset.vid = d.id;
        upload.setAttribute("aria-label", "Attach a Doteli voice recording for " + w.en);
        uploadLabel.appendChild(upload);
        v.appendChild(uploadLabel);
      }
      vars.appendChild(v);
    });
    r2.appendChild(vars);

    if (editingId === w.id) {
      const box = el("div", "edit");
      const mk = (id, ph, val, max) => {
        const i = el("input"); i.type = "text"; i.id = id; i.placeholder = ph;
        i.value = val || ""; i.maxLength = max; i.setAttribute("aria-label", ph); return i;
      };
      const row = el("div", "row"); row.style.margin = "0";
      row.append(btn("Submit", "submit", w.id, "", "small primary"), btn("Cancel", "cancel", w.id));
      box.append(mk("eDo", "Doteli word", "", 60),
                 mk("eReg", "District or area (for example Doti, Achham)", "", 40),
                 mk("eBy", "Your name (optional)", localStorage.getItem("sg-name"), 40), row);
      r2.appendChild(box);
    } else {
      r2.appendChild(btn(w.doteli.length ? "Add another form" : "Add Doteli", "add", w.id));
    }
    li.appendChild(r2);
    list.appendChild(li);
  });

  $("count").textContent = shown ? shown + (shown === 1 ? " word" : " words")
    : "No matching words. Use “Add a new word” to add it.";
  if (editingId) { const f = $("eDo"); if (f) f.focus(); }
}

// Nepali speech uses the device voice. It cannot pronounce Doteli correctly.
function speak(text) {
  if (!("speechSynthesis" in window)) { say("Your browser can’t read words aloud."); return; }
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "ne-NP"; u.rate = 0.85;
  const v = speechSynthesis.getVoices().find((x) => x.lang.toLowerCase().startsWith("ne"));
  if (v) u.voice = v; else say("No Nepali voice found on this device, so the sound may be off.");
  speechSynthesis.speak(u);
}

$("list").addEventListener("click", async (ev) => {
  const b = ev.target.closest("button"); if (!b) return;
  const { act, wid, vid } = b.dataset;
  try {
    if (act === "speak") { const w = words.find((x) => x.id === wid); if (w) speak(w.ne); return; }
    if (act === "add") { editingId = wid; say(""); render(); return; }
    if (act === "cancel") { editingId = null; render(); return; }
    if (act === "submit") {
      const by = $("eBy").value.trim();
      await api("/api/words/" + wid + "/doteli", { method: "POST",
        body: JSON.stringify({ text: $("eDo").value, region: $("eReg").value, contributor: by }) });
      if (by) localStorage.setItem("sg-name", by);
      editingId = null; say("Thank you! Your Doteli word was added and is waiting for review.");
    }
    if (act === "verify") { await api("/api/words/" + wid + "/doteli/" + vid, { method: "PATCH" }); say("Marked as verified."); }
    if (act === "remove") {
      if (!confirm("Remove this entry?")) return;
      await api("/api/words/" + wid + "/doteli/" + vid, { method: "DELETE" }); say("Entry removed.");
    }
    await loadWords();
  } catch (e) { say(e.status ? e.message : OFFLINE_MSG); }
});

$("list").addEventListener("change", async (ev) => {
  const input = ev.target;
  if (!(input instanceof HTMLInputElement) || input.dataset.act !== "audio") return;
  const file = input.files && input.files[0];
  if (!file) return;
  if (file.size > 5 * 1024 * 1024) { say("Audio files must be 5 MB or smaller."); input.value = ""; return; }
  if (!file.type) { say("This file type is not supported. Choose MP3, WAV, OGG, M4A, or WebM."); input.value = ""; return; }

  const { wid, vid } = input.dataset;
  try {
    const response = await fetch("/api/words/" + encodeURIComponent(wid) + "/doteli/" + encodeURIComponent(vid) + "/audio", {
      method: "POST",
      headers: { "Content-Type": file.type, "x-admin-key": adminKey },
      body: file
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw Object.assign(new Error(result.error || "Audio upload failed."), { status: response.status });
    say("Voice recording attached.");
    await loadWords();
  } catch (e) { say(e.status ? e.message : OFFLINE_MSG); }
});

$("searchForm").addEventListener("submit", (ev) => {
  ev.preventDefault();
  loadWords();
});
$("onlyMissing").addEventListener("change", render);

$("addBtn").addEventListener("click", async () => {
  try {
    await api("/api/words", { method: "POST",
      body: JSON.stringify({ en: $("nEn").value, ne: $("nNe").value, rom: $("nRom").value }) });
    ["nEn", "nNe", "nRom"].forEach((i) => ($(i).value = ""));
    $("addBox").open = false; say("Word added."); await loadWords();
  } catch (e) { say(e.status ? e.message : OFFLINE_MSG); }
});

$("adminOn").addEventListener("click", async () => {
  adminKey = $("adminKey").value.trim();
  try { await api("/api/admin/check"); sessionStorage.setItem("sg-admin", adminKey); say("Reviewer mode is on."); }
  catch (e) { adminKey = ""; say("That key isn’t correct."); }
  render();
});
$("adminOff").addEventListener("click", () => {
  adminKey = ""; sessionStorage.removeItem("sg-admin"); $("adminKey").value = ""; say("Reviewer mode is off."); render();
});

// ----- hero card: cycles through real words from the dictionary -----
let heroIdx = 0;
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
function showHeroWord() {
  const pool = allWords.length ? allWords : SAMPLE;
  const w = pool[heroIdx % pool.length]; heroIdx++;
  const d = (w.doteli || []).find((x) => x.verified) || (w.doteli || [])[0];
  $("hEn").textContent = w.en;
  $("hNe").textContent = w.ne;
  $("hRom").textContent = w.rom || "";
  const hd = $("hDo");
  if (d) {
    hd.textContent = d.text; hd.className = "hc-word";
    $("hFoot").textContent = (d.verified ? "Verified" : "Community-added") + (d.region ? " in " + d.region : "");
  } else {
    hd.textContent = "Waiting for a speaker"; hd.className = "hc-word empty";
    $("hFoot").textContent = "You could be the one to add this word.";
  }
}
function heroTick() {
  const card = document.querySelector(".hero-card");
  card.classList.add("fade");
  setTimeout(() => { showHeroWord(); card.classList.remove("fade"); }, 350);
}
showHeroWord();
if (!reduceMotion) setInterval(heroTick, 4000);

// ----- reveal sections on scroll -----
const reveals = document.querySelectorAll(".reveal");
if ("IntersectionObserver" in window && !reduceMotion) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
  }, { threshold: 0.12 });
  reveals.forEach((r) => io.observe(r));
} else {
  reveals.forEach((r) => r.classList.add("in"));
}

// ----- install button and service worker -----
let installEvent = null;
window.addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); installEvent = e; $("installBtn").hidden = false; });
$("installBtn").addEventListener("click", async () => {
  if (!installEvent) return;
  installEvent.prompt(); await installEvent.userChoice;
  installEvent = null; $("installBtn").hidden = true;
});
window.addEventListener("online", loadWords);
window.addEventListener("offline", loadWords);
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
}
if ("speechSynthesis" in window) speechSynthesis.getVoices();

loadWords();