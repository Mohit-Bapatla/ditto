# Responsive + behavioral test matrix

| Flow | iPhone 375x812 | iPhone 390x844 | narrow 320x640 | iPad 768x1024 | Mac 1440x900 |
| --- | --- | --- | --- | --- | --- |
| Landing, fast onboarding | Test | Test | Test | Test | Test |
| Discover swipe: touch/drag/click/buttons | Touch | Touch | Touch | Mouse | Mouse/trackpad |
| Pass and interested saved separately | Test | Test | Test | Test | Test |
| View details, join, withdraw, capacity | Test | Test | Test | Test | Test |
| Create activity + venue selection | Test | Test | Test | Test | Test |
| Circle create and invite separate sessions | Test | Test | Test | Test | Test |
| Multi-member ideas and independent swipe | Test | Test | Test | Test | Test |
| Unanimous/majority correctly labeled | Test | Test | Test | Test | Test |
| Group chat composer and scrolling | Test | Test | Test | Test | Test |
| Social Autopilot opt-in and review | Test | Test | Test | Test | Test |
| AI + SerpApi itinerary (mock in regression) | Test | Test | Test | Test | Test |
| Approvals, RSVP, calendar | Test | Test | Test | Test | Test |
| Safe area, keyboard, orientation | Test | Test | Test | Test | Test |

Run browser screenshots before/after. Four separate authenticated browser contexts for group voting. Use mocked providers for regression and optionally ONE authorized live smoke test only if useful. Existing live integration reported passed; avoid unnecessary API spending.
