// Resolves the cascade (Default -> Website) for this page and applies the
// effective font + optional size/line-height/letter-spacing/word-spacing. Runs
// at document_start in every frame; only the top frame zooms (to avoid
// compounding the page zoom inside iframes). All fonts load from files bundled
// in the extension, never the network.
(function () {
  const root = document.documentElement;
  const host = location.hostname;
  const isTop = window.top === window;
  let active = false;

  function setFaceCss(css) {
    const id = "odx-fontface";
    let el = document.getElementById(id);
    if (!css) {
      if (el) el.remove();
      return;
    }
    if (!el) {
      el = document.createElement("style");
      el.id = id;
      (document.head || root).appendChild(el);
    }
    if (el.textContent !== css) el.textContent = css;
  }

  function toggleVar(cls, name, value) {
    if (value != null) {
      root.style.setProperty(name, value);
      root.classList.add(cls);
    } else {
      root.classList.remove(cls);
      root.style.removeProperty(name);
    }
  }

  async function applyVars(eff) {
    const fonts = await odxLoadFonts();
    const { familyCss, font } = odxResolveFont(eff.font, eff.customFont, fonts);
    setFaceCss(font ? odxFaceCss(font, (p) => odxApi.runtime.getURL(p)) : "");
    root.style.setProperty("--odx-font", familyCss);

    // null = no change. Any stored value applies, including negative spacing.
    toggleVar("odx-size", "--odx-size", isTop && eff.sizePct != null ? String(eff.sizePct / 100) : null);
    toggleVar("odx-lh", "--odx-lh", eff.lineHeight != null ? String(eff.lineHeight) : null);
    toggleVar("odx-ls", "--odx-ls", eff.letterSpacing != null ? eff.letterSpacing + "em" : null);
    toggleVar("odx-ws", "--odx-ws", eff.wordSpacing != null ? eff.wordSpacing + "em" : null);
  }

  function clearAll() {
    root.classList.remove("odx-size", "odx-lh", "odx-ls", "odx-ws");
    setFaceCss("");
  }

  async function refresh() {
    const config = await odxLoadConfig();
    const { eff } = odxEffective(config, host);
    active = !!eff.enabled;
    root.classList.toggle("odx-active", active);
    if (active) await applyVars(eff);
    else clearAll();
  }

  refresh();

  odxApi.storage.onChanged.addListener((_changes, area) => {
    if (area === "local") refresh();
  });

  // No page messaging: the popup reads the host directly from the active tab.
  // Safari delivers tabs.sendMessage to content scripts unreliably, which made
  // the popup falsely report "no access" even while the font was applying.
})();
