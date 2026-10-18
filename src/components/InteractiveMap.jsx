import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Navigation, MapPin, Layers, Sparkles } from 'lucide-react';

const AVADA_TILE_PROVIDERS = {
  standard: {
    name: 'Standard OSM',
    icon: '🗺️',
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    options: {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors',
    },
  },
  humanitarian: {
    name: 'Avada Pastel',
    icon: '🌿',
    url: 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
    options: {
      maxZoom: 19,
      subdomains: 'abc',
      attribution: '© OpenStreetMap contributors, HOT',
    },
  },
  topo: {
    name: 'Avada Topo',
    icon: '⛰️',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    options: {
      maxZoom: 17,
      subdomains: 'abc',
      attribution: 'Map: © OpenStreetMap, SRTM | © OpenTopoMap',
    },
  },
};

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
  const tileLayerRef = useRef(null);
  const markersRef = useRef([]);
  const polylineRef = useRef(null);
  const gpsMarkerRef = useRef(null);
  const prevSpotsKeyRef = useRef('');
  const [gpsLoading, setGpsLoading] = useState(false);
  const [mapLoading, setMapLoading] = useState(true);
  const [mapStyle, setMapStyle] = useState(
    () => localStorage.getItem('avada_map_style') || 'standard'
  );
  const [showStyleMenu, setShowStyleMenu] = useState(false);
  const [currentZoom, setCurrentZoom] = useState(() => zoom || 12);

  // Sync style changes from Settings modal
  useEffect(() => {
    const handleStyleChange = (e) => {
      if (e.detail && AVADA_TILE_PROVIDERS[e.detail]) {
        setMapStyle(e.detail);
      }
    };
    window.addEventListener('avada_map_style_changed', handleStyleChange);
    return () => window.removeEventListener('avada_map_style_changed', handleStyleChange);
  }, []);

  // Smooth map loading overlay
  useEffect(() => {
    setMapLoading(true);
    const t = setTimeout(() => setMapLoading(false), 800);
    return () => clearTimeout(t);
  }, [center?.[0], center?.[1], spots.length]);

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

      // Track zoom level dynamically
      map.on('zoomend', () => {
        setCurrentZoom(map.getZoom());
      });

      // Avada OpenStreetMap Tile Layer (100% Free, Zero API Key, Zero Watermarks)
      const provider = AVADA_TILE_PROVIDERS[mapStyle] || AVADA_TILE_PROVIDERS.standard;
      const tileLayer = L.tileLayer(provider.url, provider.options).addTo(map);
      tileLayerRef.current = tileLayer;

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

  // Update Tile Layer dynamically when style changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      tileLayerRef.current.remove();
    }

    const provider = AVADA_TILE_PROVIDERS[mapStyle] || AVADA_TILE_PROVIDERS.standard;
    const newTileLayer = L.tileLayer(provider.url, provider.options).addTo(map);
    tileLayerRef.current = newTileLayer;
    localStorage.setItem('avada_map_style', mapStyle);
  }, [mapStyle]);

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

    const prevSpotsKey = spots.map((s) => s.id || s.name).join(',');
    const shouldFitBounds = prevSpotsKeyRef.current !== prevSpotsKey;
    prevSpotsKeyRef.current = prevSpotsKey;

    // Spot Markers with Dynamic Multi-Level Zoom Scaling
    spots.forEach((spot, idx) => {
      if (!spot.lat || !spot.lng) return;
      routeLatLngs.push([spot.lat, spot.lng]);

      const isSelected = selectedSpot && (selectedSpot.id === spot.id || selectedSpot.name === spot.name);
      const priceText = spot.expense === 0 ? 'FREE' : (spot.expense ? `₹${spot.expense}` : (spot.fare ? `₹${spot.fare}` : 'FREE'));
      const cat = (spot.category || '').toLowerCase();
      let pinColor = isSelected ? '#EF4444' : (showRoute ? '#0B3BF4' : '#0B3BF4');
      if (cat.includes('hidden')) pinColor = isSelected ? '#EF4444' : '#10B981';
      else if (cat.includes('food')) pinColor = isSelected ? '#EF4444' : '#F97316';
      else if (cat.includes('game') || cat.includes('gaming')) pinColor = isSelected ? '#EF4444' : '#8B5CF6';
      else if (cat.includes('party') || cat.includes('night')) pinColor = isSelected ? '#EF4444' : '#EC4899';

      let spotIcon;

      // ── LEVEL 1: Zoom < 8.5 (State-wide / South India view) ──
      if (currentZoom < 8.5) {
        if (!showRoute) {
          // Explore Mode: Minimalist 7px dot pin so all-Kerala view remains clean
          spotIcon = L.divIcon({
            className: 'custom-spot-marker-dot',
            html: `
              <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 12px; height: 12px; cursor: pointer;">
                <div style="width: 7px; height: 7px; border-radius: 9999px; background: ${pinColor}; border: 1.5px solid #000; box-shadow: 0 1px 0 0 #000; transition: transform 0.15s ease; ${isSelected ? 'transform: scale(1.6); background: #EF4444;' : ''}"></div>
              </div>
            `,
            iconSize: [12, 12],
            iconAnchor: [6, 6],
          });
        } else {
          // Plan Mode: Minimal numbered pill
          spotIcon = L.divIcon({
            className: 'custom-spot-marker-pill',
            html: `
              <div style="width: 18px; height: 18px; border-radius: 9999px; background: ${isSelected ? '#EF4444' : '#0B3BF4'}; border: 2px solid #000; color: #fff; font-size: 9px; font-weight: 900; display: flex; align-items: center; justify-content: center; box-shadow: 0 1.5px 0 0 #000; cursor: pointer;">
                ${idx + 1}
              </div>
            `,
            iconSize: [18, 18],
            iconAnchor: [9, 9],
          });
        }
      }
      // ── LEVEL 2: 8.5 <= Zoom < 11.0 (Between State and District view) ──
      else if (currentZoom < 11.0) {
        spotIcon = L.divIcon({
          className: 'custom-spot-marker-mini',
          html: `
            <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer;">
              <div style="
                position: relative;
                width: 32px;
                background: #ffffff;
                border: 1.5px solid #000000;
                border-radius: 8px;
                padding: 2px;
                box-shadow: ${isSelected ? '0 2.5px 0 0 #EF4444' : '0 2px 0 0 #000000'};
                transform: ${isSelected ? 'scale(1.2)' : 'scale(1)'};
                display: flex;
                flex-direction: column;
                align-items: center;
              ">
                <div style="
                  position: absolute;
                  top: -6px;
                  left: 50%;
                  transform: translateX(-50%);
                  width: 14px;
                  height: 14px;
                  border-radius: 9999px;
                  background: ${pinColor};
                  border: 1px solid #000000;
                  color: #ffffff;
                  font-size: 8px;
                  font-weight: 900;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  z-index: 10;
                ">
                  ${idx + 1}
                </div>
                <div style="width: 26px; height: 18px; border-radius: 5px; overflow: hidden; border: 1px solid #000; margin-top: 4px; background: #f1f5f9;">
                  <img src="${spot.photo || spot.photos?.[0] || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=200&q=80'}" style="width: 100%; height: 100%; object-fit: cover;" />
                </div>
              </div>
              <div style="width: 0; height: 0; border-left: 4px solid transparent; border-right: 4px solid transparent; border-top: 4px solid #000000; margin-top: -1px;"></div>
            </div>
          `,
          iconSize: [32, 42],
          iconAnchor: [16, 42],
        });
      }
      // ── LEVEL 3: 11.0 <= Zoom < 13.5 (District / City Hub view) ──
      else if (currentZoom < 13.5) {
        spotIcon = L.divIcon({
          className: 'custom-spot-marker-med',
          html: `
            <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer;">
              <div style="
                position: relative;
                width: 48px;
                background: #ffffff;
                border: 2px solid #000000;
                border-radius: 10px;
                padding: 2px 2px 1px 2px;
                box-shadow: ${isSelected ? '0 3px 0 0 #EF4444' : '0 2px 0 0 #000000'};
                transform: ${isSelected ? 'scale(1.15)' : 'scale(1)'};
                display: flex;
                flex-direction: column;
                align-items: center;
              ">
                <div style="
                  position: absolute;
                  top: -7px;
                  left: 50%;
                  transform: translateX(-50%);
                  width: 16px;
                  height: 16px;
                  border-radius: 9999px;
                  background: ${pinColor};
                  border: 1.5px solid #000000;
                  color: #ffffff;
                  font-size: 8px;
                  font-weight: 900;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  z-index: 10;
                ">
                  ${idx + 1}
                </div>
                <div style="width: 42px; height: 30px; border-radius: 6px; overflow: hidden; border: 1px solid #000; margin-top: 4px; background: #f1f5f9;">
                  <img src="${spot.photo || spot.photos?.[0] || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=200&q=80'}" style="width: 100%; height: 100%; object-fit: cover;" />
                </div>
                <div style="width: 100%; text-align: center; margin-top: 1px; line-height: 1.1; padding: 0 1px;">
                  <div style="font-size: 7px; font-weight: 900; color: #000; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                    ${spot.name}
                  </div>
                  <div style="font-size: 6px; font-weight: 800; color: ${priceText === 'FREE' ? '#059669' : '#D97706'};">
                    ${priceText}
                  </div>
                </div>
              </div>
              <div style="width: 0; height: 0; border-left: 4.5px solid transparent; border-right: 4.5px solid transparent; border-top: 4.5px solid #000000; margin-top: -1px;"></div>
            </div>
          `,
          iconSize: [48, 62],
          iconAnchor: [24, 62],
        });
      }
      // ── LEVEL 4: Zoom >= 13.5 (Local Neighborhood / Street view) ──
      else {
        spotIcon = L.divIcon({
          className: 'custom-spot-marker-large',
          html: `
            <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer;">
              <div style="
                position: relative;
                width: 66px;
                background: #ffffff;
                border: 2.5px solid #000000;
                border-radius: 12px;
                padding: 3px 3px 2px 3px;
                box-shadow: ${isSelected ? '0 4px 0 0 #EF4444' : '0 3px 0 0 #000000'};
                transform: ${isSelected ? 'scale(1.15)' : 'scale(1)'};
                display: flex;
                flex-direction: column;
                align-items: center;
              ">
                <div style="
                  position: absolute;
                  top: -9px;
                  left: 50%;
                  transform: translateX(-50%);
                  width: 19px;
                  height: 19px;
                  border-radius: 9999px;
                  background: ${pinColor};
                  border: 1.5px solid #000000;
                  color: #ffffff;
                  font-size: 9px;
                  font-weight: 900;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  z-index: 10;
                ">
                  ${idx + 1}
                </div>
                <div style="width: 58px; height: 44px; border-radius: 8px; overflow: hidden; border: 1.5px solid #000; margin-top: 5px; background: #f1f5f9;">
                  <img src="${spot.photo || spot.photos?.[0] || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=200&q=80'}" style="width: 100%; height: 100%; object-fit: cover;" />
                </div>
                <div style="width: 100%; text-align: center; margin-top: 2px; line-height: 1.15; padding: 0 1px;">
                  <div style="font-size: 8px; font-weight: 900; color: #000; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                    ${spot.name}
                  </div>
                  <div style="font-size: 7px; font-weight: 800; color: ${priceText === 'FREE' ? '#059669' : '#D97706'};">
                    ${priceText}
                  </div>
                </div>
              </div>
              <div style="width: 0; height: 0; border-left: 5px solid transparent; border-right: 5px solid transparent; border-top: 5px solid #000000; margin-top: -1px;"></div>
            </div>
          `,
          iconSize: [66, 82],
          iconAnchor: [33, 82],
        });
      }

      const marker = L.marker([spot.lat, spot.lng], { icon: spotIcon }).addTo(map);

      marker.on('click', () => {
        if (onSelectSpot) onSelectSpot(spot);
        const targetZoom = currentZoom < 11.5 ? 14 : currentZoom;
        map.flyTo([spot.lat, spot.lng], targetZoom, { duration: 0.8 });
      });

      markersRef.current.push(marker);
    });

    // Draw route polyline with cartoon double-stroke casing (only when showRoute is enabled)
    if (showRoute && routeLatLngs.length > 1) {
      if (userLocation && userLocation.lat && userLocation.lon) {
        routeLatLngs.push([userLocation.lat, userLocation.lon]);
      }

      const casingPolyline = L.polyline(routeLatLngs, {
        color: '#000000',
        weight: 8,
        opacity: 0.9,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(map);

      const innerPolyline = L.polyline(routeLatLngs, {
        color: '#0B3BF4',
        weight: 4.5,
        dashArray: '10, 10',
        opacity: 1,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(map);

      polylineRef.current = [casingPolyline, innerPolyline];

      if (shouldFitBounds) {
        try {
          const bounds = innerPolyline.getBounds();
          if (bounds.isValid()) {
            map.fitBounds(bounds, { padding: [55, 55], maxZoom: 15 });
          }
        } catch {}
      }
    } else if (!showRoute && routeLatLngs.length > 0 && shouldFitBounds) {
      try {
        const bounds = L.latLngBounds(routeLatLngs);
        if (bounds.isValid()) {
          map.fitBounds(bounds, { padding: [45, 45], maxZoom: 14 });
        }
      } catch {}
    }
  }, [spots, selectedSpot, userLocation, onSelectSpot, showRoute, currentZoom]);

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

      {/* Pulsing Logo Map Loader Overlay */}
      {mapLoading && (
        <div className="absolute inset-0 z-[500] bg-[#F4F6F9] flex flex-col items-center justify-center p-4 transition-opacity duration-300 rounded-3xl pointer-events-none">
          <div className="relative flex flex-col items-center">
            <div className="absolute -inset-4 bg-blue-500/10 rounded-full blur-xl animate-pulse-glow" />
            <img
              src="/logo.png"
              alt="Loading Map"
              className="w-32 h-auto object-contain animate-heartbeat select-none relative"
            />
            <span className="text-[10px] font-black uppercase tracking-wider text-gray-500 mt-2">
              Rendering Map...
            </span>
          </div>
        </div>
      )}

      {/* Floating Zoom Indicator in Explore mode when zoomed out */}
      {currentZoom < 8.5 && !showRoute && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[400] bg-white/95 backdrop-blur border-[2px] border-black rounded-full px-3.5 py-1 text-[11px] font-black text-black shadow-[0_2px_0_0_#000000] flex items-center gap-1.5 pointer-events-none select-none animate-bounce">
          <span>🔍</span>
          <span>Zoom in to view local photo cards</span>
        </div>
      )}

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

      {/* Avada OpenStreetMap Style Selector Pill */}
      <div className="absolute top-3 left-3 z-[400] flex flex-col gap-1.5">
        <button
          type="button"
          onClick={() => setShowStyleMenu(!showStyleMenu)}
          className="bg-white/95 backdrop-blur border-[2px] border-black rounded-full px-2.5 py-1 text-[10px] font-black shadow-[0_2px_0_0_#000000] flex items-center gap-1.5 hover:bg-yellow-50 active:scale-95 transition cursor-pointer"
          title="Switch Avada OpenStreetMap Style"
        >
          <span>{AVADA_TILE_PROVIDERS[mapStyle]?.icon || '🗺️'}</span>
          <span>{AVADA_TILE_PROVIDERS[mapStyle]?.name || 'Avada Map'}</span>
          <Layers size={11} className="text-[#0B3BF4]" strokeWidth={2.5} />
        </button>

        {showStyleMenu && (
          <div className="bg-white border-[2px] border-black rounded-2xl p-1.5 shadow-[0_4px_0_0_#000000] flex flex-col gap-1 min-w-[140px] animate-fade-in">
            <span className="text-[9px] font-black uppercase text-gray-500 px-2 py-0.5">Avada OSM Styles</span>
            {Object.entries(AVADA_TILE_PROVIDERS).map(([key, prov]) => (
              <button
                key={key}
                type="button"
                onClick={() => {
                  setMapStyle(key);
                  setShowStyleMenu(false);
                }}
                className={`flex items-center gap-2 px-2.5 py-1 rounded-xl text-left text-xs font-black transition ${
                  mapStyle === key
                    ? 'bg-[#0B3BF4] text-white'
                    : 'text-black hover:bg-gray-100'
                }`}
              >
                <span>{prov.icon}</span>
                <span>{prov.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
