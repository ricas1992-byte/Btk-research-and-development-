# Beyond the Keys Institute

**Institute in Formation**

This is the public-facing website of Beyond the Keys Institute — a pedagogical research institute dedicated to piano education, practice methodology, and musical thought.

## Status

This institute is actively developing. Content is published with clear status indicators:

- **Published** — Final, reviewed content
- **Working Paper** — Developed thinking, subject to refinement
- **In Development** — Early-stage conceptual work

## Technical

- Built with [Astro](https://astro.build)
- Deployed via Netlify
- Hebrew-first, RTL layout

## Structure

```
institute/
├── src/
│   ├── pages/          # Site pages
│   ├── layouts/        # Page layouts
│   ├── styles/         # Global styles
│   └── content/        # Content collections
├── public/             # Static assets
└── astro.config.mjs    # Astro configuration
```

## Development

```bash
npm install
npm run dev
```

## Deploy

Site deploys automatically via Netlify on push to main branch.
