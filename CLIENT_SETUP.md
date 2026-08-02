# Client Deployment Runbook

Repeatable checklist for launching this platform for a new client.
Target time once practised: **under half a day** (plus content loading).

## 0. Collect from the client (before starting)

- [ ] Business name, logo (or initials), primary colour
- [ ] Contact details: phone, office phone, email, location line
- [ ] Their domain name + registrar login (or ask them to add DNS records you send)
- [ ] Listings: photos, prices, descriptions (or portal links to copy from)
- [ ] Admin email address for their staff login

## 1. Supabase (per client — never share projects between clients)

1. supabase.com → New project (choose Sydney region) → name it `<client>-realty`.
2. SQL Editor → run, in order:
   - `src/lib/supabase-schema.sql` (core tables incl. kv_store)
   - `database/KV_STORE_AUSTRALIA.sql` *(optional sample data — skip if loading real listings straight away)*
   - `database/SAMPLE_DATA_AUSTRALIA.sql` *(tables + optional samples: testimonials, serviced apartments, buyers)*
3. Storage → create a **public** bucket named `property-images`.
4. Edge Functions → deploy `src/supabase/functions/server/` as `make-server-64143980`
   (`supabase functions deploy make-server-64143980` with the CLI, or paste via dashboard).
5. Settings → API → copy the **Project URL** and **anon key**.

## 2. Code (per client)

1. Branch or copy the repo for the client: `git checkout -b client/<name>`.
2. Edit `src/config/brand.ts` — name, initials, contacts, cities, map default.
3. Edit the `<title>` fallback in `index.html`.
4. (Optional) swap navbar initials for their logo image (see BRANDING.md).
5. Set the admin password: generate a hash with `node src/utils/generatePasswordHash.js <password>`
   and update it where the admin login checks credentials.

## 3. Netlify (per client)

1. netlify.com → Add new site → Import from Git → pick the client branch.
2. Build command `npm run build` · Publish directory `dist`.
3. Environment variables:
   - `VITE_SUPABASE_URL` = the client project URL
   - `VITE_SUPABASE_ANON_KEY` = the client anon key
4. Deploy, then Domain settings → add their custom domain → follow the DNS
   instructions → HTTPS is automatic.

## 4. Content load + QA (with the client)

- [ ] Log into `/admin/login`, add their real listings + photos
- [ ] Add 2–3 real testimonials via admin
- [ ] Serviced apartments: set nightly/weekly/monthly prices + calendar capacity
- [ ] Test on a phone: search, property detail, enquiry form, booking flow
- [ ] Submit a test enquiry and confirm it appears in admin
- [ ] Check emails/phone shown on About Us + property pages are theirs

## 5. Handover

- [ ] 30-minute staff walkthrough (add listing, answer enquiry, set reminder, export Excel)
- [ ] Send them: site URL, admin URL, admin credentials (password manager or in person)
- [ ] First invoice: remaining 50% of setup + first month's care plan
- [ ] Ask for the testimonial + permission to add the site to your portfolio
- [ ] Diary note: check-in call after 2 weeks

## Troubleshooting quick hits

- Blank data / "failed to initialize": kv_store table missing → rerun schema SQL.
- Images won't upload: `property-images` bucket missing or not public.
- 404 on page refresh: `public/_redirects` must be deployed (it is in the repo).
- Enquiries not saving: RLS policies — rerun the policy sections in the SQL files.
