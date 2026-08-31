# Store contact update

Contact details were read from the [user-supplied Google Maps listing](https://maps.app.goo.gl/rR9ZSDjpx6hmsNjv8) on 2026-08-31:

- Listing: مبلمان نیلپر خانگی مشهد
- Address: مشهد، بلوار وکیل‌آباد، بین وکیل‌آباد ۱۱ و ۱۳
- Telephone: +98 51 3843 8583
- Listed opening hours: daily, 10:00–22:00; holiday hours may differ.
- Coordinates: 36.3208475, 59.5238668

The shared configuration supplies the header, mobile menu, footer, contact page and store structured data. The contact page includes direct directions and listing links, plus a Google embed that loads only after the visitor chooses to display it. No API key or location permission is required. The embed URL came from the listing's Share/Embed dialog, with its language set to Persian.

The existing email address remains unchanged and was not verified by the listing. No ratings, reviews or partnership claims were imported.

Validation: production build, TypeScript, ESLint and all 17 existing journal/showcase checks passed. The production contact page's browser snapshot confirmed the new address, phone links, hours, map button and directions URLs. Visual review of the loaded embedded map and responsive contact layout remains outstanding; external Google availability is not guaranteed. Existing navigation responsive checks are recorded separately in `navigation-verification.md`.

No phone call or deployment was performed. Set the production site URL before publishing so canonical and structured-data URLs use the real domain.
