// ===== Sabda Ghar lessons: a Duolingo-style picture card game =====
(function () {
  "use strict";
  const KEY = "sg-learn-v1", HEARTS = 5, XP_PER_ANSWER = 10;
  const app = document.getElementById("app");
  let CARDS = [];
  let LESSONS = [];
  let save = loadSave();
  let view = "home";
  let keyHandler = null;

  // ---------- storage ----------
  function loadSave() {
    const d = { xp: 0, streak: 0, lastDay: "", done: {}, lang: "ne" };
    try { return Object.assign(d, JSON.parse(localStorage.getItem(KEY))); } catch (e) { return d; }
  }
  function persist() { try { localStorage.setItem(KEY, JSON.stringify(save)); } catch (e) {} }

  // ---------- small helpers ----------
  function h(tag, props, ...kids) {
    const n = document.createElement(tag);
    Object.entries(props || {}).forEach(([k, v]) => {
      if (v == null || v === false) return;
      if (k === "class") n.className = v;
      else if (k.startsWith("on")) n.addEventListener(k.slice(2), v);
      else n.setAttribute(k, v === true ? "" : v);
    });
    kids.flat().forEach((c) => { if (c != null && c !== false) n.append(c.nodeType ? c : document.createTextNode(c)); });
    return n;
  }
  function mount(...nodes) {
    keyHandler = null;
    app.textContent = "";
    app.append(...nodes);
    window.scrollTo(0, 0);
  }
  const tgt = (c) => targetText(c, save.lang);
  const langName = () => (save.lang === "ne" ? "Nepali" : "Doteli");
  const pool = () => CARDS.filter((c) => tgt(c));
  const lessonCards = (l) => l.cards.map((id) => CARDS.find((c) => c.id === id)).filter((c) => c && tgt(c));
  const today = () => new Date().toLocaleDateString("en-CA");

  // Nepali speech uses the device voice. It cannot say Doteli words correctly.
  function speakNe(text) {
    if (!("speechSynthesis" in window)) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "ne-NP"; u.rate = 0.85;
    const v = speechSynthesis.getVoices().find((x) => x.lang.toLowerCase().startsWith("ne"));
    if (v) u.voice = v;
    speechSynthesis.speak(u);
  }

  // Pull Doteli words that people added on the dictionary page (server, or the saved offline copy).
  async function mergeDoteli() {
    let list = null;
    try { const r = await fetch("/api/words"); if (r.ok) list = await r.json(); } catch (e) {}
    if (!list) { try { list = JSON.parse(localStorage.getItem("sg-words-cache")); } catch (e) {} }
    if (!Array.isArray(list)) return;
    const map = new Map(list.map((w) => [String(w.en).toLowerCase(), w]));
    CARDS.forEach((c) => {
      const w = map.get(c.en.toLowerCase());
      if (w && w.doteli && w.doteli.length) {
        const d = w.doteli.find((x) => x.verified) || w.doteli[0];
        c.doteli = d.text; c.verified = !!d.verified;
      }
    });
  }

  async function loadCards() {
    try {
      const response = await fetch("../data/cards.json");
      if (!response.ok) throw new Error("Could not load lesson data.");
      const data = await response.json();
      CARDS = data.cards || [];
      LESSONS = data.lessons || [];
    } catch (error) {
      app.textContent = "";
      app.append(h("main", { class: "screen center" },
        h("h1", { class: "title" }, "Lessons could not load"),
        h("p", { class: "sub" }, "Please check your connection and try again."),
        h("button", { class: "big", onclick: () => location.reload() }, "Try again")));
    }
  }

  // ---------- shared pieces ----------
  function topBar() {
    return h("header", { class: "top" },
      h("a", { class: "back", href: "index.html" }, "← Dictionary"),
      h("div", { class: "stats" },
        h("span", { class: "pill", "aria-label": save.streak + " day streak" }, "🔥 " + save.streak),
        h("span", { class: "pill", "aria-label": save.xp + " XP" }, "⚡ " + save.xp)));
  }
  function langToggle() {
    const mk = (code, label) => h("button", { "aria-pressed": String(save.lang === code),
      onclick: () => { save.lang = code; persist(); showHome(); } }, label);
    return h("div", { class: "seg", role: "group", "aria-label": "Learn in" }, mk("ne", "Nepali"), mk("doteli", "Doteli"));
  }

  // ---------- home: the lesson path ----------
  function showHome() {
    view = "home";
    const have = CARDS.filter((c) => c.doteli).length;
    const path = h("ol", { class: "path" });
    const lessons = save.lang === "doteli"
      ? LESSONS.filter((l) => l.id.startsWith("doteli-")).concat(LESSONS.filter((l) => !l.id.startsWith("doteli-")))
      : LESSONS;
    let blocked = false;
    lessons.forEach((l) => {
      const n = lessonCards(l).length;
      const empty = n === 0 || pool().length < 4;
      const done = !!save.done[save.lang + ":" + l.id];
      let state;
      if (empty) state = "soon";
      else if (done) state = "done";
      else if (!blocked) { state = "current"; blocked = true; }
      else state = "locked";
      const label = l.title + (state === "soon" ? ", waiting for words" : state === "locked" ? ", locked" : state === "done" ? ", completed" : "");
      path.append(h("li", { class: "stop " + state },
        h("button", { class: "node", "aria-label": label, disabled: state === "locked" || state === "soon",
          onclick: () => openLesson(l) }, state === "done" ? "✓" : state === "locked" ? "🔒" : l.icon),
        h("div", { class: "stop-title" }, l.title),
        h("div", { class: "stop-sub" }, n + (n === 1 ? " word" : " words"))));
    });
    mount(h("main", { class: "screen" }, topBar(),
      h("h1", { class: "title" }, "Learn with picture cards"),
      h("p", { class: "sub" }, "Finish a lesson to unlock the next one."),
      langToggle(),
      save.lang === "doteli" ? h("p", { class: "note" },
        have + " of " + CARDS.length + " words have a Doteli form so far. Starter words are available now; help verify them or add more on the dictionary page.") : null,
      path));
  }

  // ---------- lesson intro: meet the words ----------
  function wordCard(c) {
    return h("div", { class: "pcard" },
      h("div", { class: "pic", "aria-hidden": "true" }, c.pic),
      h("div", { class: "pen" }, c.en),
      h("div", { class: "pword", lang: "ne" }, tgt(c)),
      h("div", { class: "prom" }, save.lang === "ne" ? c.rom : "Nepali: " + c.ne),
      save.lang === "ne" ? h("button", { class: "mini", "aria-label": "Listen to " + c.en, onclick: () => speakNe(c.ne) }, "🔊") : null);
  }
  function openLesson(l) {
    view = "intro";
    mount(h("main", { class: "screen" }, topBar(),
      h("h1", { class: "title" }, l.title),
      h("p", { class: "sub" }, "Meet the words in " + langName() + ", then test yourself."),
      h("div", { class: "cards" }, lessonCards(l).map(wordCard)),
      h("div", { class: "stack" },
        h("button", { class: "big", onclick: () => startQuiz(l) }, "Start lesson"),
        h("button", { class: "big plain", onclick: showHome }, "Back"))));
  }

  // ---------- quiz ----------
  function startQuiz(l) {
    view = "quiz";
    const qs = buildQuestions(lessonCards(l), pool(), save.lang);
    next({ lesson: l, queue: qs, total: qs.length, done: 0, hearts: HEARTS, xp: 0, right: 0, wrong: 0 });
  }

  function next(run) {
    if (!run.queue.length) return finish(run);
    renderQuestion(run, run.queue.shift());
  }

  function renderQuestion(run, q) {
    let chosen = null, answered = false;
    const isPic = q.type === "pic2word";

    const fill = h("div", { class: "fill", style: "width:" + Math.round((run.done / run.total) * 100) + "%" });
    const top = h("div", { class: "qtop" },
      h("button", { class: "x", "aria-label": "Quit lesson", onclick: () => {
        if (confirm("Quit this lesson? You will lose your progress.")) showHome(); } }, "✕"),
      h("div", { class: "progress", role: "progressbar", "aria-valuemin": 0, "aria-valuemax": 100,
        "aria-valuenow": Math.round((run.done / run.total) * 100) }, fill),
      h("div", { class: "hearts", "aria-label": run.hearts + " hearts left" }, "❤️ " + run.hearts));

    const stage = isPic
      ? h("div", { class: "stage" }, h("div", { class: "pic", "aria-hidden": "true" }, q.card.pic), h("div", { class: "cap" }, q.card.en))
      : h("div", { class: "stage" }, h("div", { class: "word", lang: "ne" }, tgt(q.card)),
          save.lang === "ne" ? h("button", { class: "mini", "aria-label": "Listen", onclick: () => speakNe(q.card.ne) }, "🔊 Listen") : null);

    const optButtons = q.options.map((c) => {
      const b = h("button", { class: "opt", "aria-pressed": "false", lang: isPic ? "ne" : null,
        onclick: () => select(c, b) }, isPic ? tgt(c) : c.pic);
      b._card = c; return b;
    });
    const opts = h("div", { class: "opts " + (isPic ? "words" : "pics"), role: "group", "aria-label": "Answer choices" }, optButtons);

    const fb = h("div", { class: "fb", "aria-live": "polite" });
    const check = h("button", { class: "big", disabled: true, onclick: onCheck }, "Check");
    const bar = h("footer", { class: "bar" }, h("div", null, fb, check));

    function select(c, btn) {
      if (answered) return;
      chosen = c;
      optButtons.forEach((o) => o.setAttribute("aria-pressed", String(o === btn)));
      check.disabled = false;
    }

    function onCheck() {
      if (answered) { return run.hearts === 0 ? fail(run) : next(run); }
      if (!chosen) return;
      answered = true;
      const ok = chosen.id === q.card.id;
      optButtons.forEach((o) => {
        o.disabled = true;
        if (o._card.id === q.card.id) o.classList.add("right");
        else if (o._card === chosen) o.classList.add("wrong");
      });
      if (ok) {
        run.done++; run.right++;
        if (q.tries === 0) run.xp += XP_PER_ANSWER;
        bar.className = "bar ok"; fb.textContent = "Correct! Well done.";
        fill.style.width = Math.round((run.done / run.total) * 100) + "%";
      } else {
        run.hearts--; run.wrong++; q.tries++;
        run.queue.push(q); // ask it again at the end
        if (navigator.vibrate) navigator.vibrate(120);
        bar.className = "bar bad";
        fb.textContent = "Correct answer: " + (isPic ? tgt(q.card) : q.card.pic + " " + q.card.en);
      }
      check.textContent = "Continue";
      check.className = "big" + (ok ? "" : " bad");
      check.disabled = false; check.focus();
    }

    mount(h("main", { class: "screen" }, top,
      h("h1", { class: "prompt" }, isPic ? "What is this in " + langName() + "?" : "Pick the picture for this word"),
      stage, opts), bar);
    keyHandler = (e) => {
      if (e.key === "Enter" && !check.disabled) { e.preventDefault(); onCheck(); }
      else if (!answered && /^[1-4]$/.test(e.key) && optButtons[+e.key - 1]) optButtons[+e.key - 1].click();
    };
  }
  document.addEventListener("keydown", (e) => { if (keyHandler) keyHandler(e); });

  // ---------- end screens ----------
  function finish(run) {
    view = "result";
    save.xp += run.xp;
    save.done[save.lang + ":" + run.lesson.id] = true;
    save.streak = nextStreak(save.lastDay, save.streak, today());
    save.lastDay = today();
    persist();
    const total = run.right + run.wrong;
    const acc = total ? Math.round((run.right / total) * 100) : 100;
    mount(h("main", { class: "screen center" },
      h("div", { class: "big-emoji", "aria-hidden": "true" }, "🎉"),
      h("h1", { class: "title" }, "Lesson complete!"),
      h("p", { class: "sub" }, run.lesson.title),
      h("div", { class: "result" },
        h("div", { class: "rbox" }, h("b", null, "+" + run.xp), h("span", null, "XP")),
        h("div", { class: "rbox" }, h("b", null, acc + "%"), h("span", null, "accuracy")),
        h("div", { class: "rbox" }, h("b", null, "🔥 " + save.streak), h("span", null, "day streak"))),
      h("button", { class: "big", onclick: showHome }, "Continue")));
  }

  function fail(run) {
    view = "result";
    mount(h("main", { class: "screen center" },
      h("div", { class: "big-emoji", "aria-hidden": "true" }, "💔"),
      h("h1", { class: "title" }, "Out of hearts"),
      h("p", { class: "sub" }, "No worries. Review the words and try again."),
      h("div", { class: "stack" },
        h("button", { class: "big", onclick: () => openLesson(run.lesson) }, "Review the words"),
        h("button", { class: "big plain", onclick: showHome }, "Back to lessons"))));
  }

  // ---------- start ----------
  loadCards().then(() => {
    if (!CARDS.length) return;
    mergeDoteli().then(() => { showHome(); });
  });
  if ("speechSynthesis" in window) speechSynthesis.getVoices();
})();