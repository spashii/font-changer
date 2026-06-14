# Development

The extension holds all the logic; `safari/` is a generated Xcode wrapper
around it.

```
extension/            the WebExtension (all the logic)
  manifest.json
  fonts.json          static font registry (no dynamic URLs)
  fonts/              bundled .woff2 files + their OFL licenses
  icons/
  src/                common.js, content.*, popup.*, onboarding.*, manage.*, background.js
safari/               generated Xcode project: macOS + iOS app and extension targets
```

## Develop quickly (Chrome)

Load the `extension/` folder as an unpacked extension at `chrome://extensions`.
Fast iteration, no Xcode needed.

## Build for Safari (macOS + iOS)

The Xcode project references `extension/` directly (folder references), so
editing the extension and rebuilding is enough. Only re-run the converter to
regenerate the project structure, and note that doing so resets signing and
Info.plist customizations:

```sh
xcrun safari-web-extension-converter ~/Documents/spashii/safari-ext-font-changer/extension \
  --app-name "Font Changer" --bundle-identifier eu.tangerinetech.fontchanger \
  --project-location ~/Documents/spashii/safari-ext-font-changer/safari
```

Open `safari/Font Changer/Font Changer.xcodeproj`, pick the macOS or iOS scheme,
set signing to your team, and Run. Enable it in Safari as described in
[REVIEW_NOTES.md](REVIEW_NOTES.md); the in-app onboarding screen also walks
through it.

## Settings model

```json
{
  "defaults": { "enabled": true, "font": "opendyslexic", "sizePct": null, "lineHeight": null },
  "siteRules": { "example.com": { "sizePct": 115, "lineHeight": 1.7 } }
}
```

A missing key on a site inherits the default. A `null` default means "no change."
See `extension/src/common.js` (`odxLoadConfig` / `odxEffective`).
