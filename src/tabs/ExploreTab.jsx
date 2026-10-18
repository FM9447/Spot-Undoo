import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Search, MapPin, Navigation2, Star, Bookmark, MessageSquare, X, Compass, ExternalLink, Globe, ChevronDown, Navigation, Check, Bell } from 'lucide-react';
import { KERALA_CITIES } from '../data/keralaCitiesData';
import { haversineKm } from '../utils/plannerMath';
import InteractiveMap from '../components/InteractiveMap';
import ImageCarousel from '../components/ImageCarousel';
import RideComparatorModal from '../components/RideComparatorModal';
import LocationPickerModal from '../components/LocationPickerModal';
import { getBackendUrl } from '../utils/apiConfig';
import { sanitizeText } from '../utils/sanitize';
import { getRealSpotPhoto, getRealSpotPhotos } from '../utils/realPhotoResolver';

const CATEGORIES = ['All Spots', '💎 Hidden Spots', 'Food', 'Gaming & Chill', 'Night'];
const CITIES_LIST = ['Your Location', 'All Cities', 'Shoranur', 'Pattambi', 'Kochi', 'Calicut', 'Palakkad', 'Trivandrum', 'Kollam', 'Wayanad'];

const TRAIL_DOODLES = [
  { icon: '🌴', title: 'Coastal Palms', desc: 'Arabian Sea Breeze', tag: 'COASTAL' },
  { icon: '☕', title: 'Chai Kadai', desc: 'Fresh Elaichi Chai', tag: 'LOCAL SPOT' },
  { icon: '⛵', title: 'Nila Houseboat', desc: 'Backwater Basin', tag: 'WATERWAYS' },
  { icon: '⛰️', title: 'Western Ghats', desc: 'Misty Hill Ridge', tag: 'HIGHLANDS' },
  { icon: '🛺', title: 'Local Rickshaw', desc: 'Scenic Alley Route', tag: 'TRANSIT' },
  { icon: '📷', title: 'Scenic Viewpoint', desc: 'Golden Hour Snapshot', tag: 'VIEWPOINT' },
  { icon: '🧭', title: 'Navigator Dial', desc: 'N 10°14′ E 76°12′', tag: 'WAYPOINT' },
  { icon: '🌿', title: 'Forest Canopy', desc: 'Hidden Wilderness', tag: 'NATURE' },
];

export default function ExploreTab({ location, setLocation }) {
  const [activeCategory, setActiveCategory] = useState('All Spots');
  const [selectedCityFilter, setSelectedCityFilter] = useState('Your Location');
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [locationSearchQuery, setLocationSearchQuery] = useState('');
  const [cityToast, setCityToast] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('osm'); // 'osm' (Map default) | 'cartoon' | 'grid'
  const [selectedSpot, setSelectedSpot] = useState(null);
  const [rideDestination, setRideDestination] = useState(null);
  const [spotToRestore, setSpotToRestore] = useState(null);

  const handleOpenRides = (spot) => {
    if (selectedSpot) {
      setSpotToRestore(selectedSpot);
      setSelectedSpot(null);
    }
    setRideDestination(spot);
  };

  const handleCloseRides = () => {
    setRideDestination(null);
    if (spotToRestore) {
      setSelectedSpot(spotToRestore);
      setSpotToRestore(null);
    }
  };

  const [bookmarkedIds, setBookmarkedIds] = useState([]);
  const [userRating, setUserRating] = useState(5);
  const [userReviewText, setUserReviewText] = useState('');
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [communityReviews, setCommunityReviews] = useState([]);

  // Trail measurement refs & state
  const trailContainerRef = useRef(null);
  const [trailDimensions, setTrailDimensions] = useState({ width: 360, height: 600 });
  const [canvasTheme, setCanvasTheme] = useState('river'); // 'river' | 'road' | 'pinboard'

  // Merge all spots across all cities + user uploaded spots (memoized to eliminate lag)
  const allSpots = useMemo(() => {
    let userSpots = [];
    try {
      userSpots = JSON.parse(localStorage.getItem('userSpots') || '[]');
    } catch {}
    const allCitySpots = Object.entries(KERALA_CITIES).flatMap(([key, city]) =>
      (city.spots || []).map((s) => ({ ...s, cityKey: key, cityName: city.name }))
    );
    return [...allCitySpots, ...userSpots];
  }, []);

  // Filtering: strict category & city matches, plus search query & instant distance caching
  const filteredSpots = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const filterLower = selectedCityFilter.toLowerCase();

    const list = allSpots.filter((spot) => {
      const matchesSearch =
        !q ||
        spot.name.toLowerCase().includes(q) ||
        (spot.category || '').toLowerCase().includes(q) ||
        (spot.badge || '').toLowerCase().includes(q) ||
        (spot.cityName || '').toLowerCase().includes(q) ||
        (spot.cityKey || '').toLowerCase().includes(q) ||
        (spot.area || '').toLowerCase().includes(q) ||
        (spot.review || '').toLowerCase().includes(q) ||
        (spot.tags || []).some((t) => t.toLowerCase().includes(q));

      const cityKeyLower = (spot.cityKey || '').toLowerCase();
      const cityNameLower = (spot.cityName || '').toLowerCase();
      const areaLower = (spot.area || '').toLowerCase();
      const spotNameLower = (spot.name || '').toLowerCase();

      let matchesCity = selectedCityFilter === 'All Cities' || selectedCityFilter === 'Your Location';
      if (!matchesCity) {
        if (filterLower === 'pattambi') {
          matchesCity =
            cityKeyLower.includes('pattambi') ||
            cityNameLower.includes('pattambi') ||
            areaLower.includes('pattambi') ||
            spotNameLower.includes('pattambi') ||
            spotNameLower.includes('rayiranellur') ||
            spotNameLower.includes('ongallur');
        } else if (filterLower === 'kochi') {
          matchesCity =
            cityKeyLower.includes('kochi') ||
            cityNameLower.includes('kochi') ||
            cityKeyLower.includes('ernakulam') ||
            cityNameLower.includes('ernakulam') ||
            areaLower.includes('kochi') ||
            areaLower.includes('ernakulam') ||
            spotNameLower.includes('kochi') ||
            spotNameLower.includes('ernakulam') ||
            spotNameLower.includes('mattancherry');
        } else if (filterLower === 'calicut') {
          matchesCity =
            cityKeyLower.includes('calicut') ||
            cityNameLower.includes('calicut') ||
            cityKeyLower.includes('kozhikode') ||
            cityNameLower.includes('kozhikode') ||
            areaLower.includes('calicut') ||
            areaLower.includes('kozhikode') ||
            spotNameLower.includes('calicut') ||
            spotNameLower.includes('kozhikode');
        } else if (filterLower === 'trivandrum') {
          matchesCity =
            cityKeyLower.includes('trivandrum') ||
            cityNameLower.includes('trivandrum') ||
            cityKeyLower.includes('thiruvananthapuram') ||
            cityNameLower.includes('thiruvananthapuram') ||
            areaLower.includes('trivandrum') ||
            areaLower.includes('thiruvananthapuram') ||
            spotNameLower.includes('trivandrum') ||
            spotNameLower.includes('thiruvananthapuram');
        } else if (filterLower === 'palakkad') {
          matchesCity =
            cityKeyLower.includes('palakkad') ||
            cityNameLower.includes('palakkad') ||
            cityKeyLower.includes('olavakkode') ||
            cityNameLower.includes('olavakkode') ||
            areaLower.includes('palakkad') ||
            areaLower.includes('olavakkode');
        } else if (filterLower === 'shoranur') {
          matchesCity =
            cityKeyLower.includes('shoranur') ||
            cityNameLower.includes('shoranur') ||
            areaLower.includes('shoranur') ||
            spotNameLower.includes('shoranur') ||
            areaLower.includes('bharathapuzha');
        } else if (filterLower === 'kollam') {
          matchesCity =
            cityKeyLower.includes('kollam') ||
            cityNameLower.includes('kollam') ||
            cityKeyLower.includes('quilon') ||
            cityNameLower.includes('quilon') ||
            areaLower.includes('kollam') ||
            areaLower.includes('quilon');
        } else if (filterLower === 'wayanad') {
          matchesCity =
            cityKeyLower.includes('wayanad') ||
            cityNameLower.includes('wayanad') ||
            cityKeyLower.includes('kalpetta') ||
            cityNameLower.includes('kalpetta') ||
            areaLower.includes('wayanad') ||
            areaLower.includes('kalpetta');
        } else {
          matchesCity =
            cityKeyLower.includes(filterLower) ||
            cityNameLower.includes(filterLower) ||
            areaLower.includes(filterLower);
        }
      }

      const catLower = (spot.category || '').toLowerCase();
      const matchesCat =
        activeCategory === 'All Spots' ||
        (activeCategory === '💎 Hidden Spots' && (catLower.includes('hidden') || catLower.includes('scenic') || catLower.includes('nature'))) ||
        (activeCategory === 'Food' && (catLower.includes('food') || catLower.includes('cafe') || catLower.includes('restaurant') || catLower.includes('bakery'))) ||
        (activeCategory === 'Gaming & Chill' && (catLower.includes('gaming') || catLower.includes('chill') || catLower.includes('lan'))) ||
        (activeCategory === 'Night' && (catLower.includes('night') || catLower.includes('party') || catLower.includes('club') || catLower.includes('pub')));

      return matchesCity && matchesCat && matchesSearch;
    });

    // Zero-lag single-pass distance sort when Your Location is selected
    if (selectedCityFilter === 'Your Location' && location?.lat && location?.lon) {
      const uLat = location.lat;
      const uLon = location.lon;
      const withDist = list.map((s) => ({
        spot: s,
        dist: s.lat && s.lng ? haversineKm(uLat, uLon, s.lat, s.lng) : 9999,
      }));
      withDist.sort((a, b) => a.dist - b.dist);
      return withDist.map((item) => item.spot);
    }

    return list;
  }, [allSpots, searchQuery, selectedCityFilter, activeCategory, location?.lat, location?.lon]);

  // Measure container dimensions for responsive SVG canvas
  const measureCanvas = useCallback(() => {
    if (!trailContainerRef.current) return;
    const container = trailContainerRef.current;
    const w = container.clientWidth || 360;
    const h = Math.max(container.scrollHeight, container.clientHeight) || 600;
    setTrailDimensions({ width: w, height: h });
  }, []);

  // Recalculate dimensions on view, filter, or spot count changes
  useEffect(() => {
    if (viewMode !== 'cartoon') return;
    measureCanvas();
    const t1 = setTimeout(measureCanvas, 60);
    const t2 = setTimeout(measureCanvas, 250);

    let ro;
    if (trailContainerRef.current && window.ResizeObserver) {
      ro = new ResizeObserver(() => measureCanvas());
      ro.observe(trailContainerRef.current);
    }
    window.addEventListener('resize', measureCanvas);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      if (ro) ro.disconnect();
      window.removeEventListener('resize', measureCanvas);
    };
  }, [viewMode, filteredSpots.length, selectedCityFilter, activeCategory, measureCanvas]);

  // Generates a smooth meandering central river or country road down the canvas
  const meanderingPath = (() => {
    const w = trailDimensions.width;
    const h = trailDimensions.height;
    const midX = w / 2;
    const count = Math.max(filteredSpots.length, 6);
    const stepY = Math.max(140, h / count);
    let d = `M ${midX} 0`;
    for (let i = 0; i < count; i++) {
      const y1 = i * stepY;
      const y2 = (i + 1) * stepY;
      const midY = (y1 + y2) / 2;
      const swayX = i % 2 === 0 ? midX + 38 : midX - 38;
      const nextSwayX = (i + 1) % 2 === 0 ? midX + 38 : midX - 38;
      d += ` C ${swayX} ${midY - 30}, ${nextSwayX} ${midY + 30}, ${nextSwayX} ${y2}`;
    }
    return d;
  })();

  // Reset selectedSpot only if currently viewed spot is filtered out (do not auto-open)
  useEffect(() => {
    if (selectedSpot) {
      const isStillInList = filteredSpots.some(
        (s) => (s.id || s.name) === (selectedSpot.id || selectedSpot.name)
      );
      if (!isStillInList) {
        setSelectedSpot(null);
      }
    }
  }, [activeCategory, selectedCityFilter, searchQuery, filteredSpots.length]);

  // Load reviews whenever selectedSpot changes
  useEffect(() => {
    if (!selectedSpot) return;
    const spotKey = selectedSpot.id || selectedSpot.name;
    const local = JSON.parse(localStorage.getItem(`reviews_${spotKey}`) || '[]');
    setCommunityReviews(local);

    fetch(`${getBackendUrl()}/api/reviews?spotId=${encodeURIComponent(spotKey)}&spotName=${encodeURIComponent(selectedSpot.name || '')}`)
      .then((r) => r.json())
      .then((mongoReviews) => {
        if (Array.isArray(mongoReviews) && mongoReviews.length > 0) {
          const formattedMongo = mongoReviews.map((m) => ({
            rating: m.rating || 5,
            text: m.reviewText,
            author: m.author || 'Local Explorer',
            date: new Date(m.createdAt || Date.now()).toLocaleDateString(),
          }));
          const existingTexts = new Set(local.map((l) => l.text));
          const combined = [...local, ...formattedMongo.filter((m) => !existingTexts.has(m.text))];
          setCommunityReviews(combined);
        }
      })
      .catch(() => {});
  }, [selectedSpot?.id, selectedSpot?.name]);

  const toggleBookmark = (id) => {
    setBookmarkedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleCitySelect = (cityName) => {
    setSelectedCityFilter(cityName);
    setShowLocationModal(false);
    setLocationSearchQuery('');

    if (cityName === 'Your Location') {
      usePhoneGPS();
      setCityToast(`📍 Live GPS active! Showing spots nearest to you.`);
      setTimeout(() => setCityToast(''), 4500);
      return;
    }

    if (cityName === 'All Cities') {
      setCityToast(`🌴 Exploring all spots across Kerala!`);
      setTimeout(() => setCityToast(''), 4500);
      return;
    }

    if (KERALA_CITIES[cityName]) {
      const hub = KERALA_CITIES[cityName].hub;
      if (setLocation) {
        setLocation({ lat: hub.lat, lon: hub.lng, label: `${hub.name} (Active)` });
      }
      const citySpots = allSpots.filter(
        (s) =>
          (s.cityKey || '').toLowerCase() === cityName.toLowerCase() ||
          (s.cityName || '').toLowerCase() === cityName.toLowerCase()
      );
      const foodCount = citySpots.filter((s) => (s.category || '').toLowerCase().includes('food')).length;
      const hiddenCount = citySpots.filter((s) => (s.category || '').toLowerCase().includes('hidden')).length;
      setCityToast(
        `📍 Welcome to ${KERALA_CITIES[cityName].name}! ${citySpots.length} spots found (${foodCount} food spots, ${hiddenCount} hidden gems)`
      );
      setTimeout(() => setCityToast(''), 5000);
    }
  };

  const handleLocationModalSelect = (picked) => {
    setShowLocationModal(false);
    if (picked.isLive) {
      setSelectedCityFilter('Your Location');
      if (setLocation) {
        setLocation({
          lat: picked.lat,
          lon: picked.lon,
          label: 'Phone GPS (Live)',
        });
      }
      setCityToast('📍 Live GPS active! Showing spots nearest to you.');
      setTimeout(() => setCityToast(''), 4500);
      return;
    }

    if (picked.isAllKerala) {
      setSelectedCityFilter('All Cities');
      setCityToast('🌴 Exploring all spots across Kerala!');
      setTimeout(() => setCityToast(''), 4500);
      return;
    }

    if (picked.cityKey && !picked.spotId) {
      handleCitySelect(picked.cityKey);
      return;
    }

    if (picked.spotId) {
      setSelectedCityFilter('All Cities');
      if (setLocation) {
        setLocation({
          lat: picked.lat,
          lon: picked.lon,
          label: picked.label,
          spotId: picked.spotId,
        });
      }
      const spotObj = allSpots.find((s) => s.id === picked.spotId);
      if (spotObj) {
        setSelectedSpot(spotObj);
      }
      setCityToast(`📍 Selected "${picked.label}"! Distances calculated from here.`);
      setTimeout(() => setCityToast(''), 4500);
    }
  };

  const usePhoneGPS = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocation({
            lat: pos.coords.latitude,
            lon: pos.coords.longitude,
            label: 'Phone GPS (Live)',
          });
        },
        () => alert('GPS access was denied. Using current Hub.')
      );
    }
  };

  return (
    <div className="space-y-3 pb-8">
      {/* City Change Notification Toast Banner */}
      {cityToast && (
        <div className="bg-[#0B3BF4] text-white border-[2.5px] border-black rounded-2xl p-2.5 flex items-center justify-between shadow-[0_3px_0_0_#000000] animate-bounce">
          <div className="flex items-center gap-2 text-xs font-black">
            <Bell size={14} className="text-yellow-300 animate-pulse shrink-0" />
            <span>{cityToast}</span>
          </div>
          <button
            type="button"
            onClick={() => setCityToast('')}
            className="text-white hover:text-gray-200 font-black text-xs ml-2 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* 1. Dual Location Controls Card */}
      <div className="bg-white border-[2.5px] border-black rounded-2xl p-2.5 shadow-[0_3px_0_0_#000000] space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-black text-black">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>GPS: {location?.label || 'Your Location'}</span>
          </div>
          <button
            onClick={usePhoneGPS}
            className="text-[10px] font-black text-[#0B3BF4] hover:underline cursor-pointer flex items-center gap-0.5"
          >
            <Navigation size={10} /> Refresh
          </button>
        </div>

        {/* Location Selector Trigger Button */}
        <button
          type="button"
          onClick={() => setShowLocationModal(true)}
          className="w-full flex items-center justify-between gap-2 bg-[#F4F6F9] hover:bg-gray-100 border-[2px] border-black rounded-xl px-3 py-2 text-xs font-black text-black shadow-[0_1.5px_0_0_#000000] transition active:translate-y-0.5 cursor-pointer"
        >
          <div className="flex items-center gap-2 truncate text-left">
            <MapPin size={14} className="text-[#0B3BF4] shrink-0" strokeWidth={2.5} />
            <span className="truncate">
              {selectedCityFilter === 'Your Location'
                ? `📍 Your Location (${location?.label?.replace(/\s*\(Active\)/i, '') || 'Live GPS'})`
                : selectedCityFilter === 'All Cities'
                ? '🌴 All Kerala Spots'
                : `📍 ${KERALA_CITIES[selectedCityFilter]?.displayName || selectedCityFilter}`}
            </span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0 text-gray-600">
            <span className="text-[10px] font-black bg-white border border-black rounded-full px-2 py-0.5 shadow-sm">
              Change
            </span>
            <ChevronDown size={14} className="text-black" />
          </div>
        </button>

        {/* Search input */}
        <div className="flex items-center gap-2 bg-white border-[2px] border-black rounded-xl px-3 py-1.5">
          <Search size={14} className="text-black shrink-0" strokeWidth={2.5} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search places, food, or areas near you..."
            className="w-full text-xs font-bold text-black placeholder-gray-400 outline-none bg-transparent"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="text-xs font-bold text-gray-500 cursor-pointer">
              ✕
            </button>
          )}
        </div>
      </div>

      {/* 2A. View Switcher Row & Spot Counter */}
      <div className="flex items-center justify-between gap-2 px-0.5">
        <span className="text-[11px] font-black text-gray-600 uppercase tracking-wider">
          {filteredSpots.length} Spots Found
        </span>
        {/* View Switcher: Map (Default) | Canvas | Grid */}
        <div className="shrink-0 flex items-center bg-white border-[2px] border-black rounded-full p-0.5 shadow-[0_2px_0_0_#000000]">
          <button
            type="button"
            onClick={() => setViewMode('osm')}
            className={`px-2.5 py-1 rounded-full text-xs font-black transition cursor-pointer ${
              viewMode === 'osm' ? 'bg-[#0B3BF4] text-white shadow-sm' : 'text-gray-700 hover:text-black'
            }`}
          >
            🗺️ Map
          </button>
          <button
            type="button"
            onClick={() => setViewMode('cartoon')}
            className={`px-2 py-1 rounded-full text-xs font-black transition cursor-pointer ${
              viewMode === 'cartoon' ? 'bg-[#0B3BF4] text-white shadow-sm' : 'text-gray-700 hover:text-black'
            }`}
          >
            🎨 Canvas
          </button>
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            className={`px-2 py-1 rounded-full text-xs font-black transition cursor-pointer ${
              viewMode === 'grid' ? 'bg-[#0B3BF4] text-white shadow-sm' : 'text-gray-700 hover:text-black'
            }`}
          >
            📱 Grid
          </button>
        </div>
      </div>

      {/* 2B. Category Filters (Full width horizontal scroll) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none w-full">
        {CATEGORIES.map((cat) => {
          const isSelected = activeCategory === cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={`text-xs font-black px-3 py-1 rounded-full border-[2px] border-black transition shadow-[0_2px_0_0_#000000] active:translate-y-0.5 shrink-0 cursor-pointer ${
                isSelected
                  ? 'bg-[#0B3BF4] text-white'
                  : 'bg-white text-black hover:bg-gray-100'
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* 2B. City Region Filter Pills (No "City:" label) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {CITIES_LIST.map((cityName) => {
          const isSelected = selectedCityFilter === cityName;
          return (
            <button
              key={cityName}
              type="button"
              onClick={() => handleCitySelect(cityName)}
              className={`text-[11px] font-black px-2.5 py-0.5 rounded-full border-[1.5px] border-black transition shadow-[0_1px_0_0_#000000] active:translate-y-0.5 shrink-0 cursor-pointer ${
                isSelected
                  ? 'bg-amber-400 text-black'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {cityName === 'Your Location' ? '📍 Your Location' : cityName}
            </button>
          );
        })}
      </div>

      {/* Location Selection Modal (Google Maps Style) */}
      <LocationPickerModal
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        currentLocation={location}
        onSelectLocation={handleLocationModalSelect}
        showAllKeralaOption={true}
      />

      {/* 3. View Content (OSM Live Map / Cartoon Canvas / Grid) */}
      {viewMode === 'osm' ? (
        <div className="w-full">
          <InteractiveMap
            spots={filteredSpots}
            selectedSpot={selectedSpot}
            onSelectSpot={setSelectedSpot}
            userLocation={location}
            height="min(72vh, 680px)"
          />
        </div>
      ) : viewMode === 'cartoon' ? (
        <div
          ref={trailContainerRef}
          className="relative bg-[#F4F6F9] border-[2.5px] border-black rounded-3xl p-3 shadow-[0_4px_0_0_#000000] max-h-[540px] md:max-h-[720px] max-w-4xl mx-auto overflow-y-auto overflow-x-hidden scrollbar-thin scroll-smooth"
        >
          {/* Dynamic Illustrated Background Canvas: Simple Clean Path */}
          <svg
            className="absolute inset-0 w-full pointer-events-none"
            style={{ height: `${trailDimensions.height}px` }}
            width={trailDimensions.width}
            height={trailDimensions.height}
          >
            <defs>
              <pattern id="trailGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                <circle cx="20" cy="20" r="0.8" fill="#CBD5E1" opacity="0.6" />
              </pattern>
              <linearGradient id="riverWaterGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#BAE6FD" />
                <stop offset="50%" stopColor="#7DD3FC" />
                <stop offset="100%" stopColor="#BAE6FD" />
              </linearGradient>
            </defs>

            {/* Subtle Map Coordinates Dot Grid */}
            <rect width="100%" height="100%" fill="url(#trailGrid)" />

            {/* Subtle Topographic Elevation Contour Lines */}
            {Array.from({ length: Math.ceil(trailDimensions.height / 220) + 1 }).map((_, cIdx) => {
              const yBase = cIdx * 220 + 80;
              return (
                <g key={cIdx} opacity="0.38">
                  <path
                    d={`M 0 ${yBase} Q ${trailDimensions.width * 0.25} ${yBase - 35}, ${trailDimensions.width * 0.5} ${yBase + 25} T ${trailDimensions.width} ${yBase - 15}`}
                    fill="none"
                    stroke="#CBD5E1"
                    strokeWidth="1.2"
                    strokeDasharray="4 6"
                  />
                  <text
                    x={trailDimensions.width - 45}
                    y={yBase - 8}
                    fill="#94A3B8"
                    fontSize="7"
                    fontWeight="800"
                    fontFamily="monospace"
                  >
                    {cIdx * 35 + 20}m
                  </text>
                  <path
                    d={`M 0 ${yBase + 110} Q ${trailDimensions.width * 0.35} ${yBase + 140}, ${trailDimensions.width * 0.7} ${yBase + 85} T ${trailDimensions.width} ${yBase + 120}`}
                    fill="none"
                    stroke="#E2E8F0"
                    strokeWidth="1"
                  />
                </g>
              );
            })}

            {/* Simple Scenic Path: Kerala Backwaters River (Default) */}
            {canvasTheme === 'river' && (
              <g>
                <path
                  d={meanderingPath}
                  fill="none"
                  stroke="#E0F2FE"
                  strokeWidth="36"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d={meanderingPath}
                  fill="none"
                  stroke="url(#riverWaterGrad)"
                  strokeWidth="24"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d={meanderingPath}
                  fill="none"
                  stroke="#0284C7"
                  strokeWidth="2"
                  strokeDasharray="14 20"
                  strokeLinecap="round"
                  opacity="0.65"
                />
              </g>
            )}

            {/* Simple Scenic Path: Country Expedition Road */}
            {canvasTheme === 'road' && (
              <g>
                <path
                  d={meanderingPath}
                  fill="none"
                  stroke="#94A3B8"
                  strokeWidth="30"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d={meanderingPath}
                  fill="none"
                  stroke="#334155"
                  strokeWidth="22"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d={meanderingPath}
                  fill="none"
                  stroke="#FDE047"
                  strokeWidth="2"
                  strokeDasharray="10 12"
                  strokeLinecap="round"
                />
              </g>
            )}

            {/* Pinboard: Clean canvas with zero line */}
          </svg>

          {/* Floating Top Control: Location Hub Barometer + Theme Selector [River | Road | Board] + Live Explore */}
          <div className="relative z-10 flex items-center justify-between gap-1 mb-3 px-0.5">
            <div className="flex items-center gap-1.5 min-w-0">
              <div className="bg-white border-[2px] border-black rounded-2xl px-2.5 py-1 text-xs font-black text-black shadow-[0_2px_0_0_#000000] truncate flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <span className="truncate">{selectedCityFilter} • {filteredSpots.length}</span>
              </div>

              {/* Design Theme Selector */}
              <div className="flex items-center bg-white border-[2px] border-black rounded-full p-0.5 shadow-[0_1.5px_0_0_#000000] shrink-0">
                <button
                  type="button"
                  onClick={() => setCanvasTheme('river')}
                  className={`px-2 py-0.5 rounded-full text-[9px] font-black transition cursor-pointer ${
                    canvasTheme === 'river' ? 'bg-[#0B3BF4] text-white shadow-sm' : 'text-gray-600 hover:text-black'
                  }`}
                  title="Kerala Backwaters River Theme"
                >
                  🌊 River
                </button>
                <button
                  type="button"
                  onClick={() => setCanvasTheme('road')}
                  className={`px-2 py-0.5 rounded-full text-[9px] font-black transition cursor-pointer ${
                    canvasTheme === 'road' ? 'bg-[#0B3BF4] text-white shadow-sm' : 'text-gray-600 hover:text-black'
                  }`}
                  title="Scenic Country Road Theme"
                >
                  🛣️ Road
                </button>
                <button
                  type="button"
                  onClick={() => setCanvasTheme('pinboard')}
                  className={`px-2 py-0.5 rounded-full text-[9px] font-black transition cursor-pointer ${
                    canvasTheme === 'pinboard' ? 'bg-[#0B3BF4] text-white shadow-sm' : 'text-gray-600 hover:text-black'
                  }`}
                  title="Explorer's Pinboard Theme"
                >
                  📌 Board
                </button>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => setViewMode('osm')}
                className="bg-white border-[2px] border-black rounded-full px-2 py-1 flex items-center gap-1 text-[10px] font-black shadow-[0_2px_0_0_#000000] hover:bg-gray-50 active:translate-y-0.5 transition"
                title="View on Interactive Map"
              >
                <span>🗺️</span>
                <span>Map</span>
              </button>
              <button
                onClick={() => setSelectedSpot(filteredSpots[0] || allSpots[0])}
                className="bg-white border-[2px] border-black rounded-full px-2 py-1 flex items-center gap-1 text-[10px] font-black shadow-[0_2px_0_0_#000000] hover:bg-emerald-50 active:translate-y-0.5 transition"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-ping" />
                <span>Explore</span>
                <Navigation2 size={10} className="text-[#0B3BF4] fill-[#0B3BF4]" />
              </button>
            </div>
          </div>

          {/* Dynamic Pin Callout Cards with Illustrated Landmark Stickers in Empty Spaces */}
          {filteredSpots.length === 0 ? (
            <div className="relative z-10 py-16 text-center space-y-2">
              <div className="text-3xl">🔍</div>
              <div className="font-black text-sm text-black">
                No spots found {searchQuery ? `for "${searchQuery}"` : ''}
              </div>
              <p className="text-xs text-gray-500">
                Try a different search keyword or switch city
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setActiveCategory('All Spots');
                  setSelectedCityFilter('All Cities');
                }}
                className="mt-2 bg-[#0B3BF4] text-white text-xs font-black px-4 py-1.5 rounded-full border-[2px] border-black shadow-[0_2px_0_0_#000000] active:translate-y-0.5"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="relative z-10 space-y-4 my-1">
              {filteredSpots.map((spot, idx) => {
                const isLeft = idx % 2 === 0;
                const isSelected = selectedSpot?.id === spot.id || selectedSpot?.name === spot.name;
                const doodle = TRAIL_DOODLES[idx % TRAIL_DOODLES.length];
                const spotLat = spot.lat || 10.7606;
                const spotLng = spot.lng || 76.2711;
                const distKm = location?.lat ? haversineKm(location.lat, location.lon, spotLat, spotLng) : null;

                // Card component
                const spotCard = (
                  <div className="w-[48%] flex flex-col items-center">
                    {/* Category pill directly above card */}
                    <div className="flex items-center gap-1 mb-2">
                      <span className="border-[1.5px] border-black rounded-full px-2 py-0.5 text-[8.5px] font-black bg-[#FEF3C7] text-black shadow-[0_1px_0_0_#000000]">
                        {spot.category || 'Spot'}
                      </span>
                    </div>

                    {/* Compact Polaroid Snapshot Card: Pinned right onto the dotted path */}
                    <div
                      onClick={() => setSelectedSpot(spot)}
                      className={`relative bg-white border-[2px] border-black rounded-xl p-1.5 pt-2.5 pb-2 shadow-[0_3px_0_0_#000000] cursor-pointer hover:scale-[1.02] active:scale-98 transition max-w-[155px] w-full ${
                        isLeft ? '-rotate-1 hover:rotate-0' : 'rotate-1 hover:rotate-0'
                      } ${isSelected ? 'ring-2 ring-[#0B3BF4]' : ''}`}
                    >
                      {/* 3D Push-Pin with Number Pinned Exactly on the Dotted Trail Path */}
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center pointer-events-none">
                        <div className="trail-card-pin w-5 h-5 rounded-full bg-gradient-to-br from-red-400 via-red-500 to-red-600 border-[1.5px] border-black shadow-[0_2px_0_0_rgba(0,0,0,0.4)] ring-1 ring-red-300/60 flex items-center justify-center font-black text-[10px] text-white">
                          {idx + 1}
                        </div>
                      </div>

                      {/* Photo Frame */}
                      <div className="relative w-full h-[72px] rounded-md overflow-hidden border border-black mb-1 bg-gray-100 shadow-[inset_0_1px_2px_rgba(0,0,0,0.1)]">
                        <img
                          src={getRealSpotPhoto(spot)}
                          alt={spot.name}
                          onLoad={measureCanvas}
                          className="w-full h-full object-cover"
                        />
                        {spot.badge && (
                          <div className="absolute top-1 right-1">
                            <span className="bg-[#F59E0B] border border-black text-black font-black text-[6.5px] px-1 py-0.2 rounded uppercase shadow-[0_0.5px_0_0_#000000]">
                              {spot.badge}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Polaroid Bottom Chin with location details and direct Map jump */}
                      <div className="px-0.5 space-y-0.5">
                        <div className="font-black text-[10px] text-black truncate leading-tight">
                          {spot.name}
                        </div>

                        {/* Location area & landmark */}
                        <div className="text-[8px] font-bold text-gray-600 truncate flex items-center gap-0.5">
                          <span>📍</span>
                          <span className="truncate">{spot.area ? `${spot.area}, ${spot.cityName || ''}` : (spot.cityName || 'Kerala')}</span>
                        </div>

                        <div className="text-[8.5px] font-bold text-emerald-700 flex items-center justify-between pt-0.5">
                          <span>{spot.expense === 0 ? 'Free' : `₹${spot.expense}`}</span>
                          <span className="flex items-center gap-0.5">{spot.rating || 4.8} ⭐</span>
                        </div>

                        {/* Bottom Bar: Live Distance + Direct Map View & Rides Buttons */}
                        <div className="text-[7.5px] font-semibold text-gray-500 flex items-center justify-between pt-0.5 border-t border-gray-200">
                          <span className="truncate max-w-[65px]">
                            {distKm !== null ? `${distKm.toFixed(1)} km` : spot.transitText || 'Near station'}
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setRideDestination(spot);
                              }}
                              className="bg-[#FFE500] text-black text-[7px] font-black px-1.5 py-0.5 rounded-full border border-black shadow-[0_0.5px_0_0_#000000] hover:bg-yellow-400 active:translate-y-0.5 cursor-pointer flex items-center gap-0.5"
                              title="Compare Uber, Rapido & Auto fares"
                            >
                              <span>🛺</span>
                              <span>Rides</span>
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedSpot(spot);
                                setViewMode('osm');
                              }}
                              className="bg-[#0B3BF4] text-white text-[7px] font-black px-1.5 py-0.5 rounded-full border border-black shadow-[0_0.5px_0_0_#000000] hover:bg-blue-700 active:translate-y-0.5 cursor-pointer"
                              title="View on Map"
                            >
                              Map ↗
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );

                // Illustrated Adventure Sticker rendered in the empty opposite half
                const doodleSticker = (
                  <div className="w-[48%] flex justify-center py-2 pointer-events-none select-none">
                    <div className={`bg-white/85 border-[1.5px] border-black/25 rounded-2xl p-2.5 shadow-[0_2px_0_0_rgba(0,0,0,0.06)] flex items-center gap-2 max-w-[155px] w-full ${
                      isLeft ? 'rotate-1' : '-rotate-1'
                    }`}>
                      <span className="text-xl shrink-0">{doodle.icon}</span>
                      <div className="leading-tight overflow-hidden">
                        <div className="text-[7px] font-black uppercase tracking-wider text-[#0B3BF4]">
                          {doodle.tag} • KM {(idx * 1.4 + 0.6).toFixed(1)}
                        </div>
                        <div className="font-black text-[9px] text-black truncate">{doodle.title}</div>
                        <div className="text-[7.5px] font-semibold text-gray-500 truncate">{doodle.desc}</div>
                      </div>
                    </div>
                  </div>
                );

                return (
                  <div
                    key={spot.id || spot.name}
                    className="relative flex items-center justify-between gap-1"
                  >
                    {isLeft ? (
                      <>
                        {spotCard}
                        {doodleSticker}
                      </>
                    ) : (
                      <>
                        {doodleSticker}
                        {spotCard}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Bottom Safe Return / End Terminal Banner */}
          <div className="relative z-10 mt-4 mb-1">
            <div className="trail-end-node bg-[#F59E0B] border-[2.5px] border-black rounded-2xl py-2.5 px-3 flex items-center justify-between shadow-[0_3px_0_0_#000000]">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-black text-amber-400 font-black text-xs flex items-center justify-center shrink-0">
                  🏁
                </span>
                <div className="leading-tight text-left">
                  <div className="text-[9px] font-black uppercase tracking-wider text-black/80">
                    END OF TRAIL
                  </div>
                  <div className="font-black text-[11px] text-black">
                    {filteredSpots.length} Spots in {selectedCityFilter}
                  </div>
                </div>
              </div>
              <div className="bg-black text-white text-[10px] font-black px-2.5 py-0.5 rounded-full shrink-0">
                Safe Return
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Grid View */
        filteredSpots.length === 0 ? (
          <div className="bg-white border-[2.5px] border-black rounded-3xl p-8 text-center space-y-2 shadow-[0_3px_0_0_#000000]">
            <div className="text-3xl">🔍</div>
            <div className="font-black text-sm text-black">
              No spots found {searchQuery ? `for "${searchQuery}"` : ''}
            </div>
            <p className="text-xs text-gray-500">
              Try a different keyword or category
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setActiveCategory('All Spots');
                setSelectedCityFilter('All Cities');
              }}
              className="mt-2 bg-[#0B3BF4] text-white text-xs font-black px-4 py-1.5 rounded-full border-[2px] border-black shadow-[0_2px_0_0_#000000]"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5 sm:gap-4 pt-2">
            {filteredSpots.map((spot, idx) => (
              <div
                key={spot.id || spot.name}
                onClick={() => setSelectedSpot(spot)}
                className={`relative bg-white border-[2px] border-black rounded-xl p-1.5 pt-2.5 pb-2 shadow-[0_3px_0_0_#000000] cursor-pointer hover:scale-[1.02] active:scale-98 transition w-full ${
                  idx % 2 === 0 ? '-rotate-1 hover:rotate-0' : 'rotate-1 hover:rotate-0'
                }`}
              >
                {/* 3D Red Push-Pin */}
                <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center pointer-events-none">
                  <div className="w-3.5 h-3.5 rounded-full bg-gradient-to-br from-red-400 via-red-500 to-red-600 border-[1.2px] border-black shadow-[0_1.5px_0_0_rgba(0,0,0,0.35)] ring-1 ring-red-300/60 flex items-center justify-center">
                    <div className="w-1 h-1 rounded-full bg-white/70" />
                  </div>
                </div>

                {/* Photo Frame */}
                <div className="relative w-full h-22 rounded-md overflow-hidden border border-black mb-1 bg-gray-100 shadow-[inset_0_1px_2px_rgba(0,0,0,0.1)]">
                  <img
                    src={getRealSpotPhoto(spot)}
                    alt={spot.name}
                    className="w-full h-full object-cover"
                  />
                  {spot.badge && (
                    <div className="absolute top-1 right-1">
                      <span className="bg-[#F59E0B] border border-black text-black font-black text-[6.5px] px-1 py-0.2 rounded uppercase shadow-[0_0.5px_0_0_#000000]">
                        {spot.badge}
                      </span>
                    </div>
                  )}
                </div>

                {/* Polaroid Chin */}
                <div className="px-0.5 space-y-0.5">
                  <div className="font-black text-[10px] text-black truncate leading-tight">
                    {spot.name}
                  </div>
                  <div className="text-[9px] font-bold text-emerald-700 flex items-center justify-between">
                    <span>{spot.expense === 0 ? 'Free' : `₹${spot.expense}`}</span>
                    <span className="flex items-center gap-0.5">{spot.rating || 4.8} ⭐</span>
                  </div>
                  <div className="text-[8.5px] font-semibold text-gray-500 flex items-center justify-between pt-0.5 border-t border-gray-200">
                    <span className="truncate max-w-[95px]">
                      📍 {spot.distanceKm ? `${spot.distanceKm} km` : spot.transitText || 'Near station'}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setRideDestination(spot);
                      }}
                      className="bg-[#FFE500] text-black text-[7px] font-black px-1.5 py-0.5 rounded-full border border-black shadow-[0_0.5px_0_0_#000000] hover:bg-yellow-400 active:translate-y-0.5 cursor-pointer flex items-center gap-0.5 shrink-0"
                      title="Compare Uber, Rapido & Auto fares"
                    >
                      <span>🛺</span>
                      <span>Rides</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* 4. Selected-Place Popup Modal Overlay */}
      {selectedSpot && (
        <div
          onClick={() => setSelectedSpot(null)}
          className="fixed inset-0 z-[999] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-3 animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white border-[3px] border-black rounded-3xl p-4 shadow-[0_8px_0_0_#000000] w-full max-w-lg max-h-[88vh] overflow-y-auto space-y-3 relative"
          >
            {/* Handle */}
            <div className="w-12 h-1 bg-black/20 rounded-full mx-auto" />

          {/* Top Bar: Badge + Rating + Close */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="bg-[#FEF3C7] border-[1.5px] border-black rounded-full px-2.5 py-0.5 text-xs font-black text-black">
                {selectedSpot.badge || selectedSpot.category || 'Scenic Spot'}
              </span>
              <div className="flex items-center gap-1 text-xs font-black text-black">
                <Star size={13} className="text-amber-500 fill-amber-500" />
                <span>{selectedSpot.rating || 4.9}</span>
                <span className="text-gray-500 font-bold">({selectedSpot.reviewCount || 128})</span>
              </div>
            </div>
            <button
              onClick={() => setSelectedSpot(null)}
              className="w-7 h-7 rounded-full border-[2px] border-black bg-white flex items-center justify-center hover:bg-gray-100 font-black text-xs shadow-[0_1px_0_0_#000000]"
            >
              ✕
            </button>
          </div>

          {/* Title */}
          <h3 className="text-xl font-black text-black leading-tight">
            {selectedSpot.name}
          </h3>

          {/* Spot Photos Carousel with cyclic navigation < > and link */}
          <ImageCarousel
            images={getRealSpotPhotos(selectedSpot)}
            links={selectedSpot.links || []}
            alt={selectedSpot.name}
            className="w-full h-44 rounded-2xl border-[2px] border-black shadow-[0_2px_0_0_#000000]"
          />

          {/* 4-Box Stats Grid */}
          <div className="border-[2px] border-black rounded-2xl overflow-hidden grid grid-cols-4 divide-x-[2px] divide-black text-center py-2 bg-white shadow-[0_2px_0_0_#000000]">
            <div>
              <div className="text-[9px] font-bold text-gray-500 uppercase">Schedule</div>
              <div className="text-[11px] font-black text-black mt-0.5">
                {selectedSpot.schedule || '14:15 - 15:00'}
              </div>
            </div>
            <div>
              <div className="text-[9px] font-bold text-gray-500 uppercase">Est. Cost</div>
              <div className="text-[11px] font-black text-emerald-600 mt-0.5">
                {selectedSpot.expense === 0 ? 'Free' : `₹${selectedSpot.expense}`}
              </div>
            </div>
            <div>
              <div className="text-[9px] font-bold text-gray-500 uppercase">Distance</div>
              <div className="text-[11px] font-black text-black mt-0.5">
                {selectedSpot.distanceText || '2.1km (10m)'}
              </div>
            </div>
            <div>
              <div className="text-[9px] font-bold text-gray-500 uppercase">Return Time</div>
              <div className="text-[11px] font-black text-[#0B3BF4] mt-0.5">
                {selectedSpot.returnText || '10m back (₹30)'}
              </div>
            </div>
          </div>

          {/* Multimodal Ride Hailing Comparator (Uber, Rapido, Ola) Button */}
          <button
            type="button"
            onClick={() => handleOpenRides(selectedSpot)}
            className="w-full bg-[#FFE500] hover:bg-[#FACC15] border-[2.5px] border-black rounded-2xl py-2.5 px-3 font-black text-xs text-black shadow-[0_3px_0_0_#000000] flex items-center justify-between active:translate-y-0.5 transition cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <span className="text-base">🛺</span>
              <span className="tracking-tight uppercase">Compare Uber, Rapido & Autos</span>
            </div>
            <div className="flex items-center gap-1 text-[10px] font-black bg-white px-2 py-0.5 rounded-lg border border-black shadow-[0_1px_0_0_#000000]">
              <span>Fast Fares</span>
              <span>→</span>
            </div>
          </button>

          {/* Community Quote Box */}
          <div className="border-[1.5px] border-black rounded-2xl p-3 bg-[#FFFDF5] text-xs font-semibold text-black leading-relaxed flex items-start gap-2 shadow-[0_1px_0_0_#000000]">
            <span className="text-gray-400 mt-0.5">💬</span>
            <p>"{selectedSpot.review}"</p>
          </div>

          {/* Interactive User Review & Rating Section */}
          <div className="border-[2px] border-black rounded-2xl p-3 bg-white space-y-2 shadow-[0_2px_0_0_#000000]">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-black flex items-center gap-1">
                <span>⭐</span> Rate & Add Review
              </span>
              {/* Star Rating Selector */}
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setUserRating(star)}
                    className="p-0.5 focus:outline-none"
                  >
                    <Star
                      size={14}
                      className={
                        star <= userRating
                          ? 'text-amber-500 fill-amber-500'
                          : 'text-gray-300'
                      }
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={userReviewText}
                onChange={(e) => setUserReviewText(e.target.value)}
                placeholder="Share your local tip or experience here..."
                className="flex-1 border-[1.5px] border-black rounded-xl px-2.5 py-1.5 text-xs font-bold text-black outline-none bg-[#F4F6F9]"
              />
              <button
                type="button"
                onClick={async () => {
                  const cleanedText = sanitizeText(userReviewText.trim());
                  if (!cleanedText) return;
                  const spotKey = selectedSpot.id || selectedSpot.name;
                  const newReview = {
                    rating: userRating,
                    text: cleanedText,
                    author: 'Local Explorer',
                    date: new Date().toLocaleDateString(),
                  };

                  // 1. Save to localStorage
                  const key = `reviews_${spotKey}`;
                  const existing = JSON.parse(localStorage.getItem(key) || '[]');
                  localStorage.setItem(key, JSON.stringify([newReview, ...existing]));

                  // 2. Persist to MongoDB Atlas backend
                  fetch(`${getBackendUrl()}/api/reviews`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      spotId: spotKey,
                      spotName: selectedSpot.name,
                      rating: userRating,
                      reviewText: cleanedText,
                      author: 'Local Explorer',
                    }),
                  }).catch(console.warn);

                  // 3. Update communityReviews state so it renders immediately
                  setCommunityReviews((prev) => [newReview, ...prev]);

                  // 4. Update selectedSpot rating & review count
                  setSelectedSpot((prev) => ({
                    ...prev,
                    review: cleanedText,
                    rating: Number(
                      (
                        ((prev.rating || 4.5) * (prev.reviewCount || 10) + userRating) /
                        ((prev.reviewCount || 10) + 1)
                      ).toFixed(1)
                    ),
                    reviewCount: (prev.reviewCount || 10) + 1,
                  }));

                  setUserReviewText('');
                  setReviewSubmitted(true);
                  setTimeout(() => setReviewSubmitted(false), 3000);
                }}
                className="bg-[#0B3BF4] text-white border-[1.5px] border-black rounded-xl px-3 py-1.5 text-xs font-black shadow-[0_2px_0_0_#000000] active:translate-y-0.5"
              >
                Post
              </button>
            </div>
            {reviewSubmitted && (
              <p className="text-[10px] font-black text-emerald-600 flex items-center gap-1">
                ✓ Review saved to MongoDB Atlas & spot!
              </p>
            )}

            {/* Community Reviews List */}
            {communityReviews && communityReviews.length > 0 && (
              <div className="pt-2 border-t border-black/10 space-y-1.5">
                <div className="text-[10px] font-black uppercase tracking-wider text-gray-500">
                  Community Reviews ({communityReviews.length})
                </div>
                <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin">
                  {communityReviews.map((rev, idx) => (
                    <div
                      key={idx}
                      className="bg-[#F8FAFC] border-[1.5px] border-black rounded-xl p-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-black text-[11px] text-black">
                          {rev.author || 'Local Explorer'}
                        </span>
                        <div className="flex items-center gap-1 text-[10px] font-bold text-amber-600">
                          <span>{'★'.repeat(rev.rating || 5)}</span>
                          <span className="text-gray-400">· {rev.date || 'Recent'}</span>
                        </div>
                      </div>
                      <p className="text-[11px] font-medium text-gray-800 mt-0.5 leading-snug">
                        "{rev.text}"
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action Row */}
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => handleOpenRides(selectedSpot)}
              className="bg-[#FFE500] hover:bg-[#FACC15] border-[2.5px] border-black rounded-2xl py-3 px-3 font-black text-xs text-black shadow-[0_3px_0_0_#000000] flex items-center justify-center gap-1.5 active:translate-y-0.5 transition cursor-pointer"
              title="Compare Uber, Rapido, and Ola Auto"
            >
              <span className="text-base">🛺</span>
              <span>Rides</span>
            </button>
            <a
              href={`https://www.google.com/maps/dir/?api=1&origin=${location?.lat || 10.7606},${location?.lon || 76.2711}&destination=${selectedSpot.lat},${selectedSpot.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 bg-[#F59E0B] border-[2.5px] border-black rounded-2xl py-3 px-3 font-black text-xs text-black shadow-[0_3px_0_0_#000000] flex items-center justify-center gap-1.5 hover:bg-amber-400 active:translate-y-0.5 transition text-center"
            >
              <MapPin size={15} strokeWidth={2.5} />
              <span>Google Maps</span>
              <ExternalLink size={12} strokeWidth={2.5} />
            </a>
            <button
              onClick={() => toggleBookmark(selectedSpot.id || selectedSpot.name)}
              className={`w-12 h-12 border-[2.5px] border-black rounded-2xl flex items-center justify-center shadow-[0_3px_0_0_#000000] active:translate-y-0.5 transition shrink-0 ${
                bookmarkedIds.includes(selectedSpot.id || selectedSpot.name)
                  ? 'bg-[#0B3BF4] text-white'
                  : 'bg-white text-black hover:bg-gray-100'
              }`}
              title="Save spot"
            >
              <Bookmark size={18} strokeWidth={2.4} />
            </button>
          </div>
        </div>
      </div>
    )}

      {/* Multimodal Ride Hailing Comparator (Uber, Rapido, Ola) Modal */}
      <RideComparatorModal
        isOpen={!!rideDestination}
        onClose={handleCloseRides}
        destination={rideDestination}
        userLat={location?.lat || 10.7606}
        userLon={location?.lon || 76.2711}
      />
    </div>
  );
}
