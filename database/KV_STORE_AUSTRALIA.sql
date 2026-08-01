-- ============================================================
-- KV STORE: Australian Projects & Clients
-- Run in: Supabase Dashboard > SQL Editor
-- ============================================================
-- This inserts/replaces the 'projects' and 'clients' keys
-- in the kv_store_64143980 table with Australian sample data.
-- ============================================================

-- -------------------------------------------------------
-- STEP 1: Insert Australian Residential Projects
-- -------------------------------------------------------
INSERT INTO public.kv_store_64143980 (key, value)
VALUES (
  'projects',
  '[
    {
      "id": "proj-au-001",
      "name": "Pinnacle Harbour Residences",
      "type": "Apartment",
      "status": "Available",
      "city": "Sydney",
      "location": "Darling Harbour, Sydney NSW 2000",
      "description": "Iconic waterfront apartments with sweeping harbour views. Pinnacle Harbour Residences redefine luxury urban living with floor-to-ceiling glazing, premium finishes, and direct access to Sydney CBD. Each residence is designed to maximise natural light and panoramic water outlooks.",
      "totalPrice": 1250000,
      "pricePerSqFt": 1650,
      "priceNegotiable": false,
      "bhk": ["1 BHK", "2 BHK", "3 BHK"],
      "area": "72-210 sqm",
      "possession": "Ready to Move",
      "amenities": "Rooftop infinity pool, Concierge, Gym & wellness centre, Secure basement parking, Harbour-view terrace, Private cinema room, EV charging stations",
      "images": [
        "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800",
        "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800",
        "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800"
      ],
      "badges": ["Featured", "Waterfront"],
      "lead": "Pinnacle Realty Development Group",
      "coordinates": { "lat": -33.8724, "lng": 151.2011 },
      "mapAddress": "Darling Harbour, Sydney NSW 2000"
    },
    {
      "id": "proj-au-002",
      "name": "Pinnacle Gardens Melbourne",
      "type": "Apartment",
      "status": "Available",
      "city": "Melbourne",
      "location": "South Yarra, Melbourne VIC 3141",
      "description": "Boutique mid-rise apartments nestled in Melbourne''s most sought-after garden suburb. Pinnacle Gardens blends contemporary architecture with lush landscaping, offering residents a tranquil retreat minutes from Chapel Street, the Botanic Gardens, and world-class dining.",
      "totalPrice": 875000,
      "pricePerSqFt": 1220,
      "priceNegotiable": true,
      "bhk": ["2 BHK", "3 BHK"],
      "area": "88-165 sqm",
      "possession": "Dec 2025",
      "amenities": "Private courtyard gardens, Residents'' lounge, Heated lap pool, Secure parking, Bike storage & workshop, Rooftop entertaining area",
      "images": [
        "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800",
        "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800",
        "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800"
      ],
      "badges": ["New Launch", "Garden Living"],
      "lead": "Pinnacle Realty Development Group",
      "coordinates": { "lat": -37.8399, "lng": 144.9887 },
      "mapAddress": "South Yarra, Melbourne VIC 3141"
    },
    {
      "id": "proj-au-003",
      "name": "Pinnacle Skyline Brisbane",
      "type": "Apartment",
      "status": "Upcoming",
      "city": "Brisbane",
      "location": "New Farm, Brisbane QLD 4005",
      "description": "Arriving 2026 — Pinnacle Skyline is Brisbane''s next landmark residential tower, rising above the river bend at New Farm. Enjoy unobstructed city and river panoramas, resort-calibre amenities, and seamless connectivity to Brisbane''s rapidly evolving inner city.",
      "totalPrice": 695000,
      "pricePerSqFt": 980,
      "priceNegotiable": false,
      "bhk": ["1 BHK", "2 BHK", "3 BHK", "Penthouse"],
      "area": "58-320 sqm",
      "possession": "Q3 2026",
      "amenities": "25m lap pool, Sky lounge, Co-working hub, Gym, Pet-friendly facilities, Secure parking, Concierge, River-view terraces",
      "images": [
        "https://images.unsplash.com/photo-1486325212027-8081e485255e?w=800",
        "https://images.unsplash.com/photo-1559599746-8823b38544b3?w=800",
        "https://images.unsplash.com/photo-1523217582562-09d0def993a6?w=800"
      ],
      "badges": ["Pre-Launch", "River Views"],
      "lead": "Pinnacle Realty Development Group",
      "coordinates": { "lat": -27.4683, "lng": 153.0526 },
      "mapAddress": "New Farm, Brisbane QLD 4005"
    },
    {
      "id": "proj-au-004",
      "name": "Pinnacle Ridge Villas",
      "type": "Villa",
      "status": "Available",
      "city": "Gold Coast",
      "location": "Burleigh Heads, Gold Coast QLD 4220",
      "description": "Architecturally designed beachside villas set across a private estate at Burleigh Heads. Each Pinnacle Ridge Villa features a private pool, double garage, and direct beach access. Built to the highest sustainability standards with solar power, rainwater harvesting, and passive cooling design.",
      "totalPrice": 2100000,
      "pricePerSqFt": 1480,
      "priceNegotiable": true,
      "bhk": ["4 BHK", "5 BHK"],
      "area": "340-520 sqm",
      "possession": "Ready to Move",
      "amenities": "Private pool, Double garage, Beach access, Smart home automation, Solar panels, Rainwater tank, Outdoor entertaining pavilion, Landscaped gardens",
      "images": [
        "https://images.unsplash.com/photo-1613977257363-707ba9348227?w=800",
        "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800",
        "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800"
      ],
      "badges": ["Featured", "Beachside", "Luxury"],
      "lead": "Pinnacle Realty Development Group",
      "coordinates": { "lat": -28.0836, "lng": 153.4517 },
      "mapAddress": "Burleigh Heads, Gold Coast QLD 4220"
    },
    {
      "id": "proj-au-005",
      "name": "Pinnacle Reserve Villas",
      "type": "Villa",
      "status": "Available",
      "city": "Perth",
      "location": "Cottesloe, Perth WA 6011",
      "description": "Mediterranean-inspired luxury villas positioned metres from Cottesloe''s iconic white-sand beach. Pinnacle Reserve Villas offer generous proportions, premium stone finishes, and effortless indoor-outdoor living in one of Perth''s most prestigious coastal enclaves.",
      "totalPrice": 1650000,
      "pricePerSqFt": 1310,
      "priceNegotiable": false,
      "bhk": ["3 BHK", "4 BHK"],
      "area": "280-410 sqm",
      "possession": "Ready to Move",
      "amenities": "Private pool, Alfresco dining, Double garage, Cellar, Landscaped gardens, Solar system, Walk to beach",
      "images": [
        "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800",
        "https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?w=800",
        "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800"
      ],
      "badges": ["Beachside", "Premium"],
      "lead": "Pinnacle Realty Development Group",
      "coordinates": { "lat": -31.9941, "lng": 115.7527 },
      "mapAddress": "Cottesloe, Perth WA 6011"
    },
    {
      "id": "proj-au-006",
      "name": "Pinnacle Estate Land",
      "type": "Plot",
      "status": "Available",
      "city": "Adelaide",
      "location": "Mawson Lakes, Adelaide SA 5095",
      "description": "Premium titled residential lots in Adelaide''s master-planned Mawson Lakes community. Each lot enjoys full council approval, clear title, and transparent legal documentation. Surrounded by parks, quality schools, and the University of South Australia — an ideal foundation for your dream home.",
      "totalPrice": 380000,
      "pricePerSqFt": 420,
      "priceNegotiable": true,
      "bhk": [],
      "area": "420-650 sqm",
      "possession": "Ready to Build",
      "amenities": "Full services connected (water, sewer, NBN, power), Council-approved, Tree-lined streets, Close to parks and schools, Public transport access",
      "images": [
        "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800",
        "https://images.unsplash.com/photo-1448630360428-65456885c650?w=800",
        "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800"
      ],
      "badges": ["Title Clear", "Council Approved"],
      "lead": "Pinnacle Realty Development Group",
      "coordinates": { "lat": -34.8090, "lng": 138.6264 },
      "mapAddress": "Mawson Lakes, Adelaide SA 5095"
    },
    {
      "id": "proj-au-007",
      "name": "Pinnacle Meadows Estate",
      "type": "Plot",
      "status": "Available",
      "city": "Canberra",
      "location": "Googong, Canberra ACT 2620",
      "description": "Spacious residential lots in the award-winning Googong master-planned community on the outskirts of Canberra. Pinnacle Meadows Estate offers rare acreage-adjacent blocks with modern infrastructure, mountain views, and a strong sense of community — ideal for families building long-term.",
      "totalPrice": 440000,
      "pricePerSqFt": 390,
      "priceNegotiable": false,
      "bhk": [],
      "area": "500-900 sqm",
      "possession": "Ready to Build",
      "amenities": "Reticulated services, NBN connected, Parks and playing fields, Community centre, Walking trails, Mountain views",
      "images": [
        "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800",
        "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800",
        "https://images.unsplash.com/photo-1508193638397-1c4234db14d8?w=800"
      ],
      "badges": ["Master Planned", "Mountain Views"],
      "lead": "Pinnacle Realty Development Group",
      "coordinates": { "lat": -35.4341, "lng": 149.2449 },
      "mapAddress": "Googong, Canberra ACT 2620"
    },
    {
      "id": "proj-au-008",
      "name": "Pinnacle Commercial Park",
      "type": "Commercial",
      "status": "Available",
      "city": "Melbourne",
      "location": "Port Melbourne, Melbourne VIC 3207",
      "description": "A-grade commercial suites and office spaces in the thriving Port Melbourne precinct. Pinnacle Commercial Park offers flexible tenancies from boutique studios to entire floor plates, with NCC-compliant fitouts, end-of-trip facilities, and excellent freeway and public transport access.",
      "totalPrice": 950000,
      "pricePerSqFt": 1800,
      "priceNegotiable": true,
      "bhk": [],
      "area": "80-500 sqm",
      "possession": "Ready to Occupy",
      "amenities": "End-of-trip facilities, Secure parking, High-speed fibre, 24/7 access, On-site cafe, Meeting rooms, EV charging",
      "images": [
        "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800",
        "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800",
        "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800"
      ],
      "badges": ["A-Grade", "Commercial"],
      "lead": "Pinnacle Realty Development Group",
      "coordinates": { "lat": -37.8335, "lng": 144.9378 },
      "mapAddress": "Port Melbourne, Melbourne VIC 3207"
    }
  ]'::jsonb
)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- -------------------------------------------------------
-- STEP 2: Insert Sample Clients (Buyers, Sellers, Sold)
-- -------------------------------------------------------
INSERT INTO public.kv_store_64143980 (key, value)
VALUES (
  'clients',
  '[
    {
      "id": "client-au-001",
      "name": "Liam Henderson",
      "email": "liam.henderson@gmail.com",
      "phone": "+61 412 345 678",
      "type": "buyer",
      "status": "green",
      "location": "Sydney, NSW",
      "projectsInterested": ["proj-au-001", "proj-au-003"],
      "enquiryDate": "2025-11-10",
      "sold": false,
      "source": "website",
      "notes": "Looking for 2-3 BHK apartment in Sydney or Brisbane. Budget up to $1.3M. Prefers waterfront or city-adjacent location."
    },
    {
      "id": "client-au-002",
      "name": "Olivia Marchetti",
      "email": "olivia.marchetti@outlook.com",
      "phone": "+61 423 987 654",
      "type": "buyer",
      "status": "green",
      "location": "Melbourne, VIC",
      "projectsInterested": ["proj-au-002"],
      "enquiryDate": "2025-11-22",
      "sold": false,
      "source": "referral",
      "notes": "First home buyer. Keen on South Yarra apartments. Has pre-approval for $950K. Looking to settle by March 2026."
    },
    {
      "id": "client-au-003",
      "name": "Noah Fitzgerald",
      "email": "n.fitzgerald@email.com.au",
      "phone": "+61 434 112 233",
      "type": "buyer",
      "status": "amber",
      "location": "Gold Coast, QLD",
      "projectsInterested": ["proj-au-004"],
      "enquiryDate": "2025-12-05",
      "sold": false,
      "source": "ad",
      "notes": "Investor buyer interested in Gold Coast beachside villa. Reviewing comparable sales. Follow up scheduled Jan 2026."
    },
    {
      "id": "client-au-004",
      "name": "Ava Thornton",
      "email": "ava.thornton@proton.me",
      "phone": "+61 445 678 901",
      "type": "buyer",
      "status": "amber",
      "location": "Perth, WA",
      "projectsInterested": ["proj-au-005"],
      "enquiryDate": "2025-12-18",
      "sold": false,
      "source": "website",
      "notes": "Relocating from Singapore. Wants Cottesloe villa, budget $1.8M. Decision pending spousal approval."
    },
    {
      "id": "client-au-005",
      "name": "Ethan Kowalski",
      "email": "ethan.k@bigpond.com",
      "phone": "+61 456 321 987",
      "type": "buyer",
      "status": "red",
      "location": "Adelaide, SA",
      "projectsInterested": ["proj-au-006"],
      "enquiryDate": "2026-01-08",
      "sold": false,
      "source": "website",
      "notes": "Land buyer for self-build project. Budget $420K. Not yet pre-approved — early stage enquiry."
    },
    {
      "id": "client-au-006",
      "name": "Isabelle Fontaine",
      "email": "i.fontaine@live.com.au",
      "phone": "+61 467 543 210",
      "type": "buyer",
      "status": "green",
      "location": "Canberra, ACT",
      "projectsInterested": ["proj-au-007"],
      "enquiryDate": "2026-01-15",
      "sold": false,
      "source": "referral",
      "notes": "Family of 4 looking to build in Googong. Very motivated. Pre-approved to $500K for land."
    },
    {
      "id": "client-au-007",
      "name": "Marcus Reid",
      "email": "marcus.reid@corp.com.au",
      "phone": "+61 478 901 234",
      "type": "seller",
      "status": "green",
      "location": "Melbourne, VIC",
      "projectsOwned": ["proj-au-008"],
      "enquiryDate": "2025-10-20",
      "sold": false,
      "source": "direct",
      "notes": "Selling commercial suite in Port Melbourne. Asking $1.05M. Motivated — wants to liquidate by Q2 2026."
    },
    {
      "id": "client-au-008",
      "name": "Chloe Davidson",
      "email": "chloe.d@gmail.com",
      "phone": "+61 489 234 567",
      "type": "seller",
      "status": "amber",
      "location": "Brisbane, QLD",
      "projectsOwned": [],
      "enquiryDate": "2025-11-30",
      "sold": false,
      "source": "website",
      "notes": "Selling a 4BR family home in Ascot, Brisbane. Wants styling and photography done first. Timeline flexible."
    },
    {
      "id": "client-au-009",
      "name": "James Whitfield",
      "email": "j.whitfield@optusnet.com.au",
      "phone": "+61 412 111 222",
      "type": "buyer",
      "status": "green",
      "location": "Sydney, NSW",
      "projectsInterested": ["proj-au-001"],
      "enquiryDate": "2025-08-14",
      "sold": true,
      "source": "referral",
      "notes": "Purchased 2BHK at Pinnacle Harbour Residences. Settlement completed Oct 2025. Very satisfied."
    },
    {
      "id": "client-au-010",
      "name": "Sophie Nguyen",
      "email": "sophie.nguyen@gmail.com",
      "phone": "+61 423 333 444",
      "type": "buyer",
      "status": "green",
      "location": "Melbourne, VIC",
      "projectsInterested": ["proj-au-002"],
      "enquiryDate": "2025-07-03",
      "sold": true,
      "source": "ad",
      "notes": "Purchased 2BHK at Pinnacle Gardens Melbourne. Off-the-plan purchase, settled Dec 2025."
    },
    {
      "id": "client-au-011",
      "name": "Emma Foster",
      "email": "emma.foster@iinet.net.au",
      "phone": "+61 434 555 666",
      "type": "seller",
      "status": "green",
      "location": "Canberra, ACT",
      "projectsOwned": [],
      "enquiryDate": "2025-09-18",
      "sold": true,
      "source": "referral",
      "notes": "Sold 3BR townhouse in Manuka, ACT for $1.15M. Above reserve. Sold via Pinnacle Realty Oct 2025."
    },
    {
      "id": "client-au-012",
      "name": "Ben Lawson",
      "email": "ben.lawson@hotmail.com",
      "phone": "+61 445 777 888",
      "type": "buyer",
      "status": "green",
      "location": "Gold Coast, QLD",
      "projectsInterested": ["proj-au-004"],
      "enquiryDate": "2025-06-25",
      "sold": true,
      "source": "website",
      "notes": "Purchased Pinnacle Ridge Villa — 4BR beachside. Settlement Aug 2025. Now renting it as short-stay."
    }
  ]'::jsonb
)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- -------------------------------------------------------
-- STEP 3: Clear old notifications (reset to empty array)
-- -------------------------------------------------------
INSERT INTO public.kv_store_64143980 (key, value)
VALUES ('notifications', '[]'::jsonb)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- -------------------------------------------------------
-- STEP 4: Verification
-- -------------------------------------------------------
SELECT
  key,
  jsonb_array_length(value) AS record_count
FROM public.kv_store_64143980
WHERE key IN ('projects', 'clients', 'notifications')
ORDER BY key;
