-- Serviced Apartments Enquiries and Availability System
-- Simple enquiry-based model without complex booking logic

-- Enquiries table (replaces bookings)
CREATE TABLE IF NOT EXISTS enquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sa_id UUID NOT NULL REFERENCES serviced_apartments(id) ON DELETE CASCADE,
  
  -- Guest information
  guest_name TEXT NOT NULL,
  guest_email TEXT NOT NULL,
  guest_phone TEXT,
  
  -- Requested dates (date-only, half-open interval [start_date, end_date))
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  
  -- Status: requested, approved, declined
  status TEXT NOT NULL DEFAULT 'requested' CHECK (status IN ('requested', 'approved', 'declined')),
  
  -- Additional info
  adults INTEGER DEFAULT 1,
  children INTEGER DEFAULT 0,
  notes TEXT,
  admin_notes TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_dates CHECK (end_date > start_date)
);

-- Availability blocks (admin-controlled unavailability)
CREATE TABLE IF NOT EXISTS availability_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sa_id UUID NOT NULL REFERENCES serviced_apartments(id) ON DELETE CASCADE,
  
  -- Date range (date-only, half-open interval [start_date, end_date))
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  
  -- Always 'unavailable' for this simple model
  status TEXT NOT NULL DEFAULT 'unavailable' CHECK (status = 'unavailable'),
  
  -- Reason for unavailability
  reason TEXT NOT NULL DEFAULT 'admin_block' CHECK (reason IN ('admin_block', 'maintenance', 'sold_out', 'event')),
  
  -- Metadata
  created_by TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_dates CHECK (end_date > start_date)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_enquiries_sa_id ON enquiries(sa_id);
CREATE INDEX IF NOT EXISTS idx_enquiries_status ON enquiries(status);
CREATE INDEX IF NOT EXISTS idx_enquiries_dates ON enquiries(sa_id, start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_availability_blocks_sa_id ON availability_blocks(sa_id);
CREATE INDEX IF NOT EXISTS idx_availability_blocks_dates ON availability_blocks(sa_id, start_date, end_date);

-- Function to get daily counters for approved enquiries
CREATE OR REPLACE FUNCTION get_approved_enquiry_counts(
  p_sa_id UUID,
  p_from_date DATE,
  p_to_date DATE
)
RETURNS TABLE (
  date DATE,
  approved_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    d::DATE AS date,
    COUNT(e.id)::INTEGER AS approved_count
  FROM generate_series(p_from_date, p_to_date - INTERVAL '1 day', INTERVAL '1 day') d
  LEFT JOIN enquiries e
    ON e.sa_id = p_sa_id
    AND e.status = 'approved'
    AND d::DATE >= e.start_date
    AND d::DATE < e.end_date
  GROUP BY d::DATE
  ORDER BY d::DATE;
END;
$$ LANGUAGE plpgsql;

-- Function to check if a date range is unavailable
CREATE OR REPLACE FUNCTION is_date_range_unavailable(
  p_sa_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS BOOLEAN AS $$
DECLARE
  v_has_block BOOLEAN;
BEGIN
  -- Check if any availability block overlaps with the requested range
  SELECT EXISTS(
    SELECT 1
    FROM availability_blocks
    WHERE sa_id = p_sa_id
      AND status = 'unavailable'
      AND NOT (end_date <= p_start_date OR start_date >= p_end_date)
  ) INTO v_has_block;
  
  RETURN v_has_block;
END;
$$ LANGUAGE plpgsql;

-- Function to get availability status for date range
CREATE OR REPLACE FUNCTION get_availability_status(
  p_sa_id UUID,
  p_from_date DATE,
  p_to_date DATE
)
RETURNS TABLE (
  date DATE,
  is_unavailable BOOLEAN,
  approved_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  WITH date_series AS (
    SELECT d::DATE AS date
    FROM generate_series(p_from_date, p_to_date - INTERVAL '1 day', INTERVAL '1 day') d
  ),
  unavailable_dates AS (
    SELECT DISTINCT d.date
    FROM date_series d
    INNER JOIN availability_blocks ab
      ON ab.sa_id = p_sa_id
      AND ab.status = 'unavailable'
      AND d.date >= ab.start_date
      AND d.date < ab.end_date
  ),
  approved_counts AS (
    SELECT 
      d.date,
      COUNT(e.id)::INTEGER AS count
    FROM date_series d
    LEFT JOIN enquiries e
      ON e.sa_id = p_sa_id
      AND e.status = 'approved'
      AND d.date >= e.start_date
      AND d.date < e.end_date
    GROUP BY d.date
  )
  SELECT 
    ds.date,
    (ud.date IS NOT NULL) AS is_unavailable,
    COALESCE(ac.count, 0)::INTEGER AS approved_count
  FROM date_series ds
  LEFT JOIN unavailable_dates ud ON ds.date = ud.date
  LEFT JOIN approved_counts ac ON ds.date = ac.date
  ORDER BY ds.date;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at on enquiries
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enquiries_updated_at
  BEFORE UPDATE ON enquiries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
