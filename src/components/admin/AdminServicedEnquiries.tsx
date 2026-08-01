import React, { useState, useEffect } from 'react';
import { Mail, Phone, Building2, Calendar, MessageSquare, Check, X, Send, Search } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { toast } from 'sonner';
import { format } from 'date-fns';
import {
  fetchAllEnquiries,
  updateEnquiry,
  Enquiry,
  createBooking,
  upsertAvailability
} from '../../utils/supabase/servicedApartmentsOperations';

export default function AdminServicedEnquiries() {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [filteredEnquiries, setFilteredEnquiries] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedEnquiry, setSelectedEnquiry] = useState<Enquiry | null>(null);
  const [actionDialog, setActionDialog] = useState<'approve' | 'decline' | 'message' | null>(null);
  const [actionData, setActionData] = useState({
    notes: '',
    decline_reason: '',
    suggested_dates: '',
    message: ''
  });

  useEffect(() => {
    loadEnquiries();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [enquiries, searchQuery, filterStatus]);

  const loadEnquiries = async () => {
    setLoading(true);
    const { data, error } = await fetchAllEnquiries();
    if (data) {
      setEnquiries(data);
    }
    setLoading(false);
  };

  const applyFilters = () => {
    let filtered = [...enquiries];

    if (searchQuery) {
      filtered = filtered.filter(enq =>
        enq.guest_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        enq.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        enq.phone.includes(searchQuery)
      );
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(enq => enq.status === filterStatus);
    }

    filtered.sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime());
    setFilteredEnquiries(filtered);
  };

  const handleApprove = async () => {
    if (!selectedEnquiry) return;

    // Update enquiry status
    const { error: updateError } = await updateEnquiry(selectedEnquiry.id, {
      status: 'approved',
      admin_notes: actionData.notes
    });

    if (updateError) {
      toast.error('Failed to approve enquiry');
      return;
    }

    // If dates are provided, create booking and block dates
    if (selectedEnquiry.check_in_date && selectedEnquiry.check_out_date && selectedEnquiry.apartment_id) {
      // Block the dates
      await upsertAvailability({
        apartment_id: selectedEnquiry.apartment_id,
        start_date: selectedEnquiry.check_in_date,
        end_date: selectedEnquiry.check_out_date,
        status: 'booked',
        notes: `Booked by ${selectedEnquiry.guest_name}`
      });

      // Create booking
      const nights = Math.ceil(
        (new Date(selectedEnquiry.check_out_date).getTime() - new Date(selectedEnquiry.check_in_date).getTime()) / (1000 * 60 * 60 * 24)
      );

      await createBooking({
        apartment_id: selectedEnquiry.apartment_id,
        enquiry_id: selectedEnquiry.id,
        guest_name: selectedEnquiry.guest_name,
        email: selectedEnquiry.email,
        phone: selectedEnquiry.phone,
        company: selectedEnquiry.company,
        check_in_date: selectedEnquiry.check_in_date,
        check_out_date: selectedEnquiry.check_out_date,
        guests: selectedEnquiry.guests || 1,
        total_nights: nights,
        base_price: 0,
        total_amount: 0,
        booking_status: 'confirmed',
        payment_status: 'pending'
      });
    }

    toast.success('Enquiry approved and booking created');
    setActionDialog(null);
    setSelectedEnquiry(null);
    setActionData({ notes: '', decline_reason: '', suggested_dates: '', message: '' });
    loadEnquiries();
  };

  const handleDecline = async () => {
    if (!selectedEnquiry) return;

    const { error } = await updateEnquiry(selectedEnquiry.id, {
      status: 'declined',
      decline_reason: actionData.decline_reason,
      admin_notes: actionData.notes
    });

    if (error) {
      toast.error('Failed to decline enquiry');
      return;
    }

    toast.success('Enquiry declined');
    setActionDialog(null);
    setSelectedEnquiry(null);
    setActionData({ notes: '', decline_reason: '', suggested_dates: '', message: '' });
    loadEnquiries();
  };

  const handleMarkContacted = async (enquiry: Enquiry) => {
    const { error } = await updateEnquiry(enquiry.id, {
      status: 'contacted'
    });

    if (error) {
      toast.error('Failed to update status');
      return;
    }

    toast.success('Marked as contacted');
    loadEnquiries();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'contacted': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'declined': return 'bg-red-100 text-red-800';
      case 'converted': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="mb-1">Enquiries</h2>
        <p className="text-gray-600">Manage serviced apartment enquiries and bookings</p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="contacted">Contacted</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="declined">Declined</SelectItem>
                <SelectItem value="converted">Converted</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{enquiries.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">New</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl text-blue-600">{enquiries.filter(e => e.status === 'new').length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Contacted</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl text-yellow-600">{enquiries.filter(e => e.status === 'contacted').length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Approved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl text-green-600">{enquiries.filter(e => e.status === 'approved').length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Declined</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl text-red-600">{enquiries.filter(e => e.status === 'declined').length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Enquiries List */}
      <Card>
        <CardHeader>
          <CardTitle>{filteredEnquiries.length} Enquiries</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-8 text-gray-500">Loading enquiries...</div>
            ) : filteredEnquiries.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No enquiries found</div>
            ) : (
              filteredEnquiries.map(enquiry => (
                <div
                  key={enquiry.id}
                  className="p-4 border border-gray-200 rounded-lg hover:border-emerald-300 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm">{enquiry.guest_name}</h3>
                        <Badge className={getStatusColor(enquiry.status)}>
                          {enquiry.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">
                        {enquiry.apartment?.title || 'Unknown Unit'}
                      </p>
                    </div>
                    <div className="text-xs text-gray-500">
                      {format(new Date(enquiry.created_at || ''), 'PPp')}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3 text-sm">
                    <div className="flex items-center gap-1 text-gray-600">
                      <Mail className="w-3 h-3" />
                      {enquiry.email}
                    </div>
                    <div className="flex items-center gap-1 text-gray-600">
                      <Phone className="w-3 h-3" />
                      {enquiry.phone}
                    </div>
                    {enquiry.company && (
                      <div className="flex items-center gap-1 text-gray-600">
                        <Building2 className="w-3 h-3" />
                        {enquiry.company}
                      </div>
                    )}
                    {enquiry.check_in_date && enquiry.check_out_date && (
                      <div className="flex items-center gap-1 text-gray-600">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(enquiry.check_in_date), 'MMM dd')} - {format(new Date(enquiry.check_out_date), 'MMM dd')}
                      </div>
                    )}
                  </div>

                  {enquiry.special_requests && (
                    <p className="text-sm text-gray-600 mb-3 italic">"{enquiry.special_requests}"</p>
                  )}

                  {enquiry.status === 'new' || enquiry.status === 'contacted' ? (
                    <div className="flex items-center gap-2">
                      {enquiry.status === 'new' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleMarkContacted(enquiry)}
                        >
                          Mark Contacted
                        </Button>
                      )}
                      <Button
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-700"
                        onClick={() => {
                          setSelectedEnquiry(enquiry);
                          setActionDialog('approve');
                        }}
                      >
                        <Check className="w-3 h-3 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600"
                        onClick={() => {
                          setSelectedEnquiry(enquiry);
                          setActionDialog('decline');
                        }}
                      >
                        <X className="w-3 h-3 mr-1" />
                        Decline
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedEnquiry(enquiry);
                          setActionDialog('message');
                        }}
                      >
                        <MessageSquare className="w-3 h-3 mr-1" />
                        Message
                      </Button>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500">
                      {enquiry.admin_notes && <p>Notes: {enquiry.admin_notes}</p>}
                      {enquiry.decline_reason && <p>Decline reason: {enquiry.decline_reason}</p>}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Approve Dialog */}
      <Dialog open={actionDialog === 'approve'} onOpenChange={() => setActionDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Enquiry</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p>Approve enquiry from <strong>{selectedEnquiry?.guest_name}</strong>?</p>
            {selectedEnquiry?.check_in_date && selectedEnquiry?.check_out_date && (
              <div className="bg-emerald-50 p-3 rounded-lg text-sm">
                <p><strong>Check-in:</strong> {format(new Date(selectedEnquiry.check_in_date), 'PPP')}</p>
                <p><strong>Check-out:</strong> {format(new Date(selectedEnquiry.check_out_date), 'PPP')}</p>
                <p className="text-emerald-600 mt-2">These dates will be blocked and a booking will be created.</p>
              </div>
            )}
            <div>
              <Label htmlFor="approve_notes">Notes</Label>
              <Textarea
                id="approve_notes"
                value={actionData.notes}
                onChange={(e) => setActionData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Optional admin notes..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog(null)}>Cancel</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handleApprove}>
              Approve & Create Booking
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Decline Dialog */}
      <Dialog open={actionDialog === 'decline'} onOpenChange={() => setActionDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Decline Enquiry</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p>Decline enquiry from <strong>{selectedEnquiry?.guest_name}</strong>?</p>
            <div>
              <Label htmlFor="decline_reason">Reason for Decline</Label>
              <Textarea
                id="decline_reason"
                value={actionData.decline_reason}
                onChange={(e) => setActionData(prev => ({ ...prev, decline_reason: e.target.value }))}
                placeholder="Reason for declining..."
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="suggested_dates">Suggested Alternative Dates (Optional)</Label>
              <Input
                id="suggested_dates"
                value={actionData.suggested_dates}
                onChange={(e) => setActionData(prev => ({ ...prev, suggested_dates: e.target.value }))}
                placeholder="e.g., Try March 15-20"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDecline}>
              Decline Enquiry
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Message Dialog */}
      <Dialog open={actionDialog === 'message'} onOpenChange={() => setActionDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Message</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p>Send message to <strong>{selectedEnquiry?.guest_name}</strong></p>
            <div className="bg-gray-50 p-3 rounded-lg text-sm">
              <p><strong>Email:</strong> {selectedEnquiry?.email}</p>
              <p><strong>Phone:</strong> {selectedEnquiry?.phone}</p>
            </div>
            <div>
              <Label htmlFor="message">Message Template</Label>
              <Textarea
                id="message"
                value={actionData.message}
                onChange={(e) => setActionData(prev => ({ ...prev, message: e.target.value }))}
                placeholder="Type your message..."
                rows={5}
              />
            </div>
            <p className="text-xs text-gray-500">Note: This will copy the message. You'll need to send it via your email/messaging platform.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog(null)}>Cancel</Button>
            <Button onClick={() => {
              navigator.clipboard.writeText(actionData.message);
              toast.success('Message copied to clipboard');
              setActionDialog(null);
            }}>
              <Send className="w-4 h-4 mr-2" />
              Copy Message
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
