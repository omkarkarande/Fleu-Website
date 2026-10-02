# Fleu website

A static site for Fleu, built as a small printed journal: warm paper, dark ink, rust accents, serif headlines, fine rules and numbered screenshot plates. No framework, build step, CDN scripts, remote fonts, tracking or cookie banner. Existing product screenshots are preserved; their dark UI is treated as an editorial image rather than recoloured or fabricated.

## Pages

- `index.html`: product, screenshot viewer, privacy summary and compatibility.
- `privacy.html`: stable public privacy-policy route.
- `support.html`: contact and native, no-JavaScript FAQ.
- `styles.css`: shared design tokens, layouts, responsive and print styles.
- `site.js`: progressively enhanced native screenshot dialog. Real image links work without JavaScript. Escape, close, backdrop dismissal and focus restoration are supported.

`CNAME` remains unchanged. The repository uses GitHub Pages. No deployment was performed as part of this local redesign.

## Local preview

From this directory, run `npm run preview` or `python3 -m http.server 4173 --bind 127.0.0.1`, then visit `http://127.0.0.1:4173`.

## Verification

Node dependencies are development-only. They are not shipped to site visitors.

1. `npm ci`
2. `npx playwright install chromium webkit`
3. `npm test`
4. `npm exec prettier -- --check index.html privacy.html support.html styles.css site.js playwright.config.js tests/site.spec.js package.json`
5. `git diff --check`

Tests cover all three pages, local link/anchor and asset resolution, axe WCAG A/AA checks, responsive overflow from 320 to 1440px, keyboard screenshot-dialog behavior, focus restoration, no-JavaScript navigation/FAQ/image fallback, third-party runtime requests, key privacy/compatibility copy and disabled-placeholder regressions. Chromium writes full-page desktop/mobile review captures to ignored `artifacts/`.

Optional `CHROMIUM_EXECUTABLE_PATH` and `WEBKIT_EXECUTABLE_PATH` variables select already-installed browser binaries when downloads are unavailable. The October 1, 2026 verification used local Chromium headless-shell revision 1234 and WebKit revision 2336 with these overrides after browser installation stalled. Both engines passed; the duplicate WebKit screenshot-capture test is intentionally skipped. Browser tests are not a substitute for a real iPhone/VoiceOver check or legal review.

## Copy sources and boundaries

Privacy and compatibility copy were reconciled against the sibling app repository’s `APP_STORE_REVIEW.md`, `Fleu/Views/Settings/PrivacyPolicyView.swift`, and the existing website. The app repository was read only, not changed. GitHub Pages hosting was confirmed via the repository Pages API.

The key correction is that on-device analysis is not the same as device-only storage. Journal records, daily summaries and the optional profile use private Apple iCloud. The policy covers optional name/birthday/photo, account-specific caches, local preferences, photo metadata handling, deletion propagation and backup limitations. It distinguishes website hosting and email from app data flows. It does not promise an immediate remote wipe or claim that uninstalling removes cloud records.

No new legal compliance guarantee, third-party certification, testimonials, download figures or encryption promise is made. Support-email retention wording and actual operating practices need owner review before publication.

## Before publishing

- Confirm `support@fleu.app` forwarding and receipt with an actual test message. The address was supplied by the owner; mailbox delivery has not been tested.
- Review the policy against the version being released and confirm email-handling practices. This is a technical privacy description, not legal sign-off.
- Recheck the existing TestFlight invitation and beta availability; HTTP 200 alone does not prove an active build or available tester slots.
- Replace the existing example screenshots with fresh captures if the released UI changes. Their native bottom toolbars overlap some scrolling content; do not invent product UI to hide that.
- Set App Store Connect privacy and support URLs to the published `privacy.html` and `support.html` pages and verify them after deployment.
- Replace “App Store release coming soon” with a real verified App Store URL only once available.
- Check the primary flow, text enlargement and VoiceOver on an actual iPhone.

No commit, push, publication, App Store Connect change or support email was sent by this redesign.
