import React, { useState, useEffect } from "react";
import {
  Search,
  Filter,
  MapPin,
  Users,
  Bed,
  Bath,
  Wifi,
  Utensils,
  Car,
  Calendar,
  Star,
  Shield,
  Award,
  Check,
  ChevronDown,
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Slider } from "./ui/slider";
import { Checkbox } from "./ui/checkbox";
import { Label } from "./ui/label";
import {
  fetchServicedApartments,
  ServicedApartment,
} from "../utils/supabase/servicedApartmentsOperations";
import { Skeleton } from "./ui/skeleton";

interface ServicedApartmentsListingProps {
  onSelectApartment: (apartment: ServicedApartment) => void;
  searchParams?: {
    city?: string;
    type?: string;
    budget?: string;
  };
}

export default function ServicedApartmentsListing({
  onSelectApartment,
  searchParams,
}: ServicedApartmentsListingProps) {
  const [apartments, setApartments] = useState<
    ServicedApartment[]
  >([]);
  const [filteredApartments, setFilteredApartments] = useState<
    ServicedApartment[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Quick filters
  const [quickFilters, setQuickFilters] = useState({
    city: "all",
    type: "all",
    guests: "all",
    checkIn: "",
    checkOut: "",
  });

  // Advanced filters
  const [advancedFilters, setAdvancedFilters] = useState({
    minPrice: 0,
    maxPrice: 1000,
    instantBook: false,
    hasKitchen: false,
    hasLaundry: false,
    hasParking: false,
    hasGym: false,
    hasPool: false,
    petsAllowed: false,
  });

  const [sortBy, setSortBy] = useState<string>("featured");

  useEffect(() => {
    loadApartments();
  }, []);

  useEffect(() => {
    applyFiltersAndSort();
  }, [apartments, quickFilters, advancedFilters, sortBy]);

  const loadApartments = async () => {
    setLoading(true);
    const { data, error } = await fetchServicedApartments();
    if (data) {
      setApartments(data);
    }
    setLoading(false);
  };

  const applyFiltersAndSort = () => {
    let filtered = [...apartments];

    // Quick filters
    if (quickFilters.city && quickFilters.city !== "all") {
      filtered = filtered.filter((apt) =>
        apt.city
          .toLowerCase()
          .includes(quickFilters.city.toLowerCase()),
      );
    }
    if (quickFilters.type && quickFilters.type !== "all") {
      filtered = filtered.filter(
        (apt) => apt.type === quickFilters.type,
      );
    }
    if (quickFilters.guests && quickFilters.guests !== "all") {
      const guestCount = parseInt(quickFilters.guests);
      filtered = filtered.filter(
        (apt) => apt.sleeps >= guestCount,
      );
    }

    // Advanced filters
    filtered = filtered.filter((apt) => {
      const price = apt.nightly_price || 0;
      if (
        price < advancedFilters.minPrice ||
        price > advancedFilters.maxPrice
      )
        return false;
      if (advancedFilters.instantBook && !apt.instant_book)
        return false;
      if (advancedFilters.hasKitchen && !apt.has_kitchen)
        return false;
      if (advancedFilters.hasLaundry && !apt.has_laundry)
        return false;
      if (advancedFilters.hasParking && !apt.has_parking)
        return false;
      if (advancedFilters.hasGym && !apt.has_gym) return false;
      if (advancedFilters.hasPool && !apt.has_pool)
        return false;
      if (advancedFilters.petsAllowed && !apt.pets_allowed)
        return false;
      return true;
    });

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "price_low":
          return (
            (a.nightly_price || 0) - (b.nightly_price || 0)
          );
        case "price_high":
          return (
            (b.nightly_price || 0) - (a.nightly_price || 0)
          );
        case "featured":
          if (a.featured && !b.featured) return -1;
          if (!a.featured && b.featured) return 1;
          return 0;
        default:
          return 0;
      }
    });

    setFilteredApartments(filtered);
  };

  const resetFilters = () => {
    setQuickFilters({
      city: "all",
      type: "all",
      guests: "all",
      checkIn: "",
      checkOut: "",
    });
    setAdvancedFilters({
      minPrice: 0,
      maxPrice: 1000,
      instantBook: false,
      hasKitchen: false,
      hasLaundry: false,
      hasParking: false,
      hasGym: false,
      hasPool: false,
      petsAllowed: false,
    });
  };

  const cities = [
    ...new Set(apartments.map((apt) => apt.city)),
  ];
  const types = [...new Set(apartments.map((apt) => apt.type))];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="mb-2">Serviced Apartments</h1>
          <p className="text-emerald-100 mb-6">
            Your home away from home. Fully furnished,
            business-ready accommodations.
          </p>

          {/* Trust Badges */}
          <div className="flex flex-wrap gap-4 mb-8">
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg">
              <Shield className="w-5 h-5" />
              <span className="text-sm">
                Verified Properties
              </span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg">
              <Award className="w-5 h-5" />
              <span className="text-sm">
                Best Price Guarantee
              </span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg">
              <Star className="w-5 h-5" />
              <span className="text-sm">
                4.8★ Average Rating
              </span>
            </div>
          </div>

          {/* Quick Filters */}
          <Card className="bg-white/95 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                <div>
                  <Label className="text-sm mb-1 block text-gray-700">
                    City
                  </Label>
                  <Select
                    value={quickFilters.city}
                    onValueChange={(value) =>
                      setQuickFilters((prev) => ({
                        ...prev,
                        city: value,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select city" />
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
                <div>
                  <Label className="text-sm mb-1 block text-gray-700">
                    Type
                  </Label>
                  <Select
                    value={quickFilters.type}
                    onValueChange={(value) =>
                      setQuickFilters((prev) => ({
                        ...prev,
                        type: value,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
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
                <div>
                  <Label className="text-sm mb-1 block text-gray-700">
                    Guests
                  </Label>
                  <Select
                    value={quickFilters.guests}
                    onValueChange={(value) =>
                      setQuickFilters((prev) => ({
                        ...prev,
                        guests: value,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Guests" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Any</SelectItem>
                      <SelectItem value="1">1</SelectItem>
                      <SelectItem value="2">2</SelectItem>
                      <SelectItem value="4">4</SelectItem>
                      <SelectItem value="6">6+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm mb-1 block text-gray-700">
                    Check-in
                  </Label>
                  <Input
                    type="date"
                    value={quickFilters.checkIn}
                    onChange={(e) =>
                      setQuickFilters((prev) => ({
                        ...prev,
                        checkIn: e.target.value,
                      }))
                    }
                    className="bg-white"
                  />
                </div>
                <div>
                  <Label className="text-sm mb-1 block text-gray-700">
                    Check-out
                  </Label>
                  <Input
                    type="date"
                    value={quickFilters.checkOut}
                    onChange={(e) =>
                      setQuickFilters((prev) => ({
                        ...prev,
                        checkOut: e.target.value,
                      }))
                    }
                    className="bg-white"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Filter and Sort Bar */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 py-3 px-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-gray-600">
              {filteredApartments.length} properties found
            </span>
            {(quickFilters.city !== "all" ||
              quickFilters.type !== "all" ||
              quickFilters.guests !== "all") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={resetFilters}
              >
                Clear filters
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Dialog
              open={isFilterOpen}
              onOpenChange={setIsFilterOpen}
            >
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="w-4 h-4 mr-2" />
                  Advanced Filters
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Advanced Filters</DialogTitle>
                </DialogHeader>
                <div className="space-y-6 py-4">
                  {/* Price Range */}
                  <div>
                    <Label className="mb-2 block">
                      Price Range (per night)
                    </Label>
                    <div className="flex items-center gap-4 mb-2">
                      <Input
                        type="number"
                        value={advancedFilters.minPrice}
                        onChange={(e) =>
                          setAdvancedFilters((prev) => ({
                            ...prev,
                            minPrice:
                              parseInt(e.target.value) || 0,
                          }))
                        }
                        placeholder="Min"
                        className="flex-1"
                      />
                      <span>-</span>
                      <Input
                        type="number"
                        value={advancedFilters.maxPrice}
                        onChange={(e) =>
                          setAdvancedFilters((prev) => ({
                            ...prev,
                            maxPrice:
                              parseInt(e.target.value) || 20000,
                          }))
                        }
                        placeholder="Max"
                        className="flex-1"
                      />
                    </div>
                    <Slider
                      value={[
                        advancedFilters.minPrice,
                        advancedFilters.maxPrice,
                      ]}
                      onValueChange={([min, max]) =>
                        setAdvancedFilters((prev) => ({
                          ...prev,
                          minPrice: min,
                          maxPrice: max,
                        }))
                      }
                      min={0}
                      max={1000}
                      step={25}
                      className="mt-2"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>${advancedFilters.minPrice}</span>
                      <span>${advancedFilters.maxPrice}</span>
                    </div>
                  </div>

                  {/* Booking Type */}
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="instantBook"
                      checked={advancedFilters.instantBook}
                      onCheckedChange={(checked) =>
                        setAdvancedFilters((prev) => ({
                          ...prev,
                          instantBook: checked as boolean,
                        }))
                      }
                    />
                    <Label
                      htmlFor="instantBook"
                      className="cursor-pointer"
                    >
                      Instant Book Only
                    </Label>
                  </div>

                  {/* Amenities */}
                  <div>
                    <Label className="mb-3 block">
                      Amenities
                    </Label>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="kitchen"
                          checked={advancedFilters.hasKitchen}
                          onCheckedChange={(checked) =>
                            setAdvancedFilters((prev) => ({
                              ...prev,
                              hasKitchen: checked as boolean,
                            }))
                          }
                        />
                        <Label
                          htmlFor="kitchen"
                          className="cursor-pointer"
                        >
                          Kitchen
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="laundry"
                          checked={advancedFilters.hasLaundry}
                          onCheckedChange={(checked) =>
                            setAdvancedFilters((prev) => ({
                              ...prev,
                              hasLaundry: checked as boolean,
                            }))
                          }
                        />
                        <Label
                          htmlFor="laundry"
                          className="cursor-pointer"
                        >
                          Laundry
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="parking"
                          checked={advancedFilters.hasParking}
                          onCheckedChange={(checked) =>
                            setAdvancedFilters((prev) => ({
                              ...prev,
                              hasParking: checked as boolean,
                            }))
                          }
                        />
                        <Label
                          htmlFor="parking"
                          className="cursor-pointer"
                        >
                          Parking
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="gym"
                          checked={advancedFilters.hasGym}
                          onCheckedChange={(checked) =>
                            setAdvancedFilters((prev) => ({
                              ...prev,
                              hasGym: checked as boolean,
                            }))
                          }
                        />
                        <Label
                          htmlFor="gym"
                          className="cursor-pointer"
                        >
                          Gym
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="pool"
                          checked={advancedFilters.hasPool}
                          onCheckedChange={(checked) =>
                            setAdvancedFilters((prev) => ({
                              ...prev,
                              hasPool: checked as boolean,
                            }))
                          }
                        />
                        <Label
                          htmlFor="pool"
                          className="cursor-pointer"
                        >
                          Swimming Pool
                        </Label>
                      </div>
                    </div>
                  </div>

                  {/* Policies */}
                  <div>
                    <Label className="mb-3 block">
                      Policies
                    </Label>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="pets"
                        checked={advancedFilters.petsAllowed}
                        onCheckedChange={(checked) =>
                          setAdvancedFilters((prev) => ({
                            ...prev,
                            petsAllowed: checked as boolean,
                          }))
                        }
                      />
                      <Label
                        htmlFor="pets"
                        className="cursor-pointer"
                      >
                        Pets Allowed
                      </Label>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={resetFilters}
                    >
                      Reset
                    </Button>
                    <Button
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                      onClick={() => setIsFilterOpen(false)}
                    >
                      Apply Filters
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="featured">
                  Featured
                </SelectItem>
                <SelectItem value="price_low">
                  Price: Low to High
                </SelectItem>
                <SelectItem value="price_high">
                  Price: High to Low
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Listings Grid */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i}>
                <Skeleton className="h-48 w-full" />
                <CardContent className="p-4 space-y-3">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredApartments.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Search className="w-16 h-16 mx-auto" />
            </div>
            <p className="text-gray-600">
              No properties found matching your criteria.
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={resetFilters}
            >
              Clear filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredApartments.map((apartment) => (
              <ApartmentCard
                key={apartment.id}
                apartment={apartment}
                onClick={() => onSelectApartment(apartment)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ApartmentCard({
  apartment,
  onClick,
}: {
  apartment: ServicedApartment;
  onClick: () => void;
}) {
  return (
    <Card
      className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group"
      onClick={onClick}
    >
      <div className="relative h-48 overflow-hidden">
        <img
          src={
            apartment.main_image ||
            "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800"
          }
          alt={apartment.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {apartment.instant_book && (
          <Badge className="absolute top-3 right-3 bg-emerald-600 hover:bg-emerald-600">
            <Check className="w-3 h-3 mr-1" />
            Instant Book
          </Badge>
        )}
        {!apartment.instant_book && (
          <Badge
            variant="secondary"
            className="absolute top-3 right-3 bg-white/90"
          >
            Enquire Only
          </Badge>
        )}
        {apartment.featured && (
          <Badge className="absolute top-3 left-3 bg-amber-500 hover:bg-amber-500">
            <Star className="w-3 h-3 mr-1" />
            Featured
          </Badge>
        )}
      </div>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <h3 className="text-sm">{apartment.title}</h3>
            <div className="flex items-center text-gray-500 text-xs mt-1">
              <MapPin className="w-3 h-3 mr-1" />
              {apartment.location}, {apartment.city}
            </div>
          </div>
        </div>

        {/* Specs */}
        <div className="flex items-center gap-4 text-xs text-gray-600 mb-3 py-2 border-y border-gray-100">
          <div className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            <span>{apartment.sleeps}</span>
          </div>
          <div className="flex items-center gap-1">
            <Bed className="w-3.5 h-3.5" />
            <span>{apartment.bedrooms}</span>
          </div>
          <div className="flex items-center gap-1">
            <Bath className="w-3.5 h-3.5" />
            <span>{apartment.bathrooms}</span>
          </div>
          {apartment.size_sqft && (
            <div className="text-xs">
              {apartment.size_sqft} sqft
            </div>
          )}
        </div>

        {/* Highlights */}
        {apartment.highlights &&
          apartment.highlights.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {apartment.highlights
                .slice(0, 3)
                .map((highlight, idx) => (
                  <Badge
                    key={idx}
                    variant="outline"
                    className="text-xs"
                  >
                    {highlight}
                  </Badge>
                ))}
            </div>
          )}

        {/* Price and CTA */}
        <div className="flex items-end justify-between mt-3">
          <div>
            <div className="text-emerald-600">
              ${apartment.nightly_price?.toLocaleString()}
            </div>
            <div className="text-xs text-gray-500">
              per night
            </div>
          </div>
          <Button
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            View Details
          </Button>
        </div>

        {/* Availability cue */}
        <div className="flex items-center gap-1 text-xs text-green-600 mt-2">
          <Calendar className="w-3 h-3" />
          <span>Available Now</span>
        </div>
      </CardContent>
    </Card>
  );
}