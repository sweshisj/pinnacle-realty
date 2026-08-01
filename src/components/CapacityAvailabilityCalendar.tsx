import React, { useState, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { fetchCapacityRange } from '../utils/supabase/capacityOperations';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths, isSameMonth, isToday, isBefore, startOfDay } from 'date-fns';

interface CapacityAvailabilityCalendarProps {
  saId: string;
  selectedCheckIn?: Date;
  selectedCheckOut?: Date;
  onDateSelect?: (checkIn: Date, checkOut: Date) => void;
  onDateChange?: (checkIn: Date | undefined, checkOut: Date | undefined) => void;
}

export default function CapacityAvailabilityCalendar({
  saId,
  selectedCheckIn,
  selectedCheckOut,
  onDateSelect,
  onDateChange,
}: CapacityAvailabilityCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [unavailableDates, setUnavailableDates] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [selectingCheckIn, setSelectingCheckIn] = useState(true);
  const [tempCheckIn, setTempCheckIn] = useState<Date | undefined>(selectedCheckIn);
  const [tempCheckOut, setTempCheckOut] = useState<Date | undefined>(selectedCheckOut);

  useEffect(() => {
    loadAvailability();
  }, [saId, currentMonth]);

  const loadAvailability = async () => {
    setLoading(true);
    
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(addMonths(currentMonth, 1)); // Load 2 months at once
    
    const { data, error } = await fetchCapacityRange(
      saId,
      format(start, 'yyyy-MM-dd'),
      format(end, 'yyyy-MM-dd')
    );

    if (data) {
      const unavailable = new Set<string>();
      data.forEach(day => {
        if (day.is_unavailable) {
          unavailable.add(day.date);
        }
      });
      setUnavailableDates(unavailable);
    }

    setLoading(false);
  };

  const handlePrevMonth = () => {
    setCurrentMonth(prev => subMonths(prev, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(prev => addMonths(prev, 1));
  };

  const isDateUnavailable = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return unavailableDates.has(dateStr);
  };

  const isDatePast = (date: Date) => {
    return isBefore(date, startOfDay(new Date()));
  };

  const handleDateClick = (date: Date) => {
    if (isDateUnavailable(date) || isDatePast(date)) return;

    if (selectingCheckIn) {
      setTempCheckIn(date);
      setTempCheckOut(undefined);
      setSelectingCheckIn(false);
      if (onDateChange) {
        onDateChange(date, undefined);
      }
    } else {
      if (tempCheckIn && date > tempCheckIn) {
        // Check if any dates in range are unavailable
        const daysInRange = eachDayOfInterval({ start: tempCheckIn, end: date });
        const hasUnavailable = daysInRange.some(d => isDateUnavailable(d));
        
        if (!hasUnavailable) {
          setTempCheckOut(date);
          setSelectingCheckIn(true);
          if (onDateChange) {
            onDateChange(tempCheckIn, date);
          }
          if (onDateSelect) {
            onDateSelect(tempCheckIn, date);
          }
        }
      } else {
        // Restart selection
        setTempCheckIn(date);
        setTempCheckOut(undefined);
        if (onDateChange) {
          onDateChange(date, undefined);
        }
      }
    }
  };

  const isDateInRange = (date: Date) => {
    if (!tempCheckIn || !tempCheckOut) return false;
    return date >= tempCheckIn && date <= tempCheckOut;
  };

  const isDateSelected = (date: Date) => {
    if (!tempCheckIn) return false;
    if (tempCheckIn && format(date, 'yyyy-MM-dd') === format(tempCheckIn, 'yyyy-MM-dd')) return true;
    if (tempCheckOut && format(date, 'yyyy-MM-dd') === format(tempCheckOut, 'yyyy-MM-dd')) return true;
    return false;
  };

  const renderMonth = (monthDate: Date) => {
    const monthStart = startOfMonth(monthDate);
    const monthEnd = endOfMonth(monthDate);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

    // Get first day of month to calculate offset
    const firstDayOfWeek = monthStart.getDay();
    const emptyCells = Array(firstDayOfWeek).fill(null);

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">
            {format(monthDate, 'MMMM yyyy')}
          </h3>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center text-sm text-gray-500 py-2">
              {day}
            </div>
          ))}

          {/* Empty cells before month starts */}
          {emptyCells.map((_, idx) => (
            <div key={`empty-${idx}`} className="aspect-square" />
          ))}

          {/* Date cells */}
          {days.map(day => {
            const unavailable = isDateUnavailable(day);
            const past = isDatePast(day);
            const disabled = unavailable || past;
            const selected = isDateSelected(day);
            const inRange = isDateInRange(day);
            const today = isToday(day);

            return (
              <button
                key={day.toISOString()}
                onClick={() => handleDateClick(day)}
                disabled={disabled}
                className={`
                  aspect-square p-0 text-sm rounded-lg transition-all
                  ${disabled ? 'bg-gray-100 text-gray-300 cursor-not-allowed' : 'hover:bg-emerald-50 cursor-pointer'}
                  ${selected ? 'bg-emerald-600 text-white hover:bg-emerald-700' : ''}
                  ${inRange && !selected ? 'bg-emerald-100 text-emerald-900' : ''}
                  ${today && !selected && !inRange ? 'border-2 border-emerald-600' : ''}
                  ${!isSameMonth(day, monthDate) ? 'opacity-40' : ''}
                  flex items-center justify-center relative
                `}
              >
                <span>{format(day, 'd')}</span>
                {unavailable && (
                  <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-red-500 rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Select Dates
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevMonth}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextMonth}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-4 mt-2 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-600" />
            <span className="text-gray-600">Selected</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gray-100" />
            <span className="text-gray-600">Unavailable</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="py-12 text-center text-gray-500">
            Loading availability...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {renderMonth(currentMonth)}
            {renderMonth(addMonths(currentMonth, 1))}
          </div>
        )}

        {/* Policy info */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-900">
            <strong>Check-in:</strong> 2:00 PM · <strong>Check-out:</strong> 10:00 AM
          </p>
        </div>

        {/* Selection status */}
        {tempCheckIn && (
          <div className="mt-4 p-4 bg-emerald-50 rounded-lg">
            <p className="text-sm text-emerald-900">
              <strong>Check-in:</strong> {format(tempCheckIn, 'MMM dd, yyyy')}
              {tempCheckOut && (
                <>
                  {' · '}
                  <strong>Check-out:</strong> {format(tempCheckOut, 'MMM dd, yyyy')}
                </>
              )}
            </p>
            {!tempCheckOut && (
              <p className="text-xs text-emerald-700 mt-1">
                Now select your check-out date
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
