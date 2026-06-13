// "View all customizations" manager. Lets you edit your defaults inline (same
// controls as the popup, via editor.js) with a live preview, and lists every
// site that has overrides with whole-site actions. Everything is local to this
// device.
(function () {
  let fonts = [];

  const fontLabel = (key, custom) =>
    key === "system"
      ? "System default"
      : key === "custom"
      ? '"' + (custom || "") + '" (device font)'
      : (fonts.find((f) => f.key === key) || {}).label || key;

  const sizeText = (v) => (v == null ? null : v + "%");
  const numText = (v) => (v == null ? null : String(v));
  const emText = (v) => (v == null ? null : v + "em");

  function actBtn(label, fn, danger) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "act" + (danger ? " danger" : "");
    b.textContent = label;
    b.addEventListener("click", () => fn());
    return b;
  }

  // --- live preview: mirror how content.js styles a page, on the sample text ---
  const faceStyle = document.createElement("style");
  faceStyle.id = "odx-preview-face";
  document.head.appendChild(faceStyle);

  function applyPreview(d) {
    const { familyCss, font } = odxResolveFont(d.font, d.customFont, fonts);
    faceStyle.textContent = font ? odxFaceCss(font, (p) => odxApi.runtime.getURL(p)) : "";
    const el = document.getElementById("preview");
    el.style.fontFamily = familyCss + ", sans-serif";
    el.style.fontSize = (d.sizePct != null ? d.sizePct : 100) + "%";
    el.style.lineHeight = d.lineHeight != null ? String(d.lineHeight) : "";
    el.style.letterSpacing = d.letterSpacing != null ? d.letterSpacing + "em" : "";
    el.style.wordSpacing = d.wordSpacing != null ? d.wordSpacing + "em" : "";
  }

  function renderSites(config) {
    const d = config.defaults;
    const wrap = document.getElementById("sites");
    wrap.innerHTML = "";
    const hosts = Object.keys(config.siteRules).sort();
    if (!hosts.length) {
      const p = document.createElement("p");
      p.className = "empty";
      p.textContent = "No sites customized yet. Open a site and use the toolbar popup to customize it.";
      wrap.appendChild(p);
      return;
    }

    for (const host of hosts) {
      const rule = config.siteRules[host];
      const card = document.createElement("div");
      card.className = "site";

      const head = document.createElement("div");
      head.className = "site-head";
      const name = document.createElement("span");
      name.className = "site-name";
      name.textContent = host;
      head.appendChild(name);
      card.appendChild(head);

      const ul = document.createElement("ul");
      ul.className = "ov";
      const lines = [];
      if (rule.enabled === false) lines.push("Disabled here");
      else if (rule.enabled === true) lines.push("Forced on");
      if ("font" in rule) lines.push("Font: " + fontLabel(rule.font, rule.customFont));
      if ("sizePct" in rule) lines.push("Text size: " + (sizeText(rule.sizePct) || "no change"));
      if ("lineHeight" in rule) lines.push("Line height: " + (numText(rule.lineHeight) || "no change"));
      if ("letterSpacing" in rule) lines.push("Letter spacing: " + (emText(rule.letterSpacing) || "no change"));
      if ("wordSpacing" in rule) lines.push("Word spacing: " + (emText(rule.wordSpacing) || "no change"));
      if (!lines.length) lines.push("(no changes)");
      for (const t of lines) {
        const li = document.createElement("li");
        li.textContent = t;
        ul.appendChild(li);
      }
      card.appendChild(ul);

      const acts = document.createElement("div");
      acts.className = "acts";
      const disabled = rule.enabled === false;
      acts.appendChild(actBtn(disabled ? "Enable" : "Disable", () => odxSetSite(host, "enabled", disabled)));
      acts.appendChild(
        actBtn("Copy defaults here", async () => {
          for (const k of ["font", "customFont", "sizePct", "lineHeight", "letterSpacing", "wordSpacing"]) {
            const dv = d[k];
            if (dv != null && dv !== "") await odxSetSite(host, k, dv);
          }
        })
      );
      acts.appendChild(actBtn("Reset", () => odxDeleteSite(host), true));
      card.appendChild(acts);

      wrap.appendChild(card);
    }
  }

  async function render() {
    const config = await odxLoadConfig();
    const d = config.defaults;

    document.getElementById("def-enabled").checked = !!d.enabled;
    odxEditor.buildRows(document.getElementById("def-rows"), {
      view: d,
      fonts,
      onChange: (key, value) => odxSetDefault(key, value),
    });
    applyPreview(d);

    renderSites(config);
  }

  // The toggle element persists across renders, so wire it up once.
  document.getElementById("def-enabled").addEventListener("change", (e) => {
    odxSetDefault("enabled", e.target.checked);
  });

  // Every write (here or from the popup on another tab) re-renders, keeping the
  // preview and the site list in sync.
  odxApi.storage.onChanged.addListener((_c, area) => {
    if (area === "local") render();
  });

  (async function init() {
    fonts = await odxLoadFonts();
    render();
  })();
})();
