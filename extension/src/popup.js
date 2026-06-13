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
    odxEditor.buildRows(ui.rows, { view, fonts, onChange: writeSetting, headFn: headFor });

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
