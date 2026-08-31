# Navigation revision — 2026-08-31

- Removed «فضاها» from desktop and mobile navigation.
- Mobile navigation fills the viewport, includes direct product-category links, and places configured address, telephone and opening hours at the bottom. Short screens scroll inside the menu while the close control stays accessible.
- Desktop Products opens a full-screen Radix dialog with category selection, real catalog counts, six product previews, search, a catalog continuation link and shortcuts to brands/projects/journal.
- Menu and catalog share search matching, including Persian letter normalization and accent-insensitive brand lookup, so continuing a search preserves results.
- Dialog behavior includes background scroll locking, keyboard focus containment, Escape/close controls, focus restoration, route/same-route dismissal, and dismissal across the mobile/desktop breakpoint. Reduced-motion styles are included.

## Verification

- Production build, TypeScript, ESLint and whitespace checks passed.
- Existing generated-output suites passed: 12 showcase checks and 5 journal checks.
- Desktop browser review at 1440×1000 and 1280×720 confirmed viewport-sized dialogs, category/search filtering, empty recovery, search continuation into the catalog, keyboard focus containment, Escape dismissal and trigger focus restoration.
- Mobile review at 390×844 and 320×568 confirmed full width/height, no horizontal overflow, bottom contact details, scrolling on short screens, working category/navigation/contact links, same-page dismissal and responsive switching.
- No errors or warnings in inspected browser interactions.

The subsequent contact update replaced the placeholder phone and address using the supplied Google Maps listing; see `contact-verification.md`. No phone call, deployment or push was performed.
