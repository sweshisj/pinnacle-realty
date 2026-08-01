import React, { useState, useEffect } from 'react';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  RefreshCw,
  Settings,
  X,
  Clock,
  Info,
  AlertCircle,
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '../ui/sheet';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameMonth,
  isToday,
  isSameDay,
  startOfDay,
} from 'date-fns';
import {
  fetchCapacityRange,
  fetchEnquiryCountsPerDay,
  fetchICalEvents,
  fetchAvailabilityBlocks,
  fetchInternalBookings,
  createAvailabilityBlock,
  deleteAvailabilityBlock,
  DailyCapacity,
  ICalEvent,
  AvailabilityBlock,
  InternalBooking,
} from '../../utils/supabase/capacityOperations';
import { fetchAllEnquiries, Enquiry } from '../../utils/supabase/servicedApartmentsOperations';

interface AdminCapacityCalendarProps {
  saId: string;
  roomsTotal: number;
  onOpenIntegrations?: () => void;
}

export default function AdminCapacityCalendar({
  saId,
  roomsTotal,
  onOpenIntegrations,
}: AdminCapacityCalendarProps) {
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [capacityData, setCapacityData] = useState<Map<string, DailyCapacity>>(new Map());
  const [enquiryCounts, setEnquiryCounts] = useState<Map<string, { requested: number; approved: number }>>(new Map());
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Day detail drawer
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [dayDetailOpen, setDayDetailOpen] = useState(false);
  const [icalEvents, setICalEvents] = useState<ICalEvent[]>([]);
  const [availabilityBlocks, setAvailabilityBlocks] = useState<AvailabilityBlock[]>([]);
  const [internalBookings, setInternalBookings] = useState<InternalBooking[]>([]);
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);

  // Block dialog
  const [showBlockDialog, setShowBlockDialog] = useState(false);
  const [blockForm, setBlockForm] = useState({
    type: 'full' as 'full' | 'partial',
    rooms: 1,
    reason: '',
    notes: '',
  });

  useEffect(() => {
    loadCalendarData();
  }, [saId, currentDate, view]);

  const loadCalendarData = async () => {
    setLoading(true);
    
    let start: Date, end: Date;
    
    if (view === 'month') {
      start = startOfMonth(currentDate);
      end = endOfMonth(addMonths(currentDate, 1)); // Load 2 months
    } else if (view === 'week') {
      start = startOfWeek(currentDate);
      end = endOfWeek(addDays(currentDate, 7));
    } else {
      start = currentDate;
      end = addDays(currentDate, 1);
    }

    const [capacityResult, enquiryResult] = await Promise.all([
      fetchCapacityRange(saId, format(start, 'yyyy-MM-dd'), format(end, 'yyyy-MM-dd')),
      fetchEnquiryCountsPerDay(saId, format(start, 'yyyy-MM-dd'), format(end, 'yyyy-MM-dd')),
    ]);

    if (capacityResult.data) {
      const capacityMap = new Map<string, DailyCapacity>();
      capacityResult.data.forEach(day => {
        capacityMap.set(day.date, day);
      });
      setCapacityData(capacityMap);
    }

    if (enquiryResult.data) {
      const enquiryMap = new Map<string, { requested: number; approved: number }>();
      enquiryResult.data.forEach(day => {
        enquiryMap.set(day.date, {
          requested: day.requested_count,
          approved: day.approved_count,
        });
      });
      setEnquiryCounts(enquiryMap);
    }

    setLoading(false);
  };

  const loadDayDetails = async (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    
    const [eventsResult, blocksResult, bookingsResult, enquiriesResult] = await Promise.all([
      fetchICalEvents(saId, dateStr, format(addDays(date, 1), 'yyyy-MM-dd')),
      fetchAvailabilityBlocks(saId, dateStr, format(addDays(date, 1), 'yyyy-MM-dd')),
      fetchInternalBookings(saId, dateStr, format(addDays(date, 1), 'yyyy-MM-dd')),
      fetchAllEnquiries(),
    ]);

    if (eventsResult.data) setICalEvents(eventsResult.data);
    if (blocksResult.data) setAvailabilityBlocks(blocksResult.data);
    if (bookingsResult.data) setInternalBookings(bookingsResult.data);
    if (enquiriesResult.data) {
      // Filter to this day
      const filtered = enquiriesResult.data.filter(e => {
        if (!e.check_in_date || !e.check_out_date) return false;
        const checkIn = new Date(e.check_in_date);
        const checkOut = new Date(e.check_out_date);
        return date >= checkIn && date < checkOut;
      });
      setEnquiries(filtered);
    }
  };

  const handlePrev = () => {
    if (view === 'month') {
      setCurrentDate(subMonths(currentDate, 1));
    } else if (view === 'week') {
      setCurrentDate(addDays(currentDate, -7));
    } else {
      setCurrentDate(addDays(currentDate, -1));
    }
  };

  const handleNext = () => {
    if (view === 'month') {
      setCurrentDate(addMonths(currentDate, 1));
    } else if (view === 'week') {
      setCurrentDate(addDays(currentDate, 7));
    } else {
      setCurrentDate(addDays(currentDate, 1));
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleDayClick = async (date: Date) => {
    setSelectedDay(date);
    setDayDetailOpen(true);
    await loadDayDetails(date);
  };

  const handleMouseDown = (date: Date) => {
    setIsDragging(true);
    setSelectedDates([date]);
  };

  const handleMouseEnter = (date: Date) => {
    if (isDragging) {
      setSelectedDates(prev => {
        if (prev.find(d => isSameDay(d, date))) {
          return prev;
        }
        return [...prev, date];
      });
    }
  };

  const handleMouseUp = () => {
    if (isDragging && selectedDates.length > 0) {
      setShowBlockDialog(true);
    }
    setIsDragging(false);
  };

  const handleCreateBlock = async () => {
    if (selectedDates.length === 0) {
      toast.error('Please select dates');
      return;
    }

    const sortedDates = [...selectedDates].sort((a, b) => a.getTime() - b.getTime());
    const startDate = format(sortedDates[0], 'yyyy-MM-dd');
    const endDate = format(addDays(sortedDates[sortedDates.length - 1], 1), 'yyyy-MM-dd');

    const { error } = await createAvailabilityBlock({
      sa_id: saId,
      start_date: startDate,
      end_date: endDate,
      block_type: blockForm.type,
      rooms_blocked: blockForm.type === 'partial' ? blockForm.rooms : undefined,
      reason: blockForm.reason,
      notes: blockForm.notes,
    });

    if (error) {
      toast.error('Failed to create block');
      return;
    }

    toast.success('Availability block created');
    setShowBlockDialog(false);
    setSelectedDates([]);
    setBlockForm({
      type: 'full',
      rooms: 1,
      reason: '',
      notes: '',
    });
    loadCalendarData();
  };

  const handleDeleteBlock = async (blockId: string) => {
    const { error } = await deleteAvailabilityBlock(blockId);
    if (error) {
      toast.error('Failed to delete block');
      return;
    }
    toast.success('Block deleted');
    if (selectedDay) {
      await loadDayDetails(selectedDay);
    }
    loadCalendarData();
  };

  const getCapacityColor = (capacity: number, total: number): string => {
    const percentage = (capacity / total) * 100;
    if (percentage >= 50) return 'text-green-600 bg-green-50';
    if (percentage > 0) return 'text-amber-600 bg-amber-50';
    return 'text-red-600 bg-red-50';
  };

  const getCapacityBgColor = (capacity: number, total: number): string => {
    const percentage = (capacity / total) * 100;
    if (percentage >= 50) return 'bg-green-100';
    if (percentage > 0) return 'bg-amber-100';
    return 'bg-red-100';
  };

  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const firstDayOfWeek = monthStart.getDay();
    const emptyCells = Array(firstDayOfWeek).fill(null);

    return (
      <div className="space-y-4">
        {/* Day headers */}
        <div className="grid grid-cols-7 gap-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center text-sm text-gray-600 py-2">
              {day}
            </div>
          ))}

          {/* Empty cells */}
          {emptyCells.map((_, idx) => (
            <div key={`empty-${idx}`} />
          ))}

          {/* Date cells */}
          {days.map(day => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const capacity = capacityData.get(dateStr);
            const enquiry = enquiryCounts.get(dateStr);
            const isSelected = selectedDates.some(d => isSameDay(d, day));

            return (
              <motion.div
                key={dateStr}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`
                  border rounded-lg p-2 min-h-[120px] cursor-pointer transition-all
                  ${isSelected ? 'ring-2 ring-emerald-600 bg-emerald-50' : 'hover:shadow-md'}
                  ${isToday(day) ? 'border-emerald-600 border-2' : 'border-gray-200'}
                  ${capacity ? getCapacityBgColor(capacity.capacity_remaining, capacity.rooms_total) : 'bg-white'}
                `}
                onClick={() => handleDayClick(day)}
                onMouseDown={() => handleMouseDown(day)}
                onMouseEnter={() => handleMouseEnter(day)}
                onMouseUp={handleMouseUp}
              >
                <div className="flex items-start justify-between mb-2">
                  <span className={`text-sm ${isToday(day) ? 'font-bold' : ''}`}>
                    {format(day, 'd')}
                  </span>
                  {capacity && (
                    <Badge
                      className={`text-xs px-1.5 py-0.5 ${getCapacityColor(capacity.capacity_remaining, capacity.rooms_total)}`}
                      variant="secondary"
                    >
                      {capacity.capacity_remaining}/{capacity.rooms_total}
                    </Badge>
                  )}
                </div>

                {/* Badges */}
                <div className="space-y-1">
                  {capacity && capacity.rooms_from_ical > 0 && (
                    <div className="flex items-center gap-1 text-xs">
                      <div className="w-2 h-2 rounded-full bg-red-500" />
                      <span className="text-gray-600">{capacity.rooms_from_ical}</span>
                    </div>
                  )}
                  {capacity && capacity.rooms_from_internal > 0 && (
                    <div className="flex items-center gap-1 text-xs">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      <span className="text-gray-600">{capacity.rooms_from_internal}</span>
                    </div>
                  )}
                  {enquiry && enquiry.approved > 0 && (
                    <Badge variant="secondary" className="text-xs bg-gray-100">
                      +{enquiry.approved}
                    </Badge>
                  )}
                  {capacity?.has_full_block && (
                    <Badge variant="destructive" className="text-xs">
                      Blocked
                    </Badge>
                  )}
                </div>

                {/* State label */}
                {capacity && (
                  <div className="mt-2">
                    <span className={`text-xs ${capacity.is_unavailable ? 'text-red-600 font-medium' : 'text-green-600'}`}>
                      {capacity.is_unavailable ? 'Unavailable' : 'Available'}
                    </span>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderWeekView = () => {
    const weekStart = startOfWeek(currentDate);
    const days = eachDayOfInterval({ start: weekStart, end: addDays(weekStart, 6) });

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-7 gap-4">
          {days.map(day => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const capacity = capacityData.get(dateStr);
            const enquiry = enquiryCounts.get(dateStr);

            return (
              <Card
                key={dateStr}
                className={`cursor-pointer hover:shadow-lg transition-all ${
                  isToday(day) ? 'border-emerald-600 border-2' : ''
                }`}
                onClick={() => handleDayClick(day)}
              >
                <CardHeader className="pb-2">
                  <div className="text-center">
                    <div className="text-sm text-gray-600">{format(day, 'EEE')}</div>
                    <div className={`text-2xl ${isToday(day) ? 'font-bold text-emerald-600' : ''}`}>
                      {format(day, 'd')}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {capacity && (
                    <>
                      <div className={`text-center p-2 rounded ${getCapacityColor(capacity.capacity_remaining, capacity.rooms_total)}`}>
                        <div className="text-lg font-bold">
                          {capacity.capacity_remaining}/{capacity.rooms_total}
                        </div>
                        <div className="text-xs">Capacity</div>
                      </div>
                      {capacity.rooms_from_ical > 0 && (
                        <div className="flex items-center justify-between text-xs">
                          <span className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-red-500" />
                            Airbnb
                          </span>
                          <span>{capacity.rooms_from_ical}</span>
                        </div>
                      )}
                      {enquiry && enquiry.approved > 0 && (
                        <Badge variant="secondary" className="w-full justify-center">
                          +{enquiry.approved} Enquiries
                        </Badge>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  };

  const renderDayView = () => {
    const dateStr = format(currentDate, 'yyyy-MM-dd');
    const capacity = capacityData.get(dateStr);
    const enquiry = enquiryCounts.get(dateStr);

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>
              {format(currentDate, 'EEEE, MMMM d, yyyy')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {capacity && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-3xl font-bold text-blue-600">{capacity.rooms_total}</div>
                  <div className="text-sm text-gray-600 mt-1">Total Rooms</div>
                </div>
                <div className={`text-center p-4 rounded-lg ${getCapacityColor(capacity.capacity_remaining, capacity.rooms_total)}`}>
                  <div className="text-3xl font-bold">{capacity.capacity_remaining}</div>
                  <div className="text-sm mt-1">Available</div>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-3xl font-bold text-red-600">{capacity.rooms_from_ical}</div>
                  <div className="text-sm text-gray-600 mt-1">External</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-3xl font-bold text-gray-600">{enquiry?.approved || 0}</div>
                  <div className="text-sm text-gray-600 mt-1">Enquiries</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Button
          onClick={() => handleDayClick(currentDate)}
          className="w-full"
          variant="outline"
        >
          View Detailed Breakdown
        </Button>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handlePrev}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleToday}>
              Today
            </Button>
            <Button variant="outline" size="sm" onClick={handleNext}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          <h2 className="text-2xl">
            {view === 'month' && format(currentDate, 'MMMM yyyy')}
            {view === 'week' && `Week of ${format(startOfWeek(currentDate), 'MMM d, yyyy')}`}
            {view === 'day' && format(currentDate, 'MMMM d, yyyy')}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadCalendarData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          {onOpenIntegrations && (
            <Button variant="outline" size="sm" onClick={onOpenIntegrations}>
              <Settings className="w-4 h-4 mr-2" />
              Integrations
            </Button>
          )}
        </div>
      </div>

      {/* View Tabs */}
      <Tabs value={view} onValueChange={(v) => setView(v as any)}>
        <TabsList>
          <TabsTrigger value="month">Month</TabsTrigger>
          <TabsTrigger value="week">Week</TabsTrigger>
          <TabsTrigger value="day">Day</TabsTrigger>
        </TabsList>

        <TabsContent value="month" className="mt-6">
          {loading ? <div className="text-center py-12">Loading...</div> : renderMonthView()}
        </TabsContent>

        <TabsContent value="week" className="mt-6">
          {loading ? <div className="text-center py-12">Loading...</div> : renderWeekView()}
        </TabsContent>

        <TabsContent value="day" className="mt-6">
          {loading ? <div className="text-center py-12">Loading...</div> : renderDayView()}
        </TabsContent>
      </Tabs>

      {/* Legend */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span>Airbnb</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span>Booking.com</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span>Internal</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-gray-100">+n</Badge>
              <span>Enquiries</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Block Dialog */}
      <Dialog open={showBlockDialog} onOpenChange={setShowBlockDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Availability Block</DialogTitle>
            <DialogDescription>
              Block {selectedDates.length} day(s) from availability
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Block Type</Label>
              <Select
                value={blockForm.type}
                onValueChange={(v: 'full' | 'partial') => setBlockForm({ ...blockForm, type: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full">Full Block (All Rooms)</SelectItem>
                  <SelectItem value="partial">Partial Block (Some Rooms)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {blockForm.type === 'partial' && (
              <div>
                <Label>Number of Rooms to Block</Label>
                <Input
                  type="number"
                  min={1}
                  max={roomsTotal}
                  value={blockForm.rooms}
                  onChange={(e) => setBlockForm({ ...blockForm, rooms: parseInt(e.target.value) || 1 })}
                />
              </div>
            )}

            <div>
              <Label>Reason</Label>
              <Input
                value={blockForm.reason}
                onChange={(e) => setBlockForm({ ...blockForm, reason: e.target.value })}
                placeholder="e.g., Maintenance, Renovation"
              />
            </div>

            <div>
              <Label>Notes (Optional)</Label>
              <Textarea
                value={blockForm.notes}
                onChange={(e) => setBlockForm({ ...blockForm, notes: e.target.value })}
                placeholder="Additional details..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBlockDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateBlock}>
              Create Block
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Day Detail Drawer */}
      <Sheet open={dayDetailOpen} onOpenChange={setDayDetailOpen}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          {selectedDay && (
            <>
              <SheetHeader>
                <SheetTitle>{format(selectedDay, 'EEEE, MMMM d, yyyy')}</SheetTitle>
                <SheetDescription>
                  Detailed capacity breakdown and bookings
                </SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                {/* Capacity Summary */}
                {capacityData.get(format(selectedDay, 'yyyy-MM-dd')) && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Capacity</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {(() => {
                        const cap = capacityData.get(format(selectedDay, 'yyyy-MM-dd'))!;
                        return (
                          <div className="space-y-3">
                            <div className={`p-4 rounded-lg ${getCapacityColor(cap.capacity_remaining, cap.rooms_total)}`}>
                              <div className="text-3xl font-bold">
                                {cap.capacity_remaining}/{cap.rooms_total}
                              </div>
                              <div className="text-sm mt-1">Rooms Available</div>
                            </div>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-600">From External Calendars:</span>
                                <span className="font-medium">{cap.rooms_from_ical}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">From Internal Bookings:</span>
                                <span className="font-medium">{cap.rooms_from_internal}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">From Partial Blocks:</span>
                                <span className="font-medium">{cap.rooms_from_partial_blocks}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </CardContent>
                  </Card>
                )}

                {/* External Events */}
                {icalEvents.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">External Bookings</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {icalEvents.map(event => (
                        <div key={event.id} className="flex items-start gap-3 p-3 bg-red-50 rounded-lg">
                          <div className="w-2 h-2 rounded-full bg-red-500 mt-2" />
                          <div className="flex-1">
                            <div className="font-medium">{event.title || 'Booking'}</div>
                            <div className="text-sm text-gray-600">
                              {format(new Date(event.start_date), 'MMM d')} - {format(new Date(event.end_date), 'MMM d')}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {event.feed?.platform} · {event.rooms_reserved} room(s)
                            </div>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {/* Internal Bookings */}
                {internalBookings.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Internal Bookings</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {internalBookings.map(booking => (
                        <div key={booking.id} className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                          <div className="w-2 h-2 rounded-full bg-green-500 mt-2" />
                          <div className="flex-1">
                            <div className="font-medium">{booking.guest_name}</div>
                            <div className="text-sm text-gray-600">
                              Ref: {booking.reference_number}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {booking.rooms_booked} room(s) · {booking.status}
                            </div>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {/* Approved Enquiries */}
                {enquiries.filter(e => e.status === 'approved').length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Approved Enquiries</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {enquiries.filter(e => e.status === 'approved').map(enquiry => (
                        <div key={enquiry.id} className="p-3 bg-gray-50 rounded-lg">
                          <div className="font-medium">{enquiry.guest_name}</div>
                          <div className="text-sm text-gray-600">{enquiry.email}</div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {/* Availability Blocks */}
                {availabilityBlocks.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Availability Blocks</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {availabilityBlocks.map(block => (
                        <div key={block.id} className="flex items-start justify-between p-3 bg-gray-100 rounded-lg">
                          <div>
                            <Badge variant={block.block_type === 'full' ? 'destructive' : 'secondary'}>
                              {block.block_type === 'full' ? 'Full Block' : `−${block.rooms_blocked} rooms`}
                            </Badge>
                            <div className="text-sm mt-2">{block.reason}</div>
                            {block.notes && (
                              <div className="text-xs text-gray-600 mt-1">{block.notes}</div>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteBlock(block.id)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
