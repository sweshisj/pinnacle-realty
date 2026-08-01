import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  MapPin,
  Users,
  Bed,
  Bath,
  Maximize,
  Wifi,
  Utensils,
  Car,
  Dumbbell,
  Waves,
  Shield,
  Check,
  X,
  Calendar,
  Phone,
  Mail,
  Building2,
  Clock,
  CreditCard,
  FileText,
  ChevronLeft,
  ChevronRight,
  Play,
  Image as ImageIcon,
  Info,
  AlertCircle,
} from "lucide-react";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Separator } from "./ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import { Alert, AlertDescription } from "./ui/alert";
import { Calendar as CalendarComponent } from "./ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./ui/popover";
import { toast } from "sonner";
import {
  ServicedApartment,
  fetchApartmentAvailability,
  createEnquiry,
  Availability,
} from "../utils/supabase/servicedApartmentsOperations";
import {
  format,
  differenceInDays,
  addDays,
  isAfter,
  isBefore,
  isWithinInterval,
} from "date-fns";
import EnhancedDatePicker from "./EnhancedDatePicker";

interface ServicedApartmentDetailProps {
  apartment: ServicedApartment;
  onBack: () => void;
}

export default function ServicedApartmentDetail({
  apartment,
  onBack,
}: ServicedApartmentDetailProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showEnquiryForm, setShowEnquiryForm] = useState(false);
  const [showBookingSuccess, setShowBookingSuccess] =
    useState(false);
  const [availability, setAvailability] = useState<
    Availability[]
  >([]);
  const [selectedCheckIn, setSelectedCheckIn] =
    useState<Date>();
  const [selectedCheckOut, setSelectedCheckOut] =
    useState<Date>();
  const [guests, setGuests] = useState(1);

  // Enquiry form
  const [enquiryForm, setEnquiryForm] = useState({
    guest_name: "",
    email: "",
    phone: "",
    company: "",
    purpose: "Business",
    special_requests: "",
  });

  const images = apartment.images || [
    apartment.main_image ||
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800",
  ];

  useEffect(() => {
    loadAvailability();
  }, [apartment.id]);

  const loadAvailability = async () => {
    const { data } = await fetchApartmentAvailability(
      apartment.id,
    );
    if (data) {
      setAvailability(data);
    }
  };

  const calculatePrice = () => {
    if (!selectedCheckIn || !selectedCheckOut) return null;

    const nights = differenceInDays(
      selectedCheckOut,
      selectedCheckIn,
    );
    if (nights <= 0) return null;

    const basePrice = apartment.nightly_price || 0;
    const cleaningFee = apartment.cleaning_fee || 0;
    const subtotal = basePrice * nights + cleaningFee;
    const tax =
      subtotal * ((apartment.tax_percentage || 18) / 100);
    const total = subtotal + tax;

    return {
      nights,
      basePrice,
      cleaningFee,
      subtotal,
      tax,
      total,
    };
  };

  const isDateBlocked = (date: Date) => {
    return availability.some((avail) => {
      const start = new Date(avail.start_date);
      const end = new Date(avail.end_date);
      return (
        (avail.status === "blocked" ||
          avail.status === "booked") &&
        isWithinInterval(date, { start, end })
      );
    });
  };

  const isDatePending = (date: Date) => {
    return availability.some((avail) => {
      const start = new Date(avail.start_date);
      const end = new Date(avail.end_date);
      return (
        avail.status === "pending" &&
        isWithinInterval(date, { start, end })
      );
    });
  };

  const handleSubmitEnquiry = async () => {
    if (
      !enquiryForm.guest_name ||
      !enquiryForm.email ||
      !enquiryForm.phone
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (!selectedCheckIn || !selectedCheckOut) {
      toast.error("Please select check-in and check-out dates");
      return;
    }

    const enquiry = {
      apartment_id: apartment.id,
      ...enquiryForm,
      check_in_date: format(selectedCheckIn, "yyyy-MM-dd"),
      check_out_date: format(selectedCheckOut, "yyyy-MM-dd"),
      guests,
      status: "new" as const,
    };

    const { data, error } = await createEnquiry(enquiry);

    if (error) {
      toast.error(
        "Failed to submit enquiry. Please try again.",
      );
      return;
    }

    toast.success("Enquiry submitted successfully!");
    setShowEnquiryForm(false);
    setShowBookingSuccess(true);
    setEnquiryForm({
      guest_name: "",
      email: "",
      phone: "",
      company: "",
      purpose: "Business",
      special_requests: "",
    });
  };

  const priceCalc = calculatePrice();

  const handleEnquiryClick = () => {
    if (!selectedCheckIn || !selectedCheckOut) {
      toast.error("Please select check-in and check-out dates");
      return;
    }
    setShowEnquiryForm(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Button
            variant="ghost"
            onClick={onBack}
            className="mb-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Listings
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Media Carousel */}
            <Card className="overflow-hidden">
              <div className="relative h-96 bg-gray-900">
                <img
                  src={images[currentImageIndex]}
                  alt={apartment.title}
                  className="w-full h-full object-cover"
                />

                {/* Navigation */}
                {images.length > 1 && (
                  <>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white"
                      onClick={() =>
                        setCurrentImageIndex((prev) =>
                          prev === 0
                            ? images.length - 1
                            : prev - 1,
                        )
                      }
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </Button>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white"
                      onClick={() =>
                        setCurrentImageIndex((prev) =>
                          prev === images.length - 1
                            ? 0
                            : prev + 1,
                        )
                      }
                    >
                      <ChevronRight className="w-5 h-5" />
                    </Button>
                  </>
                )}

                {/* Badges */}
                <div className="absolute top-4 right-4 flex gap-2">
                  {apartment.featured && (
                    <Badge className="bg-amber-500">
                      Featured
                    </Badge>
                  )}
                </div>

                {/* Image counter */}
                <div className="absolute bottom-4 right-4 bg-black/60 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2">
                  <ImageIcon className="w-4 h-4" />
                  {currentImageIndex + 1} / {images.length}
                </div>
              </div>

              {/* Thumbnails */}
              {images.length > 1 && (
                <div className="p-4 flex gap-2 overflow-x-auto">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentImageIndex(idx)}
                      className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 ${
                        idx === currentImageIndex
                          ? "border-emerald-600"
                          : "border-transparent"
                      }`}
                    >
                      <img
                        src={img}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                  {apartment.floor_plan_image && (
                    <div className="flex-shrink-0 w-20 h-20 rounded-lg border-2 border-gray-200 flex items-center justify-center bg-gray-100">
                      <span className="text-xs">
                        Floor Plan
                      </span>
                    </div>
                  )}
                  {apartment.video_url && (
                    <div className="flex-shrink-0 w-20 h-20 rounded-lg border-2 border-gray-200 flex items-center justify-center bg-gray-100">
                      <Play className="w-6 h-6 text-gray-600" />
                    </div>
                  )}
                </div>
              )}
            </Card>

            {/* Summary Panel */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle>{apartment.title}</CardTitle>
                    <div className="flex items-center text-gray-500 mt-2">
                      <MapPin className="w-4 h-4 mr-1" />
                      {apartment.address ||
                        `${apartment.location}, ${apartment.city}`}
                    </div>
                  </div>
                  <Badge variant="outline" className="text-sm">
                    {apartment.type}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 border-y border-gray-200">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-gray-400" />
                    <div>
                      <div className="text-sm">
                        Sleeps {apartment.sleeps}
                      </div>
                      <div className="text-xs text-gray-500">
                        Guests
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Bed className="w-5 h-5 text-gray-400" />
                    <div>
                      <div className="text-sm">
                        {apartment.bedrooms} Bedroom
                        {apartment.bedrooms !== 1 ? "s" : ""}
                      </div>
                      <div className="text-xs text-gray-500">
                        Beds
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Bath className="w-5 h-5 text-gray-400" />
                    <div>
                      <div className="text-sm">
                        {apartment.bathrooms} Bathroom
                        {apartment.bathrooms !== 1 ? "s" : ""}
                      </div>
                      <div className="text-xs text-gray-500">
                        Baths
                      </div>
                    </div>
                  </div>
                  {apartment.size_sqft && (
                    <div className="flex items-center gap-2">
                      <Maximize className="w-5 h-5 text-gray-400" />
                      <div>
                        <div className="text-sm">
                          {apartment.size_sqft} sqft
                        </div>
                        <div className="text-xs text-gray-500">
                          Size
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {apartment.description && (
                  <p className="text-gray-600 mt-4">
                    {apartment.description}
                  </p>
                )}

                {apartment.highlights &&
                  apartment.highlights.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm mb-2">Highlights</p>
                      <div className="flex flex-wrap gap-2">
                        {apartment.highlights.map(
                          (highlight, idx) => (
                            <Badge
                              key={idx}
                              variant="secondary"
                              className="bg-emerald-50 text-emerald-700"
                            >
                              <Check className="w-3 h-3 mr-1" />
                              {highlight}
                            </Badge>
                          ),
                        )}
                      </div>
                    </div>
                  )}
              </CardContent>
            </Card>

            {/* Pricing Module */}
            <Card>
              <CardHeader>
                <CardTitle>Pricing</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {apartment.nightly_price && (
                    <div className="border border-gray-200 rounded-lg p-4">
                      <div className="text-2xl text-emerald-600">
                        $
                        {apartment.nightly_price.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-500">
                        per night
                      </div>
                    </div>
                  )}
                  {apartment.weekly_price && (
                    <div className="border border-gray-200 rounded-lg p-4">
                      <div className="text-2xl text-emerald-600">
                        $
                        {apartment.weekly_price.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-500">
                        per week
                      </div>
                    </div>
                  )}
                  {apartment.monthly_price && (
                    <div className="border border-gray-200 rounded-lg p-4">
                      <div className="text-2xl text-emerald-600">
                        $
                        {apartment.monthly_price.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-500">
                        per month
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <p className="text-sm">Includes:</p>
                  <div className="grid grid-cols-2 gap-2">
                    {apartment.inclusions?.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 text-sm text-gray-600"
                      >
                        <Check className="w-4 h-4 text-emerald-600" />
                        {item}
                      </div>
                    ))}
                  </div>
                </div>

                {apartment.housekeeping_frequency && (
                  <div className="flex items-center justify-between text-sm py-2 border-t border-gray-100">
                    <span className="text-gray-600">
                      Housekeeping
                    </span>
                    <span>
                      {apartment.housekeeping_frequency}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between text-sm py-2 border-t border-gray-100">
                  <span className="text-gray-600">
                    Security Deposit
                  </span>
                  <span>
                    $
                    {apartment.security_deposit?.toLocaleString() ||
                      0}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm py-2 border-t border-gray-100">
                  <span className="text-gray-600">
                    Cleaning Fee
                  </span>
                  <span>
                    $
                    {apartment.cleaning_fee?.toLocaleString() ||
                      0}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm py-2 border-t border-gray-100">
                  <span className="text-gray-600">
                    Minimum Stay
                  </span>
                  <span>
                    {apartment.minimum_stay_nights || 1} night
                    {(apartment.minimum_stay_nights || 1) > 1
                      ? "s"
                      : ""}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Amenities */}
            <Card>
              <CardHeader>
                <CardTitle>Amenities & Services</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {apartment.has_kitchen && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Utensils className="w-5 h-5 text-emerald-600" />
                      <span className="text-sm">
                        Full Kitchen
                      </span>
                    </div>
                  )}
                  {apartment.has_laundry && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Shield className="w-5 h-5 text-emerald-600" />
                      <span className="text-sm">Laundry</span>
                    </div>
                  )}
                  {apartment.has_parking && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Car className="w-5 h-5 text-emerald-600" />
                      <span className="text-sm">Parking</span>
                    </div>
                  )}
                  {apartment.has_gym && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Dumbbell className="w-5 h-5 text-emerald-600" />
                      <span className="text-sm">Gym</span>
                    </div>
                  )}
                  {apartment.has_pool && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Waves className="w-5 h-5 text-emerald-600" />
                      <span className="text-sm">Pool</span>
                    </div>
                  )}
                  {apartment.wifi_speed && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Wifi className="w-5 h-5 text-emerald-600" />
                      <span className="text-sm">
                        Wi-Fi {apartment.wifi_speed}
                      </span>
                    </div>
                  )}
                  {apartment.has_lift && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Check className="w-5 h-5 text-emerald-600" />
                      <span className="text-sm">Lift</span>
                    </div>
                  )}
                  {apartment.has_balcony && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Check className="w-5 h-5 text-emerald-600" />
                      <span className="text-sm">Balcony</span>
                    </div>
                  )}
                  {apartment.has_tv && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Check className="w-5 h-5 text-emerald-600" />
                      <span className="text-sm">TV</span>
                    </div>
                  )}
                  {apartment.amenities?.map((amenity, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                    >
                      <Check className="w-5 h-5 text-emerald-600" />
                      <span className="text-sm">{amenity}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Policies */}
            <Card>
              <CardHeader>
                <CardTitle>Policies & Rules</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                      <Clock className="w-4 h-4" />
                      Check-in
                    </div>
                    <div>
                      {apartment.check_in_time || "14:00"}
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                      <Clock className="w-4 h-4" />
                      Check-out
                    </div>
                    <div>
                      {apartment.check_out_time || "11:00"}
                    </div>
                  </div>
                </div>

                {apartment.cancellation_policy && (
                  <div>
                    <div className="text-sm text-gray-600 mb-1">
                      Cancellation Policy
                    </div>
                    <Badge variant="outline">
                      {apartment.cancellation_policy}
                    </Badge>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-2">
                    {apartment.smoking_allowed ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <X className="w-4 h-4 text-red-500" />
                    )}
                    <span className="text-sm">Smoking</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {apartment.pets_allowed ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <X className="w-4 h-4 text-red-500" />
                    )}
                    <span className="text-sm">Pets</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {apartment.parties_allowed ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <X className="w-4 h-4 text-red-500" />
                    )}
                    <span className="text-sm">Parties</span>
                  </div>
                </div>

                {(apartment.kyc_required ||
                  apartment.gst_invoice_available) && (
                  <Alert className="bg-blue-50 border-blue-200">
                    <Info className="w-4 h-4 text-blue-600" />
                    <AlertDescription className="text-sm text-blue-900">
                      <ul className="list-disc list-inside space-y-1">
                        {apartment.kyc_required && (
                          <li>KYC documents required</li>
                        )}
                        {apartment.gst_invoice_available && (
                          <li>GST invoice available</li>
                        )}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Map Section - Only show if coordinates exist */}
            {apartment.latitude && apartment.longitude && (
              <Card>
                <CardHeader>
                  <CardTitle>Location</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 rounded-lg overflow-hidden border border-gray-200">
                    <iframe
                      width="100%"
                      height="100%"
                      frameBorder="0"
                      style={{ border: 0 }}
                      src={`https://maps.google.com/maps?q=${apartment.latitude},${apartment.longitude}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                      allowFullScreen
                    />
                  </div>
                  {apartment.address && (
                    <div className="mt-4 flex items-start gap-2 text-sm text-gray-600">
                      <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span>{apartment.address}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Booking Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-20">
              <CardHeader>
                <CardTitle>Book Your Stay</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Date Selection */}
                <div>
                  <Label className="mb-2 block">
                    Check-in Date *
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                      >
                        <Calendar className="w-4 h-4 mr-2" />
                        {selectedCheckIn
                          ? format(selectedCheckIn, "PPP")
                          : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-auto p-0"
                      align="start"
                    >
                      <CalendarComponent
                        mode="single"
                        selected={selectedCheckIn}
                        onSelect={setSelectedCheckIn}
                        disabled={(date) =>
                          isBefore(date, new Date()) ||
                          isDateBlocked(date)
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <Label className="mb-2 block">
                    Check-out Date *
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                      >
                        <Calendar className="w-4 h-4 mr-2" />
                        {selectedCheckOut
                          ? format(selectedCheckOut, "PPP")
                          : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-auto p-0"
                      align="start"
                    >
                      <CalendarComponent
                        mode="single"
                        selected={selectedCheckOut}
                        onSelect={setSelectedCheckOut}
                        disabled={(date) =>
                          isBefore(
                            date,
                            selectedCheckIn || new Date(),
                          ) || isDateBlocked(date)
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <Label
                    htmlFor="guests"
                    className="mb-2 block"
                  >
                    Number of Guests
                  </Label>
                  <Select
                    value={guests.toString()}
                    onValueChange={(val) =>
                      setGuests(parseInt(val))
                    }
                  >
                    <SelectTrigger id="guests">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from(
                        { length: apartment.sleeps },
                        (_, i) => i + 1,
                      ).map((num) => (
                        <SelectItem
                          key={num}
                          value={num.toString()}
                        >
                          {num} {num === 1 ? "Guest" : "Guests"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Calendar Legend */}
                <div className="bg-gray-50 p-3 rounded-lg space-y-2 text-xs">
                  <p className="text-sm">Calendar Legend:</p>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border border-gray-300 rounded"></div>
                    <span>Available</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-gray-400 rounded"></div>
                    <span>Blocked</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-dashed border-amber-500 rounded"></div>
                    <span>Pending Approval</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-emerald-600 rounded"></div>
                    <span>Booked</span>
                  </div>
                </div>

                {/* Price Breakdown */}
                {priceCalc && (
                  <div className="bg-emerald-50 p-4 rounded-lg space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>
                        ${priceCalc.basePrice} ×{" "}
                        {priceCalc.nights} nights
                      </span>
                      <span>
                        $
                        {(
                          priceCalc.basePrice * priceCalc.nights
                        ).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Cleaning fee</span>
                      <span>
                        $
                        {priceCalc.cleaningFee.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>
                        Tax ({apartment.tax_percentage}%)
                      </span>
                      <span>
                        ${priceCalc.tax.toLocaleString()}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span>Total</span>
                      <span className="text-emerald-600">
                        ${priceCalc.total.toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}

                {/* CTA Button */}
                <Button
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  size="lg"
                  onClick={handleEnquiryClick}
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Send Enquiry
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Sticky Mobile Bottom Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg z-20">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-emerald-600">
              ${apartment.nightly_price?.toLocaleString()}
            </div>
            <div className="text-xs text-gray-500">
              per night
            </div>
          </div>
          <Button
            className="bg-blue-600 hover:bg-blue-700 flex-1"
            onClick={handleEnquiryClick}
          >
            Send Enquiry
          </Button>
        </div>
      </div>

      {/* Enquiry/Booking Form Dialog */}
      <Dialog
        open={showEnquiryForm}
        onOpenChange={setShowEnquiryForm}
      >
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Send Enquiry</DialogTitle>
            <DialogDescription>
              Please fill in the details to send your enquiry.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                value={enquiryForm.guest_name}
                onChange={(e) =>
                  setEnquiryForm((prev) => ({
                    ...prev,
                    guest_name: e.target.value,
                  }))
                }
                placeholder="Enter your name"
              />
            </div>
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={enquiryForm.email}
                onChange={(e) =>
                  setEnquiryForm((prev) => ({
                    ...prev,
                    email: e.target.value,
                  }))
                }
                placeholder="your@email.com"
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone *</Label>
              <Input
                id="phone"
                type="tel"
                value={enquiryForm.phone}
                onChange={(e) =>
                  setEnquiryForm((prev) => ({
                    ...prev,
                    phone: e.target.value,
                  }))
                }
                placeholder="+61-4XX-XXX-XXX"
              />
            </div>
            <div>
              <Label htmlFor="company">
                Company (Optional)
              </Label>
              <Input
                id="company"
                value={enquiryForm.company}
                onChange={(e) =>
                  setEnquiryForm((prev) => ({
                    ...prev,
                    company: e.target.value,
                  }))
                }
                placeholder="Company name"
              />
            </div>
            <div>
              <Label htmlFor="purpose">Purpose</Label>
              <Select
                value={enquiryForm.purpose}
                onValueChange={(value) =>
                  setEnquiryForm((prev) => ({
                    ...prev,
                    purpose: value,
                  }))
                }
              >
                <SelectTrigger id="purpose">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Business">
                    Business
                  </SelectItem>
                  <SelectItem value="Leisure">
                    Leisure
                  </SelectItem>
                  <SelectItem value="Relocation">
                    Relocation
                  </SelectItem>
                  <SelectItem value="Medical">
                    Medical
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="requests">Special Requests</Label>
              <Textarea
                id="requests"
                value={enquiryForm.special_requests}
                onChange={(e) =>
                  setEnquiryForm((prev) => ({
                    ...prev,
                    special_requests: e.target.value,
                  }))
                }
                placeholder="Any special requirements..."
                rows={3}
              />
            </div>

            {selectedCheckIn &&
              selectedCheckOut &&
              priceCalc && (
                <Alert className="bg-emerald-50 border-emerald-200">
                  <AlertDescription>
                    <div className="text-sm space-y-1">
                      <div>
                        <strong>Check-in:</strong>{" "}
                        {format(selectedCheckIn, "PPP")}
                      </div>
                      <div>
                        <strong>Check-out:</strong>{" "}
                        {format(selectedCheckOut, "PPP")}
                      </div>
                      <div>
                        <strong>Guests:</strong> {guests}
                      </div>
                      <div className="text-emerald-600 mt-2">
                        <strong>
                          Total: $
                          {priceCalc.total.toLocaleString()}
                        </strong>
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

            <Button
              className="w-full bg-emerald-600 hover:bg-emerald-700"
              onClick={handleSubmitEnquiry}
            >
              Submit Enquiry
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Success Dialog */}
      <Dialog
        open={showBookingSuccess}
        onOpenChange={setShowBookingSuccess}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="sr-only">
              Enquiry Submitted
            </DialogTitle>
            <DialogDescription className="sr-only">
              Your enquiry has been successfully submitted to
              our team.
            </DialogDescription>
          </DialogHeader>
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-emerald-600" />
            </div>
            <h3 className="mb-2">Enquiry Submitted!</h3>
            <p className="text-gray-600 mb-6">
              We have received your enquiry. Our team will
              contact you within 24 hours.
            </p>
            <Button
              onClick={() => setShowBookingSuccess(false)}
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}