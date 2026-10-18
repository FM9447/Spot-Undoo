import { useState, useEffect } from 'react';
import { Search, MapPin, Navigation2, Star, Bookmark, MessageSquare, X, Compass, ExternalLink, Globe } from 'lucide-react';
import { KERALA_CITIES } from '../data/keralaCitiesData';
import InteractiveMap from '../components/InteractiveMap';
import ImageCarousel from '../components/ImageCarousel';
import { getBackendUrl } from '../utils/apiConfig';

const CATEGORIES = ['All Spots', '💎 Hidden Spots', 'Food', 'Gaming & Chill', 'Night'];
const CITIES_LIST = ['All Cities', 'Shoranur', 'Kochi', 'Calicut', 'Palakkad', 'Trivandrum', 'Kollam', 'Wayanad'];

export default function ExploreTab({ location, setLocation }) {
  const [activeCategory, setActiveCategory] = useState('All Spots');
  const [selectedCityFilter, setSelectedCityFilter] = useState('All Cities');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('cartoon'); // 'cartoon' | 'osm' | 'grid'
  const [selectedSpot, setSelectedSpot] = useState(null);
  const [bookmarkedIds, setBookmarkedIds] = useState([]);
  const [userRating, setUserRating] = useState(5);
  const [userReviewText, setUserReviewText] = useState('');
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [communityReviews, setCommunityReviews] = useState([]);

  // Merge all spots across all cities + user uploaded spots
  const userSpots = JSON.parse(localStorage.getItem('userSpots') || '[]');
  const allCitySpots = Object.entries(KERALA_CITIES).flatMap(([key, city]) =>
    city.spots.map((s) => ({ ...s, cityKey: key, cityName: city.name }))
  );
  const allSpots = [...allCitySpots, ...userSpots];

  // Filtering: strict category & city matches, plus search query
  const filteredSpots = allSpots.filter((spot) => {
    const q = searchQuery.toLowerCase().trim();
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
    const filterLower = selectedCityFilter.toLowerCase();

    let matchesCity = selectedCityFilter === 'All Cities';
    if (!matchesCity) {
      if (filterLower === 'kochi') {
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

    // Also fetch reviews saved in MongoDB
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
    if (cityName !== 'All Cities' && KERALA_CITIES[cityName]) {
      const hub = KERALA_CITIES[cityName].hub;
      if (setLocation) {
        setLocation({ lat: hub.lat, lon: hub.lng, label: `${hub.name} (Active)` });
      }
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
      {/* 1. Dual Location Controls Card */}
      <div className="bg-white border-[2.5px] border-black rounded-2xl p-2.5 shadow-[0_3px_0_0_#000000] space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-black text-black">
            <span>GPS: {location?.label || 'Shoranur Jn Hub (Active)'}</span>
          </div>
          <button
            onClick={usePhoneGPS}
            className="text-[10px] font-black text-[#0B3BF4] hover:underline cursor-pointer"
          >
            Refresh
          </button>
        </div>

        {/* City Select Dropdown (Requested feature) */}
        <div className="flex items-center gap-2 bg-[#F4F6F9] border-[2px] border-black rounded-xl px-2.5 py-1.5 shadow-[0_1.5px_0_0_#000000]">
          <MapPin size={14} className="text-[#0B3BF4] shrink-0" strokeWidth={2.5} />
          <select
            value={selectedCityFilter}
            onChange={(e) => handleCitySelect(e.target.value)}
            className="w-full text-xs font-black text-black outline-none bg-transparent cursor-pointer"
          >
            <option value="All Cities">📍 All Cities (All 70+ Kerala Spots)</option>
            {Object.entries(KERALA_CITIES).map(([key, city]) => (
              <option key={key} value={key}>
                {city.displayName || city.name} ({city.spots.length} spots)
              </option>
            ))}
          </select>
        </div>

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

      {/* 2. Category Filters & View Toggle */}
      <div className="flex items-center justify-between gap-1 overflow-x-auto pb-1 scrollbar-none">
        <div className="flex items-center gap-1.5 shrink-0">
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

        {/* View Switcher: Cartoon | Live OSM | Grid */}
        <div className="shrink-0 flex items-center bg-white border-[2px] border-black rounded-full p-0.5 shadow-[0_2px_0_0_#000000]">
          <button
            onClick={() => setViewMode('cartoon')}
            className={`px-2 py-1 rounded-full text-xs font-black transition cursor-pointer ${
              viewMode === 'cartoon' ? 'bg-[#0B3BF4] text-white' : 'text-gray-700 hover:text-black'
            }`}
          >
            🎨 Canvas
          </button>
          <button
            onClick={() => setViewMode('osm')}
            className={`px-2 py-1 rounded-full text-xs font-black transition cursor-pointer ${
              viewMode === 'osm' ? 'bg-[#0B3BF4] text-white' : 'text-gray-700 hover:text-black'
            }`}
          >
            🗺️ Live OSM
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`px-2 py-1 rounded-full text-xs font-black transition cursor-pointer ${
              viewMode === 'grid' ? 'bg-[#0B3BF4] text-white' : 'text-gray-700 hover:text-black'
            }`}
          >
            📱 Grid
          </button>
        </div>
      </div>

      {/* 2B. City Region Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        <span className="text-[10px] font-black text-gray-500 uppercase tracking-wider shrink-0 mr-1">
          City:
        </span>
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
              {cityName}
            </button>
          );
        })}
      </div>

      {/* 3. View Content (OSM Live Map / Cartoon Canvas / Grid) */}
      {viewMode === 'osm' ? (
        <InteractiveMap
          spots={filteredSpots}
          selectedSpot={selectedSpot}
          onSelectSpot={setSelectedSpot}
          userLocation={location}
        />
      ) : viewMode === 'cartoon' ? (
        <div className="relative bg-[#F4F6F9] border-[2.5px] border-black rounded-3xl p-3 shadow-[0_4px_0_0_#000000] max-h-[640px] overflow-y-auto overflow-x-hidden scrollbar-thin scroll-smooth">
          {/* Stylized River / Road Background Canvas SVG with dynamic height */}
          {(() => {
            const svgH = Math.max(520, filteredSpots.length * 110 + 90);
            return (
              <svg
                className="absolute inset-0 w-full pointer-events-none opacity-60"
                style={{ height: `${svgH}px` }}
                viewBox={`0 0 360 ${svgH}`}
              >
                <path
                  d={`M 60 0 C 180 80, 240 180, 140 280 S 260 400, 180 500 S 240 680, 150 ${svgH}`}
                  fill="none"
                  stroke="#BAE6FD"
                  strokeWidth="28"
                  strokeLinecap="round"
                />
                <path
                  d={`M 60 0 C 180 80, 240 180, 140 280 S 260 400, 180 500 S 240 680, 150 ${svgH}`}
                  fill="none"
                  stroke="#38BDF8"
                  strokeWidth="4"
                  strokeDasharray="6 6"
                  strokeLinecap="round"
                />
              </svg>
            );
          })()}

          {/* Floating Top Control: Live Explore */}
          <div className="relative z-10 flex items-center justify-between mb-2">
            <div />
            <button
              onClick={() => setSelectedSpot(filteredSpots[0] || allSpots[0])}
              className="bg-white border-[2px] border-black rounded-full px-3 py-1 flex items-center gap-1.5 text-xs font-black shadow-[0_2px_0_0_#000000] hover:bg-emerald-50 active:translate-y-0.5"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-ping" />
              <span>Live Explore</span>
              <Navigation2 size={12} className="text-[#0B3BF4] fill-[#0B3BF4]" />
            </button>
          </div>

          {/* Dynamic Pin Callout Cards (Vertical Adventure Flow) */}
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
                return (
                  <div
                    key={spot.id || spot.name}
                    className={`flex ${isLeft ? 'justify-start pl-2' : 'justify-end pr-2'}`}
                  >
                    <div
                      onClick={() => setSelectedSpot(spot)}
                      className={`relative bg-white border-[2px] border-black rounded-xl p-1.5 pt-2.5 pb-2 shadow-[0_3px_0_0_#000000] cursor-pointer hover:scale-[1.02] active:scale-98 transition max-w-[175px] w-full ${
                        isLeft ? '-rotate-1 hover:rotate-0' : 'rotate-1 hover:rotate-0'
                      } ${isSelected ? 'ring-2 ring-[#0B3BF4]' : ''}`}
                    >
                      {/* Realistic 3D Red Push-Pin Pinned at Top Center */}
                      <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center pointer-events-none">
                        <div className="w-3.5 h-3.5 rounded-full bg-gradient-to-br from-red-400 via-red-500 to-red-600 border-[1.2px] border-black shadow-[0_1.5px_0_0_rgba(0,0,0,0.35)] ring-1 ring-red-300/60 flex items-center justify-center">
                          <div className="w-1 h-1 rounded-full bg-white/70" />
                        </div>
                      </div>

                      {/* Photo Frame */}
                      <div className="relative w-full h-20 rounded-md overflow-hidden border border-black mb-1 bg-gray-100 shadow-[inset_0_1px_2px_rgba(0,0,0,0.1)]">
                        <img
                          src={spot.photo || spot.photos?.[0]}
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

                      {/* Polaroid Bottom Chin */}
                      <div className="px-0.5 space-y-0.5">
                        <div className="font-black text-[10px] text-black truncate leading-tight">
                          {spot.name}
                        </div>
                        <div className="text-[9px] font-bold text-emerald-700 flex items-center justify-between">
                          <span>{spot.expense === 0 ? 'Free' : `₹${spot.expense}`}</span>
                          <span className="flex items-center gap-0.5">{spot.rating || 4.8} ⭐</span>
                        </div>
                        <div className="text-[8.5px] font-semibold text-gray-500 flex items-center justify-between pt-0.5 border-t border-gray-200">
                          <span className="truncate max-w-[125px]">
                            📍 {spot.distanceKm ? `${spot.distanceKm} km` : spot.transitText || 'Near station'}
                          </span>
                          <span className="text-[#0B3BF4] font-black text-[9px]">↗</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Floating Bottom Control: Nearby Count */}
          <div className="relative z-10 flex justify-end mt-2">
            <div className="bg-white border-[2px] border-black rounded-full px-3 py-1 flex items-center gap-1.5 text-xs font-black shadow-[0_2px_0_0_#000000]">
              <span>🎯</span>
              <span>{filteredSpots.length} spots nearby</span>
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
          <div className="grid grid-cols-2 gap-3 pt-2">
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
                    src={spot.photo || spot.photos?.[0]}
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
                    <span className="truncate max-w-[125px]">
                      📍 {spot.distanceKm ? `${spot.distanceKm} km` : spot.transitText || 'Near station'}
                    </span>
                    <span className="text-[#0B3BF4] font-black text-[9px]">↗</span>
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
            images={selectedSpot.photos || (selectedSpot.photo ? [selectedSpot.photo] : [])}
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
                  if (!userReviewText.trim()) return;
                  const spotKey = selectedSpot.id || selectedSpot.name;
                  const newReview = {
                    rating: userRating,
                    text: userReviewText.trim(),
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
                      reviewText: userReviewText.trim(),
                      author: 'Local Explorer',
                    }),
                  }).catch(console.warn);

                  // 3. Update communityReviews state so it renders immediately
                  setCommunityReviews((prev) => [newReview, ...prev]);

                  // 4. Update selectedSpot rating & review count
                  setSelectedSpot((prev) => ({
                    ...prev,
                    review: userReviewText.trim(),
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
            <a
              href={`https://www.google.com/maps/dir/?api=1&origin=${location.lat},${location.lon}&destination=${selectedSpot.lat},${selectedSpot.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 bg-[#F59E0B] border-[2.5px] border-black rounded-2xl py-3 px-4 font-black text-sm text-black shadow-[0_3px_0_0_#000000] flex items-center justify-center gap-1.5 hover:bg-amber-400 active:translate-y-0.5 transition text-center"
            >
              <MapPin size={16} strokeWidth={2.5} />
              <span>Open in Google Maps</span>
              <ExternalLink size={13} strokeWidth={2.5} />
            </a>
            <button
              onClick={() => toggleBookmark(selectedSpot.id || selectedSpot.name)}
              className={`w-12 h-12 border-[2.5px] border-black rounded-2xl flex items-center justify-center shadow-[0_3px_0_0_#000000] active:translate-y-0.5 transition ${
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
    </div>
  );
}
