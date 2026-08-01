import React, { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Card, CardContent } from "./ui/card";
import {
  Search,
  Navigation,
  MapPin,
  ZoomIn,
  ZoomOut,
  Crosshair,
  Trash2,
  AlertCircle,
  Loader2,
  MapPinned,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "./ui/skeleton";
import { Alert, AlertDescription } from "./ui/alert";
import { motion, AnimatePresence } from "framer-motion";

interface LocationData {
  address1?: string;
  address2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  countryCode?: string;
  latitude?: number | null;
  longitude?: number | null;
  formattedAddress?: string;
  osmId?: string;
  osmType?: string;
  addressJson?: any;
}

interface PropertyLocationPickerProps {
  value?: LocationData;
  onChange: (location: LocationData) => void;
  showMap?: boolean; // New prop to control map visibility
  showBoundaryMode?: boolean; // Accepted for compatibility with admin project forms
}

interface SearchResult {
  place_id: string;
  display_name: string;
  lat: string;
  lon: string;
  address: {
    road?: string;
    house_number?: string;
    suburb?: string;
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    country?: string;
    country_code?: string;
    postcode?: string;
  };
  osm_id: string;
  osm_type: string;
}

const COUNTRIES = [
  { code: "au", name: "Australia" },
  { code: "nz", name: "New Zealand" },
  { code: "us", name: "United States" },
  { code: "ca", name: "Canada" },
  { code: "gb", name: "United Kingdom" },
  { code: "ae", name: "United Arab Emirates" },
  { code: "sg", name: "Singapore" },
];

// Add styles for Leaflet dynamically
const loadLeafletStyles = () => {
  if (typeof document === "undefined") return;
  if (document.getElementById("leaflet-css")) return;

  const link = document.createElement("link");
  link.id = "leaflet-css";
  link.rel = "stylesheet";
  link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
  document.head.appendChild(link);
};

export function PropertyLocationPicker({
  value,
  onChange,
  showMap = true, // Default to true if not provided
}: PropertyLocationPickerProps) {
  const [location, setLocation] = useState<LocationData>(value || {});
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [mapLoading, setMapLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragPosition, setDragPosition] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-save when showMap is false and address fields change
  useEffect(() => {
    if (!showMap && hasUnsavedChanges) {
      // When map is hidden, auto-save address field changes
      const saveTimeout = setTimeout(() => {
        onChange(location);
        setHasUnsavedChanges(false);
      }, 500); // Debounce for 500ms

      return () => clearTimeout(saveTimeout);
    }
  }, [location, showMap, hasUnsavedChanges]);

  // Load Leaflet dynamically
  useEffect(() => {
    if (!showMap) return; // Don't load map resources if not showing map

    loadLeafletStyles();

    const loadLeaflet = async () => {
      if (typeof window === "undefined") return;
      if ((window as any).L) {
        initMap();
        return;
      }

      const script = document.createElement("script");
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.async = true;
      script.onload = () => initMap();
      document.head.appendChild(script);
    };

    loadLeaflet();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
      }
    };
  }, [showMap]);

  // Initialize Leaflet Map
  const initMap = () => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const L = (window as any).L;
    if (!L) return;

    // Default to Melbourne, Australia
    const defaultCenter: [number, number] = [
      location.latitude || -37.8136,
      location.longitude || 144.9631,
    ];

    const map = L.map(mapRef.current, {
      center: defaultCenter,
      zoom: location.latitude ? 15 : 12,
      zoomControl: false,
    });

    // Add OpenStreetMap tiles
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    mapInstanceRef.current = map;

    // Create custom red marker icon
    const redIcon = L.divIcon({
      className: "custom-pin",
      html: `<div style="
        width: 30px;
        height: 30px;
        background: #ef4444;
        border: 3px solid white;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        box-shadow: 0 4px 8px rgba(0,0,0,0.3);
      "></div>`,
      iconSize: [30, 30],
      iconAnchor: [15, 30],
    });

    // Add marker
    const marker = L.marker(defaultCenter, {
      icon: redIcon,
      draggable: true,
    }).addTo(map);

    markerRef.current = marker;

    // Handle marker drag
    marker.on("dragstart", () => {
      setIsDragging(true);
    });

    marker.on("drag", (e: any) => {
      const latlng = e.target.getLatLng();
      setDragPosition({ lat: latlng.lat, lng: latlng.lng });
    });

    marker.on("dragend", (e: any) => {
      const latlng = e.target.getLatLng();
      setIsDragging(false);
      setDragPosition(null);
      reverseGeocode(latlng.lat, latlng.lng);
      setHasUnsavedChanges(true);
    });

    setMapLoading(false);
  };

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      handleSearch();
    }, 500);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  // Forward geocoding with Nominatim
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setError(null);

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?` +
          `q=${encodeURIComponent(searchQuery)}&` +
          `format=jsonv2&` +
          `addressdetails=1&` +
          `limit=5`,
        {
          headers: {
            "User-Agent": "PinnacleRealty/1.0",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Search failed");
      }

      const data: SearchResult[] = await response.json();
      setSearchResults(data);
      setShowResults(data.length > 0);
    } catch (err) {
      console.error("Search error:", err);
      setError("Failed to search location. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };

  // Select search result
  const handleSelectResult = (result: SearchResult) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);

    // Update map
    if (mapInstanceRef.current && markerRef.current) {
      const L = (window as any).L;
      mapInstanceRef.current.setView([lat, lng], 15);
      markerRef.current.setLatLng([lat, lng]);
    }

    // Parse address
    const addr = result.address;
    const newLocation: LocationData = {
      latitude: lat,
      longitude: lng,
      formattedAddress: result.display_name,
      osmId: result.osm_id,
      osmType: result.osm_type,
      addressJson: addr,
      address1: addr.house_number
        ? `${addr.house_number} ${addr.road || ""}`
        : addr.road,
      city: addr.city || addr.town || addr.village,
      state: addr.state,
      country: addr.country,
      countryCode: addr.country_code,
      postalCode: addr.postcode,
    };

    setLocation(newLocation);
    setSearchQuery("");
    setShowResults(false);
    setHasUnsavedChanges(true);
  };

  // Reverse geocoding (coordinates to address)
  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      setError(null);
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?` +
          `lat=${lat}&` +
          `lon=${lng}&` +
          `format=jsonv2&` +
          `addressdetails=1`,
        {
          headers: {
            "User-Agent": "PinnacleRealty/1.0",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Reverse geocoding failed");
      }

      const data = await response.json();
      const addr = data.address || {};

      const newLocation: LocationData = {
        latitude: lat,
        longitude: lng,
        formattedAddress: data.display_name,
        osmId: data.osm_id,
        osmType: data.osm_type,
        addressJson: addr,
        address1: addr.house_number
          ? `${addr.house_number} ${addr.road || ""}`
          : addr.road,
        city: addr.city || addr.town || addr.village,
        state: addr.state,
        country: addr.country,
        countryCode: addr.country_code,
        postalCode: addr.postcode,
      };

      setLocation(newLocation);
    } catch (err) {
      console.error("Reverse geocoding error:", err);
      setError("Failed to get address from coordinates");
      // Still update coordinates even if geocoding fails
      setLocation((prev) => ({ ...prev, latitude: lat, longitude: lng }));
    }
  };

  // Get user's current location
  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      return;
    }

    setIsSearching(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        // Update map and marker
        if (mapInstanceRef.current && markerRef.current) {
          const L = (window as any).L;
          mapInstanceRef.current.setView([lat, lng], 15);
          markerRef.current.setLatLng([lat, lng]);
        }

        await reverseGeocode(lat, lng);
        setHasUnsavedChanges(true);
        setIsSearching(false);
      },
      (err) => {
        setError("Unable to get your location. Please check your permissions.");
        setIsSearching(false);
        console.error("Geolocation error:", err);
      }
    );
  };

  // Zoom controls
  const handleZoomIn = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomIn();
    }
  };

  const handleZoomOut = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomOut();
    }
  };

  const handleRecenter = () => {
    if (mapInstanceRef.current && location.latitude && location.longitude) {
      mapInstanceRef.current.setView(
        [location.latitude, location.longitude],
        15
      );
    }
  };

  // Save location
  const handleSave = () => {
    if (!location.latitude || !location.longitude) {
      setError("Please set a location on the map");
      return;
    }

    onChange(location);
    setHasUnsavedChanges(false);
    toast.success("Location saved successfully");
  };

  // Clear location
  const handleClear = () => {
    const clearedLocation: LocationData = {
      address1: "",
      address2: "",
      city: "",
      state: "",
      postalCode: "",
      country: "",
      countryCode: "",
      latitude: undefined,
      longitude: undefined,
      formattedAddress: "",
      osmId: "",
      osmType: "",
      addressJson: undefined,
    };

    setLocation(clearedLocation);
    onChange(clearedLocation); // Immediately notify parent
    setSearchQuery("");
    setSearchResults([]);
    setShowResults(false);
    setError(null);
    setHasUnsavedChanges(false);

    // Reset map to Melbourne, Australia default
    if (mapInstanceRef.current && markerRef.current) {
      const L = (window as any).L;
      const defaultCenter: [number, number] = [-37.8136, 144.9631];
      mapInstanceRef.current.setView(defaultCenter, 12);
      markerRef.current.setLatLng(defaultCenter);
    }

    toast.success("Location removed successfully");
  };

  // Remove location map (keep address fields)
  const handleRemoveLocation = () => {
    const locationWithoutMap: LocationData = {
      ...location,
      latitude: undefined,
      longitude: undefined,
    };
    
    setLocation(locationWithoutMap);
    onChange(locationWithoutMap); // Immediately notify parent
    setHasUnsavedChanges(false);

    // Reset map to Melbourne, Australia default
    if (mapInstanceRef.current && markerRef.current) {
      const L = (window as any).L;
      const defaultCenter: [number, number] = [-37.8136, 144.9631];
      mapInstanceRef.current.setView(defaultCenter, 12);
      markerRef.current.setLatLng(defaultCenter);
    }
    
    toast.success('Location map removed (address fields preserved)');
  };

  const hasLocation = Boolean(location.latitude && location.longitude);

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div>
        <h3 className="text-lg flex items-center gap-2 mb-2">
          <MapPinned className="h-5 w-5 text-green-600" />
          Property Location
        </h3>
        {showMap && (
          <p className="text-sm text-gray-500">
            Search or drag the pin. Data from{" "}
            <a
              href="https://www.openstreetmap.org"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              OpenStreetMap
            </a>
            /
            <a
              href="https://nominatim.openstreetmap.org"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              Nominatim
            </a>
            .
          </p>
        )}
        {!showMap && (
          <p className="text-sm text-gray-500">
            Enter the property address details below (map is hidden).
          </p>
        )}
      </div>

      {/* Error Alert */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Location Search */}
      {showMap && (
        <div className="space-y-3">
          <Label>Search Location</Label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 z-10" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search places (OpenStreetMap)..."
                className="pl-10 h-11"
                disabled={isSearching}
                onFocus={() => searchResults.length > 0 && setShowResults(true)}
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setShowResults(false);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}

              {/* Search Results Dropdown */}
              <AnimatePresence>
                {showResults && searchResults.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto"
                  >
                    {searchResults.map((result) => (
                      <button
                        key={result.place_id}
                        onClick={() => handleSelectResult(result)}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-0 transition-colors"
                      >
                        <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm truncate">
                              {result.display_name}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {result.address.city ||
                                result.address.town ||
                                result.address.village}
                              {result.address.country &&
                                `, ${result.address.country}`}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {isSearching && (
              <div className="h-11 px-4 flex items-center">
                <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
              </div>
            )}

            <Button
              type="button"
              variant="outline"
              onClick={handleUseMyLocation}
              disabled={isSearching}
              className="h-11"
            >
              <Navigation className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Use My Location</span>
            </Button>
          </div>
        </div>
      )}

      {/* Interactive Map */}
      {showMap && (
        <Card className="overflow-hidden shadow-lg">
          <CardContent className="p-0 relative">
            {mapLoading && (
              <Skeleton className="w-full h-[320px] md:h-[400px]" />
            )}

            {!hasLocation && !mapLoading && (
              <div className="absolute inset-0 z-10 bg-white/90 flex items-center justify-center">
                <div className="text-center p-8">
                  <MapPin className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h4 className="mb-2">No Location Set</h4>
                  <p className="text-sm text-gray-500 mb-4">
                    Search for a location or drag the pin on the map
                  </p>
                </div>
              </div>
            )}

            <div
              ref={mapRef}
              className="w-full h-[240px] md:h-[400px] bg-gray-100"
            />

            {/* Map Controls */}
            <div className="absolute top-4 right-4 flex flex-col gap-2 z-40">
              <Button
                type="button"
                size="icon"
                variant="secondary"
                onClick={handleZoomIn}
                className="shadow-lg bg-white hover:bg-gray-50 h-10 w-10"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="secondary"
                onClick={handleZoomOut}
                className="shadow-lg bg-white hover:bg-gray-50 h-10 w-10"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="secondary"
                onClick={handleRecenter}
                disabled={!hasLocation}
                className="shadow-lg bg-white hover:bg-gray-50 h-10 w-10"
              >
                <Crosshair className="h-4 w-4" />
              </Button>
            </div>

            {/* Drag Position Badge */}
            {isDragging && dragPosition && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 bg-black/80 text-white px-3 py-2 rounded-lg shadow-lg backdrop-blur">
                <p className="text-xs font-mono">
                  {dragPosition.lat.toFixed(6)}, {dragPosition.lng.toFixed(6)}
                </p>
              </div>
            )}

            {/* Helper Text */}
            {!isDragging && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-40 bg-white/95 backdrop-blur px-3 py-2 rounded-full shadow-lg">
                <p className="text-xs text-gray-600 flex items-center gap-2">
                  <MapPin className="h-3 w-3" />
                  Search or drag the pin to set location
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Address Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <Label htmlFor="address1">Address Line 1</Label>
          <Input
            id="address1"
            value={location.address1 || ""}
            onChange={(e) => {
              setLocation({ ...location, address1: e.target.value });
              setHasUnsavedChanges(true);
            }}
            placeholder="123 Main Street"
            className="h-11"
          />
          {!showMap && hasUnsavedChanges && (
            <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              Changes will be auto-saved...
            </p>
          )}
        </div>

        <div className="md:col-span-2">
          <Label htmlFor="address2">
            Address Line 2 <span className="text-gray-400">(Optional)</span>
          </Label>
          <Input
            id="address2"
            value={location.address2 || ""}
            onChange={(e) => {
              setLocation({ ...location, address2: e.target.value });
              setHasUnsavedChanges(true);
            }}
            placeholder="Apartment, suite, unit, building, floor, etc."
            className="h-11"
          />
        </div>

        <div>
          <Label htmlFor="city">City</Label>
          <Input
            id="city"
            value={location.city || ""}
            onChange={(e) => {
              setLocation({ ...location, city: e.target.value });
              setHasUnsavedChanges(true);
            }}
            placeholder="New York"
            className="h-11"
          />
        </div>

        <div>
          <Label htmlFor="state">State/Region</Label>
          <Input
            id="state"
            value={location.state || ""}
            onChange={(e) => {
              setLocation({ ...location, state: e.target.value });
              setHasUnsavedChanges(true);
            }}
            placeholder="NY"
            className="h-11"
          />
        </div>

        <div>
          <Label htmlFor="postalCode">Postal Code</Label>
          <Input
            id="postalCode"
            value={location.postalCode || ""}
            onChange={(e) => {
              setLocation({ ...location, postalCode: e.target.value });
              setHasUnsavedChanges(true);
            }}
            placeholder="10001"
            className="h-11"
          />
        </div>

        <div>
          <Label htmlFor="country">Country</Label>
          <Select
            value={location.countryCode || location.country || ""}
            onValueChange={(value) => {
              const country = COUNTRIES.find((c) => c.code === value);
              setLocation({
                ...location,
                countryCode: value,
                country: country?.name,
              });
              setHasUnsavedChanges(true);
            }}
          >
            <SelectTrigger className="h-11">
              <SelectValue placeholder="Select country" />
            </SelectTrigger>
            <SelectContent>
              {COUNTRIES.map((country) => (
                <SelectItem key={country.code} value={country.code}>
                  {country.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Read-only Computed Fields */}
      {hasLocation && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200"
        >
          <div>
            <Label className="text-xs text-gray-500">Latitude</Label>
            <p className="font-mono text-sm">
              {location.latitude?.toFixed(6) || "—"}
            </p>
          </div>
          <div>
            <Label className="text-xs text-gray-500">Longitude</Label>
            <p className="font-mono text-sm">
              {location.longitude?.toFixed(6) || "—"}
            </p>
          </div>
          <div className="md:col-span-2">
            <Label className="text-xs text-gray-500">Formatted Address</Label>
            <p className="text-sm">{location.formattedAddress || "—"}</p>
          </div>
          {location.osmId && (
            <div className="md:col-span-2">
              <Label className="text-xs text-gray-500">
                OSM ID / Type
              </Label>
              <p className="font-mono text-xs text-gray-600">
                {location.osmId} ({location.osmType})
              </p>
            </div>
          )}
        </motion.div>
      )}

      {/* Actions */}
      {showMap && (
        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t sticky bottom-0 bg-white pb-4 sm:pb-0">
          <Button
            type="button"
            onClick={handleSave}
            disabled={!hasLocation || !hasUnsavedChanges}
            className="flex-1 sm:flex-initial h-11 bg-green-600 hover:bg-green-700 shadow-lg"
          >
            <MapPin className="h-4 w-4 mr-2" />
            Save Location
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleRemoveLocation}
            className="h-11"
          >
            <X className="h-4 w-4 mr-2" />
            Remove Location
          </Button>
          {hasUnsavedChanges && (
            <span className="text-xs text-amber-600 flex items-center gap-1 self-center">
              <AlertCircle className="h-3 w-3" />
              Unsaved changes
            </span>
          )}
        </div>
      )}
    </div>
  );
}