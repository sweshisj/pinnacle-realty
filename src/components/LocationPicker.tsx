/**
 * @deprecated Use PropertyLocationPicker instead.
 * This component is kept for backwards compatibility only.
 * 
 * See: /components/PropertyLocationPicker.tsx
 * Guide: /OPENSTREETMAP_LOCATION_GUIDE.md
 */
import { useState, useEffect } from 'react';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { MapPin, Search } from 'lucide-react';

interface LocationPickerProps {
  address: string;
  coordinates: { lat: number; lng: number } | null;
  onLocationChange: (address: string, coordinates: { lat: number; lng: number } | null) => void;
}

export function LocationPicker({ address, coordinates, onLocationChange }: LocationPickerProps) {
  const [localAddress, setLocalAddress] = useState(address);
  const [lat, setLat] = useState(coordinates?.lat?.toString() || '');
  const [lng, setLng] = useState(coordinates?.lng?.toString() || '');

  useEffect(() => {
    setLocalAddress(address);
    setLat(coordinates?.lat?.toString() || '');
    setLng(coordinates?.lng?.toString() || '');
  }, [address, coordinates]);

  const handleAddressChange = (newAddress: string) => {
    setLocalAddress(newAddress);
    onLocationChange(newAddress, coordinates);
  };

  const handleCoordinatesChange = () => {
    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    
    if (!isNaN(latNum) && !isNaN(lngNum)) {
      onLocationChange(localAddress, { lat: latNum, lng: lngNum });
    } else {
      onLocationChange(localAddress, null);
    }
  };

  const geocodeAddress = async () => {
    if (!localAddress.trim()) {
      alert('Please enter an address first');
      return;
    }

    // For now, we use manual coordinate entry
    // In production, you can integrate with Google Geocoding API or Nominatim
    alert('Address search requires a geocoding API. Please enter coordinates manually below or use the map preview to verify the location.');
    
    // Optionally, you can implement Nominatim (free) geocoding here:
    /*
    try {
      const encodedAddress = encodeURIComponent(localAddress);
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}`
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          const location = data[0];
          setLat(location.lat);
          setLng(location.lon);
          onLocationChange(localAddress, { lat: parseFloat(location.lat), lng: parseFloat(location.lon) });
        } else {
          alert('Address not found. Please enter coordinates manually.');
        }
      }
    } catch (error) {
      console.error('Geocoding failed:', error);
      alert('Geocoding failed. Please enter coordinates manually.');
    }
    */
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg">
      <div className="space-y-2">
        <Label htmlFor="map-address">Project Location Address</Label>
        <div className="flex gap-2">
          <Input
            id="map-address"
            value={localAddress}
            onChange={(e) => handleAddressChange(e.target.value)}
            placeholder="Enter full address"
          />
          <Button
            type="button"
            variant="outline"
            onClick={geocodeAddress}
            title="Find coordinates from address"
          >
            <Search className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Enter the complete address for the project location
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="latitude">Latitude</Label>
          <Input
            id="latitude"
            type="number"
            step="any"
            value={lat}
            onChange={(e) => setLat(e.target.value)}
            onBlur={handleCoordinatesChange}
            placeholder="e.g., 12.9716"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="longitude">Longitude</Label>
          <Input
            id="longitude"
            type="number"
            step="any"
            value={lng}
            onChange={(e) => setLng(e.target.value)}
            onBlur={handleCoordinatesChange}
            placeholder="e.g., 77.5946"
          />
        </div>
      </div>

      {coordinates && (
        <div className="mt-4">
          <Label className="mb-2 block">Map Preview</Label>
          <div className="border rounded-lg overflow-hidden h-64">
            <iframe
              width="100%"
              height="100%"
              frameBorder="0"
              style={{ border: 0 }}
              src={`https://maps.google.com/maps?q=${coordinates.lat},${coordinates.lng}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
              allowFullScreen
            />
          </div>
          <p className="text-sm text-muted-foreground mt-2 flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            Location: {coordinates.lat.toFixed(6)}, {coordinates.lng.toFixed(6)}
          </p>
        </div>
      )}
    </div>
  );
}