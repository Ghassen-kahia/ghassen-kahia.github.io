(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const esc = (str = "") =>
    String(str).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const pad = (n, len = 2) => String(n).padStart(len, "0");

  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const initials = SITE.name.split(/\s+/).map((w) => w[0]).join("").toUpperCase();

  /* ---------- Site info from data.js ---------- */
  const [first, ...rest] = SITE.name.split(/\s+/);
  $("[data-first]").textContent = first;
  if (rest.length) $("[data-last]").textContent = rest.join(" ");
  else $("[data-last]").remove();
  $("#name").setAttribute("aria-label", SITE.name);

  $$("[data-name-full]").forEach((el) => (el.textContent = SITE.name));
  $$("[data-role]").forEach((el) => (el.textContent = SITE.role));
  $$("[data-role-lower]").forEach((el) => (el.textContent = SITE.role.toLowerCase()));
  $$("[data-location]").forEach((el) => (el.textContent = SITE.location));
  $$("[data-tagline]").forEach((el) => (el.textContent = SITE.tagline));
  $$("[data-email]").forEach((el) => (el.textContent = SITE.email));
  $$("[data-email-link]").forEach((el) => (el.href = `mailto:${SITE.email}`));
  $$("[data-resume]").forEach((el) => (el.href = SITE.resume));
  $$("[data-status]").forEach((el) => (el.textContent = SITE.available ? "Available for work" : "Currently booked"));
  if (!SITE.available) $(".status-dot").classList.add("off");

  $("[data-about]").innerHTML = esc(SITE.about).replace(/\*(.+?)\*/g, "<mark>$1</mark>");
  $("#specList").innerHTML = SITE.specs
    .map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`)
    .join("");
  $("#socials").innerHTML = Object.entries(SITE.socials)
    .filter(([, url]) => url)
    .map(([label, url]) => `<li><a href="${esc(url)}" target="_blank" rel="noopener">${esc(label)} ↗</a></li>`)
    .join("");

  $("#year").textContent = new Date().getFullYear();

  /* ---------- Name: split into letters for the load-in animation ---------- */
  let letterIndex = 0;
  $$(".name-line").forEach((line) => {
    line.setAttribute("aria-hidden", "true");
    line.innerHTML = [...line.textContent.trim()]
      .map((c) => (c === " " ? " " : `<span class="ch" style="--i:${letterIndex++}">${esc(c)}</span>`))
      .join("");
  });

  /* ---------- Live clock ---------- */
  const timeOpts = { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false };
  let clockFmt;
  try {
    clockFmt = new Intl.DateTimeFormat("en-GB", { ...timeOpts, timeZone: SITE.timezone });
  } catch {
    clockFmt = new Intl.DateTimeFormat("en-GB", timeOpts);
  }
  const clock = $("#clock");
  const tickClock = () => (clock.textContent = clockFmt.format(new Date()));
  tickClock();
  setInterval(tickClock, 1000);

  /* ==========================================================
     Isometric drawing engine
     A scene is a list of boxes {x, y, z, w, d, h, layer, acc}
     in grid units, plus optional dashed guides and labels.
     ========================================================== */
  const U = 22;
  const COS30 = Math.cos(Math.PI / 6);
  const project = (x, y, z) => [(x - y) * COS30 * U, (x + y) * 0.5 * U - z * U];
  const fmt = ([a, b]) => `${a.toFixed(1)},${b.toFixed(1)}`;

  function geometry(scene) {
    const allPts = [];
    const track = (p) => (allPts.push(p), p);

    const boxes = [...scene.boxes]
      .map((b, i) => ({ ...b, i, key: (b.layer || 0) * 1000 + (b.x + b.w / 2) + (b.y + b.d / 2) + (b.z + b.h / 2) * 0.01 }))
      .sort((a, b) => a.key - b.key || a.i - b.i)
      .map(({ x, y, z, w, d, h, acc }) => {
        const poly = (pts) => pts.map((p) => fmt(track(project(...p)))).join(" ");
        return {
          acc,
          left: poly([[x, y + d, z], [x + w, y + d, z], [x + w, y + d, z + h], [x, y + d, z + h]]),
          right: poly([[x + w, y, z], [x + w, y + d, z], [x + w, y + d, z + h], [x + w, y, z + h]]),
          top: poly([[x, y, z + h], [x + w, y, z + h], [x + w, y + d, z + h], [x, y + d, z + h]]),
        };
      });

    const guides = (scene.guides || []).map(([p1, p2]) => [...track(project(...p1)), ...track(project(...p2))]);

    const maxX = Math.max(...allPts.map((p) => p[0]));
    const leaderX = maxX + 26;
    const labels = (scene.labels || []).map(({ at, text }) => {
      const [ax, ay] = project(...at);
      allPts.push([leaderX + 10 + text.length * 7.6, ay - 8], [leaderX, ay + 8]);
      return { ax, ay, lx: leaderX, text };
    });

    const xs = allPts.map((p) => p[0]);
    const ys = allPts.map((p) => p[1]);
    const P = 10;
    const bounds = [Math.min(...xs) - P, Math.min(...ys) - P, Math.max(...xs) - Math.min(...xs) + 2 * P, Math.max(...ys) - Math.min(...ys) + 2 * P];
    return { boxes, guides, labels, bounds };
  }

  function isoMarkup(g) {
    const guides = g.guides.map(([x1, y1, x2, y2]) => `<line class="guide" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`).join("");
    const boxes = g.boxes
      .map(
        (b, i) => `<g class="box${b.acc ? " acc" : ""}" style="--d:${(i * 0.07).toFixed(2)}s">
          <polygon class="face f-left" pathLength="1" points="${b.left}"/>
          <polygon class="face f-right" pathLength="1" points="${b.right}"/>
          <polygon class="face f-top" pathLength="1" points="${b.top}"/>
        </g>`
      )
      .join("");
    const labels = g.labels
      .map(
        (l) => `<g class="label">
          <polyline class="leader" points="${l.ax},${l.ay} ${l.lx},${l.ay}"/>
          <circle class="dotm" r="2.6" cx="${l.ax}" cy="${l.ay}"/>
          <text x="${l.lx + 8}" y="${l.ay + 4}">${esc(l.text)}</text>
        </g>`
      )
      .join("");
    return `<g class="guides">${guides}</g><g class="boxes">${boxes}</g><g class="labels">${labels}</g>`;
  }

  /* ---------- Hero figure: full-stack assembly ---------- */
  const W = 5;
  const SLAB = 0.55;
  function heroScene(gap) {
    const z = (i) => i * (SLAB + gap);
    const top = (i) => z(i) + SLAB;
    const boxes = [
      // layer 0 — database
      { x: 0, y: 0, z: z(0), w: W, d: W, h: SLAB, layer: 0 },
      { x: 0.6, y: 0.6, z: top(0), w: 1.1, d: 1.1, h: 0.7, layer: 1 },
      { x: 2.0, y: 0.6, z: top(0), w: 1.1, d: 1.1, h: 0.5, layer: 1 },
      { x: 3.4, y: 0.6, z: top(0), w: 1.1, d: 1.1, h: 0.9, layer: 1 },
      { x: 0.6, y: 2.4, z: top(0), w: 3.9, d: 2.0, h: 0.35, layer: 1 },
      // layer 1 — API
      { x: 0, y: 0, z: z(1), w: W, d: W, h: SLAB, layer: 2 },
      { x: 0.7, y: 0.7, z: top(1), w: 3.6, d: 0.9, h: 0.4, layer: 3 },
      { x: 0.7, y: 2.3, z: top(1), w: 1.6, d: 2.0, h: 0.65, layer: 3 },
      { x: 2.7, y: 2.3, z: top(1), w: 1.6, d: 2.0, h: 0.45, layer: 3 },
      // layer 2 — interface
      { x: 0, y: 0, z: z(2), w: W, d: W, h: SLAB, layer: 4, acc: true },
      { x: 0.5, y: 0.5, z: top(2), w: 4.0, d: 0.7, h: 0.25, layer: 5 },
      { x: 0.5, y: 1.6, z: top(2), w: 1.8, d: 2.9, h: 0.45, layer: 5 },
      { x: 2.7, y: 1.6, z: top(2), w: 1.8, d: 1.3, h: 0.7, layer: 5 },
      { x: 2.7, y: 3.3, z: top(2), w: 1.8, d: 1.2, h: 0.3, layer: 5 },
    ];
    const guides = [];
    [0, 1].forEach((i) =>
      [[W, 0], [0, W], [W, W]].forEach(([gx, gy]) => guides.push([[gx, gy, top(i)], [gx, gy, z(i + 1)]]))
    );
    const labels = [
      { at: [W, 0, z(2) + SLAB / 2], text: "01 INTERFACE" },
      { at: [W, 0, z(1) + SLAB / 2], text: "02 API" },
      { at: [W, 0, z(0) + SLAB / 2], text: "03 DATABASE" },
    ];
    return { boxes, guides, labels };
  }

  const heroSvg = $("#heroFig");
  const heroGeo = geometry(heroScene(2.2));
  heroSvg.setAttribute("viewBox", heroGeo.bounds.join(" "));
  heroSvg.innerHTML = isoMarkup(heroGeo);

  // Draw the figure line by line the first time it comes into view
  if (!reduceMotion) {
    heroSvg.classList.add("pre");
    const drawIO = new IntersectionObserver((entries) => {
      if (!entries[0].isIntersecting) return;
      drawIO.disconnect();
      requestAnimationFrame(() => {
        heroSvg.classList.remove("pre");
        heroSvg.classList.add("drawing");
        setTimeout(() => heroSvg.classList.remove("drawing"), 3200);
      });
    }, { threshold: 0.3 });
    drawIO.observe(heroSvg);
  }


  /* ---------- Generated project models (unique per title) ---------- */
  function seeded(str) {
    let h = 2166136261;
    for (const c of str) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
    return () => {
      h ^= h << 13; h ^= h >>> 17; h ^= h << 5;
      return (h >>> 0) / 4294967296;
    };
  }

  function projectScene(title) {
    const rnd = seeded(title);
    const N = 5;
    const BASE = 0.3;
    const boxes = [{ x: 0, y: 0, z: 0, w: N, d: N, h: BASE, layer: 0 }];
    const used = new Set();
    const target = 3 + Math.floor(rnd() * 3);
    for (let tries = 0; tries < 60 && boxes.length - 1 < target; tries++) {
      const w = 1 + Math.floor(rnd() * 2);
      const d = 1 + Math.floor(rnd() * 2);
      const x = Math.floor(rnd() * (N - w + 1));
      const y = Math.floor(rnd() * (N - d + 1));
      const cells = [];
      for (let i = x; i < x + w; i++) for (let j = y; j < y + d; j++) cells.push(`${i},${j}`);
      if (cells.some((c) => used.has(c))) continue;
      cells.forEach((c) => used.add(c));
      const h = Math.round((0.5 + rnd() * 2.6) * 10) / 10;
      boxes.push({ x: x + 0.12, y: y + 0.12, z: BASE, w: w - 0.24, d: d - 0.24, h, layer: 1 });
    }
    boxes[1 + Math.floor(rnd() * (boxes.length - 1))].acc = true;
    // Sometimes stack a smaller block on top of one of them
    if (rnd() < 0.6) {
      const b = boxes[1 + Math.floor(rnd() * (boxes.length - 1))];
      boxes.push({ x: b.x + 0.2, y: b.y + 0.2, z: b.z + b.h, w: b.w - 0.4, d: b.d - 0.4, h: 0.3 + rnd() * 0.8, layer: 1 });
    }
    return { boxes };
  }

  const figCache = new Map();
  const projectFigure = (p) => {
    if (p.image) return `<img src="${esc(p.image)}" alt="${esc(p.title)} preview" loading="lazy" />`;
    if (!figCache.has(p.title)) {
      const g = geometry(projectScene(p.title));
      figCache.set(p.title, `<svg class="iso" viewBox="${g.bounds.join(" ")}" aria-hidden="true">${isoMarkup(g)}</svg>`);
    }
    return figCache.get(p.title);
  };

  /* ---------- Drawing index (projects) ---------- */
  const list = $("#projectList");
  $("#projectCount").textContent = pad(PROJECTS.length);

  list.innerHTML = PROJECTS.map(
    (p, i) => `
    <li class="row reveal" data-category="${esc(p.category)}" data-index="${i}" style="--delay:${(i * 0.05).toFixed(2)}s">
      <button class="row-head" aria-expanded="false" aria-controls="row-body-${i}">
        <span class="c-no">${pad(i + 1)}</span>
        <span class="c-title">${esc(p.title)}${p.featured ? `<em class="star" title="Featured">★</em>` : ""}</span>
        <span class="c-meta c-type">${esc(p.category)}</span>
        <span class="c-meta c-stack">${esc(p.tags.join(" · "))}</span>
        <span class="c-meta c-year">${esc(p.year || "")}</span>
        <span class="c-toggle" aria-hidden="true">+</span>
      </button>
      <div class="row-body" id="row-body-${i}">
        <div class="row-body-inner">
          <div class="row-content">
            <div class="row-fig">${projectFigure(p)}</div>
            <div>
              <p class="row-desc">${esc(p.description)}</p>
              <div class="tags">${p.tags.map((t) => `<span class="tag">${esc(t)}</span>`).join("")}</div>
              <div class="links">
                ${p.live ? `<a class="btn btn-ink" href="${esc(p.live)}" target="_blank" rel="noopener">Live demo ↗</a>` : ""}
                ${p.code ? `<a class="btn btn-line" href="${esc(p.code)}" target="_blank" rel="noopener">Source code ↗</a>` : ""}
              </div>
            </div>
          </div>
        </div>
      </div>
    </li>`
  ).join("");

  list.addEventListener("click", (e) => {
    const head = e.target.closest(".row-head");
    if (!head) return;
    const row = head.parentElement;
    const open = !row.classList.contains("open");
    row.classList.toggle("open", open);
    head.setAttribute("aria-expanded", open);
  });

  /* Filters */
  const categories = [...new Set(PROJECTS.map((p) => p.category))];
  const filters = $("#filters");
  filters.innerHTML = ["All", ...categories]
    .map((c, i) => {
      const count = c === "All" ? PROJECTS.length : PROJECTS.filter((p) => p.category === c).length;
      return `<button class="filter${i === 0 ? " active" : ""}" data-filter="${esc(c)}" aria-pressed="${i === 0}">${esc(c)}<sup>${pad(count)}</sup></button>`;
    })
    .join("");
  filters.addEventListener("click", (e) => {
    const btn = e.target.closest(".filter");
    if (!btn) return;
    $$(".filter", filters).forEach((b) => {
      b.classList.toggle("active", b === btn);
      b.setAttribute("aria-pressed", b === btn);
    });
    const f = btn.dataset.filter;
    $$(".row", list).forEach((row) => row.classList.toggle("hidden", f !== "All" && row.dataset.category !== f));
  });

  /* ---------- Skills ---------- */
  $("#partCount").textContent = pad(SKILLS.length);
  $("#partsGrid").innerHTML = SKILLS.map(
    (s, i) => `
    <div class="part reveal" style="--delay:${((i % 4) * 0.06).toFixed(2)}s">
      <div class="part-top"><span class="part-no">${pad(i + 1)}</span><span>${esc(s.group)}</span></div>
      <div class="part-name">${esc(s.name)}</div>
      <div class="part-level" role="img" aria-label="Proficiency ${s.level} of 5">
        ${[1, 2, 3, 4, 5].map((n) => `<i class="${n <= s.level ? "on" : ""}"></i>`).join("")}
      </div>
    </div>`
  ).join("");

  /* ---------- Experience ---------- */
  $("#revList").innerHTML = EXPERIENCE.map((x, i) => {
    const letter = String.fromCharCode(65 + EXPERIENCE.length - 1 - i);
    return `
    <li class="rev reveal" style="--delay:${(i * 0.08).toFixed(2)}s">
      <span class="rev-tri" aria-label="Revision ${letter}">${letter}</span>
      <span class="rev-date">${esc(x.period)}</span>
      <div class="rev-body">
        <h3 class="rev-role">${esc(x.role)}</h3>
        <span class="rev-company">${esc(x.company)}</span>
        <p class="rev-desc">${esc(x.description)}</p>
      </div>
      <span class="rev-appd" aria-hidden="true">${esc(initials)}</span>
    </li>`;
  }).join("");

  /* ---------- Reveal on scroll ---------- */
  const revealIO = new IntersectionObserver(
    (entries) =>
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add("in");
        revealIO.unobserve(e.target);
      }),
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
  );
  $$(".hero .reveal").forEach((el, i) => el.style.setProperty("--delay", `${0.3 + i * 0.1}s`));
  $$(".reveal").forEach((el) => revealIO.observe(el));

  /* ---------- Active nav link ---------- */
  const navLinks = $$(".nav a");
  const sectionIO = new IntersectionObserver(
    (entries) =>
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        navLinks.forEach((l) => l.classList.toggle("active", l.getAttribute("href") === `#${e.target.id}`));
      }),
    { rootMargin: "-40% 0px -55% 0px" }
  );
  $$("[data-sheet]").forEach((s) => sectionIO.observe(s));

  /* ---------- Mobile menu ---------- */
  const menuBtn = $("#menuBtn");
  const nav = $("#nav");
  const setMenu = (open) => {
    nav.classList.toggle("open", open);
    menuBtn.setAttribute("aria-expanded", open);
    menuBtn.textContent = open ? "Close" : "Menu";
  };
  menuBtn.addEventListener("click", () => setMenu(!nav.classList.contains("open")));
  navLinks.forEach((l) => l.addEventListener("click", () => setMenu(false)));

  /* ---------- Theme: paper / blueprint ---------- */
  const root = document.documentElement;
  const themeBtn = $("#themeToggle");
  const themeMeta = $('meta[name="theme-color"]');
  const syncTheme = () => {
    const bp = root.dataset.theme === "blueprint";
    themeBtn.setAttribute("aria-checked", bp);
    themeBtn.setAttribute("aria-label", bp ? "Switch to paper theme" : "Switch to blueprint theme");
    themeMeta.setAttribute("content", bp ? "#0D2B5E" : "#EEEBE3");
  };
  syncTheme();
  themeBtn.addEventListener("click", () => {
    root.dataset.theme = root.dataset.theme === "blueprint" ? "paper" : "blueprint";
    try { localStorage.setItem("theme", root.dataset.theme); } catch {}
    syncTheme();
  });

  /* ---------- Copy email ---------- */
  const copyBtn = $("#copyEmail");
  copyBtn.addEventListener("click", async () => {
    const label = $(".copy-label", copyBtn);
    try {
      await navigator.clipboard.writeText(SITE.email);
      label.textContent = "Copied ✓";
    } catch {
      label.textContent = SITE.email;
    }
    setTimeout(() => (label.textContent = "Copy email"), 2000);
  });
})();
