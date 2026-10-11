(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const esc = (str = "") =>
    String(str).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const pad = (n, len = 2) => String(n).padStart(len, "0");

  // "Reduce motion" (an OS setting) calms large movement — the helix turns slower
  // and looping / bouncing effects stop in CSS — but fades, colour and the small
  // interaction effects stay, so the site never looks frozen.
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Brand colours this dark would vanish on the dark theme; those use the text colour instead
  const isDark = (hex) => {
    const n = parseInt(hex.slice(1), 16);
    return 0.2126 * (n >> 16) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255) < 60;
  };


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
  if (!SITE.available) $$(".status-dot").forEach((d) => d.classList.add("off"));

  $("[data-about]").innerHTML = esc(SITE.about).replace(/\*(.+?)\*/g, "<mark>$1</mark>");
  $("#specList").innerHTML = SITE.specs
    .map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`)
    .join("");
  $("#socials").innerHTML = Object.entries(SITE.socials)
    .filter(([, url]) => url)
    .map(([label, url]) => `<li><a href="${esc(url)}" target="_blank" rel="noopener">${esc(label)} ↗</a></li>`)
    .join("");

  $("#footerLinks").innerHTML = [
    ["Email", `mailto:${SITE.email}`],
    ...Object.entries(SITE.socials),
    ["CV (PDF)", SITE.resume],
  ]
    .filter(([, url]) => url)
    .map(([label, url]) => {
      const external = /^https?:/.test(url);
      return `<li><a href="${esc(url)}"${external ? ' target="_blank" rel="noopener"' : ""}>${esc(label)}${external ? " ↗" : ""}</a></li>`;
    })
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
  const footClock = $("#footClock");
  const tickClock = () => {
    const now = clockFmt.format(new Date());
    clock.textContent = now;
    footClock.textContent = now.slice(0, 5);
  };
  tickClock();
  setInterval(tickClock, 1000);

  /* ==========================================================
     DNA helix (hero)
     Two strands spiral down the figure and open into a "bubble"
     around the portrait. Segments with z < 0 are drawn on the
     back canvas (behind the photo), z >= 0 on the front canvas.
     Skill names appear on base pairs as they turn to face you.
     ========================================================== */
  const allSkills = SKILLS.flatMap((g, stage) => g.items.map((s) => ({ ...s, stage, used: s.used || [] })));
  // Core skills first: they're the first labels to appear on the hero helix
  const helixSkills = [...allSkills.filter((s) => s.core), ...allSkills.filter((s) => !s.core)];
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

    const paths = {};
    function drawIcon(key, x, y, size) {
      const ic = typeof ICONS !== "undefined" && ICONS[key];
      if (!ic) return;
      const path = (paths[key] ||= new Path2D(ic.d));
      const color = ic.line ? colors.b : ic.hex && !isDark(ic.hex) ? ic.hex : colors.ink;
      cf.save();
      cf.translate(x, y - size / 2);
      cf.scale(size / 24, size / 24);
      if (ic.line) {
        cf.strokeStyle = color;
        cf.lineWidth = 2;
        cf.lineCap = cf.lineJoin = "round";
        cf.stroke(path);
      } else {
        cf.fillStyle = color;
        cf.fill(path);
      }
      cf.restore();
    }

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

        // Skill (logo + name) on every other rung, carried by strand A: as the helix turns
        // the label swings out on the right, then on the left, in step with the rotation.
        if (i % 2 === 0) {
          const show = Math.max(0, (Math.abs(a.c) - 0.82) / 0.18);
          if (show > 0) {
            const skill = helixSkills[(i / 2) % helixSkills.length];
            const dir = a.x >= cx ? 1 : -1; // which side of the helix the label sits on
            const ICON = 14;
            cf.globalAlpha = show * fade;
            cf.strokeStyle = colors.ink2;
            cf.lineWidth = 1;
            cf.beginPath();
            cf.moveTo(a.x + 6 * dir, a.y);
            cf.lineTo(a.x + 18 * dir, a.y);
            cf.stroke();
            const iconX = dir > 0 ? a.x + 22 : a.x - 22 - ICON;
            drawIcon(skill.icon, iconX, a.y, ICON);
            cf.fillStyle = colors.ink;
            cf.textAlign = dir > 0 ? "left" : "right";
            cf.fillText(skill.name, dir > 0 ? iconX + ICON + 5 : iconX - 5, a.y);
            cf.textAlign = "left";
          }
        }
      }
      cb.globalAlpha = cf.globalAlpha = 1;
    }

    let phase = 0;
    let last = 0;
    let start = 0;
    let running = false;
    const SPEED = reduceMotion ? 0.14 : 0.32; // radians per second
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
      if (running) return;
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

    {
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
      bars.push(`<rect class="bc-${b}" style="--k:${bars.length}" x="${x}" y="${110 - h}" width="${w}" height="${h}"/>`);
      x += w + 2 + Math.floor(rnd() * 4);
    }
    const seq = Array.from({ length: 22 }, () => Math.floor(rnd() * 4))
      .map((b, i) => `<tspan class="bc-${b}" style="--k:${i}" x="${16 + i * 12.2}">${BASES[b]}</tspan>`)
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

  /* ---------- Skills — toolchain ----------
     Stages laid out along a rail. Selecting a skill shows where it was
     used (experiences / projects referenced by id) and what it was
     used alongside, and lights up those related skills. */
  $("#skillCount").textContent = pad(allSkills.length);
  $("#stageCount").textContent = pad(SKILLS.length);

  const sources = Object.fromEntries([
    ...EXPERIENCE.map((x) => [x.id, { kind: "Internship", title: x.role, org: x.company, when: x.period, href: "#experience" }]),
    ...PROJECTS.map((p) => [p.id, { kind: "Project", title: p.title, org: p.category, when: p.year, href: "#work" }]),
  ]);
  /* Skill icons (icons.js). Brand colours show on hover / selection; marks whose
     brand colour is near-black fall back to the text colour so they stay visible. */
  const icon = (key, cls = "ico") => {
    const ic = typeof ICONS !== "undefined" && ICONS[key];
    if (!ic) return "";
    const brand = ic.hex && !isDark(ic.hex) ? ` style="--brand:${ic.hex}"` : "";
    return `<svg class="${cls}${ic.line ? " line" : ""}" viewBox="0 0 24 24" aria-hidden="true"${brand}><path d="${ic.d}"/></svg>`;
  };
  const stageLabel = (i) => `${pad(i + 1)} · ${SKILLS[i].stage}`;
  const chipHTML = (s, i, extra = "") =>
    `<button class="chip${s.core ? " core" : ""}${extra}" data-skill="${i}" aria-pressed="false">${icon(s.icon)}${esc(s.name)}${
      s.used.length ? `<span class="chip-dot" title="Used in an internship or project"></span>` : ""
    }</button>`;

  const pipeline = $("#pipeline");
  const stagesEl = $("#stages");
  const trace = $("#trace");
  let d = 0;
  stagesEl.innerHTML = SKILLS.map(
    (g, gi) => `
    <li class="stage" style="--i:${gi}">
      <span class="stage-node" aria-hidden="true"></span>
      <div class="stage-card" data-no="${pad(gi + 1)}">
        <div class="stage-head">
          <div class="stage-top">
            <span class="stage-no">${esc(stageLabel(gi))}</span>
            <span class="stage-count">${pad(g.items.length)} tools</span>
          </div>
          <h3>${esc(g.group)}</h3>
          <p>${esc(g.blurb || "")}</p>
        </div>
        <ul class="chips">${allSkills
          .map((s, i) => (s.stage === gi ? `<li style="--d:${(0.35 + d++ * 0.025).toFixed(3)}s">${chipHTML(s, i)}</li>` : ""))
          .join("")}</ul>
      </div>
    </li>`
  ).join("");

  const related = (s) =>
    allSkills
      .map((o, i) => [o, i])
      .filter(([o]) => o !== s && o.used.some((id) => s.used.includes(id)));

  /* Selecting a skill sends a packet along the rail from its stage to every
     stage it was used with; each node pings when the packet arrives. */
  const nodes = $$(".stage-node", stagesEl);
  const ping = (n) => {
    n.classList.remove("ping");
    void n.offsetWidth; // restart the animation
    n.classList.add("ping");
  };
  let routes = [];
  let routeTimer;
  function route(from, targets) {
    if (!pipeline.classList.contains("in")) return;
    routes.forEach((a) => a.cancel());
    routes = [];
    const box = pipeline.getBoundingClientRect();
    const center = (n) => {
      const r = n.getBoundingClientRect();
      return [r.left + r.width / 2 - box.left, r.top + r.height / 2 - box.top];
    };
    const [x0, y0] = center(nodes[from]);
    ping(nodes[from]);
    targets.forEach((t) => {
      const [x1, y1] = center(nodes[t]);
      const packet = document.createElement("span");
      packet.className = "packet";
      pipeline.append(packet);
      const a = packet.animate(
        [{ transform: `translate(${x0}px, ${y0}px)` }, { transform: `translate(${x1}px, ${y1}px)` }],
        { duration: 350 + Math.hypot(x1 - x0, y1 - y0) * 0.9, easing: "cubic-bezier(0.5, 0, 0.3, 1)" }
      );
      a.onfinish = () => (packet.remove(), ping(nodes[t]));
      a.oncancel = () => packet.remove();
      routes.push(a);
    });
  }

  const narrow = matchMedia("(max-width: 1100px)");
  let current = -1;
  const placeTrace = () => {
    // On narrow screens the trace sits right under the selected skill's stage
    if (narrow.matches && current >= 0) $$(".stage", stagesEl)[allSkills[current].stage].append(trace);
    else pipeline.after(trace);
  };

  function select(i) {
    if (i === current) return;
    current = i;
    const s = allSkills[i];
    const rel = related(s);
    const relSet = new Set(rel.map(([, j]) => j));

    $$(".chip", stagesEl).forEach((c) => {
      const j = +c.dataset.skill;
      c.classList.toggle("active", j === i);
      c.classList.toggle("linked", relSet.has(j));
      c.setAttribute("aria-pressed", j === i);
    });
    const litStages = new Set([s.stage, ...rel.map(([o]) => o.stage)]);
    $$(".stage", stagesEl).forEach((el, gi) => el.classList.toggle("lit", litStages.has(gi)));
    pipeline.classList.add("focused");

    const used = s.used.map((id) => sources[id]).filter(Boolean);
    trace.innerHTML = `
      <div class="trace-h"><span>Skill trace</span><span>${esc(stageLabel(s.stage))}</span></div>
      <div class="trace-body bc-${s.stage % 2}">
        <div class="trace-skill">
          <h3>${icon(s.icon, "ico ico-lg")}${esc(s.name)}</h3>
          <p>${esc(SKILLS[s.stage].group)}${s.core ? ` <em>Core focus</em>` : ""}</p>
        </div>
        <div class="trace-used">
          <span class="trace-label">Used in</span>
          ${
            used.length
              ? `<ul>${used
                  .map((u) => `<li><a href="${u.href}"><i>${esc(u.kind)}</i><b>${esc(u.title)}</b><span>${esc(u.org)} · ${esc(u.when)}</span></a></li>`)
                  .join("")}</ul>`
              : `<p class="trace-empty">Learned through my studies — no dedicated internship or project on it yet.</p>`
          }
        </div>
        ${
          rel.length
            ? `<div class="trace-pairs"><span class="trace-label">Used alongside</span><div>${rel
                .map(([o, j]) => chipHTML(o, j, " small"))
                .join("")}</div></div>`
            : ""
        }
      </div>`;
    placeTrace();
    // Wait for the pointer to settle so scanning across chips doesn't spray packets
    clearTimeout(routeTimer);
    routeTimer = setTimeout(() => route(s.stage, [...litStages].filter((g) => g !== s.stage)), 140);
    $(".trace-body", trace).animate(
        [{ opacity: 0, transform: "translateY(6px)" }, { opacity: 1, transform: "none" }],
        { duration: 320, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)" }
      );
  }

  const pick = (e) => {
    const chip = e.target.closest(".chip");
    if (chip) select(+chip.dataset.skill);
  };
  stagesEl.addEventListener("click", pick);
  stagesEl.addEventListener("focusin", pick);
  trace.addEventListener("click", (e) => {
    const chip = e.target.closest(".chip");
    if (!chip) return;
    select(+chip.dataset.skill);
    // The trace was re-rendered, so keep keyboard focus on the matching skill in the stages
    $(`.chip[data-skill="${current}"]`, stagesEl).focus();
  });
  if (matchMedia("(hover: hover)").matches) stagesEl.addEventListener("mouseover", pick);
  narrow.addEventListener("change", placeTrace);

  // Start on the first core skill of the "Run" stage (falls back to the first skill)
  const start = allSkills.findIndex((s) => s.core && SKILLS[s.stage].stage === "Run");
  select(start >= 0 ? start : 0);

  /* Languages (CEFR scale), methods and soft skills */
  const CEFR = ["A1", "A2", "B1", "B2", "C1", "C2"];
  const X = SKILL_EXTRAS;
  $("#skillExtras").innerHTML = `
    <div class="extra">
      <h3 class="extra-h">Languages</h3>
      <ul class="langs">${X.languages
        .map((l) => {
          const n = l.level === "Native" ? CEFR.length : CEFR.indexOf(l.level) + 1;
          return `<li><span class="lang-name">${esc(l.name)}</span>
            <span class="cefr" role="img" aria-label="${esc(l.level)}">${CEFR.map((c, k) => `<i class="${k < n ? "on" : ""}">${c}</i>`).join("")}</span>
            <span class="lang-level">${esc(l.level)}</span></li>`;
        })
        .join("")}</ul>
    </div>
    <div class="extra">
      <h3 class="extra-h">Ways of working</h3>
      <div class="tags">${X.methods.map((m) => `<span class="tag">${esc(m)}</span>`).join("")}</div>
    </div>
    <div class="extra">
      <h3 class="extra-h">Soft skills</h3>
      <div class="tags">${X.soft.map((m) => `<span class="tag">${esc(m)}</span>`).join("")}</div>
    </div>`;

  /* ---------- Experience + education timelines ---------- */
  const PIN = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>`;
  const GLOBE = `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.7 3.8 5.7 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-5.7-3.8-9S9.5 5.7 12 3z"/></svg>`;
  const fmtCoord = (lat, lon) =>
    `${Math.abs(lat).toFixed(4)}°${lat < 0 ? "S" : "N"} ${Math.abs(lon).toFixed(4)}°${lon < 0 ? "W" : "E"}`;
  const locHTML = (m) => {
    if (!m) return "";
    if (m.remote)
      return `<div class="loc loc-remote">${GLOBE}<b>Remote</b><span>Worked online with a distributed team</span></div>`;
    const link = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(m.query || `${m.lat},${m.lon}`)}`;
    return `<figure class="loc">
        ${m.tag ? `<span class="loc-tag">${esc(m.tag)}</span>` : ""}
        <div class="loc-map" data-lat="${m.lat}" data-lon="${m.lon}" data-zoom="${m.zoom || 13}" role="img" aria-label="Map of ${esc(m.label)}"></div>
        <span class="loc-coord" aria-hidden="true">${fmtCoord(m.lat, m.lon)}</span>
        <figcaption><span>${PIN}${esc(m.label)}</span><a href="${link}" target="_blank" rel="noopener">Open in Maps ↗</a></figcaption>
      </figure>`;
  };

  // Company logo on a light plate so every brand keeps its own colours in both themes
  const logoHTML = (x) => {
    const l = x.logo;
    if (!l) return "";
    const name = (x.company || x.school).split(" — ")[0];
    const inner = l.src
      ? `<img src="${esc(l.src)}" alt="${esc(name)} logo" loading="lazy" decoding="async" />`
      : `<b aria-label="${esc(name)}">${esc(l.mono)}</b>`;
    return l.url
      ? `<a class="event-logo" href="${esc(l.url)}" target="_blank" rel="noopener" title="${esc(name)} website">${inner}</a>`
      : `<span class="event-logo${l.src ? "" : " mono"}">${inner}</span>`;
  };

  $("#expList").innerHTML = EXPERIENCE.map(
    (x) => `
    <li class="event">
      <span class="node" aria-hidden="true"></span>
      <span class="event-date">${esc(x.period)}</span>
      <div class="event-body">
        <div class="event-head">
          ${logoHTML(x)}
          <div>
            <h3 class="event-title">${esc(x.role)}</h3>
            <span class="event-org">${esc(x.company)}${x.place ? ` <i>· ${esc(x.place)}</i>` : ""}</span>
          </div>
        </div>
        <ul class="event-points">${x.points.map((p) => `<li>${esc(p)}</li>`).join("")}</ul>
      </div>
      ${locHTML(x.map)}
    </li>`
  ).join("");

  $("#eduList").innerHTML = EDUCATION.map(
    (x) => `
    <li class="event">
      <span class="node" aria-hidden="true"></span>
      <span class="event-date">${esc(x.period)}</span>
      <div class="event-body">
        <div class="event-head">
          ${logoHTML(x)}
          <div>
            <h3 class="event-title">${esc(x.title)}</h3>
            <span class="event-org">${esc(x.school)}${x.place ? ` <i>· ${esc(x.place)}</i>` : ""}</span>
          </div>
        </div>
        ${x.note ? `<p class="event-note">${esc(x.note)}</p>` : ""}
      </div>
      ${locHTML(x.map)}
    </li>`
  ).join("");

  /* ---------- Sequenced headings ----------
     Titles resolve letter by letter out of random bases (A/T/G/C), like a
     read coming off a sequencer. Each letter is locked to its final width
     so nothing shifts, and the plain text is restored once it settles. */
  const BASE_SET = "ATGC";
  function sequence(el) {
    const text = el.textContent;
    if (!text.trim()) return;
    el.innerHTML = `<span class="sr-only">${esc(text)}</span><span class="seq" aria-hidden="true">${[...text]
      .map((c) => (c === " " ? " " : `<span class="sq">${esc(c)}</span>`))
      .join("")}</span>`;
    const seq = el.lastElementChild;
    const cells = $$(".sq", seq);
    const finals = cells.map((c) => c.textContent);
    cells.forEach((c) => (c.style.width = `${c.getBoundingClientRect().width}px`));

    let t0 = 0;
    let lastRoll = -Infinity;
    const step = (t) => {
      t0 ||= t;
      const roll = t - lastRoll > 70;
      if (roll) lastRoll = t;
      let done = true;
      cells.forEach((c, i) => {
        if (t - t0 >= 180 + i * 65) {
          if (c.dataset.b) (c.textContent = finals[i]), delete c.dataset.b;
        } else {
          done = false;
          if (roll) c.textContent = c.dataset.b = BASE_SET[(Math.random() * 4) | 0];
        }
      });
      if (done) seq.textContent = text;
      else requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  {
    const seqIO = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          seqIO.unobserve(e.target);
          (document.fonts?.ready || Promise.resolve()).then(() => sequence(e.target));
        }),
      { rootMargin: "0px 0px -15% 0px" }
    );
    $$(".sheet-title, .hero-figure figcaption b").forEach((el) => seqIO.observe(el));
  }

  /* ---------- Location mini maps (Leaflet + OpenStreetMap France tiles) ----------
     Created only when scrolled near, so the page doesn't load tiles it never shows.
     If Leaflet can't load, the caption with "Open in Maps" still works.
     The dark look comes from a CSS filter on the tiles, so theme changes need no reload.
     Each map is built zoomed out (country level) and dives into the place once it is
     actually on screen. On a mouse/trackpad the card comes alive: hovering the entry
     leans in one zoom step, the map can be dragged or zoomed with +/−, and leaving
     the entry flies it back home. Touch screens keep a still map so scrolling never
     gets caught by it. */
  (() => {
    if (typeof L === "undefined") {
      $$(".loc-map").forEach((el) => el.classList.add("no-map"));
      return;
    }
    const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
    const maps = new Map();

    const build = (el) => {
      const lat = +el.dataset.lat, lon = +el.dataset.lon, zoom = +el.dataset.zoom;
      const home = [lat, lon];
      const map = L.map(el, {
        zoomControl: false, dragging: fine, scrollWheelZoom: false, doubleClickZoom: fine,
        boxZoom: false, keyboard: false, touchZoom: false, zoomSnap: 0.25,
      }).setView(home, Math.max(zoom - 7, 4));
      map.attributionControl.setPrefix(false);
      // OSM France tiles: place names in French where available (default OSM shows local scripts)
      L.tileLayer("https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png", {
        subdomains: "abc",
        maxZoom: 19,
        attribution:
          '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OSM</a> · <a href="https://www.openstreetmap.fr/" target="_blank" rel="noopener">OSM France</a>',
      }).addTo(map);
      L.control.scale({ position: "bottomleft", metric: true, imperial: false, maxWidth: 64 }).addTo(map);
      if (fine) L.control.zoom({ position: "topright", zoomInTitle: "Zoom in", zoomOutTitle: "Zoom out" }).addTo(map);
      // dashed ring = "the neighbourhood", sized to the default zoom (~1 km at z13)
      L.circle(home, { radius: 250 * 2 ** (15 - zoom), className: "loc-area", interactive: false }).addTo(map);
      L.marker(home, {
        icon: L.divIcon({ className: "loc-pin", html: "<i></i>", iconSize: [18, 18] }),
        interactive: false, keyboard: false,
      }).addTo(map);

      // live coordinate readout follows the map centre
      const coord = el.parentElement.querySelector(".loc-coord");
      map.on("move", () => {
        const c = map.getCenter();
        coord.textContent = fmtCoord(c.lat, c.lng);
      });

      const st = { map, home, zoom, ready: false };
      st.goHome = (dz = 0, duration = 0.9) => map.flyTo(home, zoom + dz, { duration, easeLinearity: 0.3 });
      maps.set(el, st);

      const event = el.closest(".event");
      if (fine && event) {
        event.addEventListener("mouseenter", () => st.ready && st.goHome(1, 0.8));
        event.addEventListener("mouseleave", () => st.ready && st.goHome(0, 0.8));
      }
    };

    // build a little ahead of time so tiles are ready…
    const buildIO = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          buildIO.unobserve(e.target);
          build(e.target);
        }),
      { rootMargin: "400px 0px" }
    );
    // …but only dive in once the card is really in view
    const flyIO = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          flyIO.unobserve(e.target);
          if (!maps.has(e.target)) buildIO.unobserve(e.target), build(e.target);
          const st = maps.get(e.target);
          st.map.once("moveend", () => {
            st.ready = true;
            e.target.closest(".loc").classList.add("landed");
          });
          st.goHome(0, reduceMotion ? 1.2 : 2.4);
        }),
      { threshold: 0.6 }
    );
    $$(".loc-map").forEach((el) => (buildIO.observe(el), flyIO.observe(el)));
  })();

  /* ---------- Map: the route packet only travels for visitors who allow motion ---------- */
  if (reduceMotion) $$(".map-packet").forEach((el) => el.remove());

  /* ---------- Timeline: nodes light up once you've read past them ---------- */
  const passIO = new IntersectionObserver(
    (entries) =>
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add("passed");
        passIO.unobserve(e.target);
      }),
    { rootMargin: "0px 0px -45% 0px" }
  );
  $$(".event").forEach((el) => passIO.observe(el));

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
    themeMeta.setAttribute("content", dark ? "#0B1220" : "#F5F7FB");
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

  /* ---------- For whoever opens the console ---------- */
  const mono = "font-family: ui-monospace, Consolas, monospace; font-size: 12px; line-height: 1.6;";
  console.log(
    `%c$ kubectl describe candidate ${SITE.name.toLowerCase().replace(/\s+/g, "-")}%c\n` +
      `Name:      ${SITE.name}\n` +
      `Role:      ${SITE.role}\n` +
      `Status:    ${SITE.available ? SITE.status : "Currently booked"}\n` +
      `Stack:     ${allSkills.filter((s) => s.core).map((s) => s.name).join(", ")}\n` +
      `Contact:   ${SITE.email}\n\n` +
      `You opened the console, so we'd probably get along. Say hi.`,
    `${mono} color: #38bdf8; font-weight: 700;`,
    `${mono} color: inherit;`
  );
})();
