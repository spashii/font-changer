# App Store screenshots — plan

## Specs
- **6.9" iPhone: 1320 × 2868 px** (portrait). This is the only required size —
  App Store Connect auto-scales it down to smaller iPhones. Upload these.
- 13" iPad: 2064 × 2752 px (only if you ship an iPad-optimized build).
- PNG or JPG, RGB, **flattened (no alpha/transparency, no rounded corners)**.
- Up to 10 per device. The **first 3 carry ~70% of the decision** and the first
  is the only one shown in search results — put the strongest one first.

## Principles (from current ASO guidance)
- The first frame must show the core benefit in under a second.
- Captions are descriptions, not slogans. "Adjust size and spacing," not
  "The best reader ever."
- One short headline per frame. Same background, type, and colors across all of
  them — consistency reads as trustworthy.
- Vertical frames (the 2026 standard).

## Shot list (6 frames, in order)
1. **Before / after on a real article** (hero). Caption: *The same page, in a font you can read.*
2. **The popup open on a page**, font menu showing. Caption: *OpenDyslexic, Lexend, or Atkinson Hyperlegible.*
3. **The sliders.** Caption: *Set the size, line height, and spacing.*
4. **Per-site toggle.** Caption: *On everywhere. Off where you want.*
5. **The Customizations page.** Caption: *Your defaults, with per-site overrides.*
6. **Privacy closer.** Caption: *No tracking. Nothing leaves your device.*

## Capturing the raw shots
No iOS Simulator runtime is installed, so capture on the device: take the raw
screenshots on the iPhone (Side + Volume Up), AirDrop them to the Mac, and drop
them into `store/screenshots/screens/` as `1.png` … `6.png`.

## Framing + captions — don't reinvent the wheel
Pick one of these; both end at 1320 × 2868 ready for upload.

**Option A — a hosted helper (fastest, no local setup):**
- **ScreenshotWhale** — exports a locale-organized ZIP that drops straight into
  App Store Connect or Fastlane.
- **Screenshots.pro** or **BrandBird** — upload raw captures, pick a device
  frame, add a caption and background, export at the exact size.
- Use the tool's built-in device frames; don't draw your own.

**Option B — HTML (more control, on-brand):** use `template.html` in this folder.
It lays out each frame at exactly 1320 × 2868 with our palette, a caption, and a
CSS device bezel around your raw capture. Render to PNG with a headless browser,
e.g. Playwright:

```sh
npx -y playwright@latest install chromium
npx -y playwright screenshot --viewport-size=1320,2868 \
  "store/screenshots/template.html?frame=1" store/screenshots/out/1.png
# …repeat per frame, or script the loop
```

(If you'd rather not install Chromium, Option A is the lower-effort path.)
