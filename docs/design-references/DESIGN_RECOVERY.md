# Ditto design recovery — 25 October 2026

The first pass is preserved at `90b3b8a`. It is functionally tested, but it does not meet the requested visual standard. No production deployment has been made. The original pack and 27-source capture library remain in `../ditto-design-references/`; this directory adds the requested recovery work without overwriting that evidence.

## Evidence and critique

Current screenshots are in `before/` at 390 and 1440 pixels. Additional flow captures from the first pass are in `../ditto-design-references/after/`. Full-page screenshots can repeat fixed navigation inside a long image; judge the visible viewport separately. A capture was replaced when the compositor had not settled after resizing.

| Screen | Specific visual defect | Required correction |
|---|---|---|
| Discovery | Marketing headline, search box, categories and deck caption consume roughly 300px before the photo. Tiny white metadata competes over a dark gradient. Two provenance/category pills plus an uppercase photo label fragment attention. | Compact utilities; photo first; move title, venue and time to a readable light surface. Give decisions a consistent place. |
| Circles | Oversized two-line slogan, large initials in an empty tile, plus an equally prominent join card. Content looks like a dashboard template. | A direct title, actual people and plan status in compact rows; a quiet join action. |
| Group ideas/voting | Circle name, description, avatars, invitation panel and tabs delay the actual idea by most of a phone screen. | Short Circle context, secondary invitation control, decision-first voting layout. |
| Matches | Generic celebratory slogan and pill list; the selected outing has little visual weight. | Let the actual agreed activity and people be the result; one plan action. |
| Chat | Two generic bordered panels; decorative eyebrow copy and operational details dominate a nearly empty conversation. | Conversation first; selection and AI review as deliberate secondary modes. Keep consent explicit. |
| Plan review / confirmed | The plan title and repeated explanation occupy the first phone viewport, before any useful time or stop. Approval and RSVP are buried below content. | Date and first stop immediately visible; concise provenance; explicit persistent primary action where useful. |
| Profile | Oversized emoji and boilerplate copy; provider setup appears as consumer content. | Personal details first, capability diagnostics in a secondary disclosure. |
| Creation / join | Working forms but every input has the same heavy treatment; long forms have little grouping. | Short entry, grouped optional detail, clear venue selection, consistent sheets. |

Typography is too uniformly heavy and tightly tracked. Color is restrained but does not establish identity on its own. Photography is real when supplied by the provider, but the previous crop and overlay hide it. Iconography is serviceable; unnecessary icons and badges dilute useful ones. Navigation works, but the desktop rail is filled with promotional filler. Interaction behavior is stronger than the visual hierarchy: pointer/keyboard swipes, safe pass undo, server-confirmed votes and independent sessions already pass.

## Reference decisions, not borrowed styling

- **Airbnb discovery:** photos and price/location lines establish scan order without a heading explaining the product. Adopt compact utility chrome and clean text outside photography. Do not copy its branding or multi-listing inventory structure.
- **Partiful event:** the event itself owns the opening viewport; RSVP is physically close to it. Adopt a single strong visual object and nearby action. Do not copy themed event artwork or decorative backgrounds.
- **Luma event:** date and location have defined roles rather than being a paragraph of metadata. Adopt explicit information groups.
- **Tinder official screenshots:** clear selection states and one emotional next step. The saved library is match/interests/chat evidence, **not a captured swipe-deck screen**; do not overclaim it as such.
- **DoorDash public discovery:** efficient category navigation and photo/metadata rhythm. Avoid promotional clutter.
- **Mobbin:** public page was accessible, library screens were not available without login. Its marketing page is not used as interface evidence.

## Directions considered

1. **Night-out / immersive:** full-bleed photography, dark UI, large overlaid title, circular decisions. Strong energy, but repeats the current readability problem for long activity names and weak provider thumbnails.
2. **Outing card / selected direction:** near-white canvas, compact city/search/create utilities, large photograph, readable title and concise facts beneath it, a fixed visual decision rhythm. Warm vermilion is reserved for the affirmative action; a restrained display serif can distinguish the activity title from utility UI. The card resembles a personal invitation without reproducing another app.
3. **Neighborhood journal:** editorial serif headings, small photo feed and descriptive stories. Rich browsing, but less decisive for voting and too much scrolling for this product's core task.

Discovery comes first. Render the selected direction with actual stored activity data, compare screenshots directly, identify the three largest defects, and revise before propagating tokens or changing other screens. Keep backend behavior and provider contracts intact. Missing photos and long titles are quality-gate cases, not reasons to invent venue images.

## Functional baseline already established

25 unit tests, lint/typecheck/build, integration and four-user tests passed in the first pass. Four hostname-isolated browser sessions joined, voted and approved the same plan. Restart verification preserved sessions, membership and votes. Browser RSVP and ICS download passed. A bounded live check passed Muse Spark planning, real venues, driving route, four approvals/RSVPs/calendar, and selected-message extraction. Live calls are paused again. Physical touch and Safari remain untested; the in-app browser does not support dispatching touch input through its CDP capability.

## Discovery visual gate and iterations

- `iterations/discovery-v1-390.png`: first photo + invitation composition. Compared directly with `references/airbnb-discovery-viewport.png` and the saved Partiful event. Three shortcomings: tiny date/price, tightly tracked serif, detached undo control.
- `iterations/discovery-v2-390.png`: relaxed title tracking and coherent action dock. Further review increased utility text and corrected the misleading all-demo footnote on a mixed public/demo deck.
- `iterations/discovery-v3-*`: 320/360/375/390/430/768/1280/1440; no horizontal document overflow. Desktop now fits a full card and decision row on a 900px-high viewport. Real venue photo is unobscured; title and logistics sit on a light surface.
- Long-title + missing-image test initially devoted too much space to an empty photo. `long-title-missing-photo-v2-375.png` reduces that area to 180px, preserves the complete title, and keeps decisions reachable.
- Real mouse drag passed; undo restored the same venue; a predominantly vertical drag did not vote. A stopped local server did not advance the deck. The generic network exception was replaced with a connection/retry message.
- Visual gate: sufficient to carry the composition into supporting screens, not a claim of parity with mature native apps. Remaining limitations: provider thumbnail quality varies, physical touch/iOS Safari are untested, and initial spring behavior is a short CSS settle rather than a native physics engine.
