/* Weihnachtsessen 2026 · app.js */
(() => {
  "use strict";
  document.documentElement.classList.add("js");
  const CFG = window.WE_CONFIG || {};
  const DATES = (CFG.dates || []).slice();
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (s, r = document) => r.querySelector(s);
  const store = {
    get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* ignore */ } }
  };
  const fmtLong = new Intl.DateTimeFormat("de-DE", { weekday: "long", day: "numeric", month: "long" });
  const fmtShort = new Intl.DateTimeFormat("de-DE", { weekday: "short", day: "numeric", month: "numeric" });
  const fmtDay = new Intl.DateTimeFormat("de-DE", { weekday: "long" });
  const parseISO = (s) => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
  const dateLong = (s) => fmtLong.format(parseISO(s));
  const dateShort = (s) => fmtShort.format(parseISO(s)).replace(/\.$/, "");
  const daysUntil = (d) => Math.ceil((d - new Date()) / 86400000);

  /* ---------- personal link: ?fuer=Anna ---------- */
  const params = new URLSearchParams(location.search);
  const guestName = (params.get("fuer") || params.get("for") || "").trim().replace(/[<>]/g, "").slice(0, 30);
  if (guestName) {
    $("#introFor").innerHTML = "";
    const sm = document.createElement("small"); sm.textContent = "Eine Einladung für";
    $("#introFor").append(sm, document.createTextNode(guestName));
    $("#topFor").textContent = "Einladung für " + guestName;
    $("#salutation").textContent = `${guestName}, bevor dieses Jahr zu Ende geht, möchte ich noch einmal alle an einem Tisch haben. Und du gehörst da natürlich dazu.`;
    document.title = `Weihnachtsessen 2026 · für ${guestName}`;
  }

  /* ---------- audio (shared) ---------- */
  let actx = null;
  const audio = () => {
    if (!actx) { const C = window.AudioContext || window.webkitAudioContext; if (!C) return null; actx = new C(); }
    if (actx.state === "suspended") actx.resume();
    return actx;
  };

  /* ---------- Music box: Stille Nacht (Franz Xaver Gruber, 1818) ---------- */
  const N = { C4: 261.63, F3: 174.61, G3: 196, C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880, B5: 987.77, C6: 1046.5, D6: 1174.66, E6: 1318.51, F6: 1396.91 };
  const MEL = [
    ["G5",3],["A5",1],["G5",2],["E5",6], ["G5",3],["A5",1],["G5",2],["E5",6],
    ["D6",4],["D6",2],["B5",6], ["C6",4],["C6",2],["G5",6],
    ["A5",4],["A5",2],["C6",3],["B5",1],["A5",2], ["G5",3],["A5",1],["G5",2],["E5",6],
    ["A5",4],["A5",2],["C6",3],["B5",1],["A5",2], ["G5",3],["A5",1],["G5",2],["E5",6],
    ["D6",4],["D6",2],["F6",3],["D6",1],["B5",2], ["C6",6],["E6",6],
    ["C6",3],["G5",1],["E5",2],["G5",3],["F5",1],["D5",2], ["C5",12], [null,6]
  ];
  const BASS = ["C4","C4","C4","C4","G3","G3","C4","C4","F3","F3","C4","C4","F3","F3","C4","C4","G3","G3","C4","C4","C4","G3","C4","C4"];
  const music = { on: false, timer: null, master: null, next: 0, step: 0, beat: 0 };
  function pluck(ctx, out, f, t, gain, dur) {
    [[1, 1], [4.02, .18], [2, .12]].forEach(([mult, g]) => {
      const o = ctx.createOscillator(), a = ctx.createGain();
      o.type = "sine"; o.frequency.value = f * mult;
      a.gain.setValueAtTime(0, t); a.gain.linearRampToValueAtTime(gain * g, t + .006);
      a.gain.exponentialRampToValueAtTime(.0001, t + dur * (mult > 1 ? .35 : 1));
      o.connect(a).connect(out); o.start(t); o.stop(t + dur + .05);
    });
  }
  function startMusic() {
    const ctx = audio(); if (!ctx || music.on) return;
    music.on = true;
    music.master = ctx.createGain(); music.master.gain.value = 0;
    music.master.gain.linearRampToValueAtTime(.55, ctx.currentTime + 1.5);
    const delay = ctx.createDelay(); delay.delayTime.value = .27;
    const fb = ctx.createGain(); fb.gain.value = .28;
    const wet = ctx.createGain(); wet.gain.value = .35;
    music.master.connect(ctx.destination); music.master.connect(delay); delay.connect(fb).connect(delay); delay.connect(wet).connect(ctx.destination);
    music.next = ctx.currentTime + .1; music.step = 0; music.beat = 0;
    const eighth = .26;
    const tick = () => {
      while (music.next < ctx.currentTime + .4) {
        const [n, len] = MEL[music.step];
        if (n) pluck(ctx, music.master, N[n], music.next, .16, 2.2);
        if (music.beat % 6 === 0) { const b = BASS[(music.beat / 6) % BASS.length]; pluck(ctx, music.master, N[b], music.next, .1, 2.8); }
        music.next += len * eighth; music.beat += len; music.step++;
        if (music.step >= MEL.length) { music.step = 0; music.beat = 0; }
      }
    };
    tick(); music.timer = setInterval(tick, 120);
    $("#musicBtn").setAttribute("aria-pressed", "true");
  }
  function stopMusic() {
    if (!music.on) return;
    music.on = false; clearInterval(music.timer);
    const m = music.master, ctx = audio();
    if (m && ctx) { m.gain.cancelScheduledValues(ctx.currentTime); m.gain.setValueAtTime(m.gain.value, ctx.currentTime); m.gain.linearRampToValueAtTime(0, ctx.currentTime + .6); setTimeout(() => m.disconnect(), 800); }
    $("#musicBtn").setAttribute("aria-pressed", "false");
  }
  $("#musicBtn").addEventListener("click", () => (music.on ? stopMusic() : startMusic()));

  /* ---------- Intro: break the seal ---------- */
  const intro = $("#intro");
  let seen = false; try { seen = sessionStorage.getItem("we26-seal") === "1"; } catch (e) { /* ignore */ }
  if (!seen && !reduce) {
    intro.hidden = false; document.body.classList.add("locked", "intro-on");
    const open = (withMusic) => {
      if (intro.classList.contains("cracked")) return;
      try { sessionStorage.setItem("we26-seal", "1"); } catch (e) { /* ignore */ }
      if (withMusic) startMusic();
      crackSound();
      intro.classList.add("cracked");
      setTimeout(() => { intro.classList.add("opening"); document.body.classList.remove("intro-on"); }, 550);
      setTimeout(() => { intro.hidden = true; document.body.classList.remove("locked"); }, 1900);
    };
    $("#sealBtn").addEventListener("click", () => open(true));
    $("#sealQuiet").addEventListener("click", () => open(false));
  }
  function crackSound() {
    const ctx = audio(); if (!ctx) return;
    const len = ctx.sampleRate * .25, buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 6);
    const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = buf; f.type = "bandpass"; f.frequency.value = 1800; f.Q.value = .8; g.gain.value = .5;
    s.connect(f).connect(g).connect(ctx.destination); s.start();
  }

  /* ---------- Hero: snow, candle glow, letters that catch the light ---------- */
  const cv = $("#snow"), ctx2 = cv.getContext("2d");
  let W = 0, H = 0, flakes = [], orbs = [], mx = .5, my = .3, wind = 0, heroVisible = true;
  function size() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2), r = cv.getBoundingClientRect();
    W = r.width; H = r.height; cv.width = W * dpr; cv.height = H * dpr; ctx2.setTransform(dpr, 0, 0, dpr, 0, 0);
    flakes = Array.from({ length: Math.round(Math.min(240, W * H / 6000)) }, () => mk(true));
    orbs = Array.from({ length: 10 }, () => ({ x: Math.random() * W, y: H * (.4 + Math.random() * .65), r: 40 + Math.random() * 120, vx: (Math.random() - .5) * .12, ph: Math.random() * 6.28, c: Math.random() < .6 ? "216,182,115" : "196,71,93" }));
  }
  function mk(any) { const z = Math.random(); return { x: Math.random() * W, y: any ? Math.random() * H : -10, z, r: .6 + z * 2.6, vy: .25 + z * 1.1, sw: Math.random() * 6.28, sp: .006 + Math.random() * .02 }; }
  function draw(t) {
    ctx2.clearRect(0, 0, W, H); ctx2.globalCompositeOperation = "lighter";
    for (const o of orbs) {
      o.x += o.vx; if (o.x < -o.r) o.x = W + o.r; if (o.x > W + o.r) o.x = -o.r;
      const a = .05 + .035 * Math.sin(t / 1600 + o.ph), g = ctx2.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.r);
      g.addColorStop(0, `rgba(${o.c},${a})`); g.addColorStop(1, `rgba(${o.c},0)`);
      ctx2.fillStyle = g; ctx2.beginPath(); ctx2.arc(o.x, o.y, o.r, 0, 6.283); ctx2.fill();
    }
    const gx = mx * W, gy = my * H, cg = ctx2.createRadialGradient(gx, gy, 0, gx, gy, 280);
    cg.addColorStop(0, "rgba(216,182,115,.11)"); cg.addColorStop(1, "rgba(216,182,115,0)");
    ctx2.fillStyle = cg; ctx2.beginPath(); ctx2.arc(gx, gy, 280, 0, 6.283); ctx2.fill();
    ctx2.globalCompositeOperation = "source-over";
    wind += ((mx - .5) * 1.4 - wind) * .02;
    for (const f of flakes) {
      f.sw += f.sp; f.y += f.vy; f.x += Math.sin(f.sw) * .4 + wind * (.3 + f.z);
      if (f.y > H + 6) Object.assign(f, mk(false));
      if (f.x > W + 6) f.x = -6; if (f.x < -6) f.x = W + 6;
      const warm = Math.max(0, 1 - Math.hypot(f.x - gx, f.y - gy) / 250);
      ctx2.fillStyle = `rgba(241,${236 - warm * 30},${226 - warm * 100},${.25 + f.z * .6})`;
      ctx2.beginPath(); ctx2.arc(f.x, f.y, f.r, 0, 6.283); ctx2.fill();
    }
  }
  function loop(t) { if (heroVisible) draw(t); if (!reduce) requestAnimationFrame(loop); }
  size(); requestAnimationFrame(loop);
  window.addEventListener("resize", () => { size(); if (reduce) draw(0); });
  new IntersectionObserver((e) => { heroVisible = e[0].isIntersecting; }).observe($(".hero"));

  const chars = [];
  document.querySelectorAll("[data-split]").forEach((el) => {
    const txt = el.textContent; el.textContent = "";
    for (const c of txt) { const s = document.createElement("span"); s.className = "ch"; s.textContent = c; s.setAttribute("aria-hidden", "true"); el.appendChild(s); chars.push(s); }
  });
  let pending = false, px = 0, py = 0;
  $(".hero").addEventListener("pointermove", (e) => {
    const r = cv.getBoundingClientRect(); mx = (e.clientX - r.left) / r.width; my = (e.clientY - r.top) / r.height;
    px = e.clientX; py = e.clientY;
    if (reduce || pending) return; pending = true;
    requestAnimationFrame(() => {
      pending = false;
      for (const c of chars) {
        const b = c.getBoundingClientRect(), cx = b.left + b.width / 2, cy = b.top + b.height / 2;
        const d = Math.hypot(px - cx, py - cy), k = Math.max(0, 1 - d / 220);
        c.style.transform = k ? `translateY(${-k * 10}px)` : "";
        c.classList.toggle("lit", k > .55);
      }
    });
  });
  $(".hero").addEventListener("pointerleave", () => chars.forEach((c) => { c.style.transform = ""; c.classList.remove("lit"); }));

  /* ---------- facts + countdown ---------- */
  const final = CFG.finalDate ? new Date(CFG.finalDate) : null;
  function updateFacts() {
    if (final && !isNaN(final)) {
      $("#factWhen").textContent = `${fmtLong.format(final)}, ${final.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })} Uhr`;
      const ms = final - new Date();
      $("#factCountLabel").textContent = "Noch";
      if (ms <= 0) { $("#factCount").textContent = "heute Abend!"; return; }
      const d = Math.floor(ms / 86400000), h = Math.floor(ms / 3600000) % 24, m = Math.floor(ms / 60000) % 60, s = Math.floor(ms / 1000) % 60;
      $("#factCount").textContent = `${d} T  ${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    } else {
      const dl = CFG.voteDeadline ? parseISO(CFG.voteDeadline) : null;
      $("#factCountLabel").textContent = "Abstimmung";
      if (dl) {
        const left = daysUntil(dl);
        $("#factCount").textContent = left > 1 ? `noch ${left} Tage` : left === 1 ? "nur noch heute und morgen" : left === 0 ? "endet heute" : "läuft noch";
      }
    }
  }
  updateFacts(); setInterval(updateFacts, 1000);
  if (CFG.location) { const d = $("#factWhen"); d.textContent += ` · ${CFG.location}`; }

  /* ---------- Menu ---------- */
  const menu = CFG.menu || [];
  const roman = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];
  const revealed = menu.filter((m) => m.dish).length;
  const dishes = $("#dishes");
  const W1 = [62, 74, 48, 81, 56, 69, 44, 77], W2 = [38, 52, 44, 33, 47, 29, 41, 36], WW = [80, 66, 90, 58, 72, 61, 84, 70];
  menu.forEach((m, i) => {
    const row = document.createElement("div"); row.className = "dish " + (m.dish ? "revealed" : "sealed");
    const no = document.createElement("div"); no.className = "no"; no.textContent = roman[i] || String(i + 1);
    const what = document.createElement("div"); what.className = "what";
    const wine = document.createElement("div"); wine.className = "wine";
    const wl = document.createElement("span"); wl.className = "wine-label"; wl.textContent = "Im Glas";
    if (m.dish) {
      const n = document.createElement("div"); n.className = "name"; n.textContent = m.dish; what.appendChild(n);
      if (m.detail) { const d = document.createElement("div"); d.className = "detail"; d.textContent = m.detail; what.appendChild(d); }
    } else { what.innerHTML = `<div class="bar" style="width:${W1[i % 8]}%"></div><div class="bar thin" style="width:${W2[i % 8]}%"></div>`; }
    wine.appendChild(wl);
    if (m.wine) { const w = document.createElement("div"); w.className = "wine-name"; w.textContent = m.wine; wine.appendChild(w); }
    else { const b = document.createElement("div"); b.className = "bar thin"; b.style.width = WW[i % 8] + "%"; wine.appendChild(b); }
    row.append(no, what, wine); dishes.appendChild(row);
  });
  const fade = document.createElement("div"); fade.className = "dish fade";
  fade.innerHTML = '<div class="no">…</div><div class="what"><div class="bar" style="width:40%"></div></div><div class="wine"><div class="bar thin" style="width:50%"></div></div>';
  if (revealed < menu.length || !menu.length) dishes.appendChild(fade);
  $("#revealCount").textContent = `${revealed} von ${revealed === menu.length && menu.length ? menu.length : "?"}`;
  $("#courseCount").textContent = revealed === menu.length && menu.length ? String(menu.length) : "?";
  if (revealed) {
    $("#menuStamp").textContent = revealed === menu.length ? "Enthüllt" : "Teilweise enthüllt";
    $("#menuTitle").textContent = revealed === menu.length ? "Das ist das Menü." : "Das Siegel bröckelt.";
  }
  const quips = ["Netter Versuch", "Noch nicht", "Geduld", "Abwarten", "Geheim"];
  let q = 0;
  dishes.addEventListener("click", (e) => {
    const bar = e.target.closest(".dish.sealed .bar"); if (!bar) return;
    const t = document.createElement("span"); t.className = "nice-try"; t.textContent = quips[q++ % quips.length];
    bar.appendChild(t); setTimeout(() => t.remove(), 950);
  });

  /* ---------- Data layer ---------- */
  const DEMO_KEY = "we26-demo", ME_KEY = "we26-me";
  const uid = () => (crypto.randomUUID ? crypto.randomUUID() : "x" + Date.now().toString(36) + Math.random().toString(36).slice(2, 12));
  const api = CFG.apiUrl ? {
    async list() { const r = await fetch(CFG.apiUrl + "?action=list&t=" + Date.now(), { cache: "no-store" }); const j = await r.json(); if (!j.ok) throw new Error(j.error || "Fehler"); return j.responses; },
    async save(p) { const r = await fetch(CFG.apiUrl, { method: "POST", body: JSON.stringify(p) }); const j = await r.json(); if (!j.ok) throw new Error(j.error || "Fehler"); return j.responses; }
  } : {
    async list() { return (store.get(DEMO_KEY) || []).map(({ token, diet, message, ...pub }) => pub); },
    async save(p) {
      const all = store.get(DEMO_KEY) || [], now = new Date().toISOString(), i = all.findIndex((r) => r.id === p.id);
      if (i >= 0) { if (all[i].token !== p.token) throw new Error("Diese Antwort gehört jemand anderem."); Object.assign(all[i], { name: p.name, votes: p.votes, diet: p.diet, message: p.message, updated: now }); }
      else all.push({ id: p.id, token: p.token, name: p.name, votes: p.votes, diet: p.diet, message: p.message, created: now, updated: now });
      store.set(DEMO_KEY, all); return this.list();
    }
  };
  if (!CFG.apiUrl) $("#demoBanner").hidden = false;

  let responses = [], me = store.get(ME_KEY), filter = "all", newSeatId = null, loaded = false;

  /* ---------- Tally ---------- */
  function tally() {
    const t = {};
    DATES.forEach((d) => (t[d] = { y: [], m: [], n: [] }));
    responses.forEach((r) => DATES.forEach((d) => { const v = (r.votes || {})[d]; (t[d][v === "y" || v === "m" ? v : "n"]).push(r.name); }));
    let lead = null, best = 0;
    DATES.forEach((d) => { const s = t[d].y.length + t[d].m.length * .5; if (s > best) { best = s; lead = d; } });
    return { t, lead };
  }
  function renderTally() {
    const { t, lead } = tally(), total = responses.length || 1;
    const rows = $("#tallyRows"); rows.innerHTML = "";
    DATES.forEach((d) => {
      const r = document.createElement("div"); r.className = "trow" + (filter === d ? " sel" : ""); r.tabIndex = 0;
      const y = t[d].y.length, m = t[d].m.length;
      r.innerHTML = `<div class="trow-top"><div class="trow-name"><strong></strong></div><span class="tabular">${y} ja · ${m} vielleicht</span></div><div class="track"><i class="y" style="width:${(y / total) * 100}%"></i><i class="m" style="width:${(m / total) * 100}%"></i></div>`;
      const s = r.querySelector("strong"); s.textContent = dateLong(d);
      if (d === lead && responses.length) { const b = document.createElement("em"); b.className = "badge"; b.textContent = "Favorit"; s.parentNode.appendChild(b); }
      if (filter === d) {
        const nm = document.createElement("div"); nm.className = "names";
        const part = (label, arr) => { if (!arr.length) return; const b = document.createElement("b"); b.textContent = label + ": "; nm.append(b, document.createTextNode(arr.join(", ") + "  ")); };
        part("Ja", t[d].y); part("Vielleicht", t[d].m);
        if (!t[d].y.length && !t[d].m.length) nm.textContent = "Noch niemand für diesen Abend.";
        r.appendChild(nm);
      }
      const pick = () => setFilter(filter === d ? "all" : d);
      r.addEventListener("click", pick); r.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pick(); } });
      rows.appendChild(r);
    });
    // calendar heat
    const max = Math.max(1, responses.length);
    DATES.forEach((d) => {
      const cell = document.querySelector(`.day[data-date="${d}"]`); if (!cell) return;
      const s = t[d].y.length + t[d].m.length * .5;
      cell.querySelector(".heat").style.height = `${100 - (s / max) * 100}%`;
      cell.classList.toggle("lead", d === lead && responses.length > 0);
      cell.title = `${dateLong(d)}: ${t[d].y.length} ja, ${t[d].m.length} vielleicht`;
    });
  }

  /* ---------- Calendar ---------- */
  (function buildCal() {
    const cal = $("#cal");
    ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"].forEach((d) => { const e = document.createElement("div"); e.className = "dow"; e.textContent = d; cal.appendChild(e); });
    const off = (new Date(2026, 11, 1).getDay() + 6) % 7;
    for (let i = 0; i < off; i++) { const e = document.createElement("div"); e.className = "day"; cal.appendChild(e); }
    for (let d = 1; d <= 31; d++) {
      const iso = `2026-12-${String(d).padStart(2, "0")}`, e = document.createElement(DATES.includes(iso) ? "button" : "div");
      e.className = "day";
      if ([24, 25, 26, 31].includes(d)) e.classList.add("hol");
      if (DATES.includes(iso)) {
        e.classList.add("cand"); e.type = "button"; e.dataset.date = iso; e.setAttribute("aria-label", dateLong(iso));
        e.innerHTML = '<i class="heat"></i><span></span>'; e.querySelector("span").textContent = d;
        e.addEventListener("click", () => setFilter(filter === iso ? "all" : iso));
      } else e.textContent = d;
      cal.appendChild(e);
    }
  })();

  /* ---------- Table filter chips ---------- */
  function renderChips() {
    const f = $("#tableFilter"); f.innerHTML = "";
    [["all", "Alle"], ...DATES.map((d) => [d, dateShort(d)])].forEach(([k, label]) => {
      const b = document.createElement("button"); b.type = "button"; b.className = "chip"; b.setAttribute("role", "tab");
      b.setAttribute("aria-selected", String(filter === k)); b.textContent = label;
      b.addEventListener("click", () => setFilter(k)); f.appendChild(b);
    });
  }
  function setFilter(k) { filter = k; renderChips(); renderTally(); drawTable(); }

  /* ---------- The long table ---------- */
  const SVGNS = "http://www.w3.org/2000/svg";
  const el = (tag, attrs = {}, parent) => { const e = document.createElementNS(SVGNS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; };
  function drawTable() {
    const svg = $("#tableSvg"), vertical = $("#tableWrap").clientWidth < 620;
    svg.innerHTML = "";
    const A0 = 150, A1 = 900, C = vertical ? 230 : 210;
    const P = (a, o) => (vertical ? { x: C + o, y: a } : { x: a, y: C + o });
    svg.setAttribute("viewBox", vertical ? "0 0 460 960" : "0 0 1000 420");
    const defs = el("defs", {}, svg);
    const rg = el("radialGradient", { id: "candleHalo" }, defs);
    el("stop", { offset: "0", "stop-color": "#f3dfae", "stop-opacity": ".55" }, rg);
    el("stop", { offset: "1", "stop-color": "#d8b673", "stop-opacity": "0" }, rg);
    const cloth = el("linearGradient", { id: "cloth", x1: "0", y1: "0", x2: vertical ? "1" : "0", y2: vertical ? "0" : "1" }, defs);
    el("stop", { offset: "0", "stop-color": "#22392f" }, cloth); el("stop", { offset: ".5", "stop-color": "#284337" }, cloth); el("stop", { offset: "1", "stop-color": "#22392f" }, cloth);

    const guests = responses.slice();
    let n = Math.max(CFG.seats || 12, guests.length); if (n % 2) n++;
    const per = n / 2, step = (A1 - A0) / per;

    // table + runner
    const t0 = P(A0, -62), t1 = P(A1, 62);
    el("rect", { x: Math.min(t0.x, t1.x), y: Math.min(t0.y, t1.y), width: Math.abs(t1.x - t0.x), height: Math.abs(t1.y - t0.y), rx: 6, fill: "url(#cloth)", stroke: "#9c7a3c", "stroke-opacity": ".45" }, svg);
    const r0 = P(A0 + 20, -13), r1 = P(A1 - 20, 13);
    el("rect", { x: Math.min(r0.x, r1.x), y: Math.min(r0.y, r1.y), width: Math.abs(r1.x - r0.x), height: Math.abs(r1.y - r0.y), fill: "#d8b673", "fill-opacity": ".09" }, svg);
    // pine sprigs along the runner
    for (let a = A0 + 30; a < A1 - 20; a += 18) {
      const p = P(a, (Math.sin(a) * 6)), rot = (vertical ? 90 : 0) + (a % 36 ? 35 : -35);
      el("ellipse", { cx: p.x, cy: p.y, rx: 7, ry: 2.2, fill: "#3f6b55", opacity: ".8", transform: `rotate(${rot} ${p.x} ${p.y})` }, svg);
    }
    // candles
    const nC = per >= 7 ? 5 : 4;
    for (let k = 1; k <= nC; k++) {
      const p = P(A0 + (A1 - A0) * k / (nC + 1), 0);
      el("circle", { cx: p.x, cy: p.y, r: 46, fill: "url(#candleHalo)", class: "halo", style: `animation-delay:${k * .37}s` }, svg);
      el("circle", { cx: p.x, cy: p.y, r: 8, fill: "#efe6d2" }, svg);
      el("path", { d: `M${p.x} ${p.y - 13} q5 7 0 11 q-5 -4 0 -11z`, fill: "#ffd98a", class: "flame", style: `animation-delay:${k * .23}s` }, svg);
    }

    // host at the head
    const hp = P(A0 + 26, 0), hc = P(A0 - 30, 0), hl = vertical ? P(A0 - 78, 0) : P(A0 - 92, 0);
    seatShape(svg, hc, vertical ? 0 : 90);
    el("circle", { cx: hp.x, cy: hp.y, r: 20, fill: "#8e2236", stroke: "#d8b673", "stroke-width": 1.5 }, svg);
    const ht = el("text", { x: hp.x, y: hp.y + 6, "text-anchor": "middle", "font-family": "Bodoni Moda, Georgia, serif", "font-style": "italic", "font-size": 18, fill: "#f3c9d0" }, svg); ht.textContent = "L";
    const hn = el("text", { x: hl.x, y: hl.y + 5, "text-anchor": "middle", "font-size": 15, fill: "#d8b673" }, svg); hn.textContent = CFG.host || "Lucas";
    const hs = el("text", { x: hl.x, y: hl.y + 22, "text-anchor": "middle", "font-size": 9.5, "letter-spacing": "1.5", fill: "#93a89d", "font-family": "IBM Plex Mono, monospace" }, svg); hs.textContent = "GASTGEBER";

    for (let i = 0; i < n; i++) {
      const side = i % 2 ? 1 : -1, slot = Math.floor(i / 2), a = A0 + step * (slot + .5);
      const g = guests[i], vote = g && filter !== "all" ? (g.votes || {})[filter] : null;
      const cls = ["seat"];
      if (g && filter !== "all") cls.push(vote === "y" ? "yes" : vote === "m" ? "maybe" : "off");
      if (g && g.id === newSeatId) cls.push("new");
      const grp = el("g", { class: cls.join(" ") }, svg);
      const plate = P(a, side * 32), chair = P(a, side * 88), glass = P(a + 27, side * 50), lab = P(a, side * (vertical ? 116 : 120));
      seatShape(grp, chair, vertical ? 90 : 0, !!g);
      el("circle", { cx: plate.x, cy: plate.y, r: 21, class: "plate-ring", fill: g ? "#0b1613" : "none", stroke: g ? "#d8b673" : "#93a89d", "stroke-opacity": g ? "1" : ".35", "stroke-dasharray": g ? "" : "3 4", "stroke-width": 1.4 }, grp);
      el("circle", { cx: glass.x, cy: glass.y, r: 4.5, fill: g ? "#8e2236" : "none", stroke: "#f1ece2", "stroke-opacity": ".4" }, grp);
      const anchor = vertical ? (side < 0 ? "end" : "start") : "middle";
      const ly = vertical ? lab.y + 5 : lab.y + (side < 0 ? 0 : 10);
      if (g) {
        const init = el("text", { x: plate.x, y: plate.y + 6, "text-anchor": "middle", "font-family": "Bodoni Moda, Georgia, serif", "font-style": "italic", "font-size": 18, fill: "#d8b673" }, grp);
        init.textContent = (g.name || "?").trim().charAt(0).toUpperCase();
        const name = el("text", { x: lab.x, y: ly, "text-anchor": anchor, "font-size": 15, fill: "#f1ece2" }, grp);
        name.textContent = shorten(g.name, vertical ? 11 : 13);
        if (me && g.id === me.id) {
          const du = el("text", { x: lab.x, y: ly + 15, "text-anchor": anchor, "font-size": 9.5, "letter-spacing": "1.5", fill: "#d8b673", "font-family": "IBM Plex Mono, monospace" }, grp); du.textContent = "DAS BIST DU";
        }
      } else {
        const fr = el("text", { x: lab.x, y: ly, "text-anchor": anchor, "font-size": 10, "letter-spacing": "2", fill: "#4c5f56", "font-family": "IBM Plex Mono, monospace" }, grp); fr.textContent = "FREI";
      }
    }
    const yes = filter === "all" ? null : guests.filter((g) => (g.votes || {})[filter] === "y").length;
    $("#tableMeta").innerHTML = filter === "all"
      ? `<b>${guests.length}</b> von ${n} Plätzen eingedeckt`
      : `${escapeHTML(dateLong(filter))}: <b>${yes}</b> sicher dabei`;
    newSeatId = null;
  }
  function seatShape(parent, p, rot, filled) {
    el("rect", { x: p.x - 22, y: p.y - 10, width: 44, height: 20, rx: 6, fill: filled ? "#3a2a1c" : "#1a2a24", stroke: "#9c7a3c", "stroke-opacity": filled ? ".6" : ".2", transform: `rotate(${rot} ${p.x} ${p.y})` }, parent);
  }
  const shorten = (s, n) => { s = String(s || "").trim(); return s.length > n ? s.slice(0, n - 1) + "…" : s; };
  const escapeHTML = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  let lastVertical = null;
  window.addEventListener("resize", () => { const v = $("#tableWrap").clientWidth < 620; if (v !== lastVertical) { lastVertical = v; drawTable(); } });

  /* ---------- Form ---------- */
  const form = $("#rsvp"), dv = $("#dateVotes");
  DATES.forEach((d) => {
    const row = document.createElement("div"); row.className = "dv";
    const lab = document.createElement("div"); lab.className = "dv-date";
    const s = document.createElement("strong"); s.textContent = parseISO(d).getDate() + ". Dezember";
    const sp = document.createElement("span"); sp.textContent = fmtDay.format(parseISO(d));
    lab.append(s, sp);
    const seg = document.createElement("div"); seg.className = "seg"; seg.setAttribute("role", "radiogroup"); seg.setAttribute("aria-label", dateLong(d));
    [["y", "Passt"], ["m", "Vielleicht"], ["n", "Geht nicht"]].forEach(([v, t]) => {
      const id = `v-${d}-${v}`, inp = document.createElement("input");
      inp.type = "radio"; inp.name = "v-" + d; inp.value = v; inp.id = id;
      const l = document.createElement("label"); l.htmlFor = id; l.textContent = t;
      seg.append(inp, l);
    });
    row.append(lab, seg); dv.appendChild(row);
  });
  $("#allYes").addEventListener("click", () => DATES.forEach((d) => { form.querySelector(`input[name="v-${d}"][value="y"]`).checked = true; }));
  if (guestName && !(me && me.name)) $("#fName").value = guestName;

  function fillFromMe() {
    if (!me) return;
    const mine = responses.find((r) => r.id === me.id);
    if (!mine) return;
    $("#fName").value = mine.name;
    DATES.forEach((d) => { const v = (mine.votes || {})[d]; if (v) { const i = form.querySelector(`input[name="v-${d}"][value="${v}"]`); if (i) i.checked = true; } });
    if (me.diet) $("#fDiet").value = me.diet;
    if (me.message) $("#fMsg").value = me.message;
    $("#formTitle").textContent = "Deine Antwort ändern";
    $("#submitBtn").textContent = "Antwort aktualisieren";
  }

  const status = (msg, kind) => { const s = $("#formStatus"); s.textContent = msg; s.className = "form-status" + (kind ? " " + kind : ""); };
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = $("#fName").value.trim();
    if (!name) { status("Sag mir noch, wie du heißt.", "err"); $("#fName").focus(); return; }
    const votes = {}; let answered = 0;
    DATES.forEach((d) => { const c = form.querySelector(`input[name="v-${d}"]:checked`); votes[d] = c ? c.value : "n"; if (c) answered++; });
    if (!answered) { status("Wähl mindestens bei einem Abend aus, ob er dir passt.", "err"); return; }
    const isNew = !me || !responses.some((r) => r.id === me.id);
    if (!me) me = { id: uid(), token: uid() + uid() };
    const payload = { action: "upsert", id: me.id, token: me.token, name, votes, diet: $("#fDiet").value.trim(), message: $("#fMsg").value.trim(), website: $("#fWebsite").value };
    const btn = $("#submitBtn"); btn.disabled = true; status("Dein Platz wird eingedeckt …");
    try {
      responses = await api.save(payload);
      me = { ...me, name, diet: payload.diet, message: payload.message }; store.set(ME_KEY, me);
      if (isNew) newSeatId = me.id;
      status(isNew ? "Eingedeckt. Du sitzt an der Tafel." : "Gespeichert.", "ok");
      renderAll(); fillFromMe();
      toast(isNew ? `Danke, ${name}. Dein Platz ist eingedeckt.` : "Deine Antwort ist aktualisiert.");
      if (isNew) { $(".table-stage").scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" }); ring(); }
    } catch (err) {
      status("Das hat nicht geklappt: " + (err.message || "keine Verbindung") + ". Versuch es gleich nochmal.", "err");
    } finally { btn.disabled = false; }
  });

  if (final && !isNaN(final)) {
    form.classList.add("closed");
    $("#formTitle").textContent = "Die Abstimmung ist geschlossen";
    const iso = `${final.getFullYear()}-${String(final.getMonth() + 1).padStart(2, "0")}-${String(final.getDate()).padStart(2, "0")}`;
    if (DATES.includes(iso)) filter = iso;
  }

  function renderAll() { renderChips(); renderTally(); lastVertical = $("#tableWrap").clientWidth < 620; drawTable(); }
  async function load() {
    try {
      responses = await api.list(); loaded = true;
      renderAll(); fillFromMe();
    } catch (err) {
      $("#tableMeta").textContent = "Die Tafel konnte gerade nicht geladen werden";
      if (!loaded) renderAll();
    }
  }
  renderAll(); load();
  setInterval(() => { if (document.visibilityState === "visible" && CFG.apiUrl) load(); }, 30000);

  /* ---------- toast message ---------- */
  let toastT = null;
  function toast(msg) { const t = $("#toastMsg"); t.textContent = msg; t.hidden = false; t.style.animation = "none"; void t.offsetWidth; t.style.animation = ""; clearTimeout(toastT); toastT = setTimeout(() => (t.hidden = true), 3800); }

  /* ---------- Clink ---------- */
  function ring() {
    const ctx = audio(); if (!ctx) return;
    const t = ctx.currentTime;
    [[2093, .22, 1.6], [3140, .11, 1.1], [4186, .07, .8], [5274, .04, .5]].forEach(([f, g, d]) => {
      const o = ctx.createOscillator(), a = ctx.createGain();
      o.type = "sine"; o.frequency.setValueAtTime(f * (1 + (Math.random() - .5) * .01), t);
      a.gain.setValueAtTime(0, t); a.gain.linearRampToValueAtTime(g, t + .004); a.gain.exponentialRampToValueAtTime(.0001, t + d);
      o.connect(a).connect(ctx.destination); o.start(t); o.stop(t + d + .05);
    });
  }
  const sc = $("#sparks"), sx = sc.getContext("2d"), box = $("#glasses");
  let sparks = [], running = false, clinks = 0;
  const cheers = ["Prost!", "Salud!", "Cheers!", "Zum Wohl!", "Santé!", "Na zdrowie!", "Skål!", "Kampai!", "Saúde!", "Cin cin!"];
  function burst() {
    const r = sc.getBoundingClientRect(), dp = Math.min(window.devicePixelRatio || 1, 2);
    sc.width = r.width * dp; sc.height = r.height * dp; sx.setTransform(dp, 0, 0, dp, 0, 0);
    const cx = r.width / 2, cy = r.height * .2;
    for (let i = 0; i < 70; i++) { const a = Math.random() * 6.283, s = 1.5 + Math.random() * 4.8; sparks.push({ x: cx, y: cy, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 1.5, life: 1, r: 1 + Math.random() * 2.2, c: Math.random() < .75 ? "216,182,115" : "241,236,226" }); }
    if (!running) { running = true; requestAnimationFrame(tickSparks); }
  }
  function tickSparks() {
    const r = sc.getBoundingClientRect(); sx.clearRect(0, 0, r.width, r.height);
    sparks = sparks.filter((p) => p.life > 0);
    for (const p of sparks) { p.x += p.vx; p.y += p.vy; p.vy += .09; p.vx *= .985; p.life -= .016; sx.fillStyle = `rgba(${p.c},${Math.max(0, p.life)})`; sx.beginPath(); sx.arc(p.x, p.y, p.r, 0, 6.283); sx.fill(); }
    if (sparks.length) requestAnimationFrame(tickSparks); else running = false;
  }
  $("#clink").addEventListener("click", () => {
    box.classList.add("clinking");
    setTimeout(() => { ring(); if (!reduce) burst(); }, reduce ? 0 : 260);
    setTimeout(() => box.classList.remove("clinking"), 900);
    clinks++; $("#count").textContent = `${cheers[(clinks - 1) % cheers.length]}  ·  ${clinks}× angestoßen`;
  });

  /* ---------- reveal on scroll ---------- */
  const reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !reduce) {
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { rootMargin: "0px 0px -8% 0px" });
    reveals.forEach((r) => io.observe(r));
  } else reveals.forEach((r) => r.classList.add("in"));
})();
