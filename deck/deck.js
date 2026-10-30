(() => {
  const slides = window.SLIDES;
  const $ = (s, r = document) => r.querySelector(s);
  const stage = $("#stage");
  let idx = 0, frag = 0;
  const logoImgs = `<span class="logo-pill"><img class="on-light" src="assets/langgraph-logo-light.svg" alt="LangGraph"><img class="on-dark" src="assets/langgraph-logo-onblack.svg" alt="LangGraph"></span>`;

  /* ---------- tiny python highlighter ---------- */
  const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const KW = /\b(def|class|return|import|from|as|if|else|elif|for|in|not|and|or|lambda|with|None|True|False|async|await)\b/;
  function highlight(code) {
    const re = /(#[^\n]*)|("""[\s\S]*?"""|"[^"\n]*"|'[^'\n]*')|(\b\d+(?:\.\d+)?\b)|(\b[A-Za-z_]\w*)(?=\()|(\b[A-Za-z_]\w*\b)/g;
    return esc(code).replace(re, (m, c, s, n, f, w) => {
      if (c) return `<span class="tok-c">${c}</span>`;
      if (s) return `<span class="tok-s">${s}</span>`;
      if (n) return `<span class="tok-n">${n}</span>`;
      if (f) return KW.test(f) ? `<span class="tok-k">${f}</span>` : `<span class="tok-f">${f}</span>`;
      if (w && KW.test(w)) return `<span class="tok-k">${w}</span>`;
      return m;
    });
  }

  /* ---------- official docs links ---------- */
  slides.forEach((s) => { s.docs = (window.DOCS && window.DOCS[s.title]) || null; });
  const docsRow = (s) => s.docs ? `<div class="docs-row"><span>Official docs</span>${s.docs.map(([t, u]) => `<a href="${DOC + u}" target="_blank" rel="noopener noreferrer">${t} ↗</a>`).join("")}</div>` : "";

  /* ---------- slide builders ---------- */
  const chrome = (s, i) => `<div class="chrome">${logoImgs}<span class="section-tag"><b>${String(i + 1).padStart(2, "0")}</b>${s.section}</span></div>`;
  const head = (s) => `<div class="kicker">${s.kicker || ""}</div><h2>${s.title}</h2>`;

  const builders = {
    title: (s, i) => `<section class="slide title-slide">
        ${s.end ? "" : logoImgs}
        <h1>${s.end ? s.title : `Build <em>stateful</em> AI agents with ${s.title}`}</h1>
        <p>${s.sub}</p>
        <div class="chips">${(s.chips || []).map((c) => `<span class="chip">${c}</span>`).join("")}</div>
        <div class="title-art">${titleArt()}</div></section>`,
    map: (s, i) => `<section class="slide">${chrome(s, i)}${head(s)}
        <div class="map-layout"><div class="diagram-card" data-zoom><img src="${s.img}" alt="${s.title}"></div></div></section>`,
    diagram: (s, i) => `<section class="slide">${chrome(s, i)}${head(s)}
        <div class="diagram-layout">
          <div class="diagram-card" data-zoom title="Click to enlarge"><img src="${s.img}" alt="${s.title}"></div>
          <div><ul class="points">${s.points.map((p, k) => `<li class="frag"><span class="n">${k + 1}</span><span>${p}</span></li>`).join("")}</ul>
          <div class="hint"><kbd>C</kbd> code · <kbd>L</kbd> laser · <kbd>R</kbd> docs · click diagram to zoom</div>${docsRow(s)}</div>
        </div></section>`,
    quiz: (s, i) => `<section class="slide">${chrome(s, i)}
        <div class="quiz-wrap"><div class="kicker">${s.kicker}</div><div class="quiz-q">${s.q}</div>
        <div class="opts">${s.options.map((o, k) => `<button class="opt" data-k="${k}"><span class="letter">${"ABCD"[k]}</span>${o}</button>`).join("")}</div>
        <div class="explain"></div></div></section>`,
    demo: (s, i) => `<section class="slide">${chrome(s, i)}${head(s)}
        <div class="demo">
          <div class="panel"><h3>Graph</h3>
            <div class="flow"><span class="node round" data-n="start">START</span><span class="arrow">→</span>
              <span class="node" data-n="greet">greet</span><span class="arrow">→</span>
              <span class="node" data-n="think">think</span><span class="arrow">→</span>
              <span class="node" data-n="reply">reply</span><span class="arrow">→</span><span class="node round" data-n="end">END</span></div>
            <p style="color:var(--muted);font-size:17px;margin:0 0 18px">Each node returns <code>{"messages": [one new message]}</code>. Pick how the state merges updates, then step through.</p>
            <div style="margin-bottom:16px"><div class="seg" data-reducer><button data-r="append" class="on">append · add_messages</button><button data-r="overwrite">overwrite · default</button></div></div>
            <div class="ctrls"><button class="btn primary" data-act="step">Step ›</button><button class="btn" data-act="reset">Reset</button></div></div>
          <div class="panel"><h3>State</h3><div class="statebox" data-state></div></div>
        </div>${docsRow(s)}</section>`,
    summary: (s, i) => `<section class="slide">${chrome(s, i)}${head(s)}
        <div class="cards">${s.cards.map(([ic, t, d]) => `<div class="card frag"><div class="ico">${ic}</div><h4>${t}</h4><p>${d}</p></div>`).join("")}</div>${docsRow(s)}</section>`,
  };

  function titleArt() {
    // minimal node-graph illustration
    return `<svg viewBox="0 0 380 300" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" style="color:var(--accent)">
      <circle cx="60" cy="150" r="26" fill="var(--accent-soft)"/><rect x="150" y="40" width="80" height="56" rx="14" fill="var(--paper)"/>
      <rect x="150" y="204" width="80" height="56" rx="14" fill="var(--paper)"/><rect x="290" y="122" width="70" height="56" rx="14" fill="var(--accent-soft)"/>
      <path d="M84 138 C110 100 120 80 150 70" /><path d="M84 162 C110 200 120 220 150 232"/>
      <path d="M230 68 C265 80 280 110 290 140"/><path d="M230 232 C265 220 280 190 290 162" stroke-dasharray="7 8"/>
      <circle cx="190" cy="68" r="5" fill="currentColor"/><circle cx="190" cy="232" r="5" fill="currentColor"/></svg>`;
  }

  /* ---------- render ---------- */
  stage.innerHTML = slides.map((s, i) => builders[s.type](s, i)).join("") +
    `<div id="codepanel"><div class="code-head"><span class="dots"><i></i><i></i><i></i></span><span id="code-title"></span><button id="copy">Copy</button></div><pre><code id="code-body"></code></pre></div>`;
  const nodes = [...stage.querySelectorAll(".slide")];

  /* ---------- scale to fit ---------- */
  function fit() {
    const k = Math.min(innerWidth / 1280, innerHeight / 720);
    stage.style.transform = `scale(${k})`;
    resizeLaser();
  }
  addEventListener("resize", fit);

  /* ---------- navigation ---------- */
  const fragsOf = (n) => [...n.querySelectorAll(".frag")];
  function show(i, keepFrags = false) {
    idx = Math.max(0, Math.min(slides.length - 1, i));
    nodes.forEach((n, k) => { n.classList.toggle("active", k === idx); n.classList.toggle("past", k < idx); });
    const fr = fragsOf(nodes[idx]);
    frag = keepFrags ? fr.length : 0;
    fr.forEach((f, k) => f.classList.toggle("shown", k < frag));
    if (slides[idx].type === "summary" || !fr.length) { fr.forEach((f) => f.classList.add("shown")); frag = fr.length; }
    $("#counter").textContent = `${idx + 1} / ${slides.length}`;
    $("#progress i").style.width = `${((idx + 1) / slides.length) * 100}%`;
    $("#notes-body").textContent = slides[idx].notes || "No notes for this slide.";
    closeCode(); history.replaceState(null, "", `#${idx + 1}`);
    $("#btn-code").style.opacity = slides[idx].code ? 1 : .35;
  }
  function next() {
    const fr = fragsOf(nodes[idx]);
    if (frag < fr.length) { fr[frag++].classList.add("shown"); return; }
    if (idx < slides.length - 1) show(idx + 1);
  }
  function prev() {
    const fr = fragsOf(nodes[idx]);
    if (frag > 0 && slides[idx].type !== "summary") { fr[--frag].classList.remove("shown"); return; }
    if (idx > 0) show(idx - 1, true);
  }

  /* ---------- code panel ---------- */
  const panel = $("#codepanel");
  function openCode() {
    const s = slides[idx]; if (!s.code) return toast("No code on this slide");
    $("#code-title").textContent = s.title; $("#code-body").innerHTML = highlight(s.code);
    panel.classList.add("open"); $("#btn-code").classList.add("on");
  }
  function closeCode() { panel.classList.remove("open"); $("#btn-code").classList.remove("on"); }
  const toggleCode = () => (panel.classList.contains("open") ? closeCode() : openCode());
  $("#copy").onclick = () => { navigator.clipboard?.writeText(slides[idx].code); toast("Code copied"); };

  /* ---------- overview / notes / theme / fullscreen / toast ---------- */
  const ov = $("#overview");
  $("#ov-grid").innerHTML = slides.map((s, i) => `<button class="ov-item" data-i="${i}"><small>${String(i + 1).padStart(2, "0")} · ${s.section}</small><span>${s.type === "quiz" ? "Quiz: " + s.q : s.title}</span></button>`).join("");
  function toggleOverview(force) {
    const open = force ?? ov.hidden; ov.hidden = !open;
    $("#btn-overview").classList.toggle("on", open);
    $$(".ov-item").forEach((b) => b.classList.toggle("current", +b.dataset.i === idx));
  }
  const $$ = (s) => [...document.querySelectorAll(s)];
  ov.addEventListener("click", (e) => { const b = e.target.closest(".ov-item"); if (b) { show(+b.dataset.i); toggleOverview(false); } });
  const notes = $("#notes");
  const toggleNotes = () => { notes.hidden = !notes.hidden; $("#btn-notes").classList.toggle("on", !notes.hidden); };
  $("#notes-close").onclick = toggleNotes;
  function setTheme(t) { document.documentElement.dataset.theme = t; try { localStorage.setItem("deck-theme", t); } catch (e) {} }
  const toggleTheme = () => setTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark");
  const toggleFull = () => (document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen());
  let toastT; function toast(m) { const t = $("#toast"); t.textContent = m; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => (t.hidden = true), 1600); }

  /* ---------- lightbox ---------- */
  const lb = $("#lightbox");
  stage.addEventListener("click", (e) => {
    if (laserOn) return;
    const z = e.target.closest("[data-zoom]"); if (z) { $("img", lb).src = $("img", z).src; lb.hidden = false; }
  });
  lb.onclick = () => (lb.hidden = true);

  /* ---------- quiz ---------- */
  stage.addEventListener("click", (e) => {
    const o = e.target.closest(".opt"); if (!o || o.classList.contains("locked") || laserOn) return;
    const s = slides[idx], wrap = o.closest(".quiz-wrap"), k = +o.dataset.k;
    if (k === s.answer) { wrap.querySelectorAll(".opt").forEach((b) => b.classList.add("locked")); o.classList.add("right"); wrap.querySelector(".explain").textContent = "✓ " + s.explain; }
    else { o.classList.add("wrong", "locked"); wrap.querySelector(".explain").textContent = "Not quite, try again."; }
  });

  /* ---------- live demo: reducer ---------- */
  (function demo() {
    const root = nodes[slides.findIndex((s) => s.type === "demo")]; if (!root) return;
    const order = ["start", "greet", "think", "reply", "end"], msgs = ["Hello!", "Let me think…", "Here is my answer."];
    let step = 0, mode = "append", state = { messages: [] };
    const box = $("[data-state]", root);
    function draw(flash) {
      root.querySelectorAll(".node").forEach((n) => { const k = order.indexOf(n.dataset.n); n.classList.toggle("active", k === step && step > 0 && step < 4); n.classList.toggle("done", k < step && k > 0); });
      box.innerHTML = `<span class="${flash ? "flash" : ""}">${esc(JSON.stringify(state, null, 2))}</span>`;
    }
    function stepFn() {
      if (step >= 4) return;
      step++; if (step <= 3) { const m = msgs[step - 1]; state = { messages: mode === "append" ? [...state.messages, m] : [m] }; }
      draw(true);
    }
    const reset = () => { step = 0; state = { messages: [] }; draw(false); };
    root.addEventListener("click", (e) => {
      if (laserOn) return;
      const a = e.target.closest("[data-act]"), r = e.target.closest("[data-r]");
      if (a) (a.dataset.act === "step" ? stepFn : reset)();
      if (r) { mode = r.dataset.r; root.querySelectorAll("[data-r]").forEach((b) => b.classList.toggle("on", b === r)); reset(); }
    });
    draw(false);
  })();

  /* ---------- laser pointer (Excalidraw-style fading trail) ---------- */
  const cv = $("#laser"), ctx = cv.getContext("2d");
  let laserOn = false, pts = [], down = false, ripples = [], raf = 0, cursor = null;
  const LIFE = 1000; // ms a trail point stays visible
  function resizeLaser() { const r = devicePixelRatio || 1; cv.width = innerWidth * r; cv.height = innerHeight * r; ctx.setTransform(r, 0, 0, r, 0, 0); }
  function setLaser(on) {
    laserOn = on; document.body.classList.toggle("laser-on", on); $("#btn-laser").classList.toggle("on", on);
    toast(on ? "Laser on · click or drag" : "Laser off");
    if (on) loop(); else { cancelAnimationFrame(raf); ctx.clearRect(0, 0, innerWidth, innerHeight); pts = []; ripples = []; cursor = null; }
  }
  const pos = (e) => ({ x: e.clientX, y: e.clientY, t: performance.now() });
  cv.addEventListener("pointerdown", (e) => { if (!laserOn) return; down = true; cv.setPointerCapture(e.pointerId); const p = pos(e); pts.push({ ...p, brk: true }); ripples.push({ x: p.x, y: p.y, t: p.t }); });
  cv.addEventListener("pointermove", (e) => { if (!laserOn) return; const p = pos(e); cursor = p; if (down) pts.push(p); });
  cv.addEventListener("pointerup", () => { down = false; });
  cv.addEventListener("pointerleave", () => { cursor = null; });
  function loop() {
    const now = performance.now();
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    pts = pts.filter((p) => now - p.t < LIFE); ripples = ripples.filter((r) => now - r.t < 600);
    ctx.lineCap = "round"; ctx.lineJoin = "round";
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1], b = pts[i]; if (b.brk) continue;
      const k = 1 - (now - b.t) / LIFE;                       // 1 → 0 as the point ages
      ctx.strokeStyle = `rgba(255,40,60,${0.9 * k})`; ctx.shadowColor = "rgba(255,40,60,.9)"; ctx.shadowBlur = 18 * k;
      ctx.lineWidth = 3 + 6 * k; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      ctx.strokeStyle = `rgba(255,235,235,${0.85 * k})`; ctx.shadowBlur = 0; ctx.lineWidth = 1.4 + 2 * k; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    }
    for (const r of ripples) {                                // click ripple
      const k = (now - r.t) / 600; ctx.strokeStyle = `rgba(255,40,60,${0.8 * (1 - k)})`; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(r.x, r.y, 8 + 34 * k, 0, 7); ctx.stroke();
    }
    if (cursor) {                                             // the laser dot
      ctx.shadowColor = "rgba(255,40,60,1)"; ctx.shadowBlur = 22; ctx.fillStyle = "#ff2a40";
      ctx.beginPath(); ctx.arc(cursor.x, cursor.y, 7, 0, 7); ctx.fill();
      ctx.shadowBlur = 0; ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(cursor.x, cursor.y, 2.6, 0, 7); ctx.fill();
    }
    if (laserOn) raf = requestAnimationFrame(loop);
  }

  function openDocs() {
    const l = slides[idx].docs; if (!l) return toast("No docs link on this slide");
    window.open(DOC + l[0][1], "_blank", "noopener"); toast("Opened: " + l[0][0]);
  }

  /* ---------- keys / buttons / idle dock ---------- */
  addEventListener("keydown", (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key;
    if (k === "ArrowRight" || k === " " || k === "PageDown") { e.preventDefault(); next(); }
    else if (k === "ArrowLeft" || k === "PageUp") { e.preventDefault(); prev(); }
    else if (k === "Home") show(0); else if (k === "End") show(slides.length - 1);
    else if (k === "Escape") { toggleOverview(false); lb.hidden = true; closeCode(); if (laserOn) setLaser(false); }
    else if (/^[lL]$/.test(k)) setLaser(!laserOn);
    else if (/^[oO]$/.test(k)) toggleOverview();
    else if (/^[cC]$/.test(k)) toggleCode();
    else if (/^[nN]$/.test(k)) toggleNotes();
    else if (/^[rR]$/.test(k)) openDocs();
    else if (/^[dD]$/.test(k)) toggleTheme();
    else if (/^[fF]$/.test(k)) toggleFull();
  });
  $("#next").onclick = next; $("#prev").onclick = prev;
  $("#btn-overview").onclick = () => toggleOverview(); $("#btn-code").onclick = toggleCode; $("#btn-notes").onclick = toggleNotes;
  $("#btn-laser").onclick = () => setLaser(!laserOn); $("#btn-theme").onclick = toggleTheme; $("#btn-full").onclick = toggleFull;
  let idleT; const dock = $("#dock");
  const wake = () => { dock.classList.remove("idle"); clearTimeout(idleT); idleT = setTimeout(() => !laserOn && dock.classList.add("idle"), 3500); };
  addEventListener("mousemove", wake); addEventListener("keydown", wake); wake();
  // click on empty slide area advances (not while laser is on, and not on controls)
  stage.addEventListener("click", (e) => { if (laserOn || e.target.closest("button, .diagram-card, #codepanel, .panel, .opt, a")) return; next(); });

  /* ---------- init ---------- */
  try { const t = localStorage.getItem("deck-theme"); if (t) setTheme(t); } catch (e) {}
  if (!document.documentElement.dataset.theme) setTheme("light");
  fit(); show(Math.max(0, (parseInt(location.hash.slice(1)) || 1) - 1));
  window.__deck = { show, next, prev, setLaser, slides, get idx() { return idx; } };
})();
