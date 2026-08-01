-- ============================================================
-- PINNACLE REALTY — AUSTRALIA SAMPLE DATA RESET (FINAL v5)
-- ============================================================
-- Run in: Supabase Dashboard > SQL Editor > New Query
-- ============================================================


-- -------------------------------------------------------
-- STEP 1: CREATE TESTIMONIALS TABLE (if not exists)
-- -------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.testimonials (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_name        TEXT    NOT NULL,
  property_bought    TEXT    NOT NULL,
  property_location  TEXT    NOT NULL,
  rating             INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review             TEXT    NOT NULL,
  occupation         TEXT,
  client_photo       TEXT,
  video_url          TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_testimonials_rating     ON public.testimonials (rating);
CREATE INDEX IF NOT EXISTS idx_testimonials_created_at ON public.testimonials (created_at DESC);

-- RLS
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read"           ON public.testimonials;
DROP POLICY IF EXISTS "Allow authenticated insert"  ON public.testimonials;
DROP POLICY IF EXISTS "Allow authenticated update"  ON public.testimonials;
DROP POLICY IF EXISTS "Allow authenticated delete"  ON public.testimonials;

CREATE POLICY "Allow public read"
  ON public.testimonials FOR SELECT USING (true);

CREATE POLICY "Allow authenticated insert"
  ON public.testimonials FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow authenticated update"
  ON public.testimonials FOR UPDATE USING (true);

CREATE POLICY "Allow authenticated delete"
  ON public.testimonials FOR DELETE USING (true);


-- -------------------------------------------------------
-- STEP 2: CLEAR ALL EXISTING DATA
-- -------------------------------------------------------

-- 2a. KV store keys (table: kv_store_64143980)
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'kv_store_64143980'
  ) THEN
    UPDATE public.kv_store_64143980 SET value = '[]'::jsonb WHERE key = 'reminders';
    UPDATE public.kv_store_64143980 SET value = '[]'::jsonb WHERE key = 'clients';
    UPDATE public.kv_store_64143980 SET value = '[]'::jsonb WHERE key = 'notifications';
    UPDATE public.kv_store_64143980 SET value = '[]'::jsonb WHERE key = 'projects';
    UPDATE public.kv_store_64143980 SET value = '[]'::jsonb WHERE key = 'testimonials';
    UPDATE public.kv_store_64143980 SET value = '[]'::jsonb WHERE key = 'sa_enquiries';
    UPDATE public.kv_store_64143980 SET value = '[]'::jsonb WHERE key = 'sa_availability_blocks';
  END IF;
END $$;

-- 2b. NRI enquiries
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'nri_enquiries') THEN
    DELETE FROM public.nri_enquiries;
  END IF;
END $$;

-- 2c. Serviced apartment child tables (FK order)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'serviced_apartment_reviews') THEN
    DELETE FROM public.serviced_apartment_reviews; END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'serviced_apartment_bookings') THEN
    DELETE FROM public.serviced_apartment_bookings; END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'serviced_apartment_enquiries') THEN
    DELETE FROM public.serviced_apartment_enquiries; END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'serviced_apartment_availability') THEN
    DELETE FROM public.serviced_apartment_availability; END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'enquiries') THEN
    DELETE FROM public.enquiries; END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'availability_blocks') THEN
    DELETE FROM public.availability_blocks; END IF;
END $$;

-- 2d. Serviced apartments
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'serviced_apartments') THEN
    DELETE FROM public.serviced_apartments; END IF;
END $$;

-- 2e. Admin buyers
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'adminbuyers') THEN
    DELETE FROM public.adminbuyers; END IF;
END $$;

-- 2f. Testimonials
DELETE FROM public.testimonials;


-- -------------------------------------------------------
-- STEP 3: SAMPLE CLIENTS  (adminbuyers)
-- Schema: id TEXT, name TEXT, leads JSONB
-- -------------------------------------------------------

INSERT INTO public.adminbuyers (id, name, leads, created_at, updated_at) VALUES

('client-001', 'James Whitfield', '[
  {"id":"lead-001-a","propertyName":"Harborview Residences","type":"Apartment",
   "location":"Circular Quay, Sydney NSW 2000","city":"Sydney",
   "imageUrl":"https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400&h=300&fit=crop&auto=format",
   "contactName":"James Whitfield","contactPhone":"+61 412 345 678",
   "contactEmail":"james.whitfield@email.com.au",
   "description":"2BR waterfront apartment. Budget AUD 1.2M–1.5M. Pre-approved finance.",
   "status":"active"}
]'::jsonb, NOW() - INTERVAL '10 days', NOW() - INTERVAL '2 days'),

('client-002', 'Sophie Nguyen', '[
  {"id":"lead-002-a","propertyName":"Southbank Towers","type":"Apartment",
   "location":"Southbank, Melbourne VIC 3006","city":"Melbourne",
   "imageUrl":"https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&h=300&fit=crop&auto=format",
   "contactName":"Sophie Nguyen","contactPhone":"+61 423 567 890",
   "contactEmail":"sophie.nguyen@email.com.au",
   "description":"1BR investment apartment near CBD. Budget AUD 550K–700K.",
   "status":"active"},
  {"id":"lead-002-b","propertyName":"St Kilda Road Residences","type":"Apartment",
   "location":"St Kilda, Melbourne VIC 3182","city":"Melbourne",
   "imageUrl":"https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=300&fit=crop&auto=format",
   "contactName":"Sophie Nguyen","contactPhone":"+61 423 567 890",
   "contactEmail":"sophie.nguyen@email.com.au",
   "description":"2BR apartment as primary residence. Requires parking and storage.",
   "status":"pending"}
]'::jsonb, NOW() - INTERVAL '15 days', NOW() - INTERVAL '1 day'),

('client-003', 'Liam O''Brien', '[
  {"id":"lead-003-a","propertyName":"Fortitude Valley Precinct","type":"Townhouse",
   "location":"Fortitude Valley, Brisbane QLD 4006","city":"Brisbane",
   "imageUrl":"https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=400&h=300&fit=crop&auto=format",
   "contactName":"Liam O''Brien","contactPhone":"+61 434 678 901",
   "contactEmail":"liam.obrien@email.com.au",
   "description":"3BR townhouse. School zone and backyard preferred. Budget AUD 800K–950K.",
   "status":"active"}
]'::jsonb, NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'),

('client-004', 'Priya Sharma', '[
  {"id":"lead-004-a","propertyName":"Glenelg Beach Villas","type":"Villa",
   "location":"Glenelg, Adelaide SA 5045","city":"Adelaide",
   "imageUrl":"https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&h=300&fit=crop&auto=format",
   "contactName":"Priya Sharma","contactPhone":"+61 445 789 012",
   "contactEmail":"priya.sharma@email.com.au",
   "description":"Beachside villa for holiday let and personal use. Budget AUD 900K–1.1M.",
   "status":"closed"}
]'::jsonb, NOW() - INTERVAL '30 days', NOW() - INTERVAL '7 days'),

('client-005', 'Tom Kellerman', '[
  {"id":"lead-005-a","propertyName":"Fremantle Warehouse Conversion","type":"Apartment",
   "location":"Fremantle, Perth WA 6160","city":"Perth",
   "imageUrl":"https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=300&fit=crop&auto=format",
   "contactName":"Tom Kellerman","contactPhone":"+61 456 890 123",
   "contactEmail":"tom.kellerman@email.com.au",
   "description":"Character warehouse conversion loft. Art studio space essential. Budget AUD 650K.",
   "status":"active"}
]'::jsonb, NOW() - INTERVAL '8 days', NOW() - INTERVAL '3 days'),

('client-006', 'Chloe Anderson', '[
  {"id":"lead-006-a","propertyName":"Hobart Waterfront Apartments","type":"Apartment",
   "location":"Battery Point, Hobart TAS 7004","city":"Hobart",
   "imageUrl":"https://images.unsplash.com/photo-1448630360428-65456885c650?w=400&h=300&fit=crop&auto=format",
   "contactName":"Chloe Anderson","contactPhone":"+61 467 901 234",
   "contactEmail":"chloe.anderson@email.com.au",
   "description":"Heritage 2BR apartment overlooking Constitution Dock. First home buyer. Budget AUD 480K.",
   "status":"pending"}
]'::jsonb, NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'),

('client-007', 'Marcus Reid', '[
  {"id":"lead-007-a","propertyName":"Darwin Esplanade Suites","type":"Apartment",
   "location":"Darwin City NT 0800","city":"Darwin",
   "imageUrl":"https://images.unsplash.com/photo-1555636222-cae831e670b3?w=400&h=300&fit=crop&auto=format",
   "contactName":"Marcus Reid","contactPhone":"+61 478 012 345",
   "contactEmail":"marcus.reid@email.com.au",
   "description":"2BR apartment close to CBD. Defence Housing assistance available.",
   "status":"active"}
]'::jsonb, NOW() - INTERVAL '12 days', NOW() - INTERVAL '4 days'),

('client-008', 'Emma Foster', '[
  {"id":"lead-008-a","propertyName":"Canberra Civic Quarter","type":"Apartment",
   "location":"Civic, Canberra ACT 2601","city":"Canberra",
   "imageUrl":"https://images.unsplash.com/photo-1486304873000-235643847519?w=400&h=300&fit=crop&auto=format",
   "contactName":"Emma Foster","contactPhone":"+61 489 123 456",
   "contactEmail":"emma.foster@email.com.au",
   "description":"2BR apartment near parliament precinct. Budget AUD 700K–850K.",
   "status":"active"},
  {"id":"lead-008-b","propertyName":"Kingston Foreshore Apartments","type":"Apartment",
   "location":"Kingston, Canberra ACT 2604","city":"Canberra",
   "imageUrl":"https://images.unsplash.com/photo-1494526585095-c41746248156?w=400&h=300&fit=crop&auto=format",
   "contactName":"Emma Foster","contactPhone":"+61 489 123 456",
   "contactEmail":"emma.foster@email.com.au",
   "description":"Waterfront lifestyle apartment as second option. Open to 1BR or 2BR.",
   "status":"pending"}
]'::jsonb, NOW() - INTERVAL '20 days', NOW() - INTERVAL '6 days');


-- -------------------------------------------------------
-- STEP 4: SAMPLE SERVICED APARTMENTS
-- Verified schema columns (no has_wifi — wifi goes in amenities[])
-- -------------------------------------------------------

INSERT INTO public.serviced_apartments (
  title, type, city, location, address, latitude, longitude,
  sleeps, bedrooms, bathrooms, size_sqft,
  nightly_price, weekly_price, monthly_price, security_deposit, cleaning_fee,
  inclusions, housekeeping_frequency, wifi_speed,
  has_kitchen, has_laundry, has_parking, has_gym, has_pool,
  has_security, has_lift, has_balcony, has_tv,
  amenities, check_in_time, check_out_time, cancellation_policy,
  smoking_allowed, pets_allowed, parties_allowed,
  instant_book, kyc_required, gst_invoice_available,
  main_image, images, highlights, description, is_active, featured
) VALUES

(
  'Sydney Harbour Executive Suite', 'Apartment',
  'Sydney', 'Circular Quay, Sydney NSW 2000',
  '12 Macquarie St, Sydney NSW 2000', -33.8610, 151.2111,
  4, 2, 2, 1100,
  420, 2600, 9500, 1500, 250,
  ARRAY['Wi-Fi','Housekeeping','Utilities','Concierge'], 'Weekly', '200 Mbps',
  true, true, true, true, false, true, true, true, true,
  ARRAY['Air Conditioning','City Views','Coffee Machine','Workspace','Iron','Hair Dryer'],
  '14:00', '11:00', 'Moderate',
  false, false, false, true, false, false,
  'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&h=600&fit=crop&auto=format',
  ARRAY['https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&h=600&fit=crop&auto=format',
        'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop&auto=format'],
  ARRAY['Harbour Views','CBD Location','Concierge'],
  'Premium 2-bedroom serviced apartment with sweeping views over Sydney Harbour Bridge and Opera House. Fully furnished with hotel-grade linen, weekly housekeeping, and dedicated concierge.',
  true, true
),

(
  'Melbourne Southbank Studio', 'Studio',
  'Melbourne', 'Southbank, Melbourne VIC 3006',
  '8 Riverside Quay, Southbank VIC 3006', -37.8224, 144.9611,
  2, 1, 1, 480,
  195, 1250, 4800, 600, 120,
  ARRAY['Wi-Fi','Housekeeping','Utilities'], 'Weekly', '100 Mbps',
  true, false, false, true, false, true, true, false, true,
  ARRAY['Air Conditioning','River Views','Smart TV','24hr Reception'],
  '15:00', '11:00', 'Flexible',
  false, false, false, true, false, false,
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop&auto=format',
  ARRAY['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop&auto=format',
        'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&h=600&fit=crop&auto=format'],
  ARRAY['Yarra River Views','Business Ready','Instant Book'],
  'Modern studio on the Southbank promenade. Ideal for business travellers. Steps from Crown Entertainment Complex and Yarra River.',
  true, false
),

(
  'Brisbane River Apartment', 'Apartment',
  'Brisbane', 'Brisbane City QLD 4000',
  '30 Howard St, Brisbane QLD 4000', -27.4698, 153.0251,
  3, 1, 1, 680,
  255, 1600, 6200, 800, 150,
  ARRAY['Wi-Fi','Housekeeping','Utilities','Parking'], 'Weekly', '100 Mbps',
  true, true, true, false, false, true, true, true, true,
  ARRAY['Air Conditioning','River Views','Outdoor Terrace','Workspace'],
  '14:00', '11:00', 'Moderate',
  false, false, false, true, false, false,
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=600&fit=crop&auto=format',
  ARRAY['https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=600&fit=crop&auto=format',
        'https://images.unsplash.com/photo-1448630360428-65456885c650?w=800&h=600&fit=crop&auto=format'],
  ARRAY['Story Bridge Views','Outdoor Terrace','Free Parking'],
  'Spacious 1-bedroom apartment with unobstructed Story Bridge views. Full kitchen, in-unit laundry, and large outdoor terrace.',
  true, false
),

(
  'Gold Coast Beachfront Retreat', 'Villa',
  'Gold Coast', 'Surfers Paradise QLD 4217',
  '3 Esplanade, Surfers Paradise QLD 4217', -28.0024, 153.4295,
  6, 3, 2, 2100,
  580, 3600, 14000, 2500, 400,
  ARRAY['Wi-Fi','Housekeeping','Utilities','Parking','BBQ'], 'Daily', '300 Mbps',
  true, true, true, false, true, true, false, true, true,
  ARRAY['Air Conditioning','Beachfront','Rooftop Terrace','BBQ Area','Daily Housekeeping'],
  '14:00', '10:00', 'Strict',
  false, false, false, false, false, false,
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop&auto=format',
  ARRAY['https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop&auto=format',
        'https://images.unsplash.com/photo-1555636222-cae831e670b3?w=800&h=600&fit=crop&auto=format'],
  ARRAY['Beachfront','Rooftop Pool','Family Friendly'],
  'Three-bedroom beachfront villa directly on Surfers Paradise beach. Private rooftop terrace, heated pool, and BBQ. Daily housekeeping included.',
  true, true
),

(
  'Perth CBD Corporate Suite', 'Apartment',
  'Perth', 'Perth CBD WA 6000',
  '45 St Georges Tce, Perth WA 6000', -31.9505, 115.8605,
  3, 2, 1, 950,
  310, 1950, 7500, 1000, 200,
  ARRAY['Wi-Fi','Housekeeping','Utilities','Concierge'], 'Weekly', '200 Mbps',
  true, true, true, true, false, true, true, false, true,
  ARRAY['Air Conditioning','Swan River Views','Business Desk','Workspace'],
  '14:00', '11:00', 'Moderate',
  false, false, false, false, false, false,
  'https://images.unsplash.com/photo-1486304873000-235643847519?w=800&h=600&fit=crop&auto=format',
  ARRAY['https://images.unsplash.com/photo-1486304873000-235643847519?w=800&h=600&fit=crop&auto=format',
        'https://images.unsplash.com/photo-1494526585095-c41746248156?w=800&h=600&fit=crop&auto=format'],
  ARRAY['Swan River Views','Business Ready','Gym Access'],
  'Executive 2-bedroom apartment in Perth CBD. Floor-to-ceiling windows with Swan River views and premium appliances. Monthly rates available.',
  true, false
),

(
  'Adelaide Glenelg Beach House', 'Villa',
  'Adelaide', 'Glenelg SA 5045',
  '21 Jetty Rd, Glenelg SA 5045', -34.9809, 138.5158,
  5, 3, 2, 1800,
  345, 2150, 8300, 1200, 300,
  ARRAY['Wi-Fi','Housekeeping','Utilities','Parking'], 'Weekly', '100 Mbps',
  true, true, true, false, false, false, false, true, true,
  ARRAY['Air Conditioning','Beachside','BBQ','Outdoor Dining','Beach Gear'],
  '15:00', '11:00', 'Moderate',
  false, true, false, true, false, false,
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&h=600&fit=crop&auto=format',
  ARRAY['https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&h=600&fit=crop&auto=format',
        'https://images.unsplash.com/photo-1502672023488-70e25813eb80?w=800&h=600&fit=crop&auto=format'],
  ARRAY['200m to Beach','Pet Friendly','Fully Equipped'],
  'Charming 3-bedroom beach house steps from Glenelg beach. Beach gear, fully equipped kitchen, and outdoor dining. Pet-friendly on request.',
  true, false
);


-- -------------------------------------------------------
-- STEP 5: SAMPLE TESTIMONIALS
-- Schema: client_name, property_bought, property_location,
--         rating, review, occupation, client_photo
-- -------------------------------------------------------

INSERT INTO public.testimonials
  (client_name, property_bought, property_location, rating, review, occupation, client_photo)
VALUES

('James Whitfield', 'Harborview Residences', 'Circular Quay, Sydney', 5,
 'Pinnacle Realty made buying our first Sydney apartment completely stress-free. Responsive, honest, and guided us through every step. We could not be happier.',
 'Software Engineer',
 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&auto=format'),

('Sophie Nguyen', 'Southbank Towers', 'Southbank, Melbourne', 5,
 'As an investor I have dealt with many agencies — Pinnacle Realty stands out for transparency and market knowledge. Excellent rental yield from day one.',
 'Financial Analyst',
 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&auto=format'),

('Liam O''Brien', 'Fortitude Valley Precinct', 'Brisbane, QLD', 4,
 'We needed a family home in the right school zone and Pinnacle Realty delivered. They knew the Brisbane market inside out and found us the perfect townhouse within budget.',
 'Contractor',
 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&auto=format'),

('Emma Foster', 'Kingston Foreshore Apartments', 'Kingston, Canberra', 5,
 'Professional, transparent, and genuinely helpful. Pinnacle Realty helped me navigate the Canberra market as a first-time buyer. The process was smooth from start to finish.',
 'Public Servant',
 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&auto=format'),

('Tom Kellerman', 'Fremantle Warehouse Conversion', 'Fremantle, Perth', 5,
 'I had a very specific brief — a warehouse conversion with studio space in Fremantle. Pinnacle Realty found exactly what I was looking for. Exceptional knowledge of the Perth market.',
 'Graphic Designer',
 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&auto=format'),

('Chloe Anderson', 'Hobart Waterfront Apartments', 'Battery Point, Hobart', 4,
 'Buying my first home was daunting but the Pinnacle Realty team made it manageable. They explained everything clearly and negotiated a great price. I love my apartment.',
 'Nurse',
 'https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?w=200&h=200&fit=crop&auto=format');


-- -------------------------------------------------------
-- STEP 6: SAMPLE SERVICED APARTMENT ENQUIRIES
-- -------------------------------------------------------

INSERT INTO public.serviced_apartment_enquiries
  (apartment_id, guest_name, email, phone, company,
   check_in_date, check_out_date, guests, purpose, special_requests, status)
SELECT id,
  'David Chen', 'david.chen@auscorp.com.au', '+61 412 111 222', 'AusCorp Pty Ltd',
  CURRENT_DATE + 14, CURRENT_DATE + 44, 2, 'Business',
  'Dedicated desk with dual monitors and fast internet required.',
  'new'
FROM public.serviced_apartments WHERE title = 'Sydney Harbour Executive Suite' LIMIT 1;

INSERT INTO public.serviced_apartment_enquiries
  (apartment_id, guest_name, email, phone,
   check_in_date, check_out_date, guests, purpose, special_requests, status)
SELECT id,
  'Sarah Mitchell', 'sarah.mitchell@gmail.com', '+61 423 333 444',
  CURRENT_DATE + 7, CURRENT_DATE + 21, 3, 'Leisure',
  'Travelling with two children — could you provide a cot?',
  'contacted'
FROM public.serviced_apartments WHERE title = 'Gold Coast Beachfront Retreat' LIMIT 1;


-- -------------------------------------------------------
-- STEP 7: VERIFICATION
-- -------------------------------------------------------

SELECT 'adminbuyers'                    AS table_name, COUNT(*) AS rows FROM public.adminbuyers
UNION ALL
SELECT 'serviced_apartments',                           COUNT(*)        FROM public.serviced_apartments
UNION ALL
SELECT 'serviced_apartment_enquiries',                  COUNT(*)        FROM public.serviced_apartment_enquiries
UNION ALL
SELECT 'testimonials',                                  COUNT(*)        FROM public.testimonials;

-- Expected:
--   adminbuyers                   | 8
--   serviced_apartments           | 6
--   serviced_apartment_enquiries  | 2
--   testimonials                  | 6
