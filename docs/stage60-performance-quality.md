# Stage 60 — Performance, accessibility and technical quality

This stage hardens the public surface without changing tax behavior.

## Delivery and bundle discipline
- the landing page stays server-rendered and contains no client directive or browser data-fetching;
- compression is explicitly enabled and production browser source maps remain disabled;
- the existing full production build remains the authoritative bundle gate.

## Accessibility
- a keyboard skip link targets the application content;
- visible focus states are defined for links, buttons and form controls;
- reduced-motion preference disables smooth scrolling and skip-link transitions;
- the public navigation has an explicit accessible label;
- narrow-screen safeguards keep cards and result headers usable while wide tables remain horizontally scrollable.

## SEO / public metadata
- metadata has a canonical production base URL and canonical home URL;
- Open Graph and Twitter metadata are explicit;
- the sitemap includes the public simulator, rules, privacy and terms pages;
- a web app manifest exposes product identity and theme;
- a custom 404 provides a recovery path.

This stage does not change fiscal formulas, source catalogs, state activation, billing or release scope.
