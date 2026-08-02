/**
 * ────────────────────────────────────────────────────────────────
 *  BRAND CONFIGURATION
 *
 *  Edit this ONE file to rebrand the entire site for a new client:
 *  company name, logo initials, contact details, cities, default
 *  map position and primary colour. Every component reads from
 *  here — no other code changes are needed for a rebrand.
 * ────────────────────────────────────────────────────────────────
 */

export const brand = {
  /** Company name — shown in the navbar, headings, admin and browser tab */
  name: "Pinnacle Realty",

  /** Two-letter mark shown in the navbar logo square */
  initials: "PR",

  /** Prefix for Excel export file names (letters/numbers only, no spaces) */
  exportPrefix: "PinnacleRealty",

  /** User-Agent sent with OpenStreetMap / Nominatim geocoding requests */
  userAgent: "PinnacleRealty/1.0",

  contact: {
    /** Mobile / primary contact number shown on property pages */
    phone: "+61 400 123 456",
    /** Office landline shown on the About Us contact card */
    officePhone: "+61 3 9XXX XXXX",
    /** General enquiries email */
    email: "info@pinnaclerealty.com",
    /** Secondary email (used by the dormant Elite/overseas-buyers page) */
    secondaryEmail: "nri@pinnaclerealty.com",
    /** Location line shown on contact cards */
    location: "Victoria, Australia",
  },

  /** Cities used as examples in admin form placeholders */
  cities: ["Melbourne", "Sydney", "Brisbane", "Perth", "Adelaide"],

  /** Default map position when a property has no coordinates (Melbourne CBD) */
  map: {
    lat: -37.8136,
    lng: 144.9631,
  },

  /** Primary brand colour — exposed globally as the CSS variable --brand-primary */
  colors: {
    primary: "#16a34a", // Tailwind green-600
  },
};
