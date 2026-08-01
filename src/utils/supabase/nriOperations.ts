import { supabase } from './client';

export interface NRIEnquiry {
  id: string;
  name: string;
  email: string;
  phone: string;
  current_location: string | null;
  investment_city: string | null;
  investment_budget: string | null;
  property_type: string | null;
  timeline: string | null;
  purpose: string | null;
  requirements: string | null;
  status: string;
  priority: string;
  admin_notes: string | null;
  decline_reason: string | null;
  assigned_to: string | null;
  source: string | null;
  created_at: string;
  updated_at: string;
  last_contacted_at: string | null;
}

/**
 * Initialize the nri_enquiries table (call once on first load)
 */
export async function initializeNRITable() {
  try {
    // Check if table exists by trying to select
    const { error } = await supabase
      .from('nri_enquiries')
      .select('id')
      .limit(1);

    if (error) {
      console.warn('NRI Enquiries table may not exist yet. Please create it in Supabase Dashboard.');
      console.warn('SQL to create table:');
      console.warn(`
CREATE TABLE IF NOT EXISTS nri_enquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  current_location TEXT,
  investment_city TEXT,
  investment_budget TEXT,
  property_type TEXT,
  timeline TEXT,
  purpose TEXT,
  requirements TEXT,
  status TEXT DEFAULT 'new',
  priority TEXT DEFAULT 'medium',
  admin_notes TEXT,
  decline_reason TEXT,
  assigned_to TEXT,
  source TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_contacted_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_nri_enquiries_email ON nri_enquiries(email);
CREATE INDEX IF NOT EXISTS idx_nri_enquiries_phone ON nri_enquiries(phone);
CREATE INDEX IF NOT EXISTS idx_nri_enquiries_status ON nri_enquiries(status);
CREATE INDEX IF NOT EXISTS idx_nri_enquiries_priority ON nri_enquiries(priority);
CREATE INDEX IF NOT EXISTS idx_nri_enquiries_created_at ON nri_enquiries(created_at);

-- Enable Row Level Security
ALTER TABLE nri_enquiries ENABLE ROW LEVEL SECURITY;

-- Create policies for public insert (form submissions)
CREATE POLICY "Allow public insert" ON nri_enquiries
  FOR INSERT TO public
  WITH CHECK (true);

-- Create policies for authenticated read/update/delete (admin)
CREATE POLICY "Allow authenticated read" ON nri_enquiries
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated update" ON nri_enquiries
  FOR UPDATE TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated delete" ON nri_enquiries
  FOR DELETE TO authenticated
  USING (true);
      `);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error initializing NRI enquiries table:', error);
    return false;
  }
}

/**
 * Get all NRI enquiries
 */
export async function getAllNRIEnquiries() {
  const { data, error } = await supabase
    .from('nri_enquiries')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching NRI enquiries:', error);
    throw error;
  }

  return data || [];
}

/**
 * Create a new NRI enquiry
 */
export async function createNRIEnquiry(enquiry: Partial<NRIEnquiry>) {
  const { data, error } = await supabase
    .from('nri_enquiries')
    .insert([enquiry])
    .select()
    .single();

  if (error) {
    console.error('Error creating NRI enquiry:', error);
    throw error;
  }

  return data;
}

/**
 * Update an NRI enquiry
 */
export async function updateNRIEnquiry(id: string, updates: Partial<NRIEnquiry>) {
  const { data, error } = await supabase
    .from('nri_enquiries')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating NRI enquiry:', error);
    throw error;
  }

  return data;
}

/**
 * Delete an NRI enquiry
 */
export async function deleteNRIEnquiry(id: string) {
  const { error } = await supabase
    .from('nri_enquiries')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting NRI enquiry:', error);
    throw error;
  }

  return true;
}

/**
 * Update enquiry status
 */
export async function updateEnquiryStatus(id: string, status: string) {
  return updateNRIEnquiry(id, { status });
}

/**
 * Update enquiry priority
 */
export async function updateEnquiryPriority(id: string, priority: string) {
  return updateNRIEnquiry(id, { priority });
}

/**
 * Update admin notes
 */
export async function updateAdminNotes(id: string, admin_notes: string) {
  return updateNRIEnquiry(id, { admin_notes });
}

/**
 * Mark enquiry as contacted
 */
export async function markAsContacted(id: string) {
  return updateNRIEnquiry(id, { last_contacted_at: new Date().toISOString() });
}
