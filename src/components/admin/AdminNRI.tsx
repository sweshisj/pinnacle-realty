import React, { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { Textarea } from "../ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog";
import { Label } from "../ui/label";
import {
  Search,
  Filter,
  Eye,
  Trash2,
  Phone,
  Mail,
  MapPin,
  Calendar,
  DollarSign,
  Home,
  Clock,
  Target,
  MessageSquare,
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { LoadingSpinner } from "../LoadingSpinner";
import {
  initializeNRITable,
  getAllNRIEnquiries,
  updateEnquiryStatus,
  updateEnquiryPriority,
  updateAdminNotes,
  deleteNRIEnquiry,
  type NRIEnquiry
} from "../../utils/supabase/nriOperations";

interface AdminNRIProps {
  navigateTo: (page: any) => void;
}

export function AdminNRI({ navigateTo }: AdminNRIProps) {
  const [enquiries, setEnquiries] = useState<NRIEnquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [selectedEnquiry, setSelectedEnquiry] = useState<NRIEnquiry | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [tableInitialized, setTableInitialized] = useState(false);

  useEffect(() => {
    initializeTable();
  }, []);

  const initializeTable = async () => {
    const initialized = await initializeNRITable();
    setTableInitialized(initialized);
    if (initialized) {
      fetchEnquiries();
    } else {
      setLoading(false);
    }
  };

  const fetchEnquiries = async () => {
    try {
      setLoading(true);
      const data = await getAllNRIEnquiries();
      setEnquiries(data);
    } catch (error) {
      console.error("Error fetching enquiries:", error);
      toast.error("An error occurred while fetching enquiries");
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (enquiry: NRIEnquiry) => {
    setSelectedEnquiry(enquiry);
    setShowDetailsDialog(true);
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      setIsUpdating(true);
      await updateEnquiryStatus(id, status);

      toast.success("Status updated successfully");
      fetchEnquiries();
      if (selectedEnquiry?.id === id) {
        setSelectedEnquiry({ ...selectedEnquiry, status });
      }
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("An error occurred while updating status");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdatePriority = async (id: string, priority: string) => {
    try {
      setIsUpdating(true);
      await updateEnquiryPriority(id, priority);

      toast.success("Priority updated successfully");
      fetchEnquiries();
      if (selectedEnquiry?.id === id) {
        setSelectedEnquiry({ ...selectedEnquiry, priority });
      }
    } catch (error) {
      console.error("Error updating priority:", error);
      toast.error("An error occurred while updating priority");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdateNotes = async (id: string, adminNotes: string) => {
    try {
      setIsUpdating(true);
      await updateAdminNotes(id, adminNotes);

      toast.success("Notes updated successfully");
      fetchEnquiries();
      if (selectedEnquiry?.id === id) {
        setSelectedEnquiry({ ...selectedEnquiry, admin_notes: adminNotes });
      }
    } catch (error) {
      console.error("Error updating notes:", error);
      toast.error("An error occurred while updating notes");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this enquiry?")) {
      return;
    }

    try {
      await deleteNRIEnquiry(id);

      toast.success("Enquiry deleted successfully");
      fetchEnquiries();
      setShowDetailsDialog(false);
    } catch (error) {
      console.error("Error deleting enquiry:", error);
      toast.error("An error occurred while deleting enquiry");
    }
  };

  const filteredEnquiries = enquiries.filter((enquiry) => {
    const matchesSearch =
      enquiry.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      enquiry.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      enquiry.phone.includes(searchTerm);

    const matchesStatus = statusFilter === "all" || enquiry.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || enquiry.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<
      string,
      { label: string; className: string; icon: any }
    > = {
      new: { label: "New", className: "bg-blue-500", icon: AlertCircle },
      contacted: { label: "Contacted", className: "bg-yellow-500", icon: Phone },
      qualified: { label: "Qualified", className: "bg-purple-500", icon: CheckCircle },
      converted: { label: "Converted", className: "bg-green-500", icon: CheckCircle },
      declined: { label: "Declined", className: "bg-red-500", icon: XCircle },
    };

    const config = statusConfig[status] || statusConfig.new;
    const Icon = config.icon;

    return (
      <Badge className={`${config.className} text-white hover:${config.className}`}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const priorityConfig: Record<string, { label: string; className: string }> = {
      low: { label: "Low", className: "bg-gray-500" },
      medium: { label: "Medium", className: "bg-orange-500" },
      high: { label: "High", className: "bg-red-600" },
    };

    const config = priorityConfig[priority] || priorityConfig.medium;

    return (
      <Badge className={`${config.className} text-white hover:${config.className}`}>
        {config.label}
      </Badge>
    );
  };

  const stats = {
    total: enquiries.length,
    new: enquiries.filter((e) => e.status === "new").length,
    contacted: enquiries.filter((e) => e.status === "contacted").length,
    qualified: enquiries.filter((e) => e.status === "qualified").length,
    converted: enquiries.filter((e) => e.status === "converted").length,
    declined: enquiries.filter((e) => e.status === "declined").length,
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner message="Loading NRI enquiries..." color="amber" size="lg" />
      </div>
    );
  }

  if (!tableInitialized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 p-6">
        <div className="max-w-4xl mx-auto mt-20">
          <Card className="border-2 border-red-300 bg-red-50">
            <CardHeader>
              <CardTitle className="text-red-800 flex items-center gap-2">
                <AlertCircle className="h-6 w-6" />
                Database Setup Required
              </CardTitle>
              <CardDescription className="text-red-700">
                The NRI Enquiries table needs to be created in your Supabase database.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm">
                Please create the table in your Supabase Dashboard by following these steps:
              </p>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>Go to your Supabase Dashboard</li>
                <li>Navigate to the SQL Editor</li>
                <li>Copy and paste the SQL code from your browser console</li>
                <li>Click "Run" to execute the SQL</li>
                <li>Refresh this page</li>
              </ol>
              <div className="bg-white p-4 rounded-md border border-red-200">
                <p className="text-xs mb-2">Check your browser console for the SQL code.</p>
                <p className="text-xs text-gray-600">The SQL includes table creation, indexes, and Row Level Security policies.</p>
              </div>
              <Button
                onClick={() => window.location.reload()}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Refresh Page
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="mb-2 bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
            NRI Enquiries Management
          </h1>
          <p className="text-gray-600">
            Manage and track NRI property investment enquiries
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <Card className="border-2 border-amber-200">
            <CardContent className="p-4">
              <p className="text-sm text-gray-600">Total Enquiries</p>
              <p className="text-2xl mt-1">{stats.total}</p>
            </CardContent>
          </Card>
          <Card className="border-2 border-blue-200">
            <CardContent className="p-4">
              <p className="text-sm text-gray-600">New</p>
              <p className="text-2xl mt-1">{stats.new}</p>
            </CardContent>
          </Card>
          <Card className="border-2 border-yellow-200">
            <CardContent className="p-4">
              <p className="text-sm text-gray-600">Contacted</p>
              <p className="text-2xl mt-1">{stats.contacted}</p>
            </CardContent>
          </Card>
          <Card className="border-2 border-purple-200">
            <CardContent className="p-4">
              <p className="text-sm text-gray-600">Qualified</p>
              <p className="text-2xl mt-1">{stats.qualified}</p>
            </CardContent>
          </Card>
          <Card className="border-2 border-green-200">
            <CardContent className="p-4">
              <p className="text-sm text-gray-600">Converted</p>
              <p className="text-2xl mt-1">{stats.converted}</p>
            </CardContent>
          </Card>
          <Card className="border-2 border-red-200">
            <CardContent className="p-4">
              <p className="text-sm text-gray-600">Declined</p>
              <p className="text-2xl mt-1">{stats.declined}</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6 border-2 border-amber-200">
          <CardContent className="p-6">
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="search">Search</Label>
                <div className="relative mt-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="search"
                    placeholder="Search by name, email, or phone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="status-filter">Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger id="status-filter" className="mt-1">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="contacted">Contacted</SelectItem>
                    <SelectItem value="qualified">Qualified</SelectItem>
                    <SelectItem value="converted">Converted</SelectItem>
                    <SelectItem value="declined">Declined</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="priority-filter">Priority</Label>
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger id="priority-filter" className="mt-1">
                    <SelectValue placeholder="Filter by priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Enquiries Table */}
        <Card className="border-2 border-amber-200">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Current Location</TableHead>
                    <TableHead>Investment City</TableHead>
                    <TableHead>Budget</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEnquiries.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                        No enquiries found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredEnquiries.map((enquiry) => (
                      <TableRow key={enquiry.id}>
                        <TableCell>{enquiry.name}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="flex items-center gap-1">
                              <Mail className="h-3 w-3 text-gray-400" />
                              <span className="text-xs">{enquiry.email}</span>
                            </div>
                            <div className="flex items-center gap-1 mt-1">
                              <Phone className="h-3 w-3 text-gray-400" />
                              <span className="text-xs">{enquiry.phone}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{enquiry.current_location || "-"}</TableCell>
                        <TableCell>{enquiry.investment_city || "-"}</TableCell>
                        <TableCell>{enquiry.investment_budget || "-"}</TableCell>
                        <TableCell>{getStatusBadge(enquiry.status)}</TableCell>
                        <TableCell>{getPriorityBadge(enquiry.priority)}</TableCell>
                        <TableCell>
                          {new Date(enquiry.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDetails(enquiry)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Details Dialog */}
        {selectedEnquiry && (
          <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-2xl bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                  NRI Enquiry Details
                </DialogTitle>
                <DialogDescription>
                  Manage and update NRI enquiry information
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 py-4">
                {/* Personal Information */}
                <div className="space-y-4">
                  <h3 className="border-b pb-2">Personal Information</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label>Name</Label>
                      <p className="text-sm mt-1">{selectedEnquiry.name}</p>
                    </div>
                    <div>
                      <Label>Email</Label>
                      <p className="text-sm mt-1">{selectedEnquiry.email}</p>
                    </div>
                    <div>
                      <Label>Phone</Label>
                      <p className="text-sm mt-1">{selectedEnquiry.phone}</p>
                    </div>
                    <div>
                      <Label>Current Location</Label>
                      <p className="text-sm mt-1">{selectedEnquiry.current_location || "-"}</p>
                    </div>
                  </div>
                </div>

                {/* Investment Details */}
                <div className="space-y-4">
                  <h3 className="border-b pb-2">Investment Details</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label>Investment City</Label>
                      <p className="text-sm mt-1">{selectedEnquiry.investment_city || "-"}</p>
                    </div>
                    <div>
                      <Label>Budget</Label>
                      <p className="text-sm mt-1">{selectedEnquiry.investment_budget || "-"}</p>
                    </div>
                    <div>
                      <Label>Property Type</Label>
                      <p className="text-sm mt-1">{selectedEnquiry.property_type || "-"}</p>
                    </div>
                    <div>
                      <Label>Timeline</Label>
                      <p className="text-sm mt-1">{selectedEnquiry.timeline || "-"}</p>
                    </div>
                    <div>
                      <Label>Purpose</Label>
                      <p className="text-sm mt-1">{selectedEnquiry.purpose || "-"}</p>
                    </div>
                    <div>
                      <Label>Source</Label>
                      <p className="text-sm mt-1">{selectedEnquiry.source || "-"}</p>
                    </div>
                  </div>
                </div>

                {/* Requirements */}
                {selectedEnquiry.requirements && (
                  <div className="space-y-2">
                    <Label>Requirements / Message</Label>
                    <p className="text-sm text-gray-700 bg-gray-50 p-4 rounded-md">
                      {selectedEnquiry.requirements}
                    </p>
                  </div>
                )}

                {/* Status & Priority Management */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Status</Label>
                    <Select
                      value={selectedEnquiry.status}
                      onValueChange={(value) => handleUpdateStatus(selectedEnquiry.id, value)}
                      disabled={isUpdating}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">New</SelectItem>
                        <SelectItem value="contacted">Contacted</SelectItem>
                        <SelectItem value="qualified">Qualified</SelectItem>
                        <SelectItem value="converted">Converted</SelectItem>
                        <SelectItem value="declined">Declined</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Priority</Label>
                    <Select
                      value={selectedEnquiry.priority}
                      onValueChange={(value) => handleUpdatePriority(selectedEnquiry.id, value)}
                      disabled={isUpdating}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Admin Notes */}
                <div>
                  <Label>Admin Notes</Label>
                  <Textarea
                    value={selectedEnquiry.admin_notes || ""}
                    onChange={(e) => {
                      setSelectedEnquiry({
                        ...selectedEnquiry,
                        admin_notes: e.target.value,
                      });
                    }}
                    placeholder="Add internal notes about this enquiry..."
                    rows={4}
                    className="mt-1"
                  />
                  <Button
                    onClick={() =>
                      handleUpdateNotes(selectedEnquiry.id, selectedEnquiry.admin_notes || "")
                    }
                    disabled={isUpdating}
                    className="mt-2"
                    size="sm"
                  >
                    {isUpdating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      "Save Notes"
                    )}
                  </Button>
                </div>

                {/* Timestamps */}
                <div className="grid md:grid-cols-3 gap-4 pt-4 border-t">
                  <div>
                    <Label className="text-xs text-gray-500">Created At</Label>
                    <p className="text-sm">
                      {new Date(selectedEnquiry.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Updated At</Label>
                    <p className="text-sm">
                      {new Date(selectedEnquiry.updated_at).toLocaleString()}
                    </p>
                  </div>
                  {selectedEnquiry.last_contacted_at && (
                    <div>
                      <Label className="text-xs text-gray-500">Last Contacted</Label>
                      <p className="text-sm">
                        {new Date(selectedEnquiry.last_contacted_at).toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setShowDetailsDialog(false)}
                >
                  Close
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleDelete(selectedEnquiry.id)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Enquiry
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}