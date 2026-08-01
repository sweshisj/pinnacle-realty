import React, { useState, useEffect } from 'react';
import { Calendar, Search, DollarSign, CheckCircle, XCircle, AlertCircle, Building2, Phone, Mail, CreditCard } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Checkbox } from '../ui/checkbox';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { toast } from 'sonner';
import { format, isPast, isFuture, isToday } from 'date-fns';
import {
  fetchAllBookings,
  updateBooking,
  Booking
} from '../../utils/supabase/servicedApartmentsOperations';

export default function AdminServicedBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPaymentStatus, setFilterPaymentStatus] = useState('all');
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [actionDialog, setActionDialog] = useState<'checkin' | 'checkout' | 'payment' | 'cancel' | null>(null);
  const [actionData, setActionData] = useState({
    checkin_notes: '',
    checkout_notes: '',
    payment_amount: 0,
    payment_method: '',
    cancel_reason: ''
  });

  useEffect(() => {
    loadBookings();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [bookings, searchQuery, filterStatus, filterPaymentStatus]);

  const loadBookings = async () => {
    setLoading(true);
    const { data, error } = await fetchAllBookings();
    if (data) {
      setBookings(data);
    }
    setLoading(false);
  };

  const applyFilters = () => {
    let filtered = [...bookings];

    if (searchQuery) {
      filtered = filtered.filter(booking =>
        booking.guest_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        booking.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        booking.phone.includes(searchQuery)
      );
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(booking => booking.booking_status === filterStatus);
    }

    if (filterPaymentStatus !== 'all') {
      filtered = filtered.filter(booking => booking.payment_status === filterPaymentStatus);
    }

    filtered.sort((a, b) => new Date(a.check_in_date).getTime() - new Date(b.check_in_date).getTime());
    setFilteredBookings(filtered);
  };

  const handleCheckIn = async () => {
    if (!selectedBooking) return;

    const { error } = await updateBooking(selectedBooking.id, {
      booking_status: 'checked_in',
      checkin_completed: true,
      checkin_notes: actionData.checkin_notes
    });

    if (error) {
      toast.error('Failed to check in');
      return;
    }

    toast.success('Guest checked in successfully');
    setActionDialog(null);
    setSelectedBooking(null);
    loadBookings();
  };

  const handleCheckOut = async () => {
    if (!selectedBooking) return;

    const { error } = await updateBooking(selectedBooking.id, {
      booking_status: 'checked_out',
      checkout_completed: true,
      checkout_notes: actionData.checkout_notes
    });

    if (error) {
      toast.error('Failed to check out');
      return;
    }

    toast.success('Guest checked out successfully');
    setActionDialog(null);
    setSelectedBooking(null);
    loadBookings();
  };

  const handlePayment = async () => {
    if (!selectedBooking || !actionData.payment_amount) return;

    const newAmountPaid = (selectedBooking.amount_paid || 0) + actionData.payment_amount;
    const newPaymentStatus = newAmountPaid >= selectedBooking.total_amount ? 'paid' : 'partial';

    const { error } = await updateBooking(selectedBooking.id, {
      amount_paid: newAmountPaid,
      payment_status: newPaymentStatus,
      payment_method: actionData.payment_method
    });

    if (error) {
      toast.error('Failed to record payment');
      return;
    }

    toast.success('Payment recorded successfully');
    setActionDialog(null);
    setSelectedBooking(null);
    setActionData({ ...actionData, payment_amount: 0, payment_method: '' });
    loadBookings();
  };

  const handleCancel = async () => {
    if (!selectedBooking) return;

    const { error } = await updateBooking(selectedBooking.id, {
      booking_status: 'cancelled',
      checkout_notes: actionData.cancel_reason
    });

    if (error) {
      toast.error('Failed to cancel booking');
      return;
    }

    toast.success('Booking cancelled');
    setActionDialog(null);
    setSelectedBooking(null);
    loadBookings();
  };

  const getBookingStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'checked_in': return 'bg-green-100 text-green-800';
      case 'checked_out': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'partial': return 'bg-yellow-100 text-yellow-800';
      case 'pending': return 'bg-orange-100 text-orange-800';
      case 'refunded': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getBookingTiming = (booking: Booking) => {
    const checkInDate = new Date(booking.check_in_date);
    const checkOutDate = new Date(booking.check_out_date);
    
    if (isPast(checkOutDate)) return { label: 'Past', color: 'text-gray-500' };
    if (booking.booking_status === 'checked_in') return { label: 'Active', color: 'text-green-600' };
    if (isToday(checkInDate)) return { label: 'Today', color: 'text-blue-600' };
    if (isFuture(checkInDate)) return { label: 'Upcoming', color: 'text-purple-600' };
    return { label: 'Current', color: 'text-emerald-600' };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="mb-1">Bookings</h2>
        <p className="text-gray-600">Manage serviced apartment bookings and check-ins</p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by name, email, or phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Booking Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="checked_in">Checked In</SelectItem>
                <SelectItem value="checked_out">Checked Out</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterPaymentStatus} onValueChange={setFilterPaymentStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Payment Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Payments</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{bookings.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Confirmed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl text-blue-600">{bookings.filter(b => b.booking_status === 'confirmed').length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl text-green-600">{bookings.filter(b => b.booking_status === 'checked_in').length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Payment Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl text-orange-600">{bookings.filter(b => b.payment_status === 'pending').length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Paid</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl text-green-600">{bookings.filter(b => b.payment_status === 'paid').length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl">${bookings.reduce((sum, b) => sum + (b.amount_paid || 0), 0).toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      {/* Bookings List */}
      <Card>
        <CardHeader>
          <CardTitle>{filteredBookings.length} Bookings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-8 text-gray-500">Loading bookings...</div>
            ) : filteredBookings.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No bookings found</div>
            ) : (
              filteredBookings.map(booking => {
                const timing = getBookingTiming(booking);
                return (
                  <div
                    key={booking.id}
                    className="p-4 border border-gray-200 rounded-lg hover:border-emerald-300 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-sm">{booking.guest_name}</h3>
                          <Badge className={getBookingStatusColor(booking.booking_status)}>
                            {booking.booking_status}
                          </Badge>
                          <Badge className={getPaymentStatusColor(booking.payment_status)}>
                            {booking.payment_status}
                          </Badge>
                          <span className={`text-xs ${timing.color}`}>{timing.label}</span>
                        </div>
                        <p className="text-sm text-gray-600">
                          {booking.apartment?.title || 'Unknown Unit'}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-emerald-600">${booking.total_amount.toLocaleString()}</div>
                        <div className="text-xs text-gray-500">
                          Paid: ${(booking.amount_paid || 0).toLocaleString()}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3 text-sm">
                      <div className="flex items-center gap-1 text-gray-600">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(booking.check_in_date), 'MMM dd')} - {format(new Date(booking.check_out_date), 'MMM dd')}
                      </div>
                      <div className="flex items-center gap-1 text-gray-600">
                        <Mail className="w-3 h-3" />
                        {booking.email}
                      </div>
                      <div className="flex items-center gap-1 text-gray-600">
                        <Phone className="w-3 h-3" />
                        {booking.phone}
                      </div>
                      <div className="flex items-center gap-1 text-gray-600">
                        <Building2 className="w-3 h-3" />
                        {booking.total_nights} night{booking.total_nights !== 1 ? 's' : ''}
                      </div>
                    </div>

                    {/* KYC Status */}
                    {booking.kyc_required !== false && (
                      <div className="flex items-center gap-2 mb-3 text-sm">
                        {booking.kyc_verified ? (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            KYC Verified
                          </Badge>
                        ) : booking.kyc_submitted ? (
                          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            KYC Pending Review
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                            <XCircle className="w-3 h-3 mr-1" />
                            KYC Not Submitted
                          </Badge>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {booking.booking_status === 'confirmed' && !booking.checkin_completed && (
                        <Button
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-700"
                          onClick={() => {
                            setSelectedBooking(booking);
                            setActionDialog('checkin');
                          }}
                        >
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Check In
                        </Button>
                      )}
                      {booking.booking_status === 'checked_in' && !booking.checkout_completed && (
                        <Button
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700"
                          onClick={() => {
                            setSelectedBooking(booking);
                            setActionDialog('checkout');
                          }}
                        >
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Check Out
                        </Button>
                      )}
                      {booking.payment_status !== 'paid' && booking.booking_status !== 'cancelled' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedBooking(booking);
                            setActionDialog('payment');
                          }}
                        >
                          <CreditCard className="w-3 h-3 mr-1" />
                          Record Payment
                        </Button>
                      )}
                      {booking.booking_status !== 'cancelled' && booking.booking_status !== 'checked_out' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600"
                          onClick={() => {
                            setSelectedBooking(booking);
                            setActionDialog('cancel');
                          }}
                        >
                          <XCircle className="w-3 h-3 mr-1" />
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Check-in Dialog */}
      <Dialog open={actionDialog === 'checkin'} onOpenChange={() => setActionDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Check In Guest</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p>Check in <strong>{selectedBooking?.guest_name}</strong>?</p>
            <div className="bg-emerald-50 p-3 rounded-lg text-sm">
              <p><strong>Unit:</strong> {selectedBooking?.apartment?.title}</p>
              <p><strong>Check-in Date:</strong> {selectedBooking && format(new Date(selectedBooking.check_in_date), 'PPP')}</p>
              <p><strong>Duration:</strong> {selectedBooking?.total_nights} nights</p>
            </div>
            <div>
              <Label htmlFor="checkin_notes">Check-in Notes</Label>
              <Textarea
                id="checkin_notes"
                value={actionData.checkin_notes}
                onChange={(e) => setActionData(prev => ({ ...prev, checkin_notes: e.target.value }))}
                placeholder="Any notes or observations..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog(null)}>Cancel</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handleCheckIn}>
              Confirm Check In
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Check-out Dialog */}
      <Dialog open={actionDialog === 'checkout'} onOpenChange={() => setActionDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Check Out Guest</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p>Check out <strong>{selectedBooking?.guest_name}</strong>?</p>
            <div className="bg-blue-50 p-3 rounded-lg text-sm">
              <p><strong>Unit:</strong> {selectedBooking?.apartment?.title}</p>
              <p><strong>Check-out Date:</strong> {selectedBooking && format(new Date(selectedBooking.check_out_date), 'PPP')}</p>
            </div>
            <div>
              <Label htmlFor="checkout_notes">Check-out Notes</Label>
              <Textarea
                id="checkout_notes"
                value={actionData.checkout_notes}
                onChange={(e) => setActionData(prev => ({ ...prev, checkout_notes: e.target.value }))}
                placeholder="Condition of unit, damages, etc..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog(null)}>Cancel</Button>
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleCheckOut}>
              Confirm Check Out
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={actionDialog === 'payment'} onOpenChange={() => setActionDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p>Record payment for <strong>{selectedBooking?.guest_name}</strong></p>
            <div className="bg-gray-50 p-3 rounded-lg text-sm space-y-1">
              <p><strong>Total Amount:</strong> ${selectedBooking?.total_amount.toLocaleString()}</p>
              <p><strong>Amount Paid:</strong> ${(selectedBooking?.amount_paid || 0).toLocaleString()}</p>
              <p className="text-orange-600"><strong>Balance Due:</strong> ${((selectedBooking?.total_amount || 0) - (selectedBooking?.amount_paid || 0)).toLocaleString()}</p>
            </div>
            <div>
              <Label htmlFor="payment_amount">Payment Amount ($)</Label>
              <Input
                id="payment_amount"
                type="number"
                value={actionData.payment_amount}
                onChange={(e) => setActionData(prev => ({ ...prev, payment_amount: parseFloat(e.target.value) || 0 }))}
                placeholder="Enter amount"
              />
            </div>
            <div>
              <Label htmlFor="payment_method">Payment Method</Label>
              <Select 
                value={actionData.payment_method} 
                onValueChange={(value) => setActionData(prev => ({ ...prev, payment_method: value }))}
              >
                <SelectTrigger id="payment_method">
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cash">Cash</SelectItem>
                  <SelectItem value="Card">Card</SelectItem>
                  <SelectItem value="UPI">UPI</SelectItem>
                  <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                  <SelectItem value="Cheque">Cheque</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog(null)}>Cancel</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handlePayment}>
              Record Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Dialog */}
      <Dialog open={actionDialog === 'cancel'} onOpenChange={() => setActionDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Booking</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p>Cancel booking for <strong>{selectedBooking?.guest_name}</strong>?</p>
            <div className="bg-red-50 p-3 rounded-lg text-sm">
              <p>This will mark the booking as cancelled and free up the dates.</p>
            </div>
            <div>
              <Label htmlFor="cancel_reason">Cancellation Reason</Label>
              <Textarea
                id="cancel_reason"
                value={actionData.cancel_reason}
                onChange={(e) => setActionData(prev => ({ ...prev, cancel_reason: e.target.value }))}
                placeholder="Reason for cancellation..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog(null)}>Back</Button>
            <Button variant="destructive" onClick={handleCancel}>
              Cancel Booking
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
