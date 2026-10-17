import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Navigation, MapPin } from 'lucide-react';

export default function InteractiveMap({
  center = [10.7606, 76.2711],
  zoom = 14,
  spots = [],
  selectedSpot = null,
  onSelectSpot,
  userLocation,
}) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);

  // Initialize Map
  useEffect(() => {
    if (!mapRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapRef.current, {
        center: center,
        zoom: zoom,
        zoomControl: false,
      });

      // Free OpenStreetMap Tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors',
      }).addTo(map);

      // Top-right custom zoom control
      L.control.zoom({ position: 'topright' }).addTo(map);

      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Markers when spots or userLocation change
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear old markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    // User / Hub Marker
    if (userLocation && userLocation.lat && userLocation.lon) {
      const userIcon = L.divIcon({
        className: 'custom-user-marker',
        html: `
          <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 34px; height: 34px;">
            <div style="position: absolute; width: 34px; height: 34px; border-radius: 9999px; background-color: rgba(11, 59, 244, 0.25); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div style="width: 24px; height: 24px; border-radius: 9999px; background-color: #0B3BF4; border: 2.5px solid #000; box-shadow: 0 2px 0 0 #000; display: flex; align-items: center; justify-content: center; color: white; font-size: 11px; font-weight: 900;">
              📍
            </div>
          </div>
        `,
        iconSize: [34, 34],
        iconAnchor: [17, 17],
      });

      const userMarker = L.marker([userLocation.lat, userLocation.lon], { icon: userIcon })
        .addTo(map)
        .bindPopup(`<b>${userLocation.label || 'Your Location'}</b><br/>Shoranur Jn Hub`);
      markersRef.current.push(userMarker);
    }

    // Spot Markers
    spots.forEach((spot) => {
      const isSelected = selectedSpot && (selectedSpot.id === spot.id || selectedSpot.name === spot.name);

      const spotIcon = L.divIcon({
        className: 'custom-spot-marker',
        html: `
          <div style="
            display: flex;
            align-items: center;
            gap: 4px;
            background: #ffffff;
            border: 2px solid #000000;
            border-radius: 12px;
            padding: 2px 6px 2px 2px;
            box-shadow: ${isSelected ? '0 4px 0 0 #0B3BF4' : '0 2px 0 0 #000000'};
            transform: ${isSelected ? 'scale(1.12)' : 'scale(1)'};
            transition: transform 0.15s ease;
            cursor: pointer;
            white-space: nowrap;
          ">
            <img src="${spot.photo}" style="width: 22px; height: 22px; border-radius: 8px; object-fit: cover; border: 1.5px solid #000;" />
            <div style="display: flex; flex-direction: column; line-height: 1.1;">
              <span style="font-size: 11px; font-weight: 900; color: #000000;">${spot.name}</span>
              <span style="font-size: 9px; font-weight: 800; color: ${spot.expense === 0 ? '#10B981' : '#F59E0B'};">
                ${spot.expense === 0 ? 'FREE' : '₹' + spot.expense} • ★${spot.rating || 4.5}
              </span>
            </div>
          </div>
        `,
        iconSize: [120, 36],
        iconAnchor: [60, 18],
      });

      const marker = L.marker([spot.lat, spot.lng], { icon: spotIcon }).addTo(map);

      marker.on('click', () => {
        if (onSelectSpot) onSelectSpot(spot);
        map.flyTo([spot.lat, spot.lng], 15, { duration: 0.8 });
      });

      markersRef.current.push(marker);
    });
  }, [spots, selectedSpot, userLocation, onSelectSpot]);

  // Automatically fly to new city hub when location changes
  useEffect(() => {
    if (mapInstanceRef.current && userLocation?.lat && userLocation?.lon) {
      mapInstanceRef.current.flyTo([userLocation.lat, userLocation.lon], 13, { duration: 0.8 });
    }
  }, [userLocation?.lat, userLocation?.lon]);

  // Recenter map on user location
  const handleRecenter = () => {
    if (mapInstanceRef.current && userLocation?.lat && userLocation?.lon) {
      mapInstanceRef.current.flyTo([userLocation.lat, userLocation.lon], 14, { duration: 0.8 });
    }
  };

  return (
    <div className="relative w-full h-[480px] rounded-3xl overflow-hidden border-[2.5px] border-black shadow-[0_4px_0_0_#000000] bg-[#e5e7eb]">
      <div ref={mapRef} className="w-full h-full z-0" />

      {/* Recenter Floating Button */}
      <button
        onClick={handleRecenter}
        className="absolute bottom-4 right-4 z-[400] bg-white border-[2px] border-black rounded-2xl p-2.5 shadow-[0_3px_0_0_#000000] flex items-center gap-1.5 text-xs font-black active:translate-y-0.5 hover:bg-gray-50 transition"
      >
        <Navigation size={14} className="text-[#0B3BF4]" strokeWidth={2.5} />
        <span>Recenter</span>
      </button>

      {/* Attribution / OpenStreetMap pill */}
      <div className="absolute top-3 left-3 z-[400] bg-white/95 backdrop-blur border-[2px] border-black rounded-full px-2.5 py-1 text-[10px] font-black shadow-[0_2px_0_0_#000000] flex items-center gap-1">
        <MapPin size={11} className="text-[#F59E0B]" strokeWidth={2.5} />
        <span>Live OpenStreetMap</span>
      </div>
    </div>
  );
}
