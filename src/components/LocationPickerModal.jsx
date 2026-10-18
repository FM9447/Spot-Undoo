import { useState, useMemo } from 'react';
import { MapPin, Navigation, Search, Check, X, Sparkles, Building2 } from 'lucide-react';
import { KERALA_CITIES } from '../data/keralaCitiesData';

export default function LocationPickerModal({
  isOpen,
  onClose,
  currentLocation,
  onSelectLocation,
  showAllKeralaOption = true,
}) {
  const [searchQuery, setSearchQuery] = useState('');

  // Collect all searchable cities and individual spots
  const { citiesList, spotsList } = useMemo(() => {
    const cities = Object.entries(KERALA_CITIES).map(([key, city]) => ({
      key,
      name: city.name,
      displayName: city.displayName || city.name,
      district: city.district || 'Kerala',
      lat: city.hub?.lat || 10.7606,
      lng: city.hub?.lng || 76.2711,
      spotsCount: (city.spots || []).length,
    }));

    let userSpots = [];
    try {
      userSpots = JSON.parse(localStorage.getItem('userSpots') || '[]');
    } catch {}

    const allSpots = [
      ...Object.entries(KERALA_CITIES).flatMap(([key, city]) =>
        (city.spots || []).map((s) => ({
          ...s,
          cityKey: key,
          cityName: city.name,
          district: city.district || 'Kerala',
        }))
      ),
      ...userSpots.map((s) => ({
        ...s,
        cityKey: s.city || 'Custom',
        cityName: s.city || 'User Added',
        district: 'Kerala',
      })),
    ];

    return { citiesList: cities, spotsList: allSpots };
  }, []);

  // Filtered cities and spots
  const { filteredCities, filteredSpots } = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) {
      return {
        filteredCities: citiesList.slice(0, 8),
        filteredSpots: spotsList.slice(0, 10),
      };
    }

    const matchesCity = citiesList.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.district.toLowerCase().includes(q) ||
        c.displayName.toLowerCase().includes(q)
    );

    const matchesSpot = spotsList.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.category || '').toLowerCase().includes(q) ||
        (s.cityName || '').toLowerCase().includes(q) ||
        (s.district || '').toLowerCase().includes(q) ||
        (s.tags || []).some((t) => t.toLowerCase().includes(q))
    );

    return {
      filteredCities: matchesCity.slice(0, 10),
      filteredSpots: matchesSpot.slice(0, 20),
    };
  }, [searchQuery, citiesList, spotsList]);

  if (!isOpen) return null;

  const handleSelectLiveGPS = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          onSelectLocation({
            lat: pos.coords.latitude,
            lon: pos.coords.longitude,
            label: 'Your Location (Live GPS)',
            isLive: true,
          });
          onClose();
        },
        () => {
          alert('GPS permission was denied. Defaulting to current spot.');
          onSelectLocation({
            lat: currentLocation?.lat || 10.7606,
            lon: currentLocation?.lon || 76.2711,
            label: currentLocation?.label || 'Your Location',
            isLive: false,
          });
          onClose();
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    } else {
      alert('Geolocation is not supported by your browser.');
    }
  };

  const handleSelectCity = (city) => {
    onSelectLocation({
      lat: city.lat,
      lon: city.lng,
      label: `${city.name} (${city.district})`,
      cityKey: city.key,
      cityName: city.name,
      isLive: false,
    });
    onClose();
  };

  const handleSelectSpot = (spot) => {
    onSelectLocation({
      lat: spot.lat,
      lon: spot.lng,
      label: spot.name,
      cityName: spot.cityName,
      cityKey: spot.cityKey,
      spotId: spot.id,
      isLive: false,
    });
    onClose();
  };

  const handleSelectAllKerala = () => {
    onSelectLocation({
      lat: 10.8505,
      lon: 76.2711,
      label: 'All Kerala (Entire State)',
      isAllKerala: true,
      isLive: false,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-[#FFFDF7] border-[3px] border-black rounded-[28px] p-4 shadow-[0_8px_0_0_#000000] space-y-3 max-h-[85vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b-[2px] border-black">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#0B3BF4] border-[2px] border-black flex items-center justify-center text-white shadow-[0_2px_0_0_#000000]">
              <MapPin size={16} strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="text-sm font-black text-black uppercase tracking-tight">
                Choose Starting Point
              </h3>
              <p className="text-[10px] font-bold text-gray-500">
                Live GPS or any specific Kerala landmark
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 border-[2px] border-black flex items-center justify-center font-black text-xs cursor-pointer shadow-[0_1.5px_0_0_#000000] active:translate-y-0.5 transition"
          >
            ✕
          </button>
        </div>

        {/* Search Bar (Google Maps style) */}
        <div className="flex items-center gap-2 bg-white border-[2px] border-black rounded-2xl px-3 py-2 shadow-[0_2px_0_0_#000000]">
          <Search size={15} className="text-gray-400 shrink-0" strokeWidth={2.5} />
          <input
            type="text"
            autoFocus
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search city, station, or specific spot in Kerala..."
            className="w-full text-xs font-bold text-black placeholder-gray-400 outline-none bg-transparent"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="text-xs text-gray-500 hover:text-black font-black cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        {/* Scrollable list */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-thin">
          
          {/* Quick Options */}
          <div className="space-y-1.5">
            {/* Option A: Your Location (Live GPS) */}
            <button
              type="button"
              onClick={handleSelectLiveGPS}
              className={`w-full text-left p-2.5 rounded-2xl border-[2px] border-black flex items-center justify-between transition cursor-pointer shadow-[0_2px_0_0_#000000] active:translate-y-0.5 ${
                currentLocation?.label?.includes('Live GPS') || currentLocation?.label === 'Your Location'
                  ? 'bg-[#0B3BF4] text-white'
                  : 'bg-emerald-50 text-black hover:bg-emerald-100'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-emerald-300 animate-pulse shrink-0" />
                <div>
                  <div className="text-xs font-black flex items-center gap-1">
                    <span>Your Location (Live GPS)</span>
                    <span className="text-[9px] bg-black text-[#FFE500] px-1.5 py-0.2 rounded-full font-black uppercase">
                      Exact GPS
                    </span>
                  </div>
                  <div className={`text-[10px] mt-0.5 font-bold ${
                    currentLocation?.label?.includes('Live GPS') ? 'text-blue-100' : 'text-gray-600'
                  }`}>
                    {currentLocation?.isLive ? 'Currently active' : 'Tap to acquire live phone coordinates'}
                  </div>
                </div>
              </div>
              <Navigation size={15} strokeWidth={2.5} className="shrink-0" />
            </button>

            {/* Option B: All Kerala Spots (If enabled) */}
            {showAllKeralaOption && (
              <button
                type="button"
                onClick={handleSelectAllKerala}
                className="w-full text-left p-2.5 rounded-2xl border-[2px] border-black bg-[#FFFDE6] hover:bg-yellow-100 text-black flex items-center justify-between transition cursor-pointer shadow-[0_2px_0_0_#000000] active:translate-y-0.5"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-base">🌴</span>
                  <div>
                    <div className="text-xs font-black">All Kerala (Entire State)</div>
                    <div className="text-[10px] text-gray-600 font-bold">
                      Explore all 165 spots across all 14 districts
                    </div>
                  </div>
                </div>
                <Sparkles size={15} className="text-amber-600 shrink-0" />
              </button>
            )}
          </div>

          {/* Section 1: Specific Places & Landmarks */}
          {filteredSpots.length > 0 && (
            <div className="space-y-1.5">
              <div className="text-[10px] font-black uppercase text-gray-500 px-1 flex items-center justify-between">
                <span>📍 Specific Places & Landmarks ({filteredSpots.length})</span>
                <span className="text-[9px] text-gray-400">Tap to start from here</span>
              </div>
              <div className="space-y-1.5">
                {filteredSpots.map((spot) => {
                  const isSelected = currentLocation?.label === spot.name;
                  return (
                    <button
                      key={spot.id || spot.name}
                      type="button"
                      onClick={() => handleSelectSpot(spot)}
                      className={`w-full text-left p-2 rounded-xl border-[1.5px] border-black flex items-center justify-between transition cursor-pointer shadow-[0_1.5px_0_0_#000000] active:translate-y-0.5 ${
                        isSelected
                          ? 'bg-black text-[#FFE500]'
                          : 'bg-white hover:bg-gray-50 text-black'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0 pr-2">
                        {spot.photo ? (
                          <img
                            src={spot.photo}
                            alt=""
                            className="w-9 h-9 rounded-lg object-cover border border-black shrink-0"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-lg bg-gray-200 border border-black flex items-center justify-center text-xs shrink-0">
                            📍
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="text-xs font-black truncate">{spot.name}</div>
                          <div className="text-[9.5px] font-bold text-gray-500 flex items-center gap-1.5 truncate mt-0.5">
                            <span className={isSelected ? 'text-[#FFE500]' : 'text-[#0B3BF4]'}>
                              {spot.cityName || spot.cityKey}
                            </span>
                            <span>•</span>
                            <span className="truncate">{spot.category}</span>
                            <span>•</span>
                            <span>₹{spot.expense === 0 ? 'Free' : spot.expense}</span>
                          </div>
                        </div>
                      </div>
                      {isSelected ? (
                        <Check size={14} className="text-[#FFE500] shrink-0" strokeWidth={3} />
                      ) : (
                        <span className="text-[9px] font-black text-gray-400 shrink-0">Select ➔</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Section 2: Cities & Station Hubs */}
          {filteredCities.length > 0 && (
            <div className="space-y-1.5 pt-1 border-t border-black/10">
              <div className="text-[10px] font-black uppercase text-gray-500 px-1 flex items-center gap-1">
                <Building2 size={11} />
                <span>Cities & Railway Station Hubs ({filteredCities.length})</span>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {filteredCities.map((city) => {
                  const isSelected =
                    currentLocation?.label?.toLowerCase().includes(city.name.toLowerCase()) ||
                    currentLocation?.cityName?.toLowerCase() === city.name.toLowerCase();
                  return (
                    <button
                      key={city.key}
                      type="button"
                      onClick={() => handleSelectCity(city)}
                      className={`text-left p-2 rounded-xl border-[1.5px] border-black transition cursor-pointer shadow-[0_1.5px_0_0_#000000] active:translate-y-0.5 truncate ${
                        isSelected
                          ? 'bg-black text-[#FFE500]'
                          : 'bg-white hover:bg-gray-50 text-black'
                      }`}
                    >
                      <div className="text-xs font-black truncate">🚉 {city.name}</div>
                      <div className={`text-[9px] font-bold truncate mt-0.5 ${isSelected ? 'text-gray-300' : 'text-gray-500'}`}>
                        {city.district} · {city.spotsCount} spots
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-black/10 flex items-center justify-between text-[10px] font-bold text-gray-500">
          <span>Active: {currentLocation?.label || 'Not Set'}</span>
          <button
            type="button"
            onClick={onClose}
            className="font-black text-black hover:underline cursor-pointer"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
}
