import { supabase } from './client';

export interface Lead {
  id: string;
  propertyName: string;
  type: string;
  location: string;
  city: string;
  imageUrl: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  description: string;
  status: string;
}

export interface Buyer {
  id: string;
  name: string;
  leads: Lead[];
  created_at?: string;
  updated_at?: string;
}

/**
 * Initialize the adminbuyers table (call once on first load)
 */
export async function initializeBuyersTable() {
  try {
    // Check if table exists by trying to select
    const { error } = await supabase
      .from('adminbuyers')
      .select('id')
      .limit(1);

    if (error) {
      console.warn('Table may not exist yet. Please create it in Supabase Dashboard.');
      console.warn('SQL to create table:');
      console.warn(`
CREATE TABLE IF NOT EXISTS adminbuyers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  leads JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_adminbuyers_name ON adminbuyers(name);
CREATE INDEX IF NOT EXISTS idx_adminbuyers_created_at ON adminbuyers(created_at);
      `);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error initializing buyers table:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get all buyers
 */
export async function getAllBuyers(): Promise<{ success: boolean; data?: Buyer[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('adminbuyers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching buyers:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data as Buyer[] };
  } catch (error: any) {
    console.error('Error fetching buyers:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get a single buyer by ID
 */
export async function getBuyerById(id: string): Promise<{ success: boolean; data?: Buyer; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('adminbuyers')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching buyer:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data as Buyer };
  } catch (error: any) {
    console.error('Error fetching buyer:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Create a new buyer
 */
export async function createBuyer(buyer: Omit<Buyer, 'created_at' | 'updated_at'>): Promise<{ success: boolean; data?: Buyer; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('adminbuyers')
      .insert([{
        id: buyer.id,
        name: buyer.name,
        leads: buyer.leads || [],
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating buyer:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data as Buyer };
  } catch (error: any) {
    console.error('Error creating buyer:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Update a buyer
 */
export async function updateBuyer(id: string, updates: Partial<Omit<Buyer, 'id' | 'created_at' | 'updated_at'>>): Promise<{ success: boolean; data?: Buyer; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('adminbuyers')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating buyer:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data as Buyer };
  } catch (error: any) {
    console.error('Error updating buyer:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Delete a buyer
 */
export async function deleteBuyer(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('adminbuyers')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting buyer:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error deleting buyer:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Add a lead to a buyer
 */
export async function addLeadToBuyer(buyerId: string, lead: Lead): Promise<{ success: boolean; data?: Buyer; error?: string }> {
  try {
    // First get the buyer
    const buyerResult = await getBuyerById(buyerId);
    if (!buyerResult.success || !buyerResult.data) {
      return { success: false, error: buyerResult.error || 'Buyer not found' };
    }

    const buyer = buyerResult.data;
    const updatedLeads = [...(buyer.leads || []), lead];

    // Update the buyer with the new leads array
    return await updateBuyer(buyerId, { leads: updatedLeads });
  } catch (error: any) {
    console.error('Error adding lead to buyer:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Update a lead within a buyer
 */
export async function updateLead(buyerId: string, leadId: string, updates: Partial<Lead>): Promise<{ success: boolean; data?: Buyer; error?: string }> {
  try {
    // First get the buyer
    const buyerResult = await getBuyerById(buyerId);
    if (!buyerResult.success || !buyerResult.data) {
      return { success: false, error: buyerResult.error || 'Buyer not found' };
    }

    const buyer = buyerResult.data;
    const updatedLeads = (buyer.leads || []).map(lead =>
      lead.id === leadId ? { ...lead, ...updates } : lead
    );

    // Update the buyer with the updated leads array
    return await updateBuyer(buyerId, { leads: updatedLeads });
  } catch (error: any) {
    console.error('Error updating lead:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Delete a lead from a buyer
 */
export async function deleteLeadFromBuyer(buyerId: string, leadId: string): Promise<{ success: boolean; data?: Buyer; error?: string }> {
  try {
    // First get the buyer
    const buyerResult = await getBuyerById(buyerId);
    if (!buyerResult.success || !buyerResult.data) {
      return { success: false, error: buyerResult.error || 'Buyer not found' };
    }

    const buyer = buyerResult.data;
    const updatedLeads = (buyer.leads || []).filter(lead => lead.id !== leadId);

    // Update the buyer with the filtered leads array
    return await updateBuyer(buyerId, { leads: updatedLeads });
  } catch (error: any) {
    console.error('Error deleting lead from buyer:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Migrate data from localStorage to Supabase
 */
export async function migrateLocalStorageToBuyers(): Promise<{ success: boolean; count?: number; error?: string }> {
  try {
    const stored = localStorage.getItem('buyersData');
    if (!stored) {
      return { success: true, count: 0 };
    }

    const buyers: Buyer[] = JSON.parse(stored);
    let successCount = 0;

    for (const buyer of buyers) {
      const result = await createBuyer(buyer);
      if (result.success) {
        successCount++;
      } else {
        console.error(`Failed to migrate buyer ${buyer.name}:`, result.error);
      }
    }

    return { success: true, count: successCount };
  } catch (error: any) {
    console.error('Error migrating localStorage data:', error);
    return { success: false, error: error.message };
  }
}
