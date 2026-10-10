(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const esc = (str = "") =>
    String(str).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const pad = (n, len = 2) => String(n).padStart(len, "0");

  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Site info from data.js ---------- */
  const [first, ...rest] = SITE.name.split(/\s+/);
  $("[data-first]").textContent = first;
  if (rest.length) $("[data-last]").textContent = rest.join(" ");
  else $("[data-last]").remove();
  $("#name").setAttribute("aria-label", SITE.name);

  $$("[data-name-full]").forEach((el) => (el.textContent = SITE.name));
  $$("[data-role]").forEach((el) => (el.textContent = SITE.role));
  $$("[data-location]").forEach((el) => (el.textContent = SITE.location));
  $$("[data-tagline]").forEach((el) => (el.textContent = SITE.tagline));
  $$("[data-email]").forEach((el) => (el.textContent = SITE.email));
  $$("[data-email-link]").forEach((el) => (el.href = `mailto:${SITE.email}`));
  $$("[data-resume]").forEach((el) => (el.href = SITE.resume));
  $$("[data-photo]").forEach((el) => SITE.photo && (el.src = SITE.photo));
  $$("[data-stamp]").forEach((el) => (el.textContent = SITE.stamp));
  $$("[data-status]").forEach((el) => (el.textContent = SITE.available ? SITE.status : "Currently booked"));
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
     DNA helix (hero)
     Two strands spiral down the figure and open into a "bubble"
     around the portrait. Segments with z < 0 are drawn on the
     back canvas (behind the photo), z >= 0 on the front canvas.
     Skill names appear on base pairs as they turn to face you.
     ========================================================== */
  const skillNames = SKILLS.flatMap((g) => g.items);
  const helix = (() => {
    const wrap = $("#helix");
    const back = $(".helix-back", wrap);
    const front = $(".helix-front", wrap);
    const cb = back.getContext("2d");
    const cf = front.getContext("2d");
    const TURNS = 2.4;
    const RUNGS = 28;
    let W = 0, H = 0, colors = {};

    const readColors = () => {
      const cs = getComputedStyle(document.documentElement);
      const v = (name) => cs.getPropertyValue(name).trim();
      colors = { a: v("--accent"), b: v("--accent-2"), ink: v("--ink"), ink2: v("--ink-2"), mono: v("--f-mono") };
    };

    const resize = () => {
      const r = wrap.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = r.width;
      H = r.height;
      [back, front].forEach((c) => {
        c.width = Math.round(W * dpr);
        c.height = Math.round(H * dpr);
        c.getContext("2d").setTransform(dpr, 0, 0, dpr, 0, 0);
      });
    };

    function draw(phase, grow) {
      cb.clearRect(0, 0, W, H);
      cf.clearRect(0, 0, W, H);
      if (!W || !H) return;

      const cx = W / 2;
      const cy = H / 2;
      const R0 = W * 0.16; // closed helix radius
      const R1 = W * 0.4; // radius where it opens around the portrait
      const sig = H * 0.15;
      const photoR = W * 0.27;
      const k = (TURNS * 2 * Math.PI) / H;
      const open = (y) => Math.exp(-((y - cy) ** 2) / (2 * sig * sig));
      const point = (y, off) => {
        const r = R0 + (R1 - R0) * open(y);
        const t = y * k + phase + off;
        const z = Math.sin(t);
        return { x: cx + r * Math.cos(t), y: y + z * r * 0.14, z, c: Math.cos(t) };
      };
      const visible = (y) => Math.abs(y - cy) <= (grow * H) / 2;
      const edge = (y) => Math.max(0, Math.min(1, y / (H * 0.12), (H - y) / (H * 0.12)));
      const overPhoto = (p) => (p.x - cx) ** 2 + (p.y - cy) ** 2 < photoR ** 2;
      const depth = (z) => (z + 1) / 2;

      // Strands
      cb.lineCap = cf.lineCap = "round";
      const STEP = 3;
      [[0, colors.a], [Math.PI, colors.b]].forEach(([off, col]) => {
        let prev = point(0, off);
        for (let y = STEP; y <= H; y += STEP) {
          const p = point(y, off);
          if (visible(y)) {
            const zm = (p.z + prev.z) / 2;
            const ctx = zm >= 0 ? cf : cb;
            let alpha = (0.25 + 0.75 * depth(zm)) * edge(y);
            if (zm >= 0 && overPhoto(p)) alpha *= 0.55;
            ctx.globalAlpha = alpha;
            ctx.strokeStyle = col;
            ctx.lineWidth = 1 + 2 * depth(zm);
            ctx.beginPath();
            ctx.moveTo(prev.x, prev.y);
            ctx.lineTo(p.x, p.y);
            ctx.stroke();
          }
          prev = p;
        }
      });

      // Base pairs (skipped where the helix opens up)
      cf.font = cb.font = `500 10px ${colors.mono || "monospace"}`;
      cf.textBaseline = "middle";
      for (let i = 0; i < RUNGS; i++) {
        const y = (H * (i + 0.5)) / RUNGS;
        if (!visible(y) || open(y) > 0.3) continue;
        const a = point(y, 0);
        const b = point(y, Math.PI);
        const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
        const fade = edge(y);

        [[a, colors.a], [b, colors.b]].forEach(([p, col]) => {
          const ctx = p.z >= 0 ? cf : cb;
          ctx.globalAlpha = (0.2 + 0.5 * depth(p.z)) * fade;
          ctx.strokeStyle = col;
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(mid.x, mid.y);
          ctx.stroke();

          ctx.globalAlpha = (0.4 + 0.6 * depth(p.z)) * fade;
          ctx.fillStyle = col;
          ctx.beginPath();
          ctx.arc(p.x, p.y, 1.6 + 1.8 * depth(p.z), 0, Math.PI * 2);
          ctx.fill();
        });

        // Skill label on every other rung, shown while the rung faces the viewer
        if (i % 2 === 0) {
          const facing = Math.abs(a.c);
          const show = Math.max(0, (facing - 0.82) / 0.18);
          if (show > 0) {
            const end = a.x > b.x ? a : b;
            const label = skillNames[(i / 2) % skillNames.length];
            cf.globalAlpha = show * fade;
            cf.strokeStyle = colors.ink2;
            cf.lineWidth = 1;
            cf.beginPath();
            cf.moveTo(end.x + 6, end.y);
            cf.lineTo(end.x + 18, end.y);
            cf.stroke();
            cf.fillStyle = colors.ink;
            cf.fillText(label, end.x + 22, end.y);
          }
        }
      }
      cb.globalAlpha = cf.globalAlpha = 1;
    }

    let phase = 0;
    let last = 0;
    let start = 0;
    let running = false;
    const SPEED = 0.32; // radians per second
    const ease = (t) => 1 - (1 - t) ** 3;
    const scrollTwist = () => window.scrollY * 0.004;

    const frame = (t) => {
      if (!running) return;
      if (!start) start = t;
      const dt = last ? Math.min(t - last, 50) / 1000 : 0;
      last = t;
      phase += dt * SPEED;
      draw(phase + scrollTwist(), ease(Math.min(1, (t - start) / 1800)));
      requestAnimationFrame(frame);
    };
    const play = () => {
      if (running || reduceMotion) return;
      running = true;
      last = 0;
      requestAnimationFrame(frame);
    };
    const stop = () => (running = false);
    const redraw = () => draw(phase + scrollTwist(), 1);

    readColors();
    resize();
    redraw();
    new ResizeObserver(() => (resize(), redraw())).observe(wrap);

    if (!reduceMotion) {
      let inView = false;
      new IntersectionObserver((entries) => {
        inView = entries[0].isIntersecting;
        inView && !document.hidden ? play() : stop();
      }).observe(wrap);
      document.addEventListener("visibilitychange", () => (inView && !document.hidden ? play() : stop()));
    }
    // Fonts load after first paint; redraw so labels use the mono font
    document.fonts?.ready.then(() => (readColors(), redraw()));

    return { refresh: () => (readColors(), redraw()) };
  })();

  /* ---------- DNA barcode (unique per project title) ---------- */
  function seeded(str) {
    let h = 2166136261;
    for (const c of str) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
    return () => {
      h ^= h << 13; h ^= h >>> 17; h ^= h << 5;
      return (h >>> 0) / 4294967296;
    };
  }

  const BASES = ["A", "T", "G", "C"];
  function barcode(title) {
    const rnd = seeded(title);
    const bars = [];
    for (let x = 16; x < 284; ) {
      const w = 2 + Math.floor(rnd() * 6);
      const b = Math.floor(rnd() * 4);
      const h = 50 + Math.floor(rnd() * 40);
      bars.push(`<rect class="bc-${b}" x="${x}" y="${110 - h}" width="${w}" height="${h}"/>`);
      x += w + 2 + Math.floor(rnd() * 4);
    }
    const seq = Array.from({ length: 22 }, () => Math.floor(rnd() * 4))
      .map((b, i) => `<tspan class="bc-${b}" x="${16 + i * 12.2}">${BASES[b]}</tspan>`)
      .join("");
    return `<svg class="barcode" viewBox="0 0 300 150" aria-hidden="true">${bars.join("")}<line x1="16" x2="284" y1="118" y2="118"/><text y="138">${seq}</text></svg>`;
  }

  const projectFigure = (p) =>
    p.image ? `<img src="${esc(p.image)}" alt="${esc(p.title)} preview" loading="lazy" />` : barcode(p.title);

  /* ---------- Projects index ---------- */
  const list = $("#projectList");
  $("#projectCount").textContent = pad(PROJECTS.length);

  list.innerHTML = PROJECTS.map(
    (p, i) => `
    <li class="row reveal" data-category="${esc(p.category)}" style="--delay:${(i * 0.05).toFixed(2)}s">
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

  /* ---------- Skills — genome map ---------- */
  $("#skillCount").textContent = pad(skillNames.length);
  $("#genome").innerHTML = SKILLS.map(
    (g, i) => `
    <li class="chromo reveal" style="--delay:${(i * 0.05).toFixed(2)}s">
      <div class="chromo-label"><span class="chromo-no">CHR ${pad(i + 1)}</span><h3>${esc(g.group)}</h3></div>
      <ul class="genes">${g.items.map((s, j) => `<li class="gene bc-${(i + j) % 4}">${esc(s)}</li>`).join("")}</ul>
    </li>`
  ).join("");

  /* ---------- Experience + education timelines ---------- */
  $("#expList").innerHTML = EXPERIENCE.map(
    (x) => `
    <li class="event">
      <span class="node" aria-hidden="true"></span>
      <span class="event-date">${esc(x.period)}</span>
      <div class="event-body">
        <h3 class="event-title">${esc(x.role)}</h3>
        <span class="event-org">${esc(x.company)}${x.place ? ` <i>· ${esc(x.place)}</i>` : ""}</span>
        <ul class="event-points">${x.points.map((p) => `<li>${esc(p)}</li>`).join("")}</ul>
      </div>
    </li>`
  ).join("");

  $("#eduList").innerHTML = EDUCATION.map(
    (x) => `
    <li class="event">
      <span class="node" aria-hidden="true"></span>
      <span class="event-date">${esc(x.period)}</span>
      <div class="event-body">
        <h3 class="event-title">${esc(x.title)}</h3>
        <span class="event-org">${esc(x.school)}${x.place ? ` <i>· ${esc(x.place)}</i>` : ""}</span>
        ${x.note ? `<p class="event-note">${esc(x.note)}</p>` : ""}
      </div>
    </li>`
  ).join("");

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

  /* ---------- Theme: light / dark ---------- */
  const root = document.documentElement;
  const themeBtn = $("#themeToggle");
  const themeMeta = $('meta[name="theme-color"]');
  const syncTheme = () => {
    const dark = root.dataset.theme === "dark";
    themeBtn.setAttribute("aria-checked", dark);
    themeBtn.setAttribute("aria-label", dark ? "Switch to light theme" : "Switch to dark theme");
    themeMeta.setAttribute("content", dark ? "#0B0E13" : "#EEEBE3");
    helix.refresh();
  };
  syncTheme();
  themeBtn.addEventListener("click", () => {
    root.dataset.theme = root.dataset.theme === "dark" ? "light" : "dark";
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
