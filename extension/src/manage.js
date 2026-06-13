// "View all customizations" manager. Lists your defaults and every site that
// has overrides, with whole-site actions. Per-setting editing happens in the
// popup when you are on that site. Everything is local to this device.
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

  function defLine(label, val) {
    const li = document.createElement("li");
    const a = document.createElement("span");
    a.textContent = label;
    const b = document.createElement("span");
    b.textContent = val == null ? "No change" : val;
    if (val == null) b.style.color = "var(--muted)";
    li.appendChild(a);
    li.appendChild(b);
    return li;
  }

  function actBtn(label, fn, danger) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "act" + (danger ? " danger" : "");
    b.textContent = label;
    b.addEventListener("click", () => fn());
    return b;
  }

  async function render() {
    const config = await odxLoadConfig();
    const d = config.defaults;

    const dl = document.getElementById("def-list");
    dl.innerHTML = "";
    dl.appendChild(defLine("Status", d.enabled ? "On" : "Off"));
    dl.appendChild(defLine("Font", fontLabel(d.font, d.customFont)));
    dl.appendChild(defLine("Text size", sizeText(d.sizePct)));
    dl.appendChild(defLine("Line height", numText(d.lineHeight)));
    dl.appendChild(defLine("Letter spacing", emText(d.letterSpacing)));
    dl.appendChild(defLine("Word spacing", emText(d.wordSpacing)));

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

  odxApi.storage.onChanged.addListener((_c, area) => {
    if (area === "local") render();
  });

  (async function init() {
    fonts = await odxLoadFonts();
    render();
  })();
})();
