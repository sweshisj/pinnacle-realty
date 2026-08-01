import { supabase } from './client';

export interface ServicedApartment {
  rooms_total?: number;
  id: string;
  title: string;
  type: string;
  city: string;
  location: string;
  address?: string;
  latitude?: number | null;
  longitude?: number | null;
  sleeps: number;
  bedrooms: number;
  bathrooms: number;
  size_sqft?: number;
  nightly_price?: number;
  weekly_price?: number;
  monthly_price?: number;
  security_deposit?: number;
  cleaning_fee?: number;
  tax_percentage?: number;
  minimum_stay_nights?: number;
  inclusions?: string[];
  housekeeping_frequency?: string;
  wifi_speed?: string;
  has_kitchen?: boolean;
  has_laundry?: boolean;
  has_parking?: boolean;
  has_gym?: boolean;
  has_pool?: boolean;
  has_security?: boolean;
  has_lift?: boolean;
  has_balcony?: boolean;
  has_tv?: boolean;
  amenities?: string[];
  check_in_time?: string;
  check_out_time?: string;
  cancellation_policy?: string;
  smoking_allowed?: boolean;
  pets_allowed?: boolean;
  parties_allowed?: boolean;
  instant_book?: boolean;
  kyc_required?: boolean;
  gst_invoice_available?: boolean;
  main_image?: string;
  images?: string[];
  floor_plan_image?: string;
  video_url?: string;
  is_active?: boolean;
  featured?: boolean;
  highlights?: string[];
  description?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Availability {
  id: string;
  apartment_id: string;
  start_date: string;
  end_date: string;
  status: 'available' | 'blocked' | 'pending' | 'booked';
  booking_id?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Enquiry {
  id: string;
  apartment_id: string;
  guest_name: string;
  email: string;
  phone: string;
  company?: string;
  check_in_date?: string;
  check_out_date?: string;
  guests?: number;
  purpose?: string;
  special_requests?: string;
  status: 'new' | 'contacted' | 'approved' | 'declined' | 'converted';
  admin_notes?: string;
  decline_reason?: string;
  suggested_alternatives?: string[];
  created_at?: string;
  updated_at?: string;
  apartment?: ServicedApartment;
}

export interface Booking {
  id: string;
  apartment_id: string;
  enquiry_id?: string;
  guest_name: string;
  email: string;
  phone: string;
  company?: string;
  check_in_date: string;
  check_out_date: string;
  guests: number;
  total_nights: number;
  base_price: number;
  cleaning_fee?: number;
  tax_amount?: number;
  total_amount: number;
  security_deposit?: number;
  payment_status: 'pending' | 'partial' | 'paid' | 'refunded';
  amount_paid?: number;
  deposit_paid?: number;
  payment_method?: string;
  booking_status: 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled';
  checkin_completed?: boolean;
  checkout_completed?: boolean;
  checkin_notes?: string;
  checkout_notes?: string;
  kyc_required?: boolean;
  kyc_submitted?: boolean;
  kyc_verified?: boolean;
  kyc_documents?: string[];
  created_at?: string;
  updated_at?: string;
  apartment?: ServicedApartment;
}

// Fetch all active serviced apartments
export async function fetchServicedApartments(filters?: {
  city?: string;
  type?: string;
  instant_book?: boolean;
  min_price?: number;
  max_price?: number;
  guests?: number;
}) {
  try {
    let query = supabase
      .from('serviced_apartments')
      .select('*')
      .eq('is_active', true)
      .order('featured', { ascending: false })
      .order('created_at', { ascending: false });

    if (filters?.city) {
      query = query.eq('city', filters.city);
    }
    if (filters?.type) {
      query = query.eq('type', filters.type);
    }
    if (filters?.instant_book !== undefined) {
      query = query.eq('instant_book', filters.instant_book);
    }
    if (filters?.min_price) {
      query = query.gte('nightly_price', filters.min_price);
    }
    if (filters?.max_price) {
      query = query.lte('nightly_price', filters.max_price);
    }
    if (filters?.guests) {
      query = query.gte('sleeps', filters.guests);
    }

    const { data, error } = await query;

    if (error) throw error;
    return { data: data as ServicedApartment[], error: null };
  } catch (error: any) {
    console.error('Error fetching serviced apartments:', error);
    return { data: null, error: error.message };
  }
}

// Fetch single apartment by ID
export async function fetchServicedApartmentById(id: string) {
  try {
    const { data, error } = await supabase
      .from('serviced_apartments')
      .select('*')
      .eq('id', id)
      .eq('is_active', true)
      .single();

    if (error) throw error;
    return { data: data as ServicedApartment, error: null };
  } catch (error: any) {
    console.error('Error fetching apartment:', error);
    return { data: null, error: error.message };
  }
}

// Fetch availability for an apartment
export async function fetchApartmentAvailability(apartmentId: string, startDate?: string, endDate?: string) {
  try {
    let query = supabase
      .from('serviced_apartment_availability')
      .select('*')
      .eq('apartment_id', apartmentId)
      .order('start_date', { ascending: true });

    if (startDate) {
      query = query.gte('end_date', startDate);
    }
    if (endDate) {
      query = query.lte('start_date', endDate);
    }

    const { data, error } = await query;

    if (error) throw error;
    return { data: data as Availability[], error: null };
  } catch (error: any) {
    console.error('Error fetching availability:', error);
    return { data: null, error: error.message };
  }
}

// Create enquiry
export async function createEnquiry(enquiry: Omit<Enquiry, 'id' | 'created_at' | 'updated_at' | 'apartment'>) {
  try {
    console.log('Creating enquiry:', enquiry);
    
    // Insert directly into Supabase table instead of using edge function
    const { data, error } = await supabase
      .from('serviced_apartment_enquiries')
      .insert([enquiry])
      .select()
      .single();

    if (error) throw error;
    
    console.log('Enquiry created successfully:', data);
    return { data: data as Enquiry, error: null };
  } catch (error: any) {
    console.error('Error creating enquiry:', error);
    return { data: null, error: error.message };
  }
}

// ADMIN OPERATIONS

// Fetch all apartments (including inactive)
export async function fetchAllServicedApartments() {
  try {
    const { data, error } = await supabase
      .from('serviced_apartments')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data: data as ServicedApartment[], error: null };
  } catch (error: any) {
    console.error('Error fetching all apartments:', error);
    return { data: null, error: error.message };
  }
}

// Create apartment
export async function createServicedApartment(apartment: Omit<ServicedApartment, 'id' | 'created_at' | 'updated_at'>) {
  try {
    const { data, error } = await supabase
      .from('serviced_apartments')
      .insert([apartment])
      .select()
      .single();

    if (error) throw error;
    return { data: data as ServicedApartment, error: null };
  } catch (error: any) {
    console.error('❌ Error creating apartment:', error);
    return { data: null, error: error.message };
  }
}

// Update apartment
export async function updateServicedApartment(id: string, updates: Partial<ServicedApartment>) {
  try {
    const { data, error } = await supabase
      .from('serviced_apartments')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { data: data as ServicedApartment, error: null };
  } catch (error: any) {
    console.error('❌ Error updating apartment:', error);
    return { data: null, error: error.message };
  }
}

// Delete apartment
export async function deleteServicedApartment(id: string) {
  try {
    const { error } = await supabase
      .from('serviced_apartments')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { error: null };
  } catch (error: any) {
    console.error('❌ Error deleting apartment:', error);
    return { error: error.message };
  }
}

// Fetch all enquiries
export async function fetchAllEnquiries() {
  try {
    const { data, error } = await supabase
      .from('serviced_apartment_enquiries')
      .select(`
        *,
        apartment:serviced_apartments(*)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data: data as Enquiry[], error: null };
  } catch (error: any) {
    console.error('Error fetching enquiries:', error);
    return { data: null, error: error.message };
  }
}

// Update enquiry
export async function updateEnquiry(id: string, updates: Partial<Enquiry>) {
  try {
    const { data, error } = await supabase
      .from('serviced_apartment_enquiries')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select();

    if (error) throw error;
    
    // Check if we got data back
    if (!data || data.length === 0) {
      console.error('❌ Error updating enquiry: No rows returned. This usually means RLS policies are blocking the operation.');
      throw new Error('Update failed - RLS policy may be blocking this operation. Please check database permissions.');
    }
    
    return { data: data[0] as Enquiry, error: null };
  } catch (error: any) {
    console.error('❌ Error updating enquiry:', error);
    return { data: null, error: error.message || 'Failed to update enquiry' };
  }
}

// Create or update availability
export async function upsertAvailability(availability: Omit<Availability, 'id' | 'created_at' | 'updated_at'>) {
  try {
    console.log('📅 upsertAvailability called with:', availability);
    
    // Step 1: Fetch all overlapping availability entries
    const { data: overlapping, error: fetchError } = await supabase
      .from('serviced_apartment_availability')
      .select('*')
      .eq('apartment_id', availability.apartment_id)
      .or(`and(start_date.lte.${availability.end_date},end_date.gte.${availability.start_date})`);

    if (fetchError) {
      console.warn('Warning: Could not fetch overlapping availability:', fetchError);
    }

    console.log('📊 Found overlapping entries:', overlapping);

    // Step 2: Process overlapping entries - split them if needed
    if (overlapping && overlapping.length > 0) {
      for (const existing of overlapping) {
        // Parse dates as local dates to avoid timezone issues
        const existingStart = existing.start_date; // Keep as string
        const existingEnd = existing.end_date; // Keep as string
        const newStart = availability.start_date; // Keep as string
        const newEnd = availability.end_date; // Keep as string

        console.log('🔍 Processing overlap:', {
          existing: `${existingStart} to ${existingEnd}`,
          new: `${newStart} to ${newEnd}`
        });

        // Delete the existing entry - we'll recreate parts if needed
        await supabase
          .from('serviced_apartment_availability')
          .delete()
          .eq('id', existing.id);

        // Case 1: Existing range starts before new range
        // Create a new entry from existingStart to (newStart - 1 day)
        if (existingStart < newStart) {
          // Calculate the day before newStart
          const newStartDate = new Date(newStart + 'T00:00:00');
          newStartDate.setDate(newStartDate.getDate() - 1);
          const beforeEndDate = newStartDate.toISOString().split('T')[0];
          
          console.log('✂️ Creating before segment:', existingStart, 'to', beforeEndDate);
          
          await supabase
            .from('serviced_apartment_availability')
            .insert([{
              apartment_id: existing.apartment_id,
              start_date: existingStart,
              end_date: beforeEndDate,
              status: existing.status,
              notes: existing.notes
            }]);
        }

        // Case 2: Existing range extends beyond new range
        // Create a new entry from (newEnd + 1 day) to existingEnd
        if (existingEnd > newEnd) {
          // Calculate the day after newEnd
          const newEndDate = new Date(newEnd + 'T00:00:00');
          newEndDate.setDate(newEndDate.getDate() + 1);
          const afterStartDate = newEndDate.toISOString().split('T')[0];
          
          console.log('✂️ Creating after segment:', afterStartDate, 'to', existingEnd);
          
          await supabase
            .from('serviced_apartment_availability')
            .insert([{
              apartment_id: existing.apartment_id,
              start_date: afterStartDate,
              end_date: existingEnd,
              status: existing.status,
              notes: existing.notes
            }]);
        }
      }
    }

    // Step 3: Insert the new availability
    console.log('✅ Inserting new availability:', availability);
    const { data, error } = await supabase
      .from('serviced_apartment_availability')
      .insert([availability])
      .select()
      .single();

    if (error) throw error;
    console.log('✅ Availability created successfully:', data);
    return { data: data as Availability, error: null };
  } catch (error: any) {
    console.error('❌ Error creating availability:', error);
    return { data: null, error: error.message };
  }
}

// Delete availability
export async function deleteAvailability(id: string) {
  try {
    const { error } = await supabase
      .from('serviced_apartment_availability')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { error: null };
  } catch (error: any) {
    console.error('Error deleting availability:', error);
    return { error: error.message };
  }
}

// Fetch all bookings
export async function fetchAllBookings() {
  try {
    const { data, error } = await supabase
      .from('serviced_apartment_bookings')
      .select(`
        *,
        apartment:serviced_apartments(*)
      `)
      .order('check_in_date', { ascending: true });

    if (error) throw error;
    return { data: data as Booking[], error: null };
  } catch (error: any) {
    console.error('Error fetching bookings:', error);
    return { data: null, error: error.message };
  }
}

// Create booking
export async function createBooking(booking: Omit<Booking, 'id' | 'created_at' | 'updated_at' | 'apartment'>) {
  try {
    const { data, error } = await supabase
      .from('serviced_apartment_bookings')
      .insert([booking])
      .select()
      .single();

    if (error) throw error;
    return { data: data as Booking, error: null };
  } catch (error: any) {
    console.error('Error creating booking:', error);
    return { data: null, error: error.message };
  }
}

// Update booking
export async function updateBooking(id: string, updates: Partial<Booking>) {
  try {
    const { data, error } = await supabase
      .from('serviced_apartment_bookings')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { data: data as Booking, error: null };
  } catch (error: any) {
    console.error('Error updating booking:', error);
    return { data: null, error: error.message };
  }
}

// Delete enquiry
export async function deleteEnquiry(id: string) {
  try {
    const { error } = await supabase
      .from('serviced_apartment_enquiries')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { error: null };
  } catch (error: any) {
    console.error('❌ Error deleting enquiry:', error);
    return { error: error.message };
  }
}

// Delete booking
export async function deleteBooking(id: string) {
  try {
    const { error } = await supabase
      .from('serviced_apartment_bookings')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { error: null };
  } catch (error: any) {
    console.error('❌ Error deleting booking:', error);
    return { error: error.message };
  }
}