# Official logo integration

Source: user-supplied `Ditto Smiling Tile Logo.png`, preserved unchanged as `public/brand/official/source.png`. The source is a 1448×1086 raster, not vector artwork. Deterministic exports are reproducible with `node scripts/prepare-brand.mjs` using existing Sharp. Original artwork pixels are cropped, exterior matte removed, and scaled/composed; no replacement illustration is used. An experimental generated extraction was rejected and is not included.

## Assets and integration

- Transparent horizontal lockup (420×140), stacked logo, symbol, and wordmark in `public/brand/official/`.
- Apple icon 180px; PWA icons 192/512px and a separate safe-area maskable 512px icon.
- Symbol-only 16/32/48px favicons, multi-resolution ICO, and Next file-convention icon routes.
- Shared BrandLogo in desktop/mobile navigation, onboarding, existing loading and footer locations.
- 1200×630 Open Graph image, accessible image description, social metadata and web-app manifest.
- Existing light/cream interface retains its palette. Transparent assets need no separate dark recoloring in the current UI. App icons use an opaque cream background for reliable OS rendering.

## Visual review

Applied installed Impeccable polish/craft guidance and UI/UX Pro Max spacing/contrast guidance. Header lockup uses 162×54 desktop and 138×46 mobile (118×40 below 370px), leaving navigation and discovery controls in place. Review of real 1440px desktop, 390px and 375px captures found the original character, check and wordmark legible without dominating activity photography. Onboarding uses 180×60. No animation or vote implementation changed.

Real iPhone Safari via Mirroring verified the header and both right/left drag advancement. Add to Home Screen preview showed the correctly composed symbol with rounded OS masking; a temporary-domain shortcut was not installed. Actual home-screen launch/offline behavior was not tested. No service worker or offline mode was added.

Local screenshots (ignored because some contain approved personal profile photos):

- `test-results/official-logo/desktop-navigation.png`
- `test-results/official-logo/mobile-discover.png`
- `test-results/official-logo/mobile-375.png`
- `test-results/official-logo/onboarding.png`
- `test-results/official-logo/iphone-discover.png`
- `test-results/official-logo/iphone-swipe-advanced.png`
- `test-results/official-logo/iphone-app-icon-preview.png`

Earlier baseline evidence remains in `test-results/launch-polish/`. Screenshots and profile photos are not committed or pushed.

## Validation

Passed lint, typecheck, 48 unit tests, production build, multiplayer script and integration script against an isolated production server. Icon tests check dimensions, alpha, maskable safe circle, ICO entries, social image dimensions and manifest file references. HTTP checks passed for manifest, icon, Apple icon, ICO, social image and horizontal logo; HTML includes expected metadata links.

## Deployment notes and limitations

No production deployment performed. Set PUBLIC_ORIGIN to the final HTTPS origin **during the production build** as well as runtime so prerendered absolute social image URLs use the real domain. The temporary phone preview reused a localhost-built bundle: header and Apple icon worked, but Safari's sharing sheet selected a content photo rather than the social logo because its absolute OG URL was local. Rebuild with the final PUBLIC_ORIGIN before validating public social previews. Source artwork is raster; do not enlarge beyond useful source resolution or claim vector exports. At 16px, symbol color and silhouette carry recognition rather than facial detail. Optional match animation was omitted to keep this branding change independent of voting.
