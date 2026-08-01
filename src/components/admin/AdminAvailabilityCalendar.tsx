import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import {
  ChevronLeft,
  ChevronRight,
  X,
  Plus,
  Check,
} from 'lucide-react';
import {
  getAdminAvailability,
  createAvailabilityBlock,
  getAvailabilityBlocks,
  deleteAvailabilityBlock,
  getEnquiries,
  approveEnquiry,
  createManualEnquiry,
  type DayAvailability,
  type AvailabilityBlock,
  type Enquiry,
} from '../../lib/enquiry-api';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  addMonths,
  subMonths,
  isSameMonth,
  parseISO,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval as getDaysInRange,
  isWithinInterval,
  addDays,
} from 'date-fns';

interface AdminAvailabilityCalendarProps {
  apartmentId: string;
}

type StatusFilter = 'all' | 'requested' | 'approved' | 'declined';

export function AdminAvailabilityCalendar({ apartmentId }: AdminAvailabilityCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [availability, setAvailability] = useState<Map<string, DayAvailability>>(new Map());
  const [blocks, setBlocks] = useState<AvailabilityBlock[]>([]);
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  
  // Date selection state
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
  
  // Dialog states
  const [showBlockDialog, setShowBlockDialog] = useState(false);
  const [showMarkAvailableDialog, setShowMarkAvailableDialog] = useState(false);
  const [showManualCountDialog, setShowManualCountDialog] = useState(false);
  const [blockReason, setBlockReason] = useState<'admin_block' | 'maintenance' | 'sold_out' | 'event'>('admin_block');
  const [blockNotes, setBlockNotes] = useState('');
  const [manualCount, setManualCount] = useState(1);
  const [manualGuestName, setManualGuestName] = useState('');

  useEffect(() => {
    loadData();
  }, [apartmentId, currentMonth, statusFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const start = startOfWeek(startOfMonth(currentMonth));
      const end = endOfWeek(endOfMonth(currentMonth));
      
      await Promise.all([
        loadAvailability(start, end),
        loadBlocks(),
        loadEnquiries(),
      ]);
    } finally {
      setLoading(false);
    }
  };

  const loadAvailability = async (start: Date, end: Date) => {
    try {
      const data = await getAdminAvailability({
        sa_id: apartmentId,
        from_date: format(start, 'yyyy-MM-dd'),
        to_date: format(end, 'yyyy-MM-dd'),
      });

      const availMap = new Map<string, DayAvailability>();
      data.forEach((day) => {
        availMap.set(day.date, day);
      });
      setAvailability(availMap);
    } catch (error) {
      console.error('Failed to load availability:', error);
    }
  };

  const loadBlocks = async () => {
    try {
      const data = await getAvailabilityBlocks(apartmentId);
      setBlocks(data);
    } catch (error) {
      console.error('Failed to load availability blocks:', error);
    }
  };

  const loadEnquiries = async () => {
    try {
      const params: { sa_id: string; status?: 'requested' | 'approved' | 'declined' } = {
        sa_id: apartmentId,
      };
      
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      
      const data = await getEnquiries(params);
      setEnquiries(data);
    } catch (error) {
      console.error('Failed to load enquiries:', error);
    }
  };

  const handlePrevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
    resetSelection();
  };

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
    resetSelection();
  };

  const resetSelection = () => {
    setStartDate(null);
    setEndDate(null);
  };

  const handleDayClick = (dateStr: string) => {
    if (!startDate) {
      // First click: set start date
      setStartDate(dateStr);
      setEndDate(null);
    } else if (!endDate) {
      // Second click: set end date
      if (dateStr < startDate) {
        // If clicked date is before start, swap them
        setEndDate(startDate);
        setStartDate(dateStr);
      } else {
        setEndDate(dateStr);
      }
    } else {
      // Third click: reset and start over
      setStartDate(dateStr);
      setEndDate(null);
    }
  };

  const getSelectedDates = (): string[] => {
    if (!startDate) return [];
    if (!endDate) return [startDate];
    
    const start = parseISO(startDate);
    const end = parseISO(endDate);
    const days = getDaysInRange({ start, end });
    return days.map(day => format(day, 'yyyy-MM-dd'));
  };

  const handleMarkUnavailable = () => {
    const selectedDates = getSelectedDates();
    if (selectedDates.length === 0) {
      alert('Please select dates first');
      return;
    }
    setShowBlockDialog(true);
  };

  const handleMarkAvailable = () => {
    const selectedDates = getSelectedDates();
    if (selectedDates.length === 0) {
      alert('Please select dates first');
      return;
    }
    setShowMarkAvailableDialog(true);
  };

  const handleAddManualCount = () => {
    const selectedDates = getSelectedDates();
    if (selectedDates.length === 0) {
      alert('Please select dates first');
      return;
    }
    setShowManualCountDialog(true);
  };

  const handleCreateBlock = async () => {
    const selectedDates = getSelectedDates();
    if (selectedDates.length === 0) return;

    try {
      const sortedDates = [...selectedDates].sort();
      const startDateStr = sortedDates[0];
      const lastDateStr = sortedDates[sortedDates.length - 1];
      
      // Add 1 day to last date for half-open interval [start, end)
      const endDateStr = format(
        addDays(parseISO(lastDateStr), 1),
        'yyyy-MM-dd'
      );

      await createAvailabilityBlock({
        sa_id: apartmentId,
        start_date: startDateStr,
        end_date: endDateStr,
        reason: blockReason,
        notes: blockNotes,
      });

      resetSelection();
      setShowBlockDialog(false);
      setBlockNotes('');
      loadData();
    } catch (error) {
      console.error('Failed to create availability block:', error);
      alert('Failed to mark dates as unavailable');
    }
  };

  const handleRemoveBlocksInRange = async () => {
    const selectedDates = getSelectedDates();
    if (selectedDates.length === 0) return;

    try {
      const startDateObj = parseISO(selectedDates[0]);
      const endDateObj = parseISO(selectedDates[selectedDates.length - 1]);

      // Find all blocks that overlap with selected range
      const blocksToRemove = blocks.filter(block => {
        const blockStart = parseISO(block.start_date);
        const blockEnd = parseISO(block.end_date);
        
        // Check if there's any overlap
        return (blockStart <= endDateObj && blockEnd >= startDateObj);
      });

      if (blocksToRemove.length === 0) {
        alert('No unavailable blocks found in selected date range');
        return;
      }

      if (!confirm(`Remove ${blocksToRemove.length} unavailable block(s) from this date range?`)) {
        return;
      }

      await Promise.all(blocksToRemove.map(block => deleteAvailabilityBlock(block.id)));
      
      resetSelection();
      setShowMarkAvailableDialog(false);
      loadData();
    } catch (error) {
      console.error('Failed to remove blocks:', error);
      alert('Failed to mark dates as available');
    }
  };

  const handleConfirmManualCount = async () => {
    const selectedDates = getSelectedDates();
    if (selectedDates.length === 0) return;

    if (!manualGuestName.trim()) {
      alert('Please enter a guest name');
      return;
    }

    try {
      const sortedDates = [...selectedDates].sort();
      const startDateStr = sortedDates[0];
      const lastDateStr = sortedDates[sortedDates.length - 1];
      
      // Add 1 day to last date for half-open interval [start, end)
      const endDateStr = format(
        addDays(parseISO(lastDateStr), 1),
        'yyyy-MM-dd'
      );

      // Create approved enquiries for the manual count
      for (let i = 0; i < manualCount; i++) {
        await createManualEnquiry({
          sa_id: apartmentId,
          guest_name: `${manualGuestName} (${i + 1}/${manualCount})`,
          start_date: startDateStr,
          end_date: endDateStr,
          notes: 'Manually created by admin',
        });
      }

      resetSelection();
      setShowManualCountDialog(false);
      setManualCount(1);
      setManualGuestName('');
      loadData();
    } catch (error) {
      console.error('Failed to add manual count:', error);
      alert(`Failed to add manual count: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Get enquiry count for a specific date
  const getEnquiryCountForDate = (dateStr: string): { requested: number; approved: number; declined: number } => {
    const date = parseISO(dateStr);
    const counts = { requested: 0, approved: 0, declined: 0 };

    enquiries.forEach(enquiry => {
      const enquiryStart = parseISO(enquiry.start_date);
      const enquiryEnd = parseISO(enquiry.end_date);
      
      if (date >= enquiryStart && date < enquiryEnd) {
        if (enquiry.status === 'requested') counts.requested++;
        else if (enquiry.status === 'approved') counts.approved++;
        else if (enquiry.status === 'declined') counts.declined++;
      }
    });

    return counts;
  };

  const renderCalendar = () => {
    const start = startOfWeek(startOfMonth(currentMonth));
    const end = endOfWeek(endOfMonth(currentMonth));
    const days = eachDayOfInterval({ start, end });

    const weeks: Date[][] = [];
    let currentWeek: Date[] = [];

    days.forEach((day) => {
      currentWeek.push(day);
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    });

    const selectedDates = getSelectedDates();

    return (
      <div className="space-y-1">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="text-center text-sm text-gray-600 p-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="grid grid-cols-7 gap-1">
            {week.map((day) => {
              const dateStr = format(day, 'yyyy-MM-dd');
              const dayData = availability.get(dateStr);
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const isSelected = selectedDates.includes(dateStr);
              const isUnavailable = dayData?.is_unavailable || false;
              const enquiryCounts = getEnquiryCountForDate(dateStr);
              
              let displayCount = 0;
              let countColor = 'blue';
              
              if (statusFilter === 'all' || statusFilter === 'approved') {
                displayCount += enquiryCounts.approved;
              }
              if (statusFilter === 'all' || statusFilter === 'requested') {
                displayCount += enquiryCounts.requested;
                if (enquiryCounts.requested > 0) countColor = 'amber';
              }
              if (statusFilter === 'all' || statusFilter === 'declined') {
                displayCount += enquiryCounts.declined;
                if (enquiryCounts.declined > 0) countColor = 'gray';
              }

              return (
                <button
                  key={dateStr}
                  onClick={() => isCurrentMonth && handleDayClick(dateStr)}
                  disabled={!isCurrentMonth}
                  className={`
                    relative min-h-[80px] p-2 rounded-lg border-2 transition-all
                    ${!isCurrentMonth ? 'bg-gray-50 text-gray-300 cursor-not-allowed' : ''}
                    ${isCurrentMonth && !isUnavailable ? 'bg-white hover:bg-emerald-50 border-gray-200' : ''}
                    ${isUnavailable ? 'bg-red-50 border-red-200 hover:bg-red-100' : ''}
                    ${isSelected ? 'border-emerald-500 ring-2 ring-emerald-200' : ''}
                  `}
                >
                  <div className="flex flex-col items-start h-full">
                    <span className={`text-sm ${!isCurrentMonth ? 'text-gray-300' : isUnavailable ? 'text-red-700' : ''}`}>
                      {format(day, 'd')}
                    </span>
                    
                    {isCurrentMonth && (
                      <div className="mt-auto space-y-1 w-full">
                        {isUnavailable && (
                          <Badge className="text-xs bg-red-100 text-red-800 border-red-200">
                            Unavailable
                          </Badge>
                        )}
                        {!isUnavailable && displayCount === 0 && (
                          <Badge className="text-xs bg-green-100 text-green-800 border-green-200">
                            Available
                          </Badge>
                        )}
                        {displayCount > 0 && (
                          <Badge className={`text-xs ${
                            countColor === 'blue' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                            countColor === 'amber' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                            'bg-gray-100 text-gray-800 border-gray-200'
                          }`}>
                            +{displayCount}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Status filter tabs */}
      <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
        <TabsList>
          <TabsTrigger value="all">All Enquiries</TabsTrigger>
          <TabsTrigger value="requested">Requested</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="declined">Declined</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Calendar header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={handlePrevMonth}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <h3 className="text-lg font-medium min-w-[200px] text-center">
            {format(currentMonth, 'MMMM yyyy')}
          </h3>
          <Button variant="outline" size="sm" onClick={handleNextMonth}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {(startDate || endDate) && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">
              {startDate && !endDate && `Selected: ${format(parseISO(startDate), 'MMM dd')}`}
              {startDate && endDate && `Selected: ${format(parseISO(startDate), 'MMM dd')} - ${format(parseISO(endDate), 'MMM dd')}`}
            </span>
            <Button size="sm" onClick={handleMarkUnavailable} className="bg-red-600 hover:bg-red-700">
              <X className="w-4 h-4 mr-1" />
              Mark Unavailable
            </Button>
            <Button size="sm" onClick={handleMarkAvailable} className="bg-green-600 hover:bg-green-700">
              <Check className="w-4 h-4 mr-1" />
              Mark Available
            </Button>
            <Button size="sm" onClick={handleAddManualCount} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-1" />
              Add +n
            </Button>
            <Button size="sm" variant="outline" onClick={resetSelection}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-sm text-gray-600 pb-2 border-b">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-green-100 border border-green-200" />
          <span>Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-red-100 border border-red-200" />
          <span>Unavailable</span>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="text-xs bg-blue-100 text-blue-800 border-blue-200">+n</Badge>
          <span>Approved</span>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="text-xs bg-amber-100 text-amber-800 border-amber-200">+n</Badge>
          <span>Requested</span>
        </div>
      </div>

      {/* Calendar */}
      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading calendar...</div>
      ) : (
        renderCalendar()
      )}

      {/* Active blocks list */}
      {blocks.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h4 className="font-medium mb-3">Active Unavailable Blocks</h4>
            <div className="space-y-2">
              {blocks.map((block) => (
                <div key={block.id} className="flex items-center justify-between p-2 bg-red-50 rounded border border-red-200">
                  <div className="text-sm">
                    <span className="font-medium">
                      {format(parseISO(block.start_date), 'MMM dd')} – {format(parseISO(block.end_date), 'MMM dd, yyyy')}
                    </span>
                    <span className="text-gray-600 ml-2">({block.reason.replace('_', ' ')})</span>
                    {block.notes && <p className="text-gray-600 mt-1">{block.notes}</p>}
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => {
                    if (confirm('Remove this unavailable block?')) {
                      deleteAvailabilityBlock(block.id).then(() => loadData());
                    }
                  }}>
                    <X className="w-4 h-4 text-red-600" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mark Unavailable Dialog */}
      {showBlockDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardContent className="p-6">
              <h3 className="text-lg font-medium mb-4">Mark Dates as Unavailable</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Reason</label>
                  <select
                    value={blockReason}
                    onChange={(e) => setBlockReason(e.target.value as any)}
                    className="w-full p-2 border rounded"
                  >
                    <option value="admin_block">Admin Block</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="sold_out">Sold Out</option>
                    <option value="event">Event</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Notes (optional)</label>
                  <textarea
                    value={blockNotes}
                    onChange={(e) => setBlockNotes(e.target.value)}
                    className="w-full p-2 border rounded"
                    rows={3}
                    placeholder="Add any notes about this block..."
                  />
                </div>

                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setShowBlockDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateBlock} className="bg-red-600 hover:bg-red-700">
                    Mark Unavailable
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Mark Available Dialog */}
      {showMarkAvailableDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardContent className="p-6">
              <h3 className="text-lg font-medium mb-4">Mark Dates as Available</h3>
              
              <p className="text-sm text-gray-600 mb-4">
                This will remove all unavailable blocks in the selected date range.
              </p>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowMarkAvailableDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleRemoveBlocksInRange} className="bg-green-600 hover:bg-green-700">
                  Mark Available
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Add Manual Count Dialog */}
      {showManualCountDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardContent className="p-6">
              <h3 className="text-lg font-medium mb-4">Add Manual Booking Count</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Guest Name</label>
                  <input
                    type="text"
                    value={manualGuestName}
                    onChange={(e) => setManualGuestName(e.target.value)}
                    className="w-full p-2 border rounded"
                    placeholder="Enter guest name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Count</label>
                  <input
                    type="number"
                    min="1"
                    value={manualCount}
                    onChange={(e) => setManualCount(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full p-2 border rounded"
                  />
                </div>

                <p className="text-sm text-gray-600">
                  This will create {manualCount} approved enquir{manualCount > 1 ? 'ies' : 'y'} for the selected dates.
                </p>

                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setShowManualCountDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleConfirmManualCount} className="bg-blue-600 hover:bg-blue-700">
                    Add Count
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}