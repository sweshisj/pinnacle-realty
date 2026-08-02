# Rebranding Guide

All branding lives in **one file: `src/config/brand.ts`**. To rebrand the
site for a new client, edit that file and redeploy — no other code changes
are needed.

## What you can change in `src/config/brand.ts`

| Setting | What it controls |
|---|---|
| `name` | Company name — navbar, page headings, admin login, welcome screen, browser tab title |
| `initials` | The two-letter logo mark in the navbar square |
| `exportPrefix` | File name prefix for Excel exports from the admin (`<prefix>_Projects_<date>.xlsx`) |
| `userAgent` | Identifier sent with OpenStreetMap/Nominatim geocoding requests |
| `contact.phone` | Contact number shown on property detail pages |
| `contact.officePhone` | Office landline on the About Us contact card |
| `contact.email` | General enquiries email on the About Us page |
| `contact.location` | Location line on contact cards |
| `cities` | Example cities used in admin form placeholders |
| `map.lat` / `map.lng` | Default map position when a property has no coordinates (currently Melbourne CBD) |
| `colors.primary` | Exposed globally as the CSS variable `--brand-primary` (used by the navbar logo mark; available for further styling) |

## Rebrand checklist for a new client

1. Edit `src/config/brand.ts` (name, initials, contacts, map default, cities).
2. Replace the `<title>` fallback in `index.html` (the runtime sets it from
   config, but the static fallback shows during the first paint).
3. Optionally drop a client logo into `src/assets/` and swap the initials
   square in `src/components/Navbar.tsx` for an `<img>`.
4. Create the client's own Supabase project, run the SQL files in
   `database/`, and set `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`
   in the deployment environment.
5. Deploy (Netlify: build command `npm run build`, publish directory `dist`).

## A note on colours

The visual theme uses compiled Tailwind utility classes (greens/emeralds),
so a full palette swap is a find-and-replace of Tailwind class names plus a
CSS rebuild — deliberately not config-driven yet. `--brand-primary` is in
place as the hook for a future colour-token pass.

## Note on sample content

Property names in sample data ("Pinnacle Harbour Residences" etc. in
`database/`) and the About Us project showcase are **content**, managed via
the admin panel / database — not part of the code branding.
