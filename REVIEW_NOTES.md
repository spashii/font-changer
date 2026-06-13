# App Review Notes

Font Changer is a Safari Web Extension that restyles web page text locally:
font, size, line height, letter and word spacing. It is on by default and can be
turned off globally or per site.

## What it does
- Changes the font and spacing of pages using fonts bundled in the app.
- Stores all settings locally (browser extension storage). No network requests,
  no tracking, no accounts.

## How to test
1. Build and run the macOS app, or install the iOS app on a device.
2. Enable the extension:
   - macOS: Safari → Settings → Extensions → enable "Font Changer"; set its
     website access to Allow on Every Website.
   - iOS: Settings → Apps → Safari → Extensions → Font Changer → on; allow all
     websites.
3. Open https://en.wikipedia.org.
4. The page text renders in OpenDyslexic. Click the toolbar icon to change the
   font, size, or spacing, or to toggle this site off.

## Privacy
- Collects no data. See PRIVACY.md. App Privacy label: "Data Not Collected."
- No remote resources: every font is bundled; nothing is fetched at runtime.

## Submission notes
- `PrivacyInfo.xcprivacy` declares no tracking and no collected data. Add it to
  the app and extension targets (Target → Build Phases / drag in, check target
  membership). If review flags a UserDefaults required-reason API, add
  `NSPrivacyAccessedAPICategoryUserDefaults` with reason `CA92.1`.
- Provide a Privacy Policy URL (host PRIVACY.md) and a Support URL.
- Make `SafariWebExtensionHandler` a no-op that logs nothing (see the generated
  Swift file under `safari/`).
