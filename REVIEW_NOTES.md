# App Review Notes — Font Changer

Font Changer is a free Safari Web Extension that restyles the **text** of web
pages locally for readability: it swaps the font (bundled OpenDyslexic, Lexend,
or Atkinson Hyperlegible, the system font, or any font already installed on the
device) and optionally adjusts text size, line height, letter spacing, and word
spacing. Settings cascade from a global default to optional per-site overrides,
and the extension can be turned off globally or per site.

**No account, sign-in, or purchase is required** to use any feature. There is
nothing to log in to and no paywall — just enable the extension and browse.

## Why the extension requests access to all websites

`host_permissions` and the content script are declared for `<all_urls>`, and
this is **functionally required**: the purpose of the app is to restyle the text
of *whatever page the user is reading*, on by default. A reading-accessibility
tool that only worked on a fixed allow-list of domains would not serve its
purpose (a dyslexic reader needs it everywhere). The access is used **only** to
apply CSS to text on the current page; the extension never reads page content,
form data, URLs, or browsing history, and nothing is transmitted off the device.

Requested permissions and the reason for each:

- **`host_permissions: <all_urls>` + content script on `<all_urls>`** — apply the
  font/spacing CSS to the page the user is viewing. Runs at `document_start` in
  all frames so text doesn't visibly reflow.
- **`storage`** — persist the user's font/size/spacing preferences and per-site
  rules locally (extension storage). Never synced or uploaded.
- **`activeTab`** — let the toolbar popup read the current tab's host so it can
  show and edit settings for "this site."
- **`web_accessible_resources` (`fonts.json`, `fonts/*.woff2`)** — load the
  bundled font files into the page via `@font-face`. These are local files
  shipped in the app; **no font is ever fetched from the network.**

## How to enable and test

1. Build and run the macOS app, or install the iOS app on a device.
2. Enable the extension:
   - **macOS:** Safari → Settings → Extensions → turn on "Font Changer", then set
     its website access to **Allow on Every Website**.
   - **iOS:** Settings → Apps → Safari → Extensions → Font Changer → **On**, and
     **Allow** access to all websites.
3. Open any text page, e.g. `https://en.wikipedia.org`.
4. The body text renders in OpenDyslexic by default. Tap/click the Font Changer
   toolbar item to open the popup, where you can change the font, text size, line
   height, and spacing, switch between **This site** and **Defaults**, or toggle
   the extension off for the current site. "View all customizations" opens a page
   to edit your defaults (with a live preview) and manage per-site rules.

Code blocks and icon fonts are intentionally left untouched.

## Privacy

- **Collects no data.** App Privacy label: **Data Not Collected.** See
  `PRIVACY.md` (hosted at the Privacy Policy URL provided in App Store Connect).
- **No network use.** Every font is bundled in the app; nothing is fetched at
  runtime. There is no tracking, analytics, advertising, or telemetry.
- All preferences stay in local extension storage on the device.

## Technical / submission notes

- `PrivacyInfo.xcprivacy` declares no tracking and no collected data; it is
  included in the app and extension targets. If review flags a UserDefaults
  required-reason API, the declared reason is `CA92.1`
  (`NSPrivacyAccessedAPICategoryUserDefaults`).
- `SafariWebExtensionHandler` is a no-op and logs nothing.
- A **Privacy Policy URL** (hosting `PRIVACY.md`) and a **Support URL** are
  provided in App Store Connect.
- Source is open: <https://github.com/spashii/font-changer>.
