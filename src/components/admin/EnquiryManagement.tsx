import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  Check,
  X,
  Clock,
  Mail,
  Phone,
  Users,
  Calendar,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import {
  getEnquiries,
  approveEnquiry,
  declineEnquiry,
  deleteEnquiry,
  type Enquiry,
} from '../../lib/enquiry-api';
import { format, parseISO } from 'date-fns';

interface EnquiryManagementProps {
  apartmentId: string;
}

export function EnquiryManagement({ apartmentId }: EnquiryManagementProps) {
  const [activeTab, setActiveTab] = useState<'requested' | 'approved' | 'declined'>('requested');
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadEnquiries();
  }, [apartmentId, activeTab]);

  const loadEnquiries = async () => {
    try {
      setLoading(true);
      const data = await getEnquiries({
        sa_id: apartmentId,
        status: activeTab,
      });
      setEnquiries(data);
    } catch (error) {
      console.error('Failed to load enquiries:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await approveEnquiry(id);
      loadEnquiries();
    } catch (error) {
      console.error('Failed to approve enquiry:', error);
      alert('Failed to approve enquiry');
    }
  };

  const handleDecline = async (id: string) => {
    try {
      await declineEnquiry(id);
      loadEnquiries();
    } catch (error) {
      console.error('Failed to decline enquiry:', error);
      alert('Failed to decline enquiry');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setDeleting(true);
      await deleteEnquiry(id);
      setDeleteConfirmId(null);
      loadEnquiries();
    } catch (error) {
      console.error('Failed to delete enquiry:', error);
      alert('Failed to delete enquiry');
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteAll = async () => {
    try {
      setDeleting(true);
      // Delete all enquiries in the current tab
      await Promise.all(enquiries.map(e => deleteEnquiry(e.id)));
      setShowDeleteAllConfirm(false);
      loadEnquiries();
    } catch (error) {
      console.error('Failed to delete all enquiries:', error);
      alert('Failed to delete all enquiries');
    } finally {
      setDeleting(false);
    }
  };

  const formatDateRange = (start: string, end: string) => {
    const startDate = parseISO(start);
    const endDate = parseISO(end);
    return `${format(startDate, 'MMM dd')} – ${format(endDate, 'MMM dd, yyyy')}`;
  };

  const getNights = (start: string, end: string) => {
    const startDate = parseISO(start);
    const endDate = parseISO(end);
    return Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  };

  // Group approved enquiries by month
  const groupedApprovedEnquiries = React.useMemo(() => {
    if (activeTab !== 'approved') return {};
    
    return enquiries.reduce((acc, enquiry) => {
      const month = format(parseISO(enquiry.start_date), 'MMMM yyyy');
      if (!acc[month]) acc[month] = [];
      acc[month].push(enquiry);
      return acc;
    }, {} as Record<string, Enquiry[]>);
  }, [enquiries, activeTab]);

  // Count admin bookings in approved tab
  const adminBookingsCount = React.useMemo(() => {
    if (activeTab !== 'approved') return 0;
    return enquiries.filter(e => e.created_by_admin).length;
  }, [enquiries, activeTab]);

  const getStatusBadge = (status: string) => {
    const styles = {
      requested: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      approved: 'bg-green-100 text-green-800 border-green-200',
      declined: 'bg-red-100 text-red-800 border-red-200',
    };
    return (
      <Badge className={styles[status as keyof typeof styles]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const renderEnquiryCard = (enquiry: Enquiry) => {
    const isExpanded = expandedId === enquiry.id;
    const nights = getNights(enquiry.start_date, enquiry.end_date);

    return (
      <Card key={enquiry.id} className="border-l-4 border-l-emerald-500">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-3 flex-wrap">
                <h4 className="font-medium">{enquiry.guest_name}</h4>
                {getStatusBadge(enquiry.status)}
                {enquiry.created_by_admin && (
                  <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                    <ShieldCheck className="w-3 h-3 mr-1" />
                    Admin Booking
                  </Badge>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-emerald-600" />
                  <span>{formatDateRange(enquiry.start_date, enquiry.end_date)}</span>
                  <span className="text-gray-400">({nights} {nights === 1 ? 'night' : 'nights'})</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-600" />
                  <span>{enquiry.adults} {enquiry.adults === 1 ? 'adult' : 'adults'}</span>
                  {enquiry.children > 0 && <span>, {enquiry.children} {enquiry.children === 1 ? 'child' : 'children'}</span>}
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-emerald-600" />
                  <span className="truncate">{enquiry.guest_email}</span>
                </div>
                {enquiry.guest_phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-emerald-600" />
                    <span>{enquiry.guest_phone}</span>
                  </div>
                )}
              </div>

              {isExpanded && (
                <div className="mt-3 pt-3 border-t space-y-2">
                  {enquiry.notes && (
                    <div className="text-sm">
                      <span className="font-medium">Guest Notes:</span>
                      <p className="text-gray-600 mt-1">{enquiry.notes}</p>
                    </div>
                  )}
                  {enquiry.admin_notes && (
                    <div className="text-sm">
                      <span className="font-medium">Admin Notes:</span>
                      <p className="text-gray-600 mt-1">{enquiry.admin_notes}</p>
                    </div>
                  )}
                  <div className="text-xs text-gray-500">
                    Created: {format(parseISO(enquiry.created_at), 'MMM dd, yyyy HH:mm')}
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setExpandedId(isExpanded ? null : enquiry.id)}
              >
                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>

              {activeTab === 'requested' && (
                <>
                  <Button
                    size="sm"
                    onClick={() => handleApprove(enquiry.id)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Check className="w-4 h-4 mr-1" />
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDecline(enquiry.id)}
                  >
                    <X className="w-4 h-4 mr-1" />
                    Decline
                  </Button>
                </>
              )}
              
              {/* Delete button for all tabs */}
              <Button
                size="sm"
                variant="outline"
                onClick={() => setDeleteConfirmId(enquiry.id)}
                disabled={deleting}
              >
                <Trash2 className="w-4 h-4 text-red-500" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setActiveTab('requested')}
          className={`px-4 py-2 border-b-2 transition-colors ${
            activeTab === 'requested'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Requested
          </div>
        </button>
        <button
          onClick={() => setActiveTab('approved')}
          className={`px-4 py-2 border-b-2 transition-colors ${
            activeTab === 'approved'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4" />
            Approved
          </div>
        </button>
        <button
          onClick={() => setActiveTab('declined')}
          className={`px-4 py-2 border-b-2 transition-colors ${
            activeTab === 'declined'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <X className="w-4 h-4" />
            Declined
          </div>
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading enquiries...</div>
      ) : enquiries.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-gray-500">
            No {activeTab} enquiries found
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Delete All Button */}
          <div className="flex justify-end mb-4">
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowDeleteAllConfirm(true)}
              disabled={deleting}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete All {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
            </Button>
          </div>

          {activeTab === 'approved' ? (
            // Approved enquiries grouped by month
            <div className="space-y-6">
              {adminBookingsCount > 0 && (
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-sm text-blue-800">
                      <ShieldCheck className="w-4 h-4" />
                      <span className="font-medium">{adminBookingsCount} Admin Booking{adminBookingsCount !== 1 ? 's' : ''}</span>
                      <span className="text-blue-600">• {enquiries.length - adminBookingsCount} Client Enquir{enquiries.length - adminBookingsCount !== 1 ? 'ies' : 'y'}</span>
                    </div>
                  </CardContent>
                </Card>
              )}
              {Object.entries(groupedApprovedEnquiries).map(([month, monthEnquiries]) => (
                <div key={month}>
                  <h3 className="text-lg font-medium mb-3">{month}</h3>
                  <div className="space-y-3">
                    {monthEnquiries.map(renderEnquiryCard)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // Requested and Declined enquiries
            <div className="space-y-3">
              {enquiries.map(renderEnquiryCard)}
            </div>
          )}
        </>
      )}

      {/* Delete Individual Enquiry Confirmation Dialog */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="max-w-md w-full mx-4">
            <CardHeader>
              <CardTitle>Delete Enquiry</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                Are you sure you want to delete this enquiry? This action cannot be undone.
              </p>
              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setDeleteConfirmId(null)}
                  disabled={deleting}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleDelete(deleteConfirmId)}
                  disabled={deleting}
                >
                  {deleting ? 'Deleting...' : 'Delete'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Delete All Enquiries Confirmation Dialog */}
      {showDeleteAllConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="max-w-md w-full mx-4">
            <CardHeader>
              <CardTitle>Delete All {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Enquiries</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                Are you sure you want to delete all {enquiries.length} {activeTab} enquir{enquiries.length === 1 ? 'y' : 'ies'}? This action cannot be undone.
              </p>
              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteAllConfirm(false)}
                  disabled={deleting}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteAll}
                  disabled={deleting}
                >
                  {deleting ? 'Deleting...' : `Delete All (${enquiries.length})`}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}