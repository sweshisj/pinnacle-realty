import React, { useEffect } from 'react';
import { MapPin } from 'lucide-react';

interface LocationDisplayProps {
  address?: string;
  coordinates?: { lat: number; lng: number } | null;
}

export function LocationDisplay({ address, coordinates }: LocationDisplayProps) {
  // Don't render anything if no location data is provided
  if (!address && !coordinates) {
    return null;
  }

  // Don't render map if coordinates are invalid (0,0 or null)
  const hasValidCoordinates = coordinates && 
    coordinates.lat !== 0 && 
    coordinates.lng !== 0 &&
    !isNaN(coordinates.lat) &&
    !isNaN(coordinates.lng);

  useEffect(() => {
    if (!hasValidCoordinates) return;

    // Dynamically load Leaflet CSS
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    // Dynamically load Leaflet JS
    const loadLeaflet = async () => {
      if (typeof window !== 'undefined' && !(window as any).L) {
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.async = true;
        
        await new Promise((resolve) => {
          script.onload = resolve;
          document.head.appendChild(script);
        });
      }

      // Initialize map
      const mapContainer = document.getElementById('location-map-display');
      if (mapContainer && (window as any).L && coordinates) {
        // Clear any existing map
        mapContainer.innerHTML = '';
        
        const L = (window as any).L;
        const map = L.map('location-map-display').setView([coordinates.lat, coordinates.lng], 15);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 19,
        }).addTo(map);

        // Add marker
        const marker = L.marker([coordinates.lat, coordinates.lng]).addTo(map);
        
        if (address) {
          marker.bindPopup(address).openPopup();
        }
      }
    };

    loadLeaflet();
  }, [coordinates, address, hasValidCoordinates]);

  return (
    <div className="space-y-4">
      {address && (
        <div className="flex items-start gap-2">
          <MapPin className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="mb-1">Address</h4>
            <p className="text-gray-600">{address}</p>
          </div>
        </div>
      )}

      {hasValidCoordinates && (
        <div className="rounded-lg overflow-hidden border border-gray-200">
          <div id="location-map-display" style={{ height: '400px', width: '100%' }} />
        </div>
      )}
    </div>
  );
}
