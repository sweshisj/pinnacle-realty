// API functions for serviced apartment enquiries and availability
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { supabase } from '../utils/supabase/client';

export interface Enquiry {
  id: string;
  sa_id: string;
  guest_name: string;
  guest_email: string;
  guest_phone?: string;
  start_date: string; // ISO date string (YYYY-MM-DD)
  end_date: string; // ISO date string (YYYY-MM-DD)
  status: 'requested' | 'approved' | 'declined';
  adults: number;
  children: number;
  notes?: string;
  admin_notes?: string;
  created_by_admin?: boolean; // Flag to identify admin-created bookings
  created_at: string;
  updated_at: string;
}

export interface AvailabilityBlock {
  id: string;
  sa_id: string;
  start_date: string; // ISO date string (YYYY-MM-DD)
  end_date: string; // ISO date string (YYYY-MM-DD)
  status: 'unavailable';
  reason: 'admin_block' | 'maintenance' | 'sold_out' | 'event';
  created_by?: string;
  notes?: string;
  created_at: string;
}

export interface DayAvailability {
  date: string; // ISO date string (YYYY-MM-DD)
  is_unavailable: boolean;
  approved_count: number;
}

// Helper to get API base URL
const getApiUrl = (path: string) => {
  const url = `https://${projectId}.supabase.co/functions/v1/make-server-64143980${path}`;
  console.log('API URL:', url); // Debug log
  return url;
};

// Helper to get headers with auth
const getHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${publicAnonKey}`,
});

// Enquiry functions
export async function createEnquiry(data: {
  sa_id: string;
  guest_name: string;
  guest_email: string;
  guest_phone?: string;
  start_date: string;
  end_date: string;
  adults?: number;
  children?: number;
  notes?: string;
}): Promise<Enquiry> {
  const response = await fetch(getApiUrl('/api/enquiries'), {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create enquiry');
  }
  
  return response.json();
}

export async function getEnquiries(params: {
  sa_id?: string;
  status?: 'requested' | 'approved' | 'declined';
}): Promise<Enquiry[]> {
  const searchParams = new URLSearchParams();
  if (params.sa_id) searchParams.set('sa_id', params.sa_id);
  if (params.status) searchParams.set('status', params.status);
  
  const response = await fetch(getApiUrl(`/api/enquiries?${searchParams}`), {
    headers: getHeaders(),
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch enquiries');
  }
  
  return response.json();
}

export async function approveEnquiry(id: string, admin_notes?: string): Promise<Enquiry> {
  const response = await fetch(getApiUrl(`/api/enquiries/${id}/approve`), {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ admin_notes }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to approve enquiry');
  }
  
  return response.json();
}

export async function declineEnquiry(id: string, admin_notes?: string): Promise<Enquiry> {
  const response = await fetch(getApiUrl(`/api/enquiries/${id}/decline`), {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ admin_notes }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to decline enquiry');
  }
  
  return response.json();
}

export async function updateEnquiry(id: string, data: Partial<Enquiry>): Promise<Enquiry> {
  const response = await fetch(getApiUrl(`/api/enquiries/${id}`), {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update enquiry');
  }
  
  return response.json();
}

export async function deleteEnquiry(id: string): Promise<void> {
  const response = await fetch(getApiUrl(`/api/enquiries/${id}`), {
    method: 'DELETE',
    headers: getHeaders(),
  });
  
  if (!response.ok) {
    throw new Error('Failed to delete enquiry');
  }
}

// Create a manual approved enquiry (for admin use)
export async function createManualEnquiry(data: {
  sa_id: string;
  guest_name: string;
  start_date: string;
  end_date: string;
  notes?: string;
}): Promise<Enquiry> {
  try {
    // Create the enquiry directly as approved with admin flag
    const response = await fetch(getApiUrl('/api/enquiries'), {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        sa_id: data.sa_id,
        guest_name: data.guest_name,
        guest_email: 'admin@greencarpet.com', // Default email for manual entries
        start_date: data.start_date,
        end_date: data.end_date,
        status: 'approved', // Create directly as approved
        notes: data.notes || 'Manually created by admin',
        admin_notes: 'Admin-created booking',
        created_by_admin: true, // Flag to identify admin-created bookings
        adults: 1, // Default values
        children: 0,
      }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      console.error('Failed to create manual enquiry:', error);
      throw new Error(error.message || 'Failed to create manual enquiry');
    }
    
    const enquiry = await response.json();
    console.log('Manual enquiry created as approved:', enquiry);
    return enquiry;
  } catch (error: any) {
    console.error('Error creating manual enquiry:', error);
    throw new Error(error.message || 'Failed to create manual enquiry');
  }
}

// Availability block functions
export async function createAvailabilityBlock(data: {
  sa_id: string;
  start_date: string;
  end_date: string;
  reason: 'admin_block' | 'maintenance' | 'sold_out' | 'event';
  notes?: string;
  created_by?: string;
}): Promise<AvailabilityBlock> {
  const response = await fetch(getApiUrl('/api/availability-blocks'), {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create availability block');
  }
  
  return response.json();
}

export async function getAvailabilityBlocks(sa_id: string): Promise<AvailabilityBlock[]> {
  const response = await fetch(getApiUrl(`/api/availability-blocks?sa_id=${sa_id}`), {
    headers: getHeaders(),
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch availability blocks');
  }
  
  return response.json();
}

export async function deleteAvailabilityBlock(id: string): Promise<void> {
  const response = await fetch(getApiUrl(`/api/availability-blocks/${id}`), {
    method: 'DELETE',
    headers: getHeaders(),
  });
  
  if (!response.ok) {
    throw new Error('Failed to delete availability block');
  }
}

// Calendar availability functions
export async function getAdminAvailability(params: {
  sa_id: string;
  from_date: string; // ISO date string (YYYY-MM-DD)
  to_date: string; // ISO date string (YYYY-MM-DD)
}): Promise<DayAvailability[]> {
  const searchParams = new URLSearchParams(params);
  const response = await fetch(getApiUrl(`/api/admin/availability?${searchParams}`), {
    headers: getHeaders(),
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch admin availability');
  }
  
  return response.json();
}

export async function getClientAvailability(params: {
  sa_id: string;
  from_date: string; // ISO date string (YYYY-MM-DD)
  to_date: string; // ISO date string (YYYY-MM-DD)
}): Promise<{ date: string; is_unavailable: boolean }[]> {
  const searchParams = new URLSearchParams(params);
  const response = await fetch(getApiUrl(`/api/calendar/client?${searchParams}`), {
    headers: getHeaders(),
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch client availability');
  }
  
  return response.json();
}

// Helper function to check if a date range is unavailable
export async function isDateRangeUnavailable(
  sa_id: string,
  start_date: string,
  end_date: string
): Promise<boolean> {
  const response = await fetch(getApiUrl('/api/check-availability'), {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ sa_id, start_date, end_date }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to check availability');
  }
  
  const data = await response.json();
  return data.is_unavailable;
}