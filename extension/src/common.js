// Shared by the content script, popup, and onboarding. Plain script (no modules),
// so these become globals in each context.
// Safari exposes both `browser` and `chrome`; Chrome exposes only `chrome`.
const odxApi = globalThis.browser ?? globalThis.chrome;

// Cascade model: a setting resolves Default -> Website. A value present on the
// website rule overrides the default; an absent key inherits the default. A
// null default means "no change" (leave the page as-is). Stored in
// storage.local; nothing leaves the device.
const ODX_DEFAULTS = {
  enabled: true,
  font: "opendyslexic",
  customFont: "",
  sizePct: null, // null = no zoom (100%)
  lineHeight: null, // null = leave the site's line-height
  letterSpacing: null, // null = leave the site's letter-spacing (em)
  wordSpacing: null, // null = leave the site's word-spacing (em)
};

const ODX_SYSTEM_FAMILY = 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
const ODX_SETTING_KEYS = ["enabled", "font", "customFont", "sizePct", "lineHeight", "letterSpacing", "wordSpacing"];

// --- bundled-font registry (static fonts.json, never fetched from the net) ---
let _odxFontsCache = null;
async function odxLoadFonts() {
  if (_odxFontsCache) return _odxFontsCache;
  try {
    const res = await fetch(odxApi.runtime.getURL("fonts.json"));
    const data = await res.json();
    _odxFontsCache = Array.isArray(data.fonts) ? data.fonts : [];
  } catch (_e) {
    _odxFontsCache = [];
  }
  return _odxFontsCache;
}

function odxHostFromUrl(url) {
  try {
    return new URL(url).hostname;
  } catch (_e) {
    return "";
  }
}

// Load the config, migrating the old flat model on first run.
async function odxLoadConfig() {
  const raw = (await odxApi.storage.local.get(null)) || {};
  if (raw.defaults) {
    return { defaults: { ...ODX_DEFAULTS, ...raw.defaults }, siteRules: raw.siteRules || {} };
  }
  const d = { ...ODX_DEFAULTS };
  if (typeof raw.enabledGlobally === "boolean") d.enabled = raw.enabledGlobally;
  if (typeof raw.font === "string") d.font = raw.font;
  if (typeof raw.customFont === "string") d.customFont = raw.customFont;
  if (Number(raw.sizePct) && Number(raw.sizePct) !== 100) d.sizePct = Number(raw.sizePct);
  if (Number(raw.lineHeight) > 0) d.lineHeight = Number(raw.lineHeight);
  if (Number(raw.letterSpacing) > 0) d.letterSpacing = Number(raw.letterSpacing);
  const siteRules = {};
  if (Array.isArray(raw.disabledHosts)) {
    for (const h of raw.disabledHosts) siteRules[h] = { enabled: false };
  }
  await odxApi.storage.local.set({ schema: 2, defaults: d, siteRules });
  await odxApi.storage.local.remove([
    "enabledGlobally", "disabledHosts", "font", "customFont", "sizePct", "lineHeight", "letterSpacing",
  ]);
  return { defaults: d, siteRules };
}

// Resolve effective values + where each came from for a given host.
function odxEffective(config, host) {
  const site = (host && config.siteRules[host]) || {};
  const eff = {};
  const src = {};
  for (const k of ODX_SETTING_KEYS) {
    if (Object.prototype.hasOwnProperty.call(site, k)) {
      eff[k] = site[k];
      src[k] = "site";
    } else {
      eff[k] = config.defaults[k];
      src[k] = "default";
    }
  }
  return { eff, src, customized: Object.keys(site).length > 0 };
}

// How many settings are actively changing the page right now.
function odxModCount(eff) {
  if (!eff.enabled) return 0;
  let n = 1; // the font itself
  if (eff.sizePct != null) n++;
  if (eff.lineHeight != null) n++;
  if (eff.letterSpacing != null) n++;
  if (eff.wordSpacing != null) n++;
  return n;
}

// Resolve a font choice into a CSS family value + the registry entry whose
// bundled faces must be loaded (null for system / device-installed fonts).
function odxResolveFont(fontKey, customFont, fonts) {
  if (fontKey === "system") return { familyCss: ODX_SYSTEM_FAMILY, font: null };
  if (fontKey === "custom") {
    const name = (customFont || "").trim();
    if (name) return { familyCss: '"' + name + '", ' + ODX_SYSTEM_FAMILY, font: null };
  }
  const key = fontKey === "custom" ? "opendyslexic" : fontKey;
  const f = fonts.find((x) => x.key === key) || fonts.find((x) => x.key === "opendyslexic") || fonts[0] || null;
  return { familyCss: f ? '"' + f.family + '"' : ODX_SYSTEM_FAMILY, font: f };
}

function odxFaceCss(font, getUrl) {
  if (!font || !font.faces) return "";
  return font.faces
    .map(
      (f) =>
        "@font-face{font-family:'" + font.family + "';font-weight:" + f.weight +
        ";font-style:" + f.style + ";font-display:swap;src:url('" + getUrl(f.file) + "') format('woff2');}"
    )
    .join("\n");
}

// --- writers ---
async function odxSetDefault(key, value) {
  const c = await odxLoadConfig();
  c.defaults[key] = value;
  await odxApi.storage.local.set({ defaults: c.defaults });
}
async function odxSetSite(host, key, value) {
  if (!host) return;
  const c = await odxLoadConfig();
  const site = { ...(c.siteRules[host] || {}) };
  site[key] = value;
  c.siteRules[host] = site;
  await odxApi.storage.local.set({ siteRules: c.siteRules });
}
async function odxResetSite(host, key) {
  const c = await odxLoadConfig();
  const site = { ...(c.siteRules[host] || {}) };
  delete site[key];
  if (Object.keys(site).length === 0) delete c.siteRules[host];
  else c.siteRules[host] = site;
  await odxApi.storage.local.set({ siteRules: c.siteRules });
}
async function odxDeleteSite(host) {
  const c = await odxLoadConfig();
  delete c.siteRules[host];
  await odxApi.storage.local.set({ siteRules: c.siteRules });
}
// Replace the whole config (used by Undo and the manager).
async function odxWriteConfig(config) {
  await odxApi.storage.local.set({ defaults: config.defaults, siteRules: config.siteRules });
}
