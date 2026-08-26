# NPGroup Storefront

A mobile-first Persian RTL homepage for a premium furniture and interiors shop.

## Run locally

```bash
npm install
npm run dev
```

Production verification:

```bash
npm run lint
npm run build
```

## Content to replace

- Brand and contact placeholders are in `src/app/page.tsx` and `src/components/site-header.tsx`.
- Temporary editorial images live in `public/placeholders`.
- The hero is already a `<video>` element with a poster. Add your video source inside that element in `src/app/page.tsx`.
- Set `NEXT_PUBLIC_SITE_URL` to the final HTTPS domain so Open Graph image URLs are absolute.

The current product, project, brand, and editorial data are static mock content intended to be replaced when the WordPress/WooCommerce integration begins.
