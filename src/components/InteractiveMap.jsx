import { useEffect, useRef, useState } from 'react';
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
  showRoute = false,
  height = '480px',
  onLocationFound,
}) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const polylineRef = useRef(null);
  const gpsMarkerRef = useRef(null);
  const [gpsLoading, setGpsLoading] = useState(false);

  // Initialize Map
  useEffect(() => {
    if (!mapRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapRef.current, {
        center: center,
        zoom: zoom,
        zoomControl: false,
        scrollWheelZoom: true,
      });

      // OpenStreetMap Tiles (100% Free, Zero Watermark, No API Key Required)
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
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

  // Update Markers and Polyline Route when spots or userLocation change
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear old markers & polylines
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];
    if (polylineRef.current) {
      if (Array.isArray(polylineRef.current)) {
        polylineRef.current.forEach((p) => p.remove());
      } else {
        polylineRef.current.remove();
      }
      polylineRef.current = null;
    }

    const routeLatLngs = [];

    // User / Hub Starting Marker
    if (userLocation && userLocation.lat && userLocation.lon) {
      routeLatLngs.push([userLocation.lat, userLocation.lon]);

      const userIcon = L.divIcon({
        className: 'custom-user-marker',
        html: `
          <div style="position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center;">
            <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 38px; height: 38px;">
              <div style="position: absolute; width: 38px; height: 38px; border-radius: 9999px; background-color: rgba(11, 59, 244, 0.25); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
              <div style="width: 28px; height: 28px; border-radius: 9999px; background-color: #0B3BF4; border: 2.5px solid #000; box-shadow: 0 3px 0 0 #000; display: flex; align-items: center; justify-content: center; color: white; font-size: 13px; font-weight: 900;">
                🏁
              </div>
            </div>
            <div style="width: 0; height: 0; border-left: 5px solid transparent; border-right: 5px solid transparent; border-top: 5px solid #000000; margin-top: -3px;"></div>
          </div>
        `,
        iconSize: [38, 44],
        iconAnchor: [19, 44],
      });

      const userMarker = L.marker([userLocation.lat, userLocation.lon], { icon: userIcon })
        .addTo(map)
        .bindPopup(`<b>${userLocation.label || 'Starting Station'}</b><br/>Safe Return Hub`);
      markersRef.current.push(userMarker);
    }

    // Spot Markers
    spots.forEach((spot, idx) => {
      if (!spot.lat || !spot.lng) return;
      routeLatLngs.push([spot.lat, spot.lng]);

      const isSelected = selectedSpot && (selectedSpot.id === spot.id || selectedSpot.name === spot.name);
      const priceText = spot.expense === 0 ? 'FREE' : (spot.expense ? `₹${spot.expense}` : (spot.fare ? `₹${spot.fare}` : 'FREE'));

      const spotIcon = L.divIcon({
        className: 'custom-spot-marker',
        html: `
          <div style="position: relative; display: flex; flex-direction: column; align-items: center;">
            <div style="
              display: flex;
              align-items: center;
              gap: 6px;
              background: #ffffff;
              border: 2.5px solid #000000;
              border-radius: 16px;
              padding: 3px 8px 3px 3px;
              box-shadow: ${isSelected ? '0 4px 0 0 #0B3BF4' : '0 3px 0 0 #000000'};
              transform: ${isSelected ? 'scale(1.12)' : 'scale(1)'};
              transition: transform 0.15s ease;
              cursor: pointer;
              white-space: nowrap;
            ">
              ${showRoute ? `
                <div style="
                  width: 22px;
                  height: 22px;
                  border-radius: 9999px;
                  background-color: ${isSelected ? '#EF4444' : '#0B3BF4'};
                  color: #ffffff;
                  border: 2px solid #000000;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  font-size: 11px;
                  font-weight: 900;
                  flex-shrink: 0;
                  box-shadow: 0 1px 0 0 #000;
                ">
                  ${idx + 1}
                </div>
              ` : ''}
              <img src="${spot.photo || spot.photos?.[0] || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=200&q=80'}" style="width: 28px; height: 28px; border-radius: 10px; object-fit: cover; border: 1.5px solid #000;" />
              <div style="display: flex; flex-direction: column; line-height: 1.15; max-width: 140px; overflow: hidden;">
                <span style="font-size: 11px; font-weight: 900; color: #000000; overflow: hidden; text-overflow: ellipsis;">${spot.name}</span>
                <span style="font-size: 9px; font-weight: 800; color: ${priceText === 'FREE' ? '#059669' : '#D97706'};">
                  ${priceText} • ★${spot.rating || 4.7}
                </span>
              </div>
            </div>
            <div style="
              width: 0;
              height: 0;
              border-left: 6px solid transparent;
              border-right: 6px solid transparent;
              border-top: 6px solid #000000;
              margin-top: -1px;
            "></div>
          </div>
        `,
        iconSize: [showRoute ? 170 : 150, 44],
        iconAnchor: [showRoute ? 85 : 75, 44],
      });

      const marker = L.marker([spot.lat, spot.lng], { icon: spotIcon }).addTo(map);

      marker.on('click', () => {
        if (onSelectSpot) onSelectSpot(spot);
        map.flyTo([spot.lat, spot.lng], 15, { duration: 0.8 });
      });

      markersRef.current.push(marker);
    });

    // Draw route polyline with cartoon double-stroke casing
    if (showRoute && routeLatLngs.length > 1) {
      if (userLocation && userLocation.lat && userLocation.lon) {
        // Complete the loop back to starting hub
        routeLatLngs.push([userLocation.lat, userLocation.lon]);
      }

      // Outer cartoon casing (thick black outline)
      const casingPolyline = L.polyline(routeLatLngs, {
        color: '#000000',
        weight: 8,
        opacity: 0.9,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(map);

      // Inner cartoon dashed path (vibrant blue comic dashed line)
      const innerPolyline = L.polyline(routeLatLngs, {
        color: '#0B3BF4',
        weight: 4.5,
        dashArray: '10, 10',
        opacity: 1,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(map);

      polylineRef.current = [casingPolyline, innerPolyline];

      // Fit bounds to show entire route with breathing room
      try {
        const bounds = innerPolyline.getBounds();
        if (bounds.isValid()) {
          map.fitBounds(bounds, { padding: [55, 55], maxZoom: 15 });
        }
      } catch {}
    }
  }, [spots, selectedSpot, userLocation, onSelectSpot, showRoute]);

  // Recenter map on user location
  const handleRecenter = () => {
    if (mapInstanceRef.current && userLocation?.lat && userLocation?.lon) {
      mapInstanceRef.current.flyTo([userLocation.lat, userLocation.lon], 14, { duration: 0.8 });
    }
  };

  // Live GPS tracking
  const handleLocateGPS = () => {
    if (!navigator.geolocation) {
      alert('GPS is not supported by your browser');
      return;
    }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsLoading(false);
        const { latitude, longitude } = pos.coords;
        const map = mapInstanceRef.current;
        if (!map) return;

        if (gpsMarkerRef.current) gpsMarkerRef.current.remove();

        const liveIcon = L.divIcon({
          className: 'live-gps-marker',
          html: `
            <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 32px; height: 32px;">
              <div style="position: absolute; width: 32px; height: 32px; border-radius: 9999px; background-color: rgba(16, 185, 129, 0.35); animation: ping 1.2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
              <div style="width: 18px; height: 18px; border-radius: 9999px; background-color: #10B981; border: 2.5px solid #ffffff; box-shadow: 0 0 10px #10B981;"></div>
            </div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });

        const m = L.marker([latitude, longitude], { icon: liveIcon })
          .addTo(map)
          .bindPopup('<b>📍 Your Live Location</b><br/>Real-time GPS Active');
        gpsMarkerRef.current = m;

        map.flyTo([latitude, longitude], 15, { duration: 0.8 });
        onLocationFound?.({ lat: latitude, lon: longitude });
      },
      (err) => {
        setGpsLoading(false);
        console.warn('GPS location error:', err);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  return (
    <div
      style={{ height }}
      className="cartoon-map-wrapper relative w-full rounded-3xl overflow-hidden border-[3px] border-black shadow-[0_4px_0_0_#000000] bg-[#e5e7eb]"
    >
      <style>{`
        .cartoon-map-wrapper .leaflet-tile-pane {
          filter: saturate(1.55) contrast(1.16) brightness(1.03) hue-rotate(-2deg);
        }
        .cartoon-map-wrapper .leaflet-bar {
          border: 2.5px solid #000000 !important;
          border-radius: 14px !important;
          box-shadow: 0 3px 0 0 #000000 !important;
          overflow: hidden !important;
          background: #ffffff !important;
        }
        .cartoon-map-wrapper .leaflet-bar a {
          background-color: #ffffff !important;
          border-bottom: 2px solid #000000 !important;
          color: #000000 !important;
          font-weight: 900 !important;
          font-size: 16px !important;
          line-height: 28px !important;
        }
        .cartoon-map-wrapper .leaflet-bar a:hover {
          background-color: #FEF08A !important;
        }
      `}</style>
      <div ref={mapRef} className="w-full h-full z-0" />

      {/* Cartoon Compass Rose Badge */}
      <div className="absolute top-3 right-12 z-[400] bg-white border-[2px] border-black rounded-full px-2 py-0.5 text-[9px] font-black shadow-[0_2px_0_0_#000000] flex items-center gap-1 select-none pointer-events-none">
        <span>🧭</span>
        <span className="text-red-600">N</span>
      </div>

      {/* Floating GPS and Recenter Buttons */}
      <div className="absolute bottom-4 right-4 z-[400] flex items-center gap-2">
        <button
          type="button"
          onClick={handleLocateGPS}
          disabled={gpsLoading}
          className="bg-white border-[2px] border-black rounded-2xl p-2.5 shadow-[0_3px_0_0_#000000] flex items-center gap-1.5 text-xs font-black active:translate-y-0.5 hover:bg-emerald-50 text-emerald-800 transition cursor-pointer"
          title="Track Live GPS Location"
        >
          <span className={`w-2 h-2 rounded-full bg-emerald-500 inline-block ${gpsLoading ? 'animate-spin' : 'animate-ping'}`} />
          <span>{gpsLoading ? 'Locating...' : 'My GPS'}</span>
        </button>

        <button
          type="button"
          onClick={handleRecenter}
          className="bg-white border-[2px] border-black rounded-2xl p-2.5 shadow-[0_3px_0_0_#000000] flex items-center gap-1.5 text-xs font-black active:translate-y-0.5 hover:bg-gray-50 transition cursor-pointer"
        >
          <Navigation size={14} className="text-[#0B3BF4]" strokeWidth={2.5} />
          <span>Recenter</span>
        </button>
      </div>

      {/* Attribution / OpenStreetMap pill */}
      <div className="absolute top-3 left-3 z-[400] bg-white/95 backdrop-blur border-[2px] border-black rounded-full px-2.5 py-1 text-[10px] font-black shadow-[0_2px_0_0_#000000] flex items-center gap-1.5">
        <MapPin size={11} className="text-[#F59E0B]" strokeWidth={2.5} />
        <span>{showRoute ? 'Interactive Cartoon Route' : 'Live Cartoon Map'}</span>
      </div>
    </div>
  );
}
