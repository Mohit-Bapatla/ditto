---
name: Ditto
description: Friends decide on real outings one physical invitation at a time.
colors:
  accent: "#e11d48"
  accent-hover: "#b9153a"
  paper: "#fff9fa"
  surface: "#ffffff"
  ink: "#211b20"
  muted: "#716570"
  line: "#e7dce1"
  tint: "#ffe7ed"
  lime: "#ffd2df"
  vote-yes: "#08753d"
  vote-yes-hover: "#065d31"
  vote-yes-edge: "#138650"
  vote-no: "#bd2428"
  vote-no-edge: "#c93835"
typography:
  display:
    fontFamily: "Syne, sans-serif"
    fontSize: "clamp(28px, 7.7vw, 36px)"
    fontWeight: 700
    lineHeight: 1.04
    letterSpacing: "-0.03em"
  headline:
    fontFamily: "Syne, sans-serif"
    fontSize: "38px"
    fontWeight: 700
    lineHeight: 1.12
    letterSpacing: "-0.03em"
  body:
    fontFamily: "Manrope, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Manrope, sans-serif"
    fontSize: "12px"
    fontWeight: 600
rounded:
  sm: "10px"
  md: "16px"
  lg: "24px"
  control: "12px"
  dialog: "20px"
  circle: "50%"
spacing:
  base: "8px"
  control-x: "20px"
  control-y: "12px"
  section: "24px"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.surface}"
    rounded: "{rounded.control}"
    padding: "12px 20px"
    height: "48px"
  button-primary-hover:
    backgroundColor: "{colors.accent-hover}"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "12px 20px"
    height: "48px"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "12px"
    height: "48px"
  category-selected:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.surface}"
    rounded: "{rounded.control}"
    padding: "8px 14px"
  invitation:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.surface}"
    rounded: "{rounded.lg}"
  decision-yes:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.vote-yes}"
    rounded: "{rounded.circle}"
    width: "56px"
    height: "56px"
---

# Design System: Ditto

## Overview

**Creative North Star: "One physical invitation"**

Ditto is a photo-led, mobile-first place for friends to choose real outings together. The confirmed visual direction is Vibrant & Block-based + Motion-Driven: rose identity, near-white pink surfaces, expressive Syne headings and clear Manrope supporting text. Physical movement communicates a decision; it is not decoration.

This documents the implemented light identity, replacing the previous beige direction. It does not promise a dark theme. Product truth remains unchanged: interest is not an RSVP, and group consensus comes from independent real votes. Surface-specific composition and concept comparisons live in `docs/design-iterations/rebuild/DIRECTION.md`.

**Key Characteristics:**
- Authentic photography with honest venue, illustration and demo attribution.
- Expressive headings, quiet utilities and semantic green/red decisions.
- Tactile drag feedback with keyboard and button alternatives.
- Progressive disclosure that preserves the complete planning flow.

## Colors

### Primary

Rose accent carries brand identity, primary actions, active navigation and focus. Accent-hover darkens interactive emphasis; tint provides quiet selection surfaces. The historical `lime` token now denotes the soft rose highlight. Compatibility aliases `purple` and `lavender` resolve to accent and tint; do not treat their names as permission to introduce purple.

### Neutral

Paper is the near-white pink page; surface is white; ink is the dark text and toast foundation. Muted supports secondary information, and line separates lists and fields. The exact normative values are above and map to identically named CSS custom properties in `app/globals.css`.

Semantic vote colors remain distinct from brand rose: green means Ditto/interest, red means Pass. Edge tokens support the progressive gesture border. They are semantic states, not additional brand accents.

**The Honest Decision Rule.** Always pair decision color with a word, icon or accessible name; never imply attendance or group agreement from personal interest.

## Typography

Display uses local Syne weights 700 and 800; body uses local Manrope weights 400, 600 and 700, all with sans-serif fallback. `app/layout.tsx` loads local TTF assets with `next/font/local` and swap display. No external font request is required. CSS requests such as button weight 650 resolve through the installed faces; no separate 650 font asset exists.

Syne gives activity identity and headings character. Manrope keeps dates, places, forms and navigation easy to scan. The frontmatter display role describes invitation titles; it is not a universal heading size. General page headings use the headline role, becoming 30px on mobile. Discover's compact toolbar heading is 24px. Invitation titles are 36px on desktop and 28px at the narrowest breakpoint. The wordmark uses Syne 800 at 36px desktop/34px mobile.

Body text follows the frontmatter body role. Supporting card labels use the label role; place text is 14px with 1.4 line-height. Small hints and attribution use 10–11px, so never move essential decision information into that tier.

## Layout

Desktop uses a centered horizontal navigation shell (1120px maximum, 72px high), a general content container (1060px maximum), and 32px side padding. Discovery remains a compact centered invitation rather than stretching photography across the full desktop width: maximum 580px at widths from 761px.

At widths through 760px, navigation moves to a fixed bottom bar (70px plus bottom safe area). The workspace reserves the same space. The top bar is at least 64px and respects the top safe area; general content uses 20px side padding and Discover uses 12px. Four persistent destinations remain Discover, Circles, Plans and Profile. Profile uses columns on desktop and a single flow on mobile. Circles are separated people-and-decision rows; Plans form a chronological list.

The spacing basis is 8px, with purpose-specific 12px, 20px and 24px component padding. Invitation height uses viewport-relative clamps: mobile `clamp(380px, calc(100svh - 286px - env(safe-area-inset-top) - env(safe-area-inset-bottom)), 620px)`; desktop `clamp(350px, calc(100svh - 250px), 640px)`. Short windows may scroll. These formulas are not a guarantee that long content or enlarged text fits: retain explicit overflow and 200% text-size checks.

## Elevation & Depth

Lists and planning surfaces are mostly flat, separated by spacing and thin rules. Photography and tonal layers create hierarchy. Invitation depth comes from a restrained next-card preview, revealed as the active card moves.

Decision controls use `0 3px 16px #211b2009`; dialogs use `0 24px 80px #211b2033`. Do not spread dialog shadows across ordinary content. The photo scrim is functional: a gradient from transparent through `#16101555` to `#161015f5` protects caption contrast. Recheck contrast with actual imagery and caption heights.

## Shapes

The implemented radius scale is in frontmatter. Invitations use the largest card curve; controls are gently rounded; dialogs use a distinct dialog curve. Decision buttons are circles: 56px for Pass/Ditto, 44px for undo. Inputs retain the smaller radius. Circle identity tiles use 20px desktop/16px mobile corners. Ordinary Circles and Plans list rows remain flat and divided rather than becoming repeated boxed cards.

## Components

### Buttons and fields

Primary buttons use rose with white text; secondary buttons use a white surface, ink text and a line border. Both have a 48px minimum height and the frontmatter padding. Primary hover uses accent-hover; secondary hover uses tint. Form fields have a 48px minimum height, 16px text, a white surface and the incumbent `#bfc3b8` border. Native disabled buttons use opacity 0.42.

Keyboard focus uses a 3px accent outline offset by 4px. Preserve this on buttons, links, fields and focusable cards. Icon actions require accessible names. Visible labels must remain included in those names as state changes.

### Categories and navigation

Category choices live in a labeled fieldset inside Filters. Choices are at least 44px high, use a line border by default, and fill rose when selected; `aria-pressed` carries selection state. Navigation uses muted text at rest and rose when active with `aria-current`; desktop adds tint behind the active destination. Mobile keeps the active destination flat and visibly labeled.

### Invitation and gesture

Use a supplied venue photo when available. Otherwise retain explicit inspiration/demo attribution; never generate a fictional picture that claims to depict a real venue. Failed images show a readable fallback. Keep time, title, place, host and Details associated with the active invitation. The next card is inert and hidden from accessibility navigation.

Touch and pointer motion follow continuously along x, with rotation up to the mapped ±16° at ±400px and progressive PASS/DITTO feedback. Vertical intent remains page scrolling (`touch-action: pan-y`). Commit distance is `max(64, min(110, width × 0.24))`; a deliberate flick can commit after 32px at release velocity ≥0.65px/ms. Horizontal intent must exceed vertical travel by 1.25×. Below threshold, spring back (stiffness 440, damping 30, mass 0.85).

Pointer, button and arrow-key actions share the same locked server transaction. Await save before exit, then publish the next server state. Failed saves return the same card and announce retry guidance. Cancel/lost capture/blur/hidden-tab interruption must not strand a drag or cast a vote. Focus follows replaced cards only when the old card held focus. Reduced motion removes rotation/spring/flyout and uses a 100ms opacity exit; it preserves state feedback and the transaction.

### Dialogs and feedback

Use native dialog modality, Escape, a named close button and scrollable content. Preserve the modal class that binds consumer styling. Saving uses status text; errors use alerts; confirmations use status toasts. Interest copy must explicitly distinguish saving interest from RSVP. Empty decks offer filters and revisiting activities.

## Do's and Don'ts

### Do:
- **Do** preserve real backend votes, RSVP, approvals, routing and calendar behavior while refining presentation.
- **Do** use authentic venue imagery and identify illustrative or demo content plainly.
- **Do** keep touch, mouse and keyboard decisions equivalent and guard against duplicate submissions.
- **Do** check long names, failed images, empty/error states, enlarged text and reduced motion in rendered screens.
- **Do** keep native phone Safari/Chrome verification explicitly pending until actual devices are tested.

### Don't:
- **Don't** confuse rose brand emphasis with semantic green/red voting.
- **Don't** fabricate venue imagery, attendance, or group agreement.
- **Don't** replace this identity with generic SaaS panels, decorative blobs or gratuitous gradients.
- **Don't** remove useful feedback globally to implement reduced motion.
- **Don't** promise dark theme support or physical-device verification from this light-theme source documentation.

Implementation notes: `ActivityPhoto` preserves media bounds and displays an explicit photo-unavailable fallback for failed group imagery. Activity titles over 70 characters use a smaller caption type size so metadata remains visible; this was checked with a 101-character title at 375px. This changes presentation only, never the stored title.
