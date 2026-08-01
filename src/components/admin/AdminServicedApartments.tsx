import React, { useState, useEffect } from "react";
import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  Users,
  Building2,
  Mail,
  Phone,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  Home,
  ExternalLink,
  CalendarRange,
  Check,
  X,
} from "lucide-react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Textarea } from "../ui/textarea";
import { Calendar as CalendarComponent } from "../ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../ui/popover";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { LoadingSpinner } from "../LoadingSpinner";
import AdminServicedApartmentEditor from "./AdminServicedApartmentEditor";

import AdminCapacityManagement from "./AdminCapacityManagement";
import {
  ServicedApartment,
  Enquiry,
  Booking,
  fetchAllServicedApartments,
  deleteServicedApartment,
  fetchAllEnquiries,
  updateEnquiry,
  deleteEnquiry,
  fetchAllBookings,
  deleteBooking,
  createBooking,
} from "../../utils/supabase/servicedApartmentsOperations";

interface AdminServicedApartmentsProps {
  navigateTo?: (page: any) => void;
}

export default function AdminServicedApartments({
  navigateTo,
}: AdminServicedApartmentsProps) {
  const [activeTab, setActiveTab] = useState("apartments");
  const [apartments, setApartments] = useState<
    ServicedApartment[]
  >([]);
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  // Apartments states
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCity, setFilterCity] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [showEditor, setShowEditor] = useState(false);
  const [selectedApartment, setSelectedApartment] = useState<
    ServicedApartment | undefined
  >();
  const [deleteConfirm, setDeleteConfirm] = useState<
    string | null
  >(null);

  // Capacity management states
  const [showCapacityManagement, setShowCapacityManagement] =
    useState(false);
  const [capacityApartment, setCapacityApartment] =
    useState<ServicedApartment | null>(null);

  // Enquiries states
  const [enquirySearch, setEnquirySearch] = useState("");
  const [enquiryStatusFilter, setEnquiryStatusFilter] =
    useState("all");
  const [selectedEnquiry, setSelectedEnquiry] =
    useState<Enquiry | null>(null);
  const [actionDialog, setActionDialog] = useState<
    "approve" | "decline" | null
  >(null);
  const [actionData, setActionData] = useState({
    notes: "",
    decline_reason: "",
    suggested_dates: "",
  });
  const [enquiryDetailsOpen, setEnquiryDetailsOpen] =
    useState(false);
  const [deleteEnquiryConfirm, setDeleteEnquiryConfirm] =
    useState<string | null>(null);
  const [deleteBookingConfirm, setDeleteBookingConfirm] =
    useState<string | null>(null);

  // New booking states
  const [showCreateBookingDialog, setShowCreateBookingDialog] =
    useState(false);
  const [newBookingData, setNewBookingData] = useState({
    apartment_id: "",
    guest_name: "",
    email: "",
    phone: "",
    company: "",
    check_in_date: "",
    check_out_date: "",
    guests: 1,
    payment_status: "pending" as
      | "pending"
      | "partial"
      | "paid"
      | "refunded",
    booking_status: "confirmed" as
      | "confirmed"
      | "checked_in"
      | "checked_out"
      | "cancelled",
    amount_paid: 0,
    deposit_paid: 0,
    payment_method: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    await Promise.all([
      loadApartments(),
      loadEnquiries(),
      loadBookings(),
    ]);
    setLoading(false);
  };

  const loadApartments = async () => {
    const { data } = await fetchAllServicedApartments();
    if (data) setApartments(data);
  };

  const loadEnquiries = async () => {
    const { data } = await fetchAllEnquiries();
    if (data) setEnquiries(data);
  };

  const loadBookings = async () => {
    const { data } = await fetchAllBookings();
    if (data) setBookings(data);
  };

  const handleDeleteApartment = async (id: string) => {
    const { error } = await deleteServicedApartment(id);
    if (error) {
      toast.error("Failed to delete apartment");
      return;
    }
    toast.success("Apartment deleted successfully");
    setDeleteConfirm(null);
    loadApartments();
  };

  const handleDeleteEnquiry = async (id: string) => {
    const { error } = await deleteEnquiry(id);
    if (error) {
      toast.error("Failed to delete enquiry");
      return;
    }
    toast.success("Enquiry deleted successfully");
    setDeleteEnquiryConfirm(null);
    loadEnquiries();
  };

  const handleDeleteBooking = async (id: string) => {
    const { error } = await deleteBooking(id);
    if (error) {
      toast.error("Failed to delete booking");
      return;
    }
    toast.success("Booking deleted successfully");
    setDeleteBookingConfirm(null);
    loadBookings();
  };

  const handleApproveEnquiry = async () => {
    if (!selectedEnquiry) return;

    const { error: updateError } = await updateEnquiry(
      selectedEnquiry.id,
      {
        status: "approved",
        admin_notes: actionData.notes,
      },
    );

    if (updateError) {
      toast.error("Failed to approve enquiry");
      return;
    }

    // If dates are provided, create booking
    // Note: Availability blocking is now handled by the capacity management system
    if (
      selectedEnquiry.check_in_date &&
      selectedEnquiry.check_out_date &&
      selectedEnquiry.apartment_id
    ) {
      // Create booking
      const nights = Math.ceil(
        (new Date(selectedEnquiry.check_out_date).getTime() -
          new Date(selectedEnquiry.check_in_date).getTime()) /
          (1000 * 60 * 60 * 24),
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
        booking_status: "confirmed",
        payment_status: "pending",
      });
    }

    toast.success("Enquiry approved and booking created");
    setActionDialog(null);
    setSelectedEnquiry(null);
    setActionData({
      notes: "",
      decline_reason: "",
      suggested_dates: "",
    });
    loadEnquiries();
    loadBookings();
  };

  const handleDeclineEnquiry = async () => {
    if (!selectedEnquiry) return;

    const { error } = await updateEnquiry(selectedEnquiry.id, {
      status: "declined",
      decline_reason: actionData.decline_reason,
      admin_notes: actionData.notes,
    });

    if (error) {
      toast.error("Failed to decline enquiry");
      return;
    }

    toast.success("Enquiry declined");
    setActionDialog(null);
    setSelectedEnquiry(null);
    setActionData({
      notes: "",
      decline_reason: "",
      suggested_dates: "",
    });
    loadEnquiries();
  };



  const handleCreateBooking = async () => {
    if (
      !newBookingData.apartment_id ||
      !newBookingData.guest_name ||
      !newBookingData.email ||
      !newBookingData.phone ||
      !newBookingData.check_in_date ||
      !newBookingData.check_out_date
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Calculate nights
    const nights = Math.ceil(
      (new Date(newBookingData.check_out_date).getTime() -
        new Date(newBookingData.check_in_date).getTime()) /
        (1000 * 60 * 60 * 24),
    );

    // Find apartment to get pricing
    const apartment = apartments.find(
      (a) => a.id === newBookingData.apartment_id,
    );
    const basePrice = apartment?.nightly_price || 0;
    const cleaningFee = apartment?.cleaning_fee || 0;
    const taxPercentage = apartment?.tax_percentage || 18;

    const subtotal = basePrice * nights;
    const taxAmount =
      (subtotal + cleaningFee) * (taxPercentage / 100);
    const totalAmount = subtotal + cleaningFee + taxAmount;

    // Create booking
    // Note: Availability blocking is now handled by the capacity management system
    const { error } = await createBooking({
      apartment_id: newBookingData.apartment_id,
      guest_name: newBookingData.guest_name,
      email: newBookingData.email,
      phone: newBookingData.phone,
      company: newBookingData.company,
      check_in_date: newBookingData.check_in_date,
      check_out_date: newBookingData.check_out_date,
      guests: newBookingData.guests,
      total_nights: nights,
      base_price: subtotal,
      cleaning_fee: cleaningFee,
      tax_amount: taxAmount,
      total_amount: totalAmount,
      booking_status: newBookingData.booking_status,
      payment_status: newBookingData.payment_status,
      amount_paid: newBookingData.amount_paid,
      deposit_paid: newBookingData.deposit_paid,
      payment_method: newBookingData.payment_method,
    });

    if (error) {
      toast.error("Failed to create booking");
      return;
    }

    toast.success("Booking created successfully");
    setShowCreateBookingDialog(false);
    setNewBookingData({
      apartment_id: "",
      guest_name: "",
      email: "",
      phone: "",
      company: "",
      check_in_date: "",
      check_out_date: "",
      guests: 1,
      payment_status: "pending",
      booking_status: "confirmed",
      amount_paid: 0,
      deposit_paid: 0,
      payment_method: "",
    });
    loadBookings();
  };

  const filteredApartments = apartments.filter((apt) => {
    const matchesSearch =
      apt.title
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      apt.location
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
    const matchesCity =
      filterCity === "all" || apt.city === filterCity;
    const matchesType =
      filterType === "all" || apt.type === filterType;
    return matchesSearch && matchesCity && matchesType;
  });

  const filteredEnquiries = enquiries.filter((enq) => {
    const matchesSearch =
      enq.guest_name
        .toLowerCase()
        .includes(enquirySearch.toLowerCase()) ||
      enq.email
        .toLowerCase()
        .includes(enquirySearch.toLowerCase()) ||
      enq.phone.includes(enquirySearch);
    const matchesStatus =
      enquiryStatusFilter === "all" ||
      enq.status === enquiryStatusFilter;
    return matchesSearch && matchesStatus;
  });

  const cities = Array.from(
    new Set(apartments.map((a) => a.city)),
  ).sort();
  const types = Array.from(
    new Set(apartments.map((a) => a.type)),
  ).sort();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "new":
        return "bg-blue-100 text-blue-800";
      case "contacted":
        return "bg-yellow-100 text-yellow-800";
      case "approved":
        return "bg-green-100 text-green-800";
      case "declined":
        return "bg-red-100 text-red-800";
      case "converted":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
        <LoadingSpinner
          message="Loading serviced apartments..."
          color="green"
        />
      </div>
    );
  }

  if (showEditor) {
    return (
      <AdminServicedApartmentEditor
        apartment={selectedApartment}
        onBack={() => {
          setShowEditor(false);
          setSelectedApartment(undefined);
        }}
        onSave={() => {
          setShowEditor(false);
          setSelectedApartment(undefined);
          loadApartments();
        }}
      />
    );
  }

  if (showCapacityManagement && capacityApartment) {
    return (
      <AdminCapacityManagement
        apartment={capacityApartment}
        onBack={() => {
          setShowCapacityManagement(false);
          setCapacityApartment(null);
          loadApartments(); // Refresh in case any changes were made
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="flex items-center gap-3 mb-2">
                <Home className="w-8 h-8 text-emerald-600" />
                Serviced Apartments Management
              </h1>
              <p className="text-gray-600">
                Manage properties, enquiries, and bookings
              </p>
            </div>
            <Button
              onClick={() => {
                setSelectedApartment(undefined);
                setShowEditor(true);
              }}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Apartment
            </Button>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6"
        >
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">
                    Total Properties
                  </p>
                  <p className="text-2xl text-emerald-600 mt-1">
                    {apartments.length}
                  </p>
                </div>
                <Building2 className="w-8 h-8 text-emerald-600/20" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">
                    New Enquiries
                  </p>
                  <p className="text-2xl text-blue-600 mt-1">
                    {
                      enquiries.filter(
                        (e) => e.status === "new",
                      ).length
                    }
                  </p>
                </div>
                <Mail className="w-8 h-8 text-blue-600/20" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">
                    Active Bookings
                  </p>
                  <p className="text-2xl text-purple-600 mt-1">
                    {
                      bookings.filter(
                        (b) => b.booking_status === "confirmed",
                      ).length
                    }
                  </p>
                </div>
                <Calendar className="w-8 h-8 text-purple-600/20" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">
                    Available Units
                  </p>
                  <p className="text-2xl text-green-600 mt-1">
                    {
                      apartments.filter((a) => a.is_active)
                        .length
                    }
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600/20" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-white">
            <TabsTrigger value="apartments">
              <Building2 className="w-4 h-4 mr-2" />
              Apartments ({apartments.length})
            </TabsTrigger>
            <TabsTrigger value="availability">
              <CalendarRange className="w-4 h-4 mr-2" />
              Booking Management
            </TabsTrigger>
            <TabsTrigger value="enquiries">
              <Mail className="w-4 h-4 mr-2" />
              Enquiries ({enquiries.length})
            </TabsTrigger>
            <TabsTrigger value="bookings">
              <Calendar className="w-4 h-4 mr-2" />
              Bookings ({bookings.length})
            </TabsTrigger>
          </TabsList>

          {/* Apartments Tab */}
          <TabsContent value="apartments" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <Label htmlFor="search">Search</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        id="search"
                        placeholder="Search by name or location..."
                        value={searchQuery}
                        onChange={(e) =>
                          setSearchQuery(e.target.value)
                        }
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="w-full md:w-48">
                    <Label htmlFor="city">City</Label>
                    <Select
                      value={filterCity}
                      onValueChange={setFilterCity}
                    >
                      <SelectTrigger id="city">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">
                          All Cities
                        </SelectItem>
                        {cities.map((city) => (
                          <SelectItem key={city} value={city}>
                            {city}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-full md:w-48">
                    <Label htmlFor="type">Type</Label>
                    <Select
                      value={filterType}
                      onValueChange={setFilterType}
                    >
                      <SelectTrigger id="type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">
                          All Types
                        </SelectItem>
                        {types.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {filteredApartments.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Building2 className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p>No apartments found</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredApartments.map((apartment) => (
                      <motion.div
                        key={apartment.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="border border-gray-200 rounded-lg overflow-hidden bg-white hover:shadow-lg transition-shadow"
                      >
                        <div className="relative h-48">
                          <img
                            src={
                              apartment.main_image ||
                              "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400"
                            }
                            alt={apartment.title}
                            className="w-full h-full object-cover"
                          />
                          {apartment.featured && (
                            <Badge className="absolute top-2 right-2 bg-amber-500">
                              Featured
                            </Badge>
                          )}
                          {!apartment.is_active && (
                            <Badge className="absolute top-2 left-2 bg-red-500">
                              Unavailable
                            </Badge>
                          )}
                        </div>
                        <div className="p-4">
                          <h3 className="mb-1 line-clamp-1">
                            {apartment.title}
                          </h3>
                          <p className="text-sm text-gray-600 mb-2">
                            {apartment.location},{" "}
                            {apartment.city}
                          </p>
                          <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                            <span>
                              {apartment.bedrooms} Bed
                            </span>
                            <span>
                              {apartment.bathrooms} Bath
                            </span>
                            <span>
                              {apartment.sleeps} Guests
                            </span>
                          </div>
                          <div className="text-emerald-600 mb-3">
                            $
                            {apartment.nightly_price?.toLocaleString()}
                            /night
                          </div>
                          <div className="space-y-2">
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1"
                                onClick={() => {
                                  setSelectedApartment(
                                    apartment,
                                  );
                                  setShowEditor(true);
                                }}
                              >
                                <Edit className="w-4 h-4 mr-1" />
                                Edit
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  setDeleteConfirm(apartment.id)
                                }
                              >
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </Button>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full text-blue-600 border-blue-200 hover:bg-blue-50"
                              onClick={() => {
                                setCapacityApartment(apartment);
                                setShowCapacityManagement(true);
                              }}
                            >
                              <CalendarRange className="w-4 h-4 mr-1" />
                              Manage Bookings
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                              onClick={() => {
                                setCapacityApartment(apartment);
                                setShowCapacityManagement(true);
                              }}
                            >
                              <Calendar className="w-4 h-4 mr-1" />
                              Capacity & Integrations
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Availability Tab - Now with Advanced Booking System - Now with Advanced Booking System */}
          <TabsContent
            value="availability"
            className="space-y-4"
          >
            <Card>
              <CardHeader>
                <CardTitle>
                  Select an Apartment to Manage Bookings &
                  Bookings & Availability
                </CardTitle>
                <p className="text-sm text-gray-600 mt-2">
                  Click on any apartment to access the advanced
                  booking calendar with conflict detection,
                  approval workflow, and buffer management.
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {apartments.map((apartment) => (
                    <Card
                      key={apartment.id}
                      className="hover:shadow-lg transition-shadow cursor-pointer"
                      onClick={() => {
                        setCapacityApartment(apartment);
                        setShowCapacityManagement(true);
                      }}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="flex-1">
                            <h3 className="mb-1">
                              {apartment.title}
                            </h3>
                            <p className="text-sm text-gray-600 mb-2">
                              {apartment.location},{" "}
                              {apartment.city}
                            </p>
                            <div className="flex items-center gap-2 text-sm text-gray-500 mb-2 mb-2">
                              <Building2 className="w-4 h-4" />
                              {apartment.type}
                            </div>
                            <div className="flex gap-2 text-xs">
                              <Badge
                                variant="outline"
                                className="bg-emerald-50 text-emerald-700"
                              >
                                Check-in:{" "}
                                {apartment.check_in_time ||
                                  "14:00"}
                              </Badge>
                              <Badge
                                variant="outline"
                                className="bg-blue-50 text-blue-700"
                              >
                                Check-out:{" "}
                                {apartment.check_out_time ||
                                  "10:00"}
                              </Badge>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                            onClick={(e) => {
                              e.stopPropagation();
                              setCapacityApartment(apartment);
                              setShowCapacityManagement(true);
                            }}
                          >
                            <CalendarRange className="w-4 h-4 mr-1" />
                            Manage
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                {apartments.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    <Building2 className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p>No apartments found</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Enquiries Tab */}
          <TabsContent value="enquiries" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <Label htmlFor="enquiry-search">
                      Search
                    </Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        id="enquiry-search"
                        placeholder="Search by name, email, or phone..."
                        value={enquirySearch}
                        onChange={(e) =>
                          setEnquirySearch(e.target.value)
                        }
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="w-full md:w-48">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={enquiryStatusFilter}
                      onValueChange={setEnquiryStatusFilter}
                    >
                      <SelectTrigger id="status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">
                          All Status
                        </SelectItem>
                        <SelectItem value="new">New</SelectItem>
                        <SelectItem value="contacted">
                          Contacted
                        </SelectItem>
                        <SelectItem value="approved">
                          Approved
                        </SelectItem>
                        <SelectItem value="declined">
                          Declined
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {filteredEnquiries.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Mail className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p>No enquiries found</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredEnquiries.map((enquiry) => (
                      <motion.div
                        key={enquiry.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="border border-gray-200 rounded-lg p-4 bg-white hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => {
                          setSelectedEnquiry(enquiry);
                          setEnquiryDetailsOpen(true);
                        }}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4>{enquiry.guest_name}</h4>
                              <Badge
                                className={getStatusColor(
                                  enquiry.status,
                                )}
                              >
                                {enquiry.status}
                              </Badge>
                            </div>

                            {/* Apartment Info */}
                            {enquiry.apartment && (
                              <div className="mb-2 flex items-center gap-2">
                                <Building2 className="w-4 h-4 text-emerald-600" />
                                <span className="text-sm text-emerald-600">
                                  {enquiry.apartment.title}
                                </span>
                              </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-600 mb-2">
                              <div className="flex items-center gap-2">
                                <Mail className="w-4 h-4" />
                                {enquiry.email}
                              </div>
                              <div className="flex items-center gap-2">
                                <Phone className="w-4 h-4" />
                                {enquiry.phone}
                              </div>
                              {enquiry.check_in_date && (
                                <div className="flex items-center gap-2">
                                  <Calendar className="w-4 h-4" />
                                  {format(
                                    new Date(
                                      enquiry.check_in_date,
                                    ),
                                    "MMM dd",
                                  )}{" "}
                                  -{" "}
                                  {enquiry.check_out_date &&
                                    format(
                                      new Date(
                                        enquiry.check_out_date,
                                      ),
                                      "MMM dd",
                                    )}
                                </div>
                              )}
                            </div>
                            {enquiry.special_requests && (
                              <p className="text-sm text-gray-500 italic line-clamp-1">
                                "{enquiry.special_requests}"
                              </p>
                            )}
                          </div>
                          <div
                            className="flex gap-2 ml-4"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {enquiry.status === "new" && (
                              <>
                                <Button
                                  size="sm"
                                  className="bg-emerald-600 hover:bg-emerald-700"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedEnquiry(enquiry);
                                    setActionDialog("approve");
                                  }}
                                >
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedEnquiry(enquiry);
                                    setActionDialog("decline");
                                  }}
                                >
                                  <XCircle className="w-4 h-4 mr-1 text-red-500" />
                                  Decline
                                </Button>
                              </>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteEnquiryConfirm(
                                  enquiry.id,
                                );
                              }}
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Bookings Tab */}
          <TabsContent value="bookings" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>All Bookings</CardTitle>
                  <Button
                    onClick={() =>
                      setShowCreateBookingDialog(true)
                    }
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Booking
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {bookings.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Calendar className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p>No bookings found</p>
                    <p className="text-sm mt-2">
                      Click "Create Booking" to add a direct
                      booking
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {bookings.map((booking) => (
                      <div
                        key={booking.id}
                        className="border border-gray-200 rounded-lg p-4 bg-white"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="mb-1">
                              {booking.guest_name}
                            </h4>

                            {/* Apartment Info */}
                            {booking.apartment && (
                              <div className="mb-2 flex items-center gap-2">
                                <Building2 className="w-4 h-4 text-emerald-600" />
                                <span className="text-sm text-emerald-600">
                                  {booking.apartment.title}
                                </span>
                              </div>
                            )}

                            <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm text-gray-600">
                              <div>Email: {booking.email}</div>
                              <div>Phone: {booking.phone}</div>
                              <div>
                                Check-in:{" "}
                                {format(
                                  new Date(
                                    booking.check_in_date,
                                  ),
                                  "PPP",
                                )}
                              </div>
                              <div>
                                Check-out:{" "}
                                {format(
                                  new Date(
                                    booking.check_out_date,
                                  ),
                                  "PPP",
                                )}
                              </div>
                              <div>
                                Guests: {booking.guests}
                              </div>
                              <div>
                                Nights: {booking.total_nights}
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <Badge
                              className={
                                booking.booking_status ===
                                "confirmed"
                                  ? "bg-green-100 text-green-800"
                                  : booking.booking_status ===
                                      "cancelled"
                                    ? "bg-red-100 text-red-800"
                                    : "bg-yellow-100 text-yellow-800"
                              }
                            >
                              {booking.booking_status}
                            </Badge>
                            <Badge
                              variant="outline"
                              className={
                                booking.payment_status ===
                                "paid"
                                  ? "border-green-600 text-green-600"
                                  : booking.payment_status ===
                                      "pending"
                                    ? "border-yellow-600 text-yellow-600"
                                    : "border-red-600 text-red-600"
                              }
                            >
                              {booking.payment_status}
                            </Badge>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                setDeleteBookingConfirm(
                                  booking.id,
                                )
                              }
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deleteConfirm}
        onOpenChange={() => setDeleteConfirm(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Apartment</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this apartment?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteConfirm(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                deleteConfirm &&
                handleDeleteApartment(deleteConfirm)
              }
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approve Dialog */}
      <Dialog
        open={actionDialog === "approve"}
        onOpenChange={() => setActionDialog(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Enquiry</DialogTitle>
            <DialogDescription>
              Approve enquiry from {selectedEnquiry?.guest_name}
              ? This will create a booking and block the
              selected dates.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedEnquiry?.check_in_date &&
              selectedEnquiry?.check_out_date && (
                <div className="bg-emerald-50 p-3 rounded-lg text-sm">
                  <p>
                    <strong>Check-in:</strong>{" "}
                    {format(
                      new Date(selectedEnquiry.check_in_date),
                      "PPP",
                    )}
                  </p>
                  <p>
                    <strong>Check-out:</strong>{" "}
                    {format(
                      new Date(selectedEnquiry.check_out_date),
                      "PPP",
                    )}
                  </p>
                  <p className="text-emerald-600 mt-2">
                    These dates will be blocked and a booking
                    will be created.
                  </p>
                </div>
              )}
            <div>
              <Label htmlFor="approve_notes">
                Notes (Optional)
              </Label>
              <Textarea
                id="approve_notes"
                value={actionData.notes}
                onChange={(e) =>
                  setActionData((prev) => ({
                    ...prev,
                    notes: e.target.value,
                  }))
                }
                placeholder="Optional admin notes..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setActionDialog(null)}
            >
              Cancel
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={handleApproveEnquiry}
            >
              Approve & Create Booking
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Decline Dialog */}
      <Dialog
        open={actionDialog === "decline"}
        onOpenChange={() => setActionDialog(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Decline Enquiry</DialogTitle>
            <DialogDescription>
              Decline enquiry from {selectedEnquiry?.guest_name}
              ? You can provide a reason for the decline.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="decline_reason">
                Reason for Decline
              </Label>
              <Textarea
                id="decline_reason"
                value={actionData.decline_reason}
                onChange={(e) =>
                  setActionData((prev) => ({
                    ...prev,
                    decline_reason: e.target.value,
                  }))
                }
                placeholder="Reason for declining..."
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="suggested_dates">
                Suggested Alternative Dates (Optional)
              </Label>
              <Input
                id="suggested_dates"
                value={actionData.suggested_dates}
                onChange={(e) =>
                  setActionData((prev) => ({
                    ...prev,
                    suggested_dates: e.target.value,
                  }))
                }
                placeholder="e.g., Try March 15-20"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setActionDialog(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeclineEnquiry}
            >
              Decline Enquiry
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Enquiry Details Dialog */}
      <Dialog
        open={enquiryDetailsOpen}
        onOpenChange={setEnquiryDetailsOpen}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Enquiry Details</DialogTitle>
          </DialogHeader>
          {selectedEnquiry && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">
                    Guest Name
                  </p>
                  <p>{selectedEnquiry.guest_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">
                    Status
                  </p>
                  <Badge
                    className={getStatusColor(
                      selectedEnquiry.status,
                    )}
                  >
                    {selectedEnquiry.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p>{selectedEnquiry.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p>{selectedEnquiry.phone}</p>
                </div>
                {selectedEnquiry.company && (
                  <div>
                    <p className="text-sm text-gray-500">
                      Company
                    </p>
                    <p>{selectedEnquiry.company}</p>
                  </div>
                )}
                {selectedEnquiry.purpose && (
                  <div>
                    <p className="text-sm text-gray-500">
                      Purpose
                    </p>
                    <p>{selectedEnquiry.purpose}</p>
                  </div>
                )}
                {selectedEnquiry.guests && (
                  <div>
                    <p className="text-sm text-gray-500">
                      Number of Guests
                    </p>
                    <p>{selectedEnquiry.guests}</p>
                  </div>
                )}
              </div>

              {selectedEnquiry.check_in_date &&
                selectedEnquiry.check_out_date && (
                  <div>
                    <p className="text-sm text-gray-500 mb-2">
                      Stay Dates
                    </p>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {format(
                          new Date(
                            selectedEnquiry.check_in_date,
                          ),
                          "PPP",
                        )}{" "}
                        -{" "}
                        {format(
                          new Date(
                            selectedEnquiry.check_out_date,
                          ),
                          "PPP",
                        )}
                      </span>
                    </div>
                  </div>
                )}

              {selectedEnquiry.special_requests && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">
                    Special Requests
                  </p>
                  <p className="text-sm bg-gray-50 p-3 rounded">
                    {selectedEnquiry.special_requests}
                  </p>
                </div>
              )}

              {/* Project/Apartment Details */}
              {selectedEnquiry.apartment && (
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-emerald-600" />
                      Property Details
                    </h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEnquiryDetailsOpen(false);
                        if (navigateTo) {
                          navigateTo("projects");
                        }
                      }}
                    >
                      View in Projects
                      <ExternalLink className="w-3 h-3 ml-1" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-4 bg-emerald-50 p-4 rounded-lg">
                    <div>
                      <p className="text-sm text-gray-600">
                        Title
                      </p>
                      <p className="text-emerald-800">
                        {selectedEnquiry.apartment.title}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">
                        Type
                      </p>
                      <p>{selectedEnquiry.apartment.type}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">
                        Location
                      </p>
                      <p>
                        {selectedEnquiry.apartment.location},{" "}
                        {selectedEnquiry.apartment.city}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">
                        Price
                      </p>
                      <p>
                        $
                        {selectedEnquiry.apartment.nightly_price?.toLocaleString()}
                        /night
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {selectedEnquiry.admin_notes && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">
                    Admin Notes
                  </p>
                  <p className="text-sm bg-blue-50 p-3 rounded">
                    {selectedEnquiry.admin_notes}
                  </p>
                </div>
              )}

              {selectedEnquiry.decline_reason && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">
                    Decline Reason
                  </p>
                  <p className="text-sm bg-red-50 p-3 rounded">
                    {selectedEnquiry.decline_reason}
                  </p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEnquiryDetailsOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Enquiry Dialog */}
      <Dialog
        open={!!deleteEnquiryConfirm}
        onOpenChange={() => setDeleteEnquiryConfirm(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Enquiry</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this enquiry? This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteEnquiryConfirm(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                deleteEnquiryConfirm &&
                handleDeleteEnquiry(deleteEnquiryConfirm)
              }
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Booking Dialog */}
      <Dialog
        open={!!deleteBookingConfirm}
        onOpenChange={() => setDeleteBookingConfirm(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Booking</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this booking? This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteBookingConfirm(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                deleteBookingConfirm &&
                handleDeleteBooking(deleteBookingConfirm)
              }
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Booking Dialog */}
      <Dialog
        open={showCreateBookingDialog}
        onOpenChange={() => setShowCreateBookingDialog(false)}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Booking</DialogTitle>
            <DialogDescription>
              Add a new booking directly.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
            <div>
              <Label htmlFor="apartment_id">Apartment</Label>
              <Select
                value={newBookingData.apartment_id}
                onValueChange={(apartment_id) =>
                  setNewBookingData((prev) => ({
                    ...prev,
                    apartment_id,
                  }))
                }
              >
                <SelectTrigger id="apartment_id">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {apartments.map((apartment) => (
                    <SelectItem
                      key={apartment.id}
                      value={apartment.id}
                    >
                      {apartment.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="guest_name">Guest Name</Label>
              <Input
                id="guest_name"
                value={newBookingData.guest_name}
                onChange={(e) =>
                  setNewBookingData((prev) => ({
                    ...prev,
                    guest_name: e.target.value,
                  }))
                }
                placeholder="Guest Name"
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={newBookingData.email}
                onChange={(e) =>
                  setNewBookingData((prev) => ({
                    ...prev,
                    email: e.target.value,
                  }))
                }
                placeholder="Email"
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={newBookingData.phone}
                onChange={(e) =>
                  setNewBookingData((prev) => ({
                    ...prev,
                    phone: e.target.value,
                  }))
                }
                placeholder="Phone"
              />
            </div>
            <div>
              <Label htmlFor="company">
                Company (Optional)
              </Label>
              <Input
                id="company"
                value={newBookingData.company}
                onChange={(e) =>
                  setNewBookingData((prev) => ({
                    ...prev,
                    company: e.target.value,
                  }))
                }
                placeholder="Company"
              />
            </div>
            <div>
              <Label htmlFor="check_in_date">
                Check-in Date
              </Label>
              <Input
                id="check_in_date"
                type="date"
                value={newBookingData.check_in_date}
                onChange={(e) =>
                  setNewBookingData((prev) => ({
                    ...prev,
                    check_in_date: e.target.value,
                  }))
                }
                placeholder="Check-in Date"
              />
            </div>
            <div>
              <Label htmlFor="check_out_date">
                Check-out Date
              </Label>
              <Input
                id="check_out_date"
                type="date"
                value={newBookingData.check_out_date}
                onChange={(e) =>
                  setNewBookingData((prev) => ({
                    ...prev,
                    check_out_date: e.target.value,
                  }))
                }
                placeholder="Check-out Date"
              />
            </div>
            <div>
              <Label htmlFor="guests">Number of Guests</Label>
              <Input
                id="guests"
                type="number"
                value={newBookingData.guests}
                onChange={(e) =>
                  setNewBookingData((prev) => ({
                    ...prev,
                    guests: parseInt(e.target.value),
                  }))
                }
                placeholder="Number of Guests"
              />
            </div>
            <div>
              <Label htmlFor="payment_status">
                Payment Status
              </Label>
              <Select
                value={newBookingData.payment_status}
                onValueChange={(payment_status) =>
                  setNewBookingData((prev) => ({
                    ...prev,
                    payment_status: payment_status as typeof prev.payment_status,
                  }))
                }
              >
                <SelectTrigger id="payment_status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">
                    Pending
                  </SelectItem>
                  <SelectItem value="partial">
                    Partial
                  </SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="refunded">
                    Refunded
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="booking_status">
                Booking Status
              </Label>
              <Select
                value={newBookingData.booking_status}
                onValueChange={(booking_status) =>
                  setNewBookingData((prev) => ({
                    ...prev,
                    booking_status: booking_status as typeof prev.booking_status,
                  }))
                }
              >
                <SelectTrigger id="booking_status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="confirmed">
                    Confirmed
                  </SelectItem>
                  <SelectItem value="checked_in">
                    Checked-in
                  </SelectItem>
                  <SelectItem value="checked_out">
                    Checked-out
                  </SelectItem>
                  <SelectItem value="cancelled">
                    Cancelled
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="amount_paid">Amount Paid</Label>
              <Input
                id="amount_paid"
                type="number"
                value={newBookingData.amount_paid}
                onChange={(e) =>
                  setNewBookingData((prev) => ({
                    ...prev,
                    amount_paid: parseFloat(e.target.value),
                  }))
                }
                placeholder="Amount Paid"
              />
            </div>
            <div>
              <Label htmlFor="deposit_paid">Deposit Paid</Label>
              <Input
                id="deposit_paid"
                type="number"
                value={newBookingData.deposit_paid}
                onChange={(e) =>
                  setNewBookingData((prev) => ({
                    ...prev,
                    deposit_paid: parseFloat(e.target.value),
                  }))
                }
                placeholder="Deposit Paid"
              />
            </div>
            <div>
              <Label htmlFor="payment_method">
                Payment Method
              </Label>
              <Input
                id="payment_method"
                value={newBookingData.payment_method}
                onChange={(e) =>
                  setNewBookingData((prev) => ({
                    ...prev,
                    payment_method: e.target.value,
                  }))
                }
                placeholder="Payment Method"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateBookingDialog(false)}
            >
              Cancel
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={handleCreateBooking}
            >
              Create Booking
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}