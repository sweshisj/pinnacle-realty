import { supabase } from './client';

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface ICalFeed {
  id: string;
  sa_id: string;
  name: string;
  platform: 'airbnb' | 'booking.com' | 'other';
  ical_url: string;
  color: string;
  is_active: boolean;
  last_synced_at?: string;
  next_sync_at?: string;
  sync_frequency_minutes: number;
  last_error?: string;
  rooms_per_event: number;
  created_at?: string;
  updated_at?: string;
}

export interface ICalEvent {
  id: string;
  sa_id: string;
  feed_id: string;
  event_uid: string;
  title?: string;
  start_date: string;
  end_date: string;
  rooms_reserved: number;
  raw_ical_data?: any;
  created_at?: string;
  updated_at?: string;
  feed?: ICalFeed;
}

export interface AvailabilityBlock {
  id: string;
  sa_id: string;
  start_date: string;
  end_date: string;
  block_type: 'full' | 'partial';
  rooms_blocked?: number;
  reason?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface InternalBooking {
  id: string;
  sa_id: string;
  guest_name: string;
  guest_email?: string;
  guest_phone?: string;
  reference_number?: string;
  start_date: string;
  end_date: string;
  rooms_booked: number;
  status: 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled';
  total_amount?: number;
  amount_paid?: number;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface DailyCapacity {
  date: string;
  rooms_total: number;
  rooms_from_ical: number;
  rooms_from_internal: number;
  rooms_from_partial_blocks: number;
  has_full_block: boolean;
  capacity_remaining: number;
  is_unavailable: boolean;
}

export interface EnquiryCount {
  date: string;
  requested_count: number;
  approved_count: number;
}

// ============================================
// ICAL FEEDS OPERATIONS
// ============================================

export async function fetchICalFeeds(saId: string) {
  try {
    const { data, error } = await supabase
      .from('serviced_apartment_ical_feeds')
      .select('*')
      .eq('sa_id', saId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data: data as ICalFeed[], error: null };
  } catch (error: any) {
    console.error('Error fetching iCal feeds:', error);
    return { data: null, error: error.message };
  }
}

export async function createICalFeed(feed: Omit<ICalFeed, 'id' | 'created_at' | 'updated_at'>) {
  try {
    const { data, error } = await supabase
      .from('serviced_apartment_ical_feeds')
      .insert([feed])
      .select()
      .single();

    if (error) throw error;
    return { data: data as ICalFeed, error: null };
  } catch (error: any) {
    console.error('Error creating iCal feed:', error);
    return { data: null, error: error.message };
  }
}

export async function updateICalFeed(id: string, updates: Partial<ICalFeed>) {
  try {
    const { data, error } = await supabase
      .from('serviced_apartment_ical_feeds')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { data: data as ICalFeed, error: null };
  } catch (error: any) {
    console.error('Error updating iCal feed:', error);
    return { data: null, error: error.message };
  }
}

export async function deleteICalFeed(id: string) {
  try {
    const { error } = await supabase
      .from('serviced_apartment_ical_feeds')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { error: null };
  } catch (error: any) {
    console.error('Error deleting iCal feed:', error);
    return { error: error.message };
  }
}

// ============================================
// ICAL EVENTS OPERATIONS
// ============================================

export async function fetchICalEvents(saId: string, startDate?: string, endDate?: string) {
  try {
    let query = supabase
      .from('serviced_apartment_ical_events')
      .select(`
        *,
        feed:serviced_apartment_ical_feeds(*)
      `)
      .eq('sa_id', saId);

    if (startDate) {
      query = query.gte('end_date', startDate);
    }
    if (endDate) {
      query = query.lte('start_date', endDate);
    }

    query = query.order('start_date', { ascending: true });

    const { data, error } = await query;

    if (error) throw error;
    return { data: data as ICalEvent[], error: null };
  } catch (error: any) {
    console.error('Error fetching iCal events:', error);
    return { data: null, error: error.message };
  }
}

export async function syncICalFeed(feedId: string): Promise<{ success: boolean; error?: string; eventsCount?: number }> {
  try {
    // This would call a backend function to parse iCal and import events
    // For now, return a mock response
    // In production, this should call an edge function or API endpoint
    
    // Update last_synced_at
    await updateICalFeed(feedId, {
      last_synced_at: new Date().toISOString(),
      next_sync_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      last_error: undefined,
    });

    return { success: true, eventsCount: 0 };
  } catch (error: any) {
    console.error('Error syncing iCal feed:', error);
    return { success: false, error: error.message };
  }
}

// ============================================
// AVAILABILITY BLOCKS OPERATIONS
// ============================================

export async function fetchAvailabilityBlocks(saId: string, startDate?: string, endDate?: string) {
  try {
    let query = supabase
      .from('serviced_apartment_availability_blocks')
      .select('*')
      .eq('sa_id', saId);

    if (startDate) {
      query = query.gte('end_date', startDate);
    }
    if (endDate) {
      query = query.lte('start_date', endDate);
    }

    query = query.order('start_date', { ascending: true });

    const { data, error } = await query;

    if (error) throw error;
    return { data: data as AvailabilityBlock[], error: null };
  } catch (error: any) {
    console.error('Error fetching availability blocks:', error);
    return { data: null, error: error.message };
  }
}

export async function createAvailabilityBlock(block: Omit<AvailabilityBlock, 'id' | 'created_at' | 'updated_at'>) {
  try {
    const { data, error } = await supabase
      .from('serviced_apartment_availability_blocks')
      .insert([block])
      .select()
      .single();

    if (error) throw error;
    return { data: data as AvailabilityBlock, error: null };
  } catch (error: any) {
    console.error('Error creating availability block:', error);
    return { data: null, error: error.message };
  }
}

export async function updateAvailabilityBlock(id: string, updates: Partial<AvailabilityBlock>) {
  try {
    const { data, error } = await supabase
      .from('serviced_apartment_availability_blocks')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { data: data as AvailabilityBlock, error: null };
  } catch (error: any) {
    console.error('Error updating availability block:', error);
    return { data: null, error: error.message };
  }
}

export async function deleteAvailabilityBlock(id: string) {
  try {
    const { error } = await supabase
      .from('serviced_apartment_availability_blocks')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { error: null };
  } catch (error: any) {
    console.error('Error deleting availability block:', error);
    return { error: error.message };
  }
}

// ============================================
// INTERNAL BOOKINGS OPERATIONS
// ============================================

export async function fetchInternalBookings(saId: string, startDate?: string, endDate?: string) {
  try {
    let query = supabase
      .from('serviced_apartment_internal_bookings')
      .select('*')
      .eq('sa_id', saId);

    if (startDate) {
      query = query.gte('end_date', startDate);
    }
    if (endDate) {
      query = query.lte('start_date', endDate);
    }

    query = query.order('start_date', { ascending: true });

    const { data, error } = await query;

    if (error) throw error;
    return { data: data as InternalBooking[], error: null };
  } catch (error: any) {
    console.error('Error fetching internal bookings:', error);
    return { data: null, error: error.message };
  }
}

export async function createInternalBooking(booking: Omit<InternalBooking, 'id' | 'created_at' | 'updated_at'>) {
  try {
    const { data, error } = await supabase
      .from('serviced_apartment_internal_bookings')
      .insert([booking])
      .select()
      .single();

    if (error) throw error;
    return { data: data as InternalBooking, error: null };
  } catch (error: any) {
    console.error('Error creating internal booking:', error);
    return { data: null, error: error.message };
  }
}

export async function updateInternalBooking(id: string, updates: Partial<InternalBooking>) {
  try {
    const { data, error } = await supabase
      .from('serviced_apartment_internal_bookings')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { data: data as InternalBooking, error: null };
  } catch (error: any) {
    console.error('Error updating internal booking:', error);
    return { data: null, error: error.message };
  }
}

export async function deleteInternalBooking(id: string) {
  try {
    const { error } = await supabase
      .from('serviced_apartment_internal_bookings')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { error: null };
  } catch (error: any) {
    console.error('Error deleting internal booking:', error);
    return { error: error.message };
  }
}

// ============================================
// CAPACITY CALCULATION
// ============================================

export async function fetchDailyCapacity(saId: string, date: string): Promise<{ data: DailyCapacity | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .rpc('calculate_daily_capacity', {
        p_sa_id: saId,
        p_date: date,
      });

    if (error) throw error;
    return { data: data?.[0] || null, error: null };
  } catch (error: any) {
    console.error('Error fetching daily capacity:', error);
    return { data: null, error: error.message };
  }
}

export async function fetchCapacityRange(saId: string, startDate: string, endDate: string): Promise<{ data: DailyCapacity[] | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .rpc('get_capacity_range', {
        p_sa_id: saId,
        p_start_date: startDate,
        p_end_date: endDate,
      });

    if (error) throw error;
    return { data: data as DailyCapacity[], error: null };
  } catch (error: any) {
    console.error('Error fetching capacity range:', error);
    return { data: null, error: error.message };
  }
}

export async function fetchEnquiryCountsPerDay(saId: string, startDate: string, endDate: string): Promise<{ data: EnquiryCount[] | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .rpc('get_enquiry_counts_per_day', {
        p_sa_id: saId,
        p_start_date: startDate,
        p_end_date: endDate,
      });

    if (error) throw error;
    return { data: data as EnquiryCount[], error: null };
  } catch (error: any) {
    console.error('Error fetching enquiry counts:', error);
    return { data: null, error: error.message };
  }
}

// ============================================
// EXPORT ICAL URL
// ============================================

export function getExportICalUrl(saId: string): string {
  // This would be an edge function endpoint that generates iCal feed
  // For now, return a placeholder
  return `${window.location.origin}/api/ical-export/${saId}`;
}
