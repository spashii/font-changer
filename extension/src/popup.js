// Popup. Shows the current site, whether it uses your defaults or its own
// customizations, and lets you edit each setting in either context (This site /
// Defaults) with live apply, source badges, per-row Reset, and Undo. Sliders are
// centred on "no change": drag left to reduce, right to increase, or type an
// exact value. The host comes straight from the active tab URL.
(function () {
  const $ = (id) => document.getElementById(id);
  const ui = {
    host: $("odx-host"), status: $("odx-status"), enabled: $("odx-enabled"), enabledLabel: $("odx-enabled-label"),
    ctxSite: $("odx-ctx-site"), ctxDef: $("odx-ctx-def"), rows: $("odx-rows"), summary: $("odx-summary"),
    undo: $("odx-undo"), resetSite: $("odx-reset-site"), help: $("odx-help"), viewAll: $("odx-viewall"),
  };

  // Each slider is centred on `center`, which means "no change" (stored as null).
  // Range is symmetric around the centre so the default sits at the midpoint.
  const RANGE = {
    sizePct: { min: 50, max: 150, step: 5, numStep: 1, unit: "%", round: 0, center: 100 },
    lineHeight: { min: 1.0, max: 2.0, step: 0.1, numStep: 0.1, unit: "", round: 2, center: 1.5 },
    letterSpacing: { min: -0.1, max: 0.1, step: 0.01, numStep: 0.01, unit: "em", round: 2, center: 0 },
    wordSpacing: { min: -0.2, max: 0.2, step: 0.05, numStep: 0.05, unit: "em", round: 2, center: 0 },
  };
  const RANGE_ROWS = [["sizePct", "Text size"], ["lineHeight", "Line height"], ["letterSpacing", "Letter spacing"], ["wordSpacing", "Word spacing"]];

  const fromStore = (cfg, v) => (v == null ? cfg.center : v);
  const toStore = (cfg, v) => (Math.abs(v - cfg.center) < cfg.step / 2 ? null : +v.toFixed(cfg.round));
  const showNum = (cfg, v) => (cfg.round ? +v.toFixed(cfg.round) : Math.round(v));

  let currentHost = "", ctx = "site", config = null, fonts = [], snapshot = null;
  const clone = (o) => JSON.parse(JSON.stringify(o));

  async function activeHost() {
    for (const q of [{ active: true, currentWindow: true }, { active: true, lastFocusedWindow: true }, { active: true }]) {
      try {
        const t = ((await odxApi.tabs.query(q)) || []).find((t) => t && t.url && /^https?:/i.test(t.url));
        if (t) return odxHostFromUrl(t.url);
      } catch (_e) {}
    }
    return "";
  }

  function isOverridden(key) {
    const site = config.siteRules[currentHost];
    return !!(site && Object.prototype.hasOwnProperty.call(site, key));
  }
  async function snap() {
    snapshot = clone(config);
    ui.undo.hidden = false;
  }
  async function commitReload() {
    config = await odxLoadConfig();
    render();
  }
  async function writeSetting(key, value) {
    await snap();
    if (ctx === "defaults") await odxSetDefault(key, value);
    else await odxSetSite(currentHost, key, value);
    await commitReload();
  }

  function resetBtn(key) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "odx-reset";
    b.textContent = "Reset";
    b.addEventListener("click", async () => {
      await snap();
      await odxResetSite(currentHost, key);
      await commitReload();
    });
    return b;
  }
  function badge(key) {
    const overridden = isOverridden(key);
    const el = document.createElement("span");
    el.className = "odx-badge " + (overridden ? "is-site" : "is-def");
    el.textContent = overridden ? "This site" : "Default";
    return { el, overridden };
  }
  function headFor(label, key) {
    const head = document.createElement("div");
    head.className = "odx-prow-head";
    const lab = document.createElement("span");
    lab.className = "odx-prow-label";
    lab.textContent = label;
    head.appendChild(lab);
    if (ctx === "site") {
      const { el, overridden } = badge(key);
      head.appendChild(el);
      if (overridden) head.appendChild(resetBtn(key));
    }
    return head;
  }

  function fontRow(view) {
    const row = document.createElement("div");
    row.className = "odx-prow";
    row.appendChild(headFor("Font", "font"));
    const sel = document.createElement("select");
    sel.setAttribute("aria-label", "Font");
    for (const f of fonts) sel.add(new Option(f.label, f.key));
    sel.add(new Option("System default", "system"));
    sel.add(new Option("Font on this device…", "custom"));
    sel.value = view.font;
    sel.addEventListener("change", () => writeSetting("font", sel.value));
    row.appendChild(sel);
    if (view.font === "custom") {
      const inp = document.createElement("input");
      inp.type = "text";
      inp.placeholder = "e.g. Georgia, Verdana, a font you have";
      inp.value = view.customFont || "";
      inp.setAttribute("aria-label", "Font on this device");
      inp.addEventListener("change", () => writeSetting("customFont", inp.value.trim()));
      row.appendChild(inp);
    }
    return row;
  }

  function rangeRow(key, label, storedVal) {
    const cfg = RANGE[key];
    const cur = fromStore(cfg, storedVal);
    const row = document.createElement("div");
    row.className = "odx-prow";
    const head = headFor(label, key);

    const wrap = document.createElement("span");
    wrap.className = "odx-numwrap";
    const num = document.createElement("input");
    num.type = "number";
    num.className = "odx-num";
    num.min = cfg.min;
    num.max = cfg.max;
    num.step = cfg.numStep;
    num.value = showNum(cfg, cur);
    num.setAttribute("aria-label", label + " value");
    wrap.appendChild(num);
    if (cfg.unit) {
      const u = document.createElement("span");
      u.className = "odx-unit";
      u.textContent = cfg.unit;
      wrap.appendChild(u);
    }
    head.appendChild(wrap);
    row.appendChild(head);

    const r = document.createElement("input");
    r.type = "range";
    r.min = cfg.min;
    r.max = cfg.max;
    r.step = cfg.step;
    r.value = cur;
    r.setAttribute("aria-label", label);
    row.appendChild(r);

    const clamp = (v) => Math.min(cfg.max, Math.max(cfg.min, isNaN(v) ? cfg.center : v));
    r.addEventListener("input", () => {
      num.value = showNum(cfg, Number(r.value));
    });
    r.addEventListener("change", () => writeSetting(key, toStore(cfg, clamp(Number(r.value)))));
    num.addEventListener("change", () => {
      const v = clamp(Number(num.value));
      r.value = v;
      writeSetting(key, toStore(cfg, v));
    });
    return row;
  }

  function render() {
    const { eff, customized } = odxEffective(config, currentHost);
    ui.host.textContent = currentHost || "this page";

    if (ctx === "site") {
      ui.enabledLabel.textContent = "On this site";
      ui.enabled.checked = !!eff.enabled;
      ui.enabled.disabled = !currentHost;
      ui.status.textContent = !currentHost ? "This page can't be changed" : customized ? "Customized for this site" : "Using your defaults";
      ui.status.className = "odx-status " + (currentHost && customized ? "is-site" : "is-def");
    } else {
      ui.enabledLabel.textContent = "Enabled by default";
      ui.enabled.checked = !!config.defaults.enabled;
      ui.enabled.disabled = false;
      ui.status.textContent = "Defaults apply everywhere unless a site is customized";
      ui.status.className = "odx-status is-def";
    }
    ui.ctxSite.classList.toggle("on", ctx === "site");
    ui.ctxSite.setAttribute("aria-selected", String(ctx === "site"));
    ui.ctxDef.classList.toggle("on", ctx === "defaults");
    ui.ctxDef.setAttribute("aria-selected", String(ctx === "defaults"));

    const view = ctx === "site" ? eff : config.defaults;
    ui.rows.innerHTML = "";
    ui.rows.appendChild(fontRow(view));
    for (const [key, label] of RANGE_ROWS) ui.rows.appendChild(rangeRow(key, label, view[key]));

    const n = odxModCount(eff);
    ui.summary.textContent = ctx === "site" && !currentHost ? "Open a normal web page to use this." : !eff.enabled ? "Off on this site." : n + (n === 1 ? " setting" : " settings") + " changing this page.";
    ui.resetSite.hidden = !(ctx === "site" && currentHost && customized);
  }

  ui.enabled.addEventListener("change", async () => {
    await snap();
    if (ctx === "defaults") await odxSetDefault("enabled", ui.enabled.checked);
    else await odxSetSite(currentHost, "enabled", ui.enabled.checked);
    await commitReload();
  });
  ui.ctxSite.addEventListener("click", () => { ctx = "site"; render(); });
  ui.ctxDef.addEventListener("click", () => { ctx = "defaults"; render(); });
  ui.undo.addEventListener("click", async () => {
    if (!snapshot) return;
    await odxWriteConfig(snapshot);
    snapshot = null;
    ui.undo.hidden = true;
    await commitReload();
  });
  ui.resetSite.addEventListener("click", async () => {
    await snap();
    await odxDeleteSite(currentHost);
    await commitReload();
  });
  ui.help.addEventListener("click", () => odxApi.tabs.create({ url: odxApi.runtime.getURL("src/onboarding.html") }));
  ui.viewAll.addEventListener("click", () => odxApi.tabs.create({ url: odxApi.runtime.getURL("src/manage.html") }));

  (async function init() {
    fonts = await odxLoadFonts();
    currentHost = await activeHost();
    config = await odxLoadConfig();
    render();
  })();
})();
