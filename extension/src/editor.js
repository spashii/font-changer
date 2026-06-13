// Shared setting-editor widgets used by both the popup and the Customizations
// page, so the font picker and sliders look and behave identically in both.
// Each slider is centred on `center`, which means "no change" (stored as null);
// drag left to reduce, right to increase, or type an exact value. Plain script
// (no modules): exposes a single `odxEditor` global.
(function () {
  // Symmetric ranges centred on the "no change" value, so the default sits at
  // the midpoint of every slider.
  const RANGE = {
    sizePct: { min: 50, max: 150, step: 5, numStep: 1, unit: "%", round: 0, center: 100 },
    lineHeight: { min: 1.0, max: 2.0, step: 0.1, numStep: 0.1, unit: "", round: 2, center: 1.5 },
    letterSpacing: { min: -0.1, max: 0.1, step: 0.01, numStep: 0.01, unit: "em", round: 2, center: 0 },
    wordSpacing: { min: -0.2, max: 0.2, step: 0.05, numStep: 0.05, unit: "em", round: 2, center: 0 },
  };
  const RANGE_ROWS = [
    ["sizePct", "Text size"],
    ["lineHeight", "Line height"],
    ["letterSpacing", "Letter spacing"],
    ["wordSpacing", "Word spacing"],
  ];

  const fromStore = (cfg, v) => (v == null ? cfg.center : v);
  const toStore = (cfg, v) => (Math.abs(v - cfg.center) < cfg.step / 2 ? null : +v.toFixed(cfg.round));
  const showNum = (cfg, v) => (cfg.round ? +v.toFixed(cfg.round) : Math.round(v));

  // Default row header: just a label. Callers (the popup) can pass their own
  // `headFn(label, key)` to add source badges and per-row reset.
  function plainHead(label) {
    const head = document.createElement("div");
    head.className = "odx-prow-head";
    const lab = document.createElement("span");
    lab.className = "odx-prow-label";
    lab.textContent = label;
    head.appendChild(lab);
    return head;
  }

  // `view` holds the values to show (effective site values or the defaults).
  // `onChange(key, value)` is called with the value to store (null = no change).
  function fontRow(view, fonts, onChange, headFn) {
    const row = document.createElement("div");
    row.className = "odx-prow";
    row.appendChild(headFn ? headFn("Font", "font") : plainHead("Font"));
    const sel = document.createElement("select");
    sel.setAttribute("aria-label", "Font");
    for (const f of fonts) sel.add(new Option(f.label, f.key));
    sel.add(new Option("System default", "system"));
    sel.add(new Option("Font on this device…", "custom"));
    sel.value = view.font;
    sel.addEventListener("change", () => onChange("font", sel.value));
    row.appendChild(sel);
    if (view.font === "custom") {
      const inp = document.createElement("input");
      inp.type = "text";
      inp.placeholder = "e.g. Georgia, Verdana, a font you have";
      inp.value = view.customFont || "";
      inp.setAttribute("aria-label", "Font on this device");
      inp.addEventListener("change", () => onChange("customFont", inp.value.trim()));
      row.appendChild(inp);
    }
    return row;
  }

  function rangeRow(key, label, storedVal, onChange, headFn) {
    const cfg = RANGE[key];
    const cur = fromStore(cfg, storedVal);
    const row = document.createElement("div");
    row.className = "odx-prow";
    const head = headFn ? headFn(label, key) : plainHead(label);

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
    r.addEventListener("change", () => onChange(key, toStore(cfg, clamp(Number(r.value)))));
    num.addEventListener("change", () => {
      const v = clamp(Number(num.value));
      r.value = v;
      onChange(key, toStore(cfg, v));
    });
    return row;
  }

  // Build the font row + every range row into `container`.
  // opts: { view, fonts, onChange, headFn? }
  function buildRows(container, opts) {
    container.innerHTML = "";
    container.appendChild(fontRow(opts.view, opts.fonts, opts.onChange, opts.headFn));
    for (const [key, label] of RANGE_ROWS) {
      container.appendChild(rangeRow(key, label, opts.view[key], opts.onChange, opts.headFn));
    }
  }

  globalThis.odxEditor = { RANGE, RANGE_ROWS, fromStore, toStore, showNum, fontRow, rangeRow, buildRows };
})();
