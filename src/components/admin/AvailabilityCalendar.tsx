import React, { useState, useEffect } from "react";
import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Badge } from "../ui/badge";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import {
  ChevronLeft,
  ChevronRight,
  X,
  Check,
} from "lucide-react";
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
} from "date-fns";
import { Availability } from "../../utils/supabase/servicedApartmentsOperations";

interface AvailabilityCalendarProps {
  apartmentId: string;
  apartmentTitle: string;
  checkInTime: string;
  checkOutTime: string;
  availability: Availability[];
  onSave: (data: {
    start_date: string;
    end_date: string;
    status: string;
    notes: string;
  }) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  onClose: () => void;
}

export default function AvailabilityCalendar({
  apartmentId,
  apartmentTitle,
  checkInTime,
  checkOutTime,
  availability,
  onSave,
  onDelete,
  onClose,
}: AvailabilityCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedStatus, setSelectedStatus] = useState<
    "available" | "blocked" | "pending" | "booked"
  >("blocked");
  const [selectedStart, setSelectedStart] =
    useState<Date | null>(null);
  const [selectedEnd, setSelectedEnd] = useState<Date | null>(
    null,
  );
  const [notes, setNotes] = useState("");
  const [hoveredDate, setHoveredDate] = useState<Date | null>(
    null,
  );

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
    },
  );

  // Pad the calendar to end on Saturday
  const endDayOfWeek = monthEnd.getDay();
  const nextMonthDays = Array.from(
    { length: 6 - endDayOfWeek },
    (_, i) => {
      const date = new Date(monthEnd);
      date.setDate(date.getDate() + (i + 1));
      return date;
    },
  );

  const allDays = [
    ...previousMonthDays,
    ...daysInMonth,
    ...nextMonthDays,
  ];

  const getDateStatus = (
    date: Date,
  ): { status: string; id?: string } | null => {
    const match = availability.find((avail) => {
      const start = new Date(avail.start_date);
      const end = new Date(avail.end_date);
      return isWithinInterval(date, { start, end });
    });
    return match
      ? { status: match.status, id: match.id }
      : null;
  };

  const getDateColor = (date: Date): string => {
    // Check if it's in the selected range
    if (selectedStart && selectedEnd) {
      if (
        isWithinInterval(date, {
          start: selectedStart,
          end: selectedEnd,
        })
      ) {
        return "bg-gray-300 text-gray-900 hover:bg-gray-400";
      }
    } else if (
      selectedStart &&
      isSameDay(date, selectedStart)
    ) {
      return "bg-gray-300 text-gray-900 hover:bg-gray-400";
    }

    // Check hover preview
    if (
      selectedStart &&
      !selectedEnd &&
      hoveredDate &&
      date >= selectedStart &&
      date <= hoveredDate
    ) {
      return "bg-gray-200 text-gray-700";
    }

    // Check existing availability status
    const statusInfo = getDateStatus(date);
    if (statusInfo) {
      switch (statusInfo.status) {
        case "blocked":
          return "bg-red-500 text-white hover:bg-red-600";
        case "booked":
          return "bg-green-500 text-white hover:bg-green-600";
        case "pending":
          return "bg-yellow-400 text-gray-900 hover:bg-yellow-500";
        case "available":
          return "bg-white hover:bg-gray-100";
        default:
          return "bg-white hover:bg-gray-100";
      }
    }

    return "bg-white hover:bg-gray-100";
  };

  const handleDateClick = (date: Date) => {
    if (!isSameMonth(date, currentMonth)) return;

    // First click - set start date
    if (!selectedStart) {
      setSelectedStart(date);
      setSelectedEnd(null);
      return;
    }

    // Second click - set end date
    if (selectedStart && !selectedEnd) {
      if (isBefore(date, selectedStart)) {
        // If clicked date is before start, swap them
        setSelectedEnd(selectedStart);
        setSelectedStart(date);
      } else {
        setSelectedEnd(date);
      }
      return;
    }

    // Third click - reset
    setSelectedStart(null);
    setSelectedEnd(null);
  };

  const handleSave = async () => {
    if (!selectedStart || !selectedEnd) {
      alert("Please select both start and end dates");
      return;
    }

    await onSave({
      start_date: format(selectedStart, "yyyy-MM-dd"),
      end_date: format(selectedEnd, "yyyy-MM-dd"),
      status: selectedStatus,
      notes,
    });

    // Reset selection
    setSelectedStart(null);
    setSelectedEnd(null);
    setNotes("");
  };

  const handleReset = () => {
    setSelectedStart(null);
    setSelectedEnd(null);
    setNotes("");
  };

  const statusButtons = [
    {
      value: "available",
      label: "Available",
      color:
        "bg-white border-gray-300 text-gray-700 hover:bg-gray-50",
    },
    {
      value: "blocked",
      label: "Blocked",
      color: "bg-red-500 text-white hover:bg-red-600",
    },
    {
      value: "booked",
      label: "Booked",
      color: "bg-green-500 text-white hover:bg-green-600",
    },
    {
      value: "pending",
      label: "Pending",
      color: "bg-yellow-400 text-gray-900 hover:bg-yellow-500",
    },
  ];

  return (
    <div className="space-y-4 md:space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl md:text-2xl">Manage Availability</h2>
          <p className="text-sm md:text-base text-gray-600">{apartmentTitle}</p>
        </div>
        <Button variant="ghost" onClick={onClose} size="sm">
          <X className="w-4 h-4 md:w-5 md:h-5" />
        </Button>
      </div>

      {/* Status Selection */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base md:text-lg">Step 1: Select Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
            {statusButtons.map((btn) => (
              <Button
                key={btn.value}
                type="button"
                onClick={() =>
                  setSelectedStatus(btn.value as any)
                }
                className={`${btn.color} ${selectedStatus === btn.value ? 'ring-2 ring-emerald-600 ring-offset-2' : ''} text-xs md:text-sm`}
                variant="outline"
              >
                {btn.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Calendar */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <CardTitle className="text-base md:text-lg">Step 2: Select Dates</CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentMonth(subMonths(currentMonth, 1))
                }
              >
                <ChevronLeft className="w-3 h-3 md:w-4 md:h-4" />
              </Button>
              <span className="text-sm md:text-base min-w-[140px] md:min-w-[180px] text-center">
                {format(currentMonth, "MMM yyyy")}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentMonth(addMonths(currentMonth, 1))
                }
              >
                <ChevronRight className="w-3 h-3 md:w-4 md:h-4" />
              </Button>
            </div>
          </div>
          <p className="text-xs md:text-sm text-gray-600 mt-2">
            {!selectedStart &&
              "Click once to select start date"}
            {selectedStart &&
              !selectedEnd &&
              "Click again to select end date"}
            {selectedStart &&
              selectedEnd &&
              "Click again to reset and start over"}
          </p>
        </CardHeader>
        <CardContent>
          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 md:gap-2 mb-2">
            {[
              "Sun",
              "Mon",
              "Tue",
              "Wed",
              "Thu",
              "Fri",
              "Sat",
            ].map((day) => (
              <div
                key={day}
                className="text-center text-xs md:text-sm text-gray-600 py-1 md:py-2"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar days */}
          <div className="grid grid-cols-7 gap-1 md:gap-2">
            {allDays.map((date, idx) => {
              const isCurrentMonth = isSameMonth(
                date,
                currentMonth,
              );
              const isToday = isSameDay(date, new Date());
              const dateColor = getDateColor(date);
              const statusInfo = getDateStatus(date);

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleDateClick(date)}
                  onMouseEnter={() => setHoveredDate(date)}
                  onMouseLeave={() => setHoveredDate(null)}
                  disabled={!isCurrentMonth}
                  className={`
                    relative aspect-square rounded-md md:rounded-lg border transition-all
                    ${dateColor}
                    ${!isCurrentMonth ? "opacity-30 cursor-not-allowed" : "cursor-pointer"}
                    ${isToday ? "ring-1 md:ring-2 ring-emerald-600" : "border-gray-200"}
                    flex items-center justify-center
                    min-h-[32px] md:min-h-[40px]
                  `}
                  title={
                    statusInfo
                      ? `${statusInfo.status.toUpperCase()}`
                      : ""
                  }
                >
                  <span
                    className={`text-xs md:text-sm ${!isCurrentMonth ? "text-gray-400" : ""}`}
                  >
                    {format(date, "d")}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-4 md:mt-6 pt-3 md:pt-4 border-t">
            <div className="flex flex-wrap gap-2 md:gap-4 text-xs md:text-sm">
              <div className="flex items-center gap-1 md:gap-2">
                <div className="w-4 h-4 md:w-6 md:h-6 rounded bg-gray-300 border"></div>
                <span>Selected</span>
              </div>
              <div className="flex items-center gap-1 md:gap-2">
                <div className="w-4 h-4 md:w-6 md:h-6 rounded bg-white border border-gray-300"></div>
                <span>Available</span>
              </div>
              <div className="flex items-center gap-1 md:gap-2">
                <div className="w-4 h-4 md:w-6 md:h-6 rounded bg-red-500"></div>
                <span>Blocked</span>
              </div>
              <div className="flex items-center gap-1 md:gap-2">
                <div className="w-4 h-4 md:w-6 md:h-6 rounded bg-green-500"></div>
                <span>Booked</span>
              </div>
              <div className="flex items-center gap-1 md:gap-2">
                <div className="w-4 h-4 md:w-6 md:h-6 rounded bg-yellow-400"></div>
                <span>Pending</span>
              </div>
              <div className="flex items-center gap-1 md:gap-2">
                <div className="w-4 h-4 md:w-6 md:h-6 rounded ring-1 md:ring-2 ring-emerald-600"></div>
                <span>Today</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Selection Summary & Notes */}
      {selectedStart && selectedEnd && (
        <Card className="border-emerald-200 bg-emerald-50">
          <CardHeader>
            <CardTitle>Step 3: Confirm & Save</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-white p-4 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600">
                    Status
                  </p>
                  <Badge
                    className={
                      selectedStatus === "blocked"
                        ? "bg-red-500"
                        : selectedStatus === "booked"
                          ? "bg-green-500"
                          : selectedStatus === "pending"
                            ? "bg-yellow-400 text-gray-900"
                            : "bg-white border border-gray-300 text-gray-900"
                    }
                  >
                    {selectedStatus.toUpperCase()}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-600">
                    Start Date
                  </p>
                  <p>{format(selectedStart, "PPP")}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">
                    End Date
                  </p>
                  <p>{format(selectedEnd, "PPP")}</p>
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any notes about this availability period..."
                rows={3}
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleSave}
                className="bg-emerald-600 hover:bg-emerald-700 flex-1"
              >
                <Check className="w-4 h-4 mr-2" />
                Save Availability
              </Button>
              <Button onClick={handleReset} variant="outline">
                <X className="w-4 h-4 mr-2" />
                Reset
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Existing Availability Entries */}
      {availability.length > 0 && onDelete && (
        <Card>
          <CardHeader>
            <CardTitle>Current Availability Entries</CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              These are the current date ranges set for this apartment. Dates shown are inclusive (both start and end dates are included).
            </p>
            <div className="text-xs text-gray-500 mt-2 flex items-center gap-4">
              <span>📍 Check-in: <strong>{checkInTime}</strong></span>
              <span>📍 Check-out: <strong>{checkOutTime}</strong></span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {availability.map((avail) => (
                <div
                  key={avail.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <Badge
                      className={
                        avail.status === "blocked"
                          ? "bg-red-500"
                          : avail.status === "booked"
                            ? "bg-green-500"
                            : avail.status === "pending"
                              ? "bg-yellow-400 text-gray-900"
                              : "bg-white border border-gray-300 text-gray-900"
                      }
                    >
                      {avail.status}
                    </Badge>
                    <div className="flex-1">
                      <div className="text-sm">
                        <span className="font-medium">
                          {format(
                            new Date(avail.start_date),
                            "MMM d, yyyy",
                          )}
                        </span>
                        <span className="text-xs text-gray-500 mx-1">({checkInTime})</span>
                        {" to "}
                        <span className="font-medium">
                          {format(
                            new Date(avail.end_date),
                            "MMM d, yyyy",
                          )}
                        </span>
                        <span className="text-xs text-gray-500 ml-1">({checkOutTime})</span>
                      </div>
                      {avail.notes && (
                        <span className="text-xs text-gray-500 italic block mt-1">
                          "{avail.notes}"
                        </span>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete && onDelete(avail.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}