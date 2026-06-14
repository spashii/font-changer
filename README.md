# Font Changer

Make any web page easier to read in Safari, on Mac and iPhone. Font Changer
swaps the page font to a dyslexia-friendly typeface like OpenDyslexic, Lexend,
or Atkinson Hyperlegible, and lets you tune size, line height, and spacing, on
by default everywhere, with per-site control. Free, open source, and private by
design: no accounts, no tracking, nothing leaves your device.

![The same page, before and after](docs/assets/screenshots/1.png)
![The same fonts on Mac and iPhone](docs/assets/screenshots/2.png)
![Choose OpenDyslexic, Lexend, or Atkinson Hyperlegible](docs/assets/screenshots/3.png)
![Set the size, line height, and spacing](docs/assets/screenshots/4.png)
![Customize any site, or turn it off](docs/assets/screenshots/5.png)

Not affiliated with or endorsed by OpenDyslexic, Lexend, or Atkinson
Hyperlegible; it simply ships their fonts under their open-source licenses.

## What it does

- Swap the page font to OpenDyslexic, Lexend, Atkinson Hyperlegible, the system
  font, or any font installed on your device.
- Adjust text size, line height, letter spacing, and word spacing.
- On by default everywhere, with a one-click off switch per site.
- Settings cascade: your **Defaults** apply everywhere, and any **site** can
  override just the settings you change, with the rest inherited.
- Leaves icon fonts and code blocks alone.

## Privacy

- No tracking, no analytics, no advertising, no accounts.
- Fonts are bundled in the app. The extension never loads anything from the
  internet.
- Your settings stay on this device (browser extension storage).
- It only restyles pages. It never reads or sends your browsing.

See [PRIVACY.md](PRIVACY.md).

## Project layout

This is an Apple app plus a WebExtension, not a copied Chrome extension:

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

Regenerate the Xcode wrapper after changing `extension/` (the converter copies
the resources in):

```sh
xcrun safari-web-extension-converter ~/Documents/spashii/safari-ext-font-changer/extension \
  --app-name "Font Changer" --bundle-identifier eu.tangerinetech.fontchanger \
  --project-location ~/Documents/spashii/safari-ext-font-changer/safari
```

Then open `safari/Font Changer/Font Changer.xcodeproj`, pick the macOS or iOS
scheme, set signing to your Apple ID, and Run. Enable it in Safari as described
in [REVIEW_NOTES.md](REVIEW_NOTES.md); the in-app onboarding screen also walks
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

## Accessibility

The popup itself is built to be usable: visible keyboard focus, labelled
switches and sliders, larger touch targets on iPhone and iPad, and a clear
per-site off switch.

## Licensing

- Code: MIT, see [LICENSE](LICENSE).
- Fonts: each under the SIL Open Font License 1.1, see
  [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) and `extension/fonts/`.
- Icon: original artwork.

## Found a bug or have an idea?

Tell me. Bug reports and suggestions are welcome:
[open a GitHub issue](https://github.com/spashii/font-changer/issues/new).

## More

[Roadmap](ROADMAP.md) · [Contributing](CONTRIBUTING.md) · [Privacy](PRIVACY.md) · [Review notes](REVIEW_NOTES.md) · [Issues](https://github.com/spashii/font-changer/issues)
