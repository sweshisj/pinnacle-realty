import { supabase } from './client';

// Timezone for Australia (Melbourne)
const TIMEZONE = 'Australia/Melbourne';

// Policy times
export const DEFAULT_CHECKIN_TIME = '14:00';
export const DEFAULT_CHECKOUT_TIME = '10:00';
export const HOLD_DURATION_HOURS = 24;

export interface BookingConflict {
  has_conflict: boolean;
  conflict_type?: string;
  conflict_booking_id?: string;
  conflict_start?: string;
  conflict_end?: string;
}

export interface BookingQuote {
  total_nights: number;
  base_price: number;
  cleaning_fee: number;
  tax_amount: number;
  early_checkin_fee: number;
  late_checkout_fee: number;
  total_amount: number;
  security_deposit: number;
  available: boolean;
  conflict_reason?: string;
}

export interface AvailableDate {
  date: string;
  available: boolean;
  checkin_eligible: boolean;
  checkout_only: boolean;
  reason?: string;
}

/**
 * Convert a date string to a datetime with check-in time (14:00)
 */
export function convertToCheckInDateTime(dateStr: string, customTime?: string): string {
  const time = customTime || DEFAULT_CHECKIN_TIME;
  return `${dateStr}T${time}:00+05:30`;
}

/**
 * Convert a date string to a datetime with check-out time (10:00)
 */
export function convertToCheckOutDateTime(dateStr: string, customTime?: string): string {
  const time = customTime || DEFAULT_CHECKOUT_TIME;
  return `${dateStr}T${time}:00+05:30`;
}

/**
 * Calculate hold expiration time (24 hours from now)
 */
export function calculateHoldExpiration(hours: number = HOLD_DURATION_HOURS): string {
  const now = new Date();
  now.setHours(now.getHours() + hours);
  return now.toISOString();
}

/**
 * Check for booking conflicts using the database function
 */
export async function checkBookingConflict(
  apartmentId: string,
  checkInAt: string,
  checkOutAt: string,
  cleaningBufferBefore: number = 0,
  cleaningBufferAfter: number = 0,
  excludeBookingId?: string
): Promise<{ conflicts: BookingConflict[]; error: string | null }> {
  try {
    const { data, error } = await supabase.rpc('check_booking_conflict', {
      p_apartment_id: apartmentId,
      p_check_in_at: checkInAt,
      p_check_out_at: checkOutAt,
      p_cleaning_buffer_before_minutes: cleaningBufferBefore,
      p_cleaning_buffer_after_minutes: cleaningBufferAfter,
      p_exclude_booking_id: excludeBookingId || null,
    });

    if (error) throw error;

    return { conflicts: data || [], error: null };
  } catch (error: any) {
    console.error('Error checking booking conflict:', error);
    return { conflicts: [], error: error.message };
  }
}

/**
 * Get available dates for client picker with turnover intelligence
 */
export async function getAvailableDates(
  apartmentId: string,
  startDate: string,
  endDate: string,
  minNights: number = 1
): Promise<{ dates: AvailableDate[]; error: string | null }> {
  try {
    const { data, error } = await supabase.rpc('get_available_dates_for_apartment', {
      p_apartment_id: apartmentId,
      p_start_date: startDate,
      p_end_date: endDate,
      p_min_nights: minNights,
    });

    if (error) throw error;

    return { dates: data || [], error: null };
  } catch (error: any) {
    console.error('Error fetching available dates:', error);
    return { dates: [], error: error.message };
  }
}

/**
 * Calculate booking price quote
 */
export async function calculateBookingQuote(
  apartmentId: string,
  checkInDate: string,
  checkOutDate: string,
  guests: number,
  earlyCheckIn: boolean = false,
  lateCheckOut: boolean = false
): Promise<{ quote: BookingQuote | null; error: string | null }> {
  try {
    const { data, error } = await supabase.rpc('calculate_booking_quote', {
      p_apartment_id: apartmentId,
      p_check_in_date: checkInDate,
      p_check_out_date: checkOutDate,
      p_guests: guests,
      p_early_checkin: earlyCheckIn,
      p_late_checkout: lateCheckOut,
    });

    if (error) throw error;

    if (!data || data.length === 0) {
      return { quote: null, error: 'No quote data returned' };
    }

    return { quote: data[0] as BookingQuote, error: null };
  } catch (error: any) {
    console.error('Error calculating booking quote:', error);
    return { quote: null, error: error.message };
  }
}

/**
 * Create a booking request (status: requested)
 */
export async function createBookingRequest(bookingData: {
  apartment_id: string;
  guest_name: string;
  email: string;
  phone: string;
  company?: string;
  check_in_date: string;
  check_out_date: string;
  check_in_at?: string;
  check_out_at?: string;
  guests: number;
  total_nights: number;
  base_price: number;
  cleaning_fee?: number;
  tax_amount?: number;
  total_amount: number;
  security_deposit?: number;
  source?: string;
  special_requests?: string;
}) {
  try {
    // Convert dates to datetimes if not provided
    const checkInAt = bookingData.check_in_at || convertToCheckInDateTime(bookingData.check_in_date);
    const checkOutAt = bookingData.check_out_at || convertToCheckOutDateTime(bookingData.check_out_date);

    const { data, error } = await supabase
      .from('serviced_apartment_bookings')
      .insert([
        {
          ...bookingData,
          check_in_at: checkInAt,
          check_out_at: checkOutAt,
          status: 'requested',
          payment_status: 'pending',
          booking_status: 'confirmed', // Keep for backward compatibility
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error: any) {
    console.error('Error creating booking request:', error);
    return { data: null, error: error.message };
  }
}

/**
 * Approve booking request and create hold
 */
export async function approveBookingRequest(
  bookingId: string,
  approvedBy: string = 'admin',
  holdHours: number = HOLD_DURATION_HOURS
) {
  try {
    const holdExpiresAt = calculateHoldExpiration(holdHours);

    // Update booking to approved_hold status
    const { data: booking, error: bookingError } = await supabase
      .from('serviced_apartment_bookings')
      .update({
        status: 'approved_hold',
        hold_expires_at: holdExpiresAt,
        updated_at: new Date().toISOString(),
      })
      .eq('id', bookingId)
      .select()
      .single();

    if (bookingError) throw bookingError;

    // Create hold record
    const { error: holdError } = await supabase
      .from('serviced_apartment_booking_holds')
      .insert([
        {
          booking_id: bookingId,
          status: 'approved_hold',
          hold_expires_at: holdExpiresAt,
          approved_by: approvedBy,
          approved_at: new Date().toISOString(),
        },
      ]);

    if (holdError) throw holdError;

    return { data: booking, error: null };
  } catch (error: any) {
    console.error('Error approving booking:', error);
    return { data: null, error: error.message };
  }
}

/**
 * Confirm booking after payment
 */
export async function confirmBookingPayment(
  bookingId: string,
  paymentMethod?: string,
  amountPaid?: number
) {
  try {
    const { data, error } = await supabase
      .from('serviced_apartment_bookings')
      .update({
        status: 'confirmed',
        payment_status: 'paid',
        payment_method: paymentMethod,
        amount_paid: amountPaid,
        hold_expires_at: null, // Clear hold expiration
        updated_at: new Date().toISOString(),
      })
      .eq('id', bookingId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error: any) {
    console.error('Error confirming booking payment:', error);
    return { data: null, error: error.message };
  }
}

/**
 * Decline booking request
 */
export async function declineBookingRequest(
  bookingId: string,
  reason?: string
) {
  try {
    const { data, error } = await supabase
      .from('serviced_apartment_bookings')
      .update({
        status: 'declined',
        admin_notes: reason,
        updated_at: new Date().toISOString(),
      })
      .eq('id', bookingId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error: any) {
    console.error('Error declining booking:', error);
    return { data: null, error: error.message };
  }
}

/**
 * Cancel booking
 */
export async function cancelBooking(
  bookingId: string,
  reason?: string
) {
  try {
    const { data, error } = await supabase
      .from('serviced_apartment_bookings')
      .update({
        status: 'cancelled',
        booking_status: 'cancelled',
        admin_notes: reason,
        updated_at: new Date().toISOString(),
      })
      .eq('id', bookingId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error: any) {
    console.error('Error cancelling booking:', error);
    return { data: null, error: error.message };
  }
}

/**
 * Expire booking holds (should be run periodically)
 */
export async function expireBookingHolds() {
  try {
    const { error } = await supabase.rpc('expire_booking_holds');
    if (error) throw error;
    return { error: null };
  } catch (error: any) {
    console.error('Error expiring holds:', error);
    return { error: error.message };
  }
}

/**
 * Create availability block with datetime
 */
export async function createAvailabilityBlock(blockData: {
  apartment_id: string;
  start_date: string;
  end_date: string;
  start_at?: string;
  end_at?: string;
  status: string;
  block_type?: string;
  notes?: string;
}) {
  try {
    // If specific times not provided, use policy times
    const startAt = blockData.start_at || convertToCheckInDateTime(blockData.start_date);
    const endAt = blockData.end_at || convertToCheckOutDateTime(blockData.end_date);

    const { data, error } = await supabase
      .from('serviced_apartment_availability')
      .insert([
        {
          ...blockData,
          start_at: startAt,
          end_at: endAt,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error: any) {
    console.error('Error creating availability block:', error);
    return { data: null, error: error.message };
  }
}

/**
 * Get all bookings for calendar view
 */
export async function getBookingsForCalendar(
  apartmentId?: string,
  startDate?: string,
  endDate?: string
) {
  try {
    let query = supabase
      .from('serviced_apartment_bookings')
      .select(`
        *,
        apartment:serviced_apartments(*)
      `)
      .in('status', ['requested', 'approved_hold', 'confirmed', 'checked_in']);

    if (apartmentId) {
      query = query.eq('apartment_id', apartmentId);
    }

    if (startDate) {
      query = query.gte('check_out_date', startDate);
    }

    if (endDate) {
      query = query.lte('check_in_date', endDate);
    }

    query = query.order('check_in_at', { ascending: true });

    const { data, error } = await query;

    if (error) throw error;
    return { data, error: null };
  } catch (error: any) {
    console.error('Error fetching bookings for calendar:', error);
    return { data: null, error: error.message };
  }
}

/**
 * Update cleaning buffers for a booking
 */
export async function updateBookingBuffers(
  bookingId: string,
  beforeMinutes: number,
  afterMinutes: number
) {
  try {
    const { data, error } = await supabase
      .from('serviced_apartment_bookings')
      .update({
        cleaning_buffer_before_minutes: beforeMinutes,
        cleaning_buffer_after_minutes: afterMinutes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', bookingId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error: any) {
    console.error('Error updating booking buffers:', error);
    return { data: null, error: error.message };
  }
}

/**
 * Update apartment default buffers
 */
export async function updateApartmentBuffers(
  apartmentId: string,
  beforeMinutes: number,
  afterMinutes: number,
  earlyCheckinFee?: number,
  lateCheckoutFee?: number
) {
  try {
    const updates: any = {
      default_cleaning_buffer_before_minutes: beforeMinutes,
      default_cleaning_buffer_after_minutes: afterMinutes,
      updated_at: new Date().toISOString(),
    };

    if (earlyCheckinFee !== undefined) {
      updates.early_checkin_fee = earlyCheckinFee;
    }

    if (lateCheckoutFee !== undefined) {
      updates.late_checkout_fee = lateCheckoutFee;
    }

    const { data, error } = await supabase
      .from('serviced_apartments')
      .update(updates)
      .eq('id', apartmentId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error: any) {
    console.error('Error updating apartment buffers:', error);
    return { data: null, error: error.message };
  }
}
