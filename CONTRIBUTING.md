# Contributing

Thanks for helping make the web more readable.

## Project layout
- `extension/` — the WebExtension (the actual logic): `manifest.json`, `src/`
  (scripts and pages), `icons/`, `fonts/` (bundled woff2 + OFL licenses), and
  `fonts.json` (the font registry).
- `safari/` — the generated Xcode project (macOS + iOS app and extension
  targets) that wraps the extension.

## Develop quickly (Chrome)
Load `extension/` as an unpacked extension at `chrome://extensions`. Fast
iteration, no Xcode required.

## Build for Safari
See README "Build for Safari". Regenerate the Xcode wrapper with the converter
after changing `extension/`, since it copies the extension resources in.

## Code style
- Plain JavaScript, no build step, no frameworks. Match the existing style.
- No remote resources, ever. Bundle anything you need under `extension/`.
- Keep the icon-font and code exclusions in `content.css` intact.

## Adding a font
Add the `.woff2` files to `extension/fonts/`, add an entry to
`extension/fonts.json`, drop the font's license in `extension/fonts/`, and add a
note to `THIRD_PARTY_NOTICES.md`. Only add OFL or otherwise permissively licensed
fonts, and respect reserved-font-name rules.

## Settings model
Defaults cascade to per-site rules; see `src/common.js` (`odxLoadConfig` /
`odxEffective`). A missing key on a site inherits the default; a `null` default
means "no change."
