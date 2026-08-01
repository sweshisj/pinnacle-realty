import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Label } from './ui/label';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Info,
  Clock,
  DollarSign,
} from 'lucide-react';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  isWithinInterval,
  isBefore,
  isAfter,
  addDays,
} from 'date-fns';
import {
  getAvailableDates,
  calculateBookingQuote,
  DEFAULT_CHECKIN_TIME,
  DEFAULT_CHECKOUT_TIME,
  type BookingQuote,
} from '../utils/supabase/bookingOperations';

interface EnhancedDatePickerProps {
  apartmentId: string;
  minNights?: number;
  onSelect: (
    checkInDate: string,
    checkOutDate: string,
    quote: BookingQuote
  ) => void;
  guests: number;
  checkInTime?: string;
  checkOutTime?: string;
}

export default function EnhancedDatePicker({
  apartmentId,
  minNights = 1,
  onSelect,
  guests,
  checkInTime = DEFAULT_CHECKIN_TIME,
  checkOutTime = DEFAULT_CHECKOUT_TIME,
}: EnhancedDatePickerProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedCheckIn, setSelectedCheckIn] = useState<Date | null>(null);
  const [selectedCheckOut, setSelectedCheckOut] = useState<Date | null>(null);
  const [hoveredDate, setHoveredDate] = useState<Date | null>(null);
  const [availableDates, setAvailableDates] = useState<Map<string, any>>(
    new Map()
  );
  const [quote, setQuote] = useState<BookingQuote | null>(null);
  const [loading, setLoading] = useState(false);
  const [quoteLoading, setQuoteLoading] = useState(false);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({
    start: monthStart,
    end: monthEnd,
  });

  // Pad the calendar to start on Sunday
  const startDayOfWeek = monthStart.getDay();
  const previousMonthDays = Array.from(
    { length: startDayOfWeek },
    (_, i) => {
      const date = new Date(monthStart);
      date.setDate(date.getDate() - (startDayOfWeek - i));
      return date;
    }
  );

  // Pad the calendar to end on Saturday
  const endDayOfWeek = monthEnd.getDay();
  const nextMonthDays = Array.from({ length: 6 - endDayOfWeek }, (_, i) => {
    const date = new Date(monthEnd);
    date.setDate(date.getDate() + (i + 1));
    return date;
  });

  const allDays = [...previousMonthDays, ...daysInMonth, ...nextMonthDays];

  // Fetch available dates when month changes
  useEffect(() => {
    fetchAvailableDates();
  }, [currentMonth, apartmentId]);

  // Calculate quote when both dates are selected
  useEffect(() => {
    if (selectedCheckIn && selectedCheckOut) {
      fetchQuote();
    } else {
      setQuote(null);
    }
  }, [selectedCheckIn, selectedCheckOut, guests]);

  const fetchAvailableDates = async () => {
    setLoading(true);
    const startDate = format(monthStart, 'yyyy-MM-dd');
    const endDate = format(addMonths(monthEnd, 2), 'yyyy-MM-dd'); // Fetch 3 months ahead

    const { dates, error } = await getAvailableDates(
      apartmentId,
      startDate,
      endDate,
      minNights
    );

    if (!error && dates) {
      const dateMap = new Map();
      dates.forEach((d) => {
        dateMap.set(d.date, d);
      });
      setAvailableDates(dateMap);
    }
    setLoading(false);
  };

  const fetchQuote = async () => {
    if (!selectedCheckIn || !selectedCheckOut) return;

    setQuoteLoading(true);
    const checkInDate = format(selectedCheckIn, 'yyyy-MM-dd');
    const checkOutDate = format(selectedCheckOut, 'yyyy-MM-dd');

    const { quote: newQuote, error } = await calculateBookingQuote(
      apartmentId,
      checkInDate,
      checkOutDate,
      guests,
      false,
      false
    );

    if (!error && newQuote) {
      setQuote(newQuote);
      if (newQuote.available) {
        onSelect(checkInDate, checkOutDate, newQuote);
      }
    }
    setQuoteLoading(false);
  };

  const getDateInfo = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return availableDates.get(dateStr);
  };

  const isDateDisabled = (date: Date): boolean => {
    if (isBefore(date, new Date())) return true;

    const info = getDateInfo(date);
    if (!info) return true;

    // If selecting check-in, must be check-in eligible
    if (!selectedCheckIn) {
      return !info.checkin_eligible;
    }

    // If selecting check-out, must be after check-in and available
    if (selectedCheckIn && !selectedCheckOut) {
      if (!isAfter(date, selectedCheckIn)) return true;

      // Check if all dates between check-in and this date are available
      const daysToCheck = eachDayOfInterval({
        start: selectedCheckIn,
        end: date,
      });

      return daysToCheck.some((d) => {
        const dayInfo = getDateInfo(d);
        return !dayInfo || !dayInfo.available;
      });
    }

    return false;
  };

  const getDateColor = (date: Date): string => {
    const isDisabled = isDateDisabled(date);
    const info = getDateInfo(date);

    // Check if it's in the selected range
    if (selectedCheckIn && selectedCheckOut) {
      if (
        isWithinInterval(date, {
          start: selectedCheckIn,
          end: selectedCheckOut,
        })
      ) {
        return 'bg-emerald-500 text-white hover:bg-emerald-600';
      }
    } else if (selectedCheckIn && isSameDay(date, selectedCheckIn)) {
      return 'bg-emerald-500 text-white hover:bg-emerald-600';
    }

    // Check hover preview
    if (
      selectedCheckIn &&
      !selectedCheckOut &&
      hoveredDate &&
      date > selectedCheckIn &&
      date <= hoveredDate &&
      !isDisabled
    ) {
      return 'bg-emerald-200 text-emerald-900';
    }

    // Disabled dates
    if (isDisabled) {
      return 'bg-gray-100 text-gray-400 cursor-not-allowed';
    }

    // Checkout-only (turnover day)
    if (info?.checkout_only && !selectedCheckIn) {
      return 'bg-amber-100 text-amber-900 hover:bg-amber-200';
    }

    // Available dates
    if (info?.available) {
      return 'bg-white hover:bg-emerald-50 border-emerald-200';
    }

    return 'bg-white hover:bg-gray-50';
  };

  const handleDateClick = (date: Date) => {
    if (!isSameMonth(date, currentMonth)) return;
    if (isDateDisabled(date)) return;

    // First click - set check-in date
    if (!selectedCheckIn) {
      setSelectedCheckIn(date);
      setSelectedCheckOut(null);
      return;
    }

    // Second click - set check-out date
    if (selectedCheckIn && !selectedCheckOut) {
      if (isBefore(date, selectedCheckIn)) {
        // If clicked date is before check-in, reset
        setSelectedCheckIn(date);
        setSelectedCheckOut(null);
      } else {
        // Ensure minimum nights requirement
        const nights = Math.ceil(
          (date.getTime() - selectedCheckIn.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (nights < minNights) {
          alert(`Minimum stay is ${minNights} night(s)`);
          return;
        }
        setSelectedCheckOut(date);
      }
      return;
    }

    // Third click - reset
    setSelectedCheckIn(null);
    setSelectedCheckOut(null);
    setQuote(null);
  };

  const handleReset = () => {
    setSelectedCheckIn(null);
    setSelectedCheckOut(null);
    setQuote(null);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-emerald-600" />
          <h3 className="text-lg">Select Dates</h3>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm min-w-[140px] text-center">
            {format(currentMonth, 'MMM yyyy')}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-900">
            {!selectedCheckIn && (
              <p>Click on an available date to select your check-in.</p>
            )}
            {selectedCheckIn && !selectedCheckOut && (
              <p>
                Check-in: <strong>{format(selectedCheckIn, 'PP')}</strong>.
                Now select your check-out date (min {minNights} night
                {minNights > 1 ? 's' : ''}).
              </p>
            )}
            {selectedCheckIn && selectedCheckOut && (
              <p>
                Selected: <strong>{format(selectedCheckIn, 'PP')}</strong> to{' '}
                <strong>{format(selectedCheckOut, 'PP')}</strong>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Policy Times */}
      <div className="flex items-center gap-4 text-sm text-gray-600">
        <div className="flex items-center gap-1">
          <Clock className="w-4 h-4" />
          <span>Check-in: {checkInTime}</span>
        </div>
        <div className="flex items-center gap-1">
          <Clock className="w-4 h-4" />
          <span>Check-out: {checkOutTime}</span>
        </div>
      </div>

      {/* Calendar */}
      <Card>
        <CardContent className="p-4">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div
                key={day}
                className="text-center text-xs text-gray-600 py-2"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar days */}
          <div className="grid grid-cols-7 gap-1">
            {allDays.map((date, idx) => {
              const isCurrentMonth = isSameMonth(date, currentMonth);
              const isToday = isSameDay(date, new Date());
              const dateColor = getDateColor(date);
              const info = getDateInfo(date);
              const disabled = isDateDisabled(date);

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleDateClick(date)}
                  onMouseEnter={() => setHoveredDate(date)}
                  onMouseLeave={() => setHoveredDate(null)}
                  disabled={!isCurrentMonth || disabled}
                  className={`
                    relative aspect-square rounded-lg border transition-all
                    ${dateColor}
                    ${!isCurrentMonth ? 'opacity-30' : ''}
                    ${isToday ? 'ring-2 ring-emerald-600 ring-offset-1' : ''}
                    flex items-center justify-center
                    min-h-[40px]
                  `}
                  title={
                    info
                      ? info.checkout_only
                        ? 'Turnover day - available for check-out'
                        : info.available
                          ? 'Available'
                          : 'Not available'
                      : ''
                  }
                >
                  <span
                    className={`text-sm ${!isCurrentMonth ? 'text-gray-400' : ''}`}
                  >
                    {format(date, 'd')}
                  </span>
                  {info?.checkout_only && !selectedCheckIn && (
                    <div className="absolute bottom-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-amber-500"></div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-4 pt-4 border-t">
            <div className="flex flex-wrap gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded bg-emerald-500 border"></div>
                <span>Selected</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded bg-white border border-emerald-200"></div>
                <span>Available</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded bg-gray-100 border"></div>
                <span>Not Available</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded bg-amber-100 border relative">
                  <div className="absolute bottom-0 right-0 w-1.5 h-1.5 rounded-full bg-amber-500"></div>
                </div>
                <span>Turnover Day</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded ring-2 ring-emerald-600"></div>
                <span>Today</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Price Quote */}
      {selectedCheckIn && selectedCheckOut && (
        <Card className="border-emerald-200 bg-emerald-50">
          <CardContent className="p-4">
            {quoteLoading ? (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-600"></div>
                <span className="ml-2 text-sm text-gray-600">
                  Calculating price...
                </span>
              </div>
            ) : quote ? (
              <div className="space-y-3">
                {quote.available ? (
                  <>
                    <div className="flex items-center justify-between">
                      <h4 className="text-lg">Price Breakdown</h4>
                      <Badge className="bg-green-600">Available</Badge>
                    </div>

                    <div className="bg-white rounded-lg p-3 space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">
                          {quote.total_nights} night
                          {quote.total_nights > 1 ? 's' : ''}
                        </span>
                        <span>${quote.base_price.toFixed(2)}</span>
                      </div>
                      {quote.cleaning_fee > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Cleaning fee</span>
                          <span>${quote.cleaning_fee.toFixed(2)}</span>
                        </div>
                      )}
                      {quote.tax_amount > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Taxes</span>
                          <span>${quote.tax_amount.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="border-t pt-2 flex justify-between font-semibold">
                        <span>Total</span>
                        <span>${quote.total_amount.toFixed(2)}</span>
                      </div>
                      {quote.security_deposit > 0 && (
                        <div className="flex justify-between text-gray-600">
                          <span>Security deposit</span>
                          <span>${quote.security_deposit.toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-red-800">
                      <Info className="w-4 h-4" />
                      <div>
                        <p className="font-medium">Not Available</p>
                        <p className="text-sm">
                          {quote.conflict_reason ||
                            'Selected dates are not available'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <Button
                  onClick={handleReset}
                  variant="outline"
                  className="w-full"
                >
                  Select Different Dates
                </Button>
              </div>
            ) : null}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
