import { useState, useMemo } from 'react';
import { X, ExternalLink, Zap, Clock, ShieldCheck, ArrowUpDown, AlertCircle, MapPin, Info, CheckCircle2 } from 'lucide-react';
import { roadDistanceKm } from '../utils/plannerMath';

export const KERALA_TOWN_HUBS = {
  pattambi: { name: 'Pattambi Railway Station', lat: 10.80486, lng: 76.17802 },
  shoranur: { name: 'Shoranur Junction Station', lat: 10.7606, lng: 76.2711 },
  kochi: { name: 'Ernakulam South Station', lat: 9.9680, lng: 76.2890 },
  ernakulam: { name: 'Ernakulam South Station', lat: 9.9680, lng: 76.2890 },
  calicut: { name: 'Kozhikode Railway Station', lat: 11.2460, lng: 75.7830 },
  kozhikode: { name: 'Kozhikode Railway Station', lat: 11.2460, lng: 75.7830 },
  palakkad: { name: 'Palakkad Fort / Town Stand', lat: 10.7867, lng: 76.6548 },
  trivandrum: { name: 'Thiruvananthapuram Central', lat: 8.4875, lng: 76.9525 },
  thiruvananthapuram: { name: 'Thiruvananthapuram Central', lat: 8.4875, lng: 76.9525 },
  kollam: { name: 'Kollam Junction Station', lat: 8.8833, lng: 76.6000 },
  wayanad: { name: 'Kalpetta Town Bus Stand', lat: 11.6050, lng: 76.0828 },
  kalpetta: { name: 'Kalpetta Town Bus Stand', lat: 11.6050, lng: 76.0828 },
};

export function getKeralaRideAvailability(lat, lng, name = '') {
  const lower = (name || '').toLowerCase();

  // Explicit check for non-app cab areas in Kerala
  const isPattambi = lower.includes('pattambi') || (lat >= 10.78 && lat <= 10.84 && lng >= 76.15 && lng <= 76.22);
  const isShoranur = lower.includes('shoranur') || (lat >= 10.74 && lat <= 10.78 && lng >= 76.25 && lng <= 76.30);
  const isWayanad = lower.includes('wayanad') || lower.includes('kalpetta') || (lat >= 11.55 && lat <= 11.90);
  const isPalakkadRural = (lower.includes('palakkad') && !lower.includes('town')) || (lat >= 10.65 && lat <= 10.95 && lng >= 76.45 && lng <= 76.75 && !lower.includes('town'));

  // Cities with active app-cabs (Uber/Rapido)
  const isKochi = lower.includes('kochi') || lower.includes('ernakulam') || (lat >= 9.85 && lat <= 10.15 && lng >= 76.15 && lng <= 76.45);
  const isTrivandrum = lower.includes('trivandrum') || lower.includes('thiruvananthapuram') || (lat >= 8.40 && lat <= 8.65 && lng >= 76.85 && lng <= 77.05);
  const isCalicut = lower.includes('calicut') || lower.includes('kozhikode') || (lat >= 11.15 && lat <= 11.38 && lng >= 75.70 && lng <= 75.92);
  const isThrissur = lower.includes('thrissur') || (lat >= 10.45 && lat <= 10.60 && lng >= 76.15 && lng <= 76.28);

  const hasUber = isKochi || isTrivandrum || isCalicut;
  const hasRapido = isKochi || isTrivandrum || isCalicut || isThrissur;
  const noAppCabs = isPattambi || isShoranur || isWayanad || isPalakkadRural || (!hasUber && !hasRapido);

  let hubLabel = 'Kerala Regional Hub';
  if (isPattambi) hubLabel = 'Pattambi Town Hub';
  else if (isShoranur) hubLabel = 'Shoranur Junction Hub';
  else if (isWayanad) hubLabel = 'Wayanad High Ranges';
  else if (isKochi) hubLabel = 'Kochi Metro Hub';
  else if (isTrivandrum) hubLabel = 'Trivandrum Hub';
  else if (isCalicut) hubLabel = 'Calicut Hub';

  return {
    isPattambi,
    isShoranur,
    noAppCabs,
    hasUber,
    hasRapido,
    hubLabel,
  };
}

export default function RideComparatorModal({ isOpen, onClose, destination, userLat, userLon }) {
  if (!isOpen || !destination) return null;

  const destLat = destination.lat;
  const destLng = destination.lng || destination.lon;
  const destName = destination.name || 'Destination';

  // 1. Find the Town Transit Station / Central Hub for this destination
  const townHub = useMemo(() => {
    const lower = (destName + ' ' + (destination.cityName || '') + ' ' + (destination.cityKey || '')).toLowerCase();
    for (const [key, hub] of Object.entries(KERALA_TOWN_HUBS)) {
      if (lower.includes(key)) return hub;
    }
    // Proximity fallback to nearest town hub
    let nearest = null;
    let minD = Infinity;
    for (const hub of Object.values(KERALA_TOWN_HUBS)) {
      const d = roadDistanceKm(destLat, destLng, hub.lat, hub.lng);
      if (d < minD) {
        minD = d;
        nearest = hub;
      }
    }
    return nearest || { name: 'Town Central Stand', lat: destLat, lng: destLng };
  }, [destLat, destLng, destName, destination]);

  // 2. Compute live GPS distance and town hub distance
  const liveGpsDist = useMemo(() => {
    if (!userLat || !userLon || !destLat || !destLng) return null;
    return Math.max(0.2, roadDistanceKm(userLat, userLon, destLat, destLng));
  }, [userLat, userLon, destLat, destLng]);

  const townHubDist = useMemo(() => {
    if (!destLat || !destLng || !townHub) return 1.5;
    return Math.max(0.3, roadDistanceKm(townHub.lat, townHub.lng, destLat, destLng));
  }, [destLat, destLng, townHub]);

  // Are we currently within 25 km of the destination?
  const isUserInSameCity = liveGpsDist !== null && liveGpsDist <= 25;

  // Origin mode state: 'live' (User's live location) or 'hub' (Town station hub)
  const [originMode, setOriginMode] = useState(() => (isUserInSameCity ? 'live' : 'hub'));
  const [filterMode, setFilterMode] = useState('cheapest'); // 'cheapest', 'fastest', 'autos', 'bikes', 'cabs'
  const [showTechDetails, setShowTechDetails] = useState(false);

  // Active distance used for calculations
  const distKm = originMode === 'live' && liveGpsDist !== null ? liveGpsDist : townHubDist;
  const currentOriginName = originMode === 'live' ? 'Your Live Location' : townHub.name;

  // Regional Kerala availability detection
  const availability = useMemo(() => {
    return getKeralaRideAvailability(destLat, destLng, destName);
  }, [destLat, destLng, destName]);

  // Dynamic Kerala ride calculation engine
  const rideOptions = useMemo(() => {
    const d = distKm;
    const now = new Date();
    const hour = now.getHours();
    // Night surcharge (10pm - 5am: 1.5x official Kerala MVD meter tariff; rush hours: 1.15x)
    const isNight = hour >= 22 || hour < 5;
    const isRush = (hour >= 8 && hour <= 10) || (hour >= 17 && hour <= 20);
    const peakFactor = isNight ? 1.5 : (isRush ? 1.15 : 1.0);

    const options = [];

    // 1. Official Kerala Stand Auto-Rickshaw (Regulated Kerala MVD Govt Meter)
    // Rate: ₹30 min for 1.5 km, ₹15 per km thereafter
    const standAutoBase = Math.round((30 + Math.max(0, d - 1.5) * 15) * (isNight ? 1.5 : 1.0));
    options.push({
      id: 'kerala-stand-auto',
      provider: availability.isPattambi ? 'Pattambi Stand' : (availability.isShoranur ? 'Shoranur Stand' : 'Kerala Auto Stand'),
      service: 'Kerala Meter Auto',
      type: 'auto',
      badgeColor: 'bg-black text-[#FFE500] border-black',
      icon: '🛺',
      basePrice: standAutoBase,
      etaMins: Math.max(2, Math.ceil(d * 2.6)),
      available: true,
      appScheme: `https://www.google.com/maps/dir/?api=1&destination=${destLat},${destLng}&travelmode=driving`,
      webUrl: `https://www.google.com/maps/dir/?api=1&destination=${destLat},${destLng}&travelmode=driving`,
      tag: 'Official Kerala MVD Rate',
      note: availability.noAppCabs ? 'Always available at Station & Town Stands' : 'Available at all local stands',
    });

    // 2. Town Tourist Taxi Stand (Omni / Tourist Sedan)
    // Local stand rate: ₹300-₹350 min (covers up to 10 km), ₹18/km thereafter
    const taxiBase = Math.round(Math.max(300, (300 + Math.max(0, d - 10) * 18)) * (isNight ? 1.3 : 1.0));
    options.push({
      id: 'town-taxi',
      provider: availability.isPattambi ? 'Pattambi Taxi Stand' : 'Town Taxi Stand',
      service: 'Station Tourist Taxi',
      type: 'cab',
      badgeColor: 'bg-[#0B3BF4] text-white border-black',
      icon: '🚕',
      basePrice: taxiBase,
      etaMins: Math.max(4, Math.ceil(d * 2.8)),
      available: true,
      appScheme: `https://www.google.com/maps/dir/?api=1&destination=${destLat},${destLng}&travelmode=driving`,
      webUrl: `https://www.google.com/maps/dir/?api=1&destination=${destLat},${destLng}&travelmode=driving`,
      tag: 'Omni / Sedan / Innova',
      note: 'Available at Railway Station Stand',
    });

    // 3. Local Stage Carriage / KSRTC Bus
    if (d >= 1.2) {
      options.push({
        id: 'local-bus',
        provider: 'Kerala Bus',
        service: 'Local / KSRTC Bus',
        type: 'bus',
        badgeColor: 'bg-emerald-600 text-white border-black',
        icon: '🚌',
        basePrice: d > 6 ? 22 : 12,
        etaMins: Math.max(8, Math.ceil(d * 3.5)),
        available: true,
        appScheme: `https://www.google.com/maps/dir/?api=1&destination=${destLat},${destLng}&travelmode=transit`,
        webUrl: `https://www.google.com/maps/dir/?api=1&destination=${destLat},${destLng}&travelmode=transit`,
        tag: 'Lowest Cost Transit',
        note: 'Frequent services from Town Bus Stand',
      });
    }

    // 4. App Cabs: Uber & Rapido
    if (!availability.noAppCabs) {
      // In Kochi, Trivandrum, Calicut
      options.push({
        id: 'rapido-bike',
        provider: 'Rapido',
        service: 'Bike Taxi',
        type: 'bike',
        badgeColor: 'bg-[#FFDE00] text-black border-black',
        icon: '🛵',
        basePrice: Math.round((20 + d * 11) * peakFactor),
        etaMins: Math.max(3, Math.ceil(d * 2.2)),
        available: true,
        appScheme: `rapido://ride?pickup=current&dest_lat=${destLat}&dest_lng=${destLng}`,
        webUrl: `https://rapido.bike`,
        tag: 'Fastest in Traffic',
      });
      options.push({
        id: 'uber-moto',
        provider: 'Uber',
        service: 'Uber Moto',
        type: 'bike',
        badgeColor: 'bg-black text-white border-black',
        icon: '🏍️',
        basePrice: Math.round((22 + d * 10.5) * peakFactor),
        etaMins: Math.max(3, Math.ceil(d * 2.3)),
        available: true,
        appScheme: `uber://?action=setPickup&pickup=my_location&dropoff[latitude]=${destLat}&dropoff[longitude]=${destLng}&dropoff[nickname]=${encodeURIComponent(destName)}`,
        webUrl: `https://m.uber.com/ul/?action=setPickup&pickup=my_location&dropoff[latitude]=${destLat}&dropoff[longitude]=${destLng}&dropoff[nickname]=${encodeURIComponent(destName)}`,
        tag: 'Affordable Solo',
      });
      options.push({
        id: 'uber-auto',
        provider: 'Uber',
        service: 'Uber Auto',
        type: 'auto',
        badgeColor: 'bg-[#000000] text-[#00E5FF] border-black',
        icon: '🛺',
        basePrice: Math.round((30 + Math.max(0, d - 1.5) * 18) * peakFactor),
        etaMins: Math.max(4, Math.ceil(d * 2.8)),
        available: true,
        appScheme: `uber://?action=setPickup&pickup=my_location&dropoff[latitude]=${destLat}&dropoff[longitude]=${destLng}&dropoff[nickname]=${encodeURIComponent(destName)}`,
        webUrl: `https://m.uber.com/ul/?action=setPickup&pickup=my_location&dropoff[latitude]=${destLat}&dropoff[longitude]=${destLng}&dropoff[nickname]=${encodeURIComponent(destName)}`,
        tag: 'App Meter Auto',
      });
      options.push({
        id: 'uber-go',
        provider: 'Uber',
        service: 'Uber Go (AC Cab)',
        type: 'cab',
        badgeColor: 'bg-[#111] text-white border-black',
        icon: '🚗',
        basePrice: Math.round((70 + d * 21) * peakFactor),
        etaMins: Math.max(6, Math.ceil(d * 3.2)),
        available: true,
        appScheme: `uber://?action=setPickup&pickup=my_location&dropoff[latitude]=${destLat}&dropoff[longitude]=${destLng}&dropoff[nickname]=${encodeURIComponent(destName)}`,
        webUrl: `https://m.uber.com/ul/?action=setPickup&pickup=my_location&dropoff[latitude]=${destLat}&dropoff[longitude]=${destLng}&dropoff[nickname]=${encodeURIComponent(destName)}`,
        tag: 'AC & Luggage',
      });
    } else {
      // In Pattambi / Shoranur / non-app areas: explicitly show as unavailable so user isn't deceived
      options.push({
        id: 'uber-go-unavail',
        provider: 'Uber',
        service: 'Uber Go',
        type: 'cab',
        badgeColor: 'bg-red-100 text-red-800 border-red-300',
        icon: '🚗',
        basePrice: null,
        etaMins: null,
        available: false,
        appScheme: `uber://`,
        webUrl: `https://m.uber.com`,
        tag: 'No Drivers in Area',
        note: `Uber is not operational in ${availability.hubLabel}`,
      });
      options.push({
        id: 'rapido-unavail',
        provider: 'Rapido',
        service: 'Rapido Bike',
        type: 'bike',
        badgeColor: 'bg-red-100 text-red-800 border-red-300',
        icon: '🛵',
        basePrice: null,
        etaMins: null,
        available: false,
        appScheme: `rapido://`,
        webUrl: `https://rapido.bike`,
        tag: 'No Service',
        note: `Rapido is not operational in ${availability.hubLabel}`,
      });
    }

    // 5. Walking Route (if reasonable distance)
    if (d <= 2.5) {
      options.push({
        id: 'walk',
        provider: 'Walking',
        service: 'Walk Trail',
        type: 'walk',
        badgeColor: 'bg-emerald-500 text-white border-black',
        icon: '🚶',
        basePrice: 0,
        etaMins: Math.ceil(d * 12),
        available: true,
        appScheme: `https://www.google.com/maps/dir/?api=1&destination=${destLat},${destLng}&travelmode=walking`,
        webUrl: `https://www.google.com/maps/dir/?api=1&destination=${destLat},${destLng}&travelmode=walking`,
        tag: '100% Free & Healthy',
        note: 'Walkway accessible',
      });
    }

    return options;
  }, [distKm, destLat, destLng, destName, availability]);

  // Sorted and filtered options
  const displayedOptions = useMemo(() => {
    let list = [...rideOptions];

    if (filterMode === 'bikes') {
      list = list.filter((r) => r.type === 'bike');
    } else if (filterMode === 'autos') {
      list = list.filter((r) => r.type === 'auto');
    } else if (filterMode === 'cabs') {
      list = list.filter((r) => r.type === 'cab' || r.type === 'bus');
    }

    list.sort((a, b) => {
      if (a.available !== b.available) return a.available ? -1 : 1;
      if (filterMode === 'cheapest') {
        const pA = a.basePrice ?? 99999;
        const pB = b.basePrice ?? 99999;
        return pA - pB;
      } else if (filterMode === 'fastest') {
        const eA = a.etaMins ?? 99999;
        const eB = b.etaMins ?? 99999;
        return eA - eB;
      }
      return 0;
    });

    return list;
  }, [rideOptions, filterMode]);

  // Deep launch ride handler
  const handleBookRide = (ride) => {
    if (!ride.available) {
      window.open(`https://www.google.com/maps/search/?api=1&query=auto+stand+near+${encodeURIComponent(destName)}`, '_blank');
      return;
    }
    const startTime = Date.now();
    window.location.href = ride.appScheme;

    setTimeout(() => {
      if (Date.now() - startTime < 1200) {
        window.open(ride.webUrl, '_blank', 'noopener,noreferrer');
      }
    }, 500);
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[1001] flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-xs">
      <div className="bg-[#FFFDF7] border-[3px] border-black rounded-t-3xl sm:rounded-3xl w-full max-w-md max-h-[88vh] flex flex-col shadow-[0_8px_0_0_#000000] overflow-hidden animate-in slide-in-from-bottom-6 duration-200">
        
        {/* Header */}
        <div className="bg-[#FFE500] border-b-[2.5px] border-black p-4 flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-black bg-black text-[#FFE500] px-2 py-0.5 rounded-full uppercase tracking-wider">
                Compare Rides
              </span>
              <span className="text-xs font-black text-black">
                {distKm.toFixed(1)} km · ~{Math.ceil(distKm * 2.6)}m
              </span>
            </div>
            <h2 className="text-sm font-black text-black truncate max-w-[240px]">
              {destName}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full border-[2px] border-black bg-white flex items-center justify-center text-black hover:bg-red-500 hover:text-white transition shadow-[0_1.5px_0_0_#000000] active:translate-y-0.5 cursor-pointer"
          >
            <X size={16} strokeWidth={3} />
          </button>
        </div>

        {/* Origin Selector: Live GPS vs Town Station Hub */}
        <div className="px-3 pt-2.5 pb-2 bg-[#FFFDE6] border-b-[2px] border-black space-y-1.5">
          <div className="flex items-center justify-between text-[10px] font-black uppercase text-black">
            <span>Calculate Route From:</span>
            <span className="text-[#0B3BF4]">
              {originMode === 'live' ? '📍 Live GPS' : '🚉 Station Hub'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            {/* Option A: Town Station Hub */}
            <button
              type="button"
              onClick={() => setOriginMode('hub')}
              className={`p-1.5 rounded-xl border-[2px] text-left transition shadow-[0_1.5px_0_0_#000000] cursor-pointer ${
                originMode === 'hub'
                  ? 'bg-black text-[#FFE500] border-black'
                  : 'bg-white text-black border-black/30 hover:bg-gray-100'
              }`}
            >
              <div className="text-[9px] font-black truncate">🚉 {townHub.name}</div>
              <div className="text-[10px] font-bold mt-0.5 flex items-center justify-between">
                <span>{townHubDist.toFixed(1)} km</span>
                <span className={originMode === 'hub' ? 'text-emerald-400' : 'text-emerald-700'}>
                  ₹{Math.round(30 + Math.max(0, townHubDist - 1.5) * 15)}
                </span>
              </div>
            </button>

            {/* Option B: Live GPS */}
            <button
              type="button"
              onClick={() => setOriginMode('live')}
              disabled={liveGpsDist === null}
              className={`p-1.5 rounded-xl border-[2px] text-left transition shadow-[0_1.5px_0_0_#000000] cursor-pointer ${
                originMode === 'live'
                  ? 'bg-black text-[#FFE500] border-black'
                  : 'bg-white text-black border-black/30 hover:bg-gray-100'
              } disabled:opacity-40`}
            >
              <div className="text-[9px] font-black truncate">
                📍 {isUserInSameCity ? 'Your Live Location' : 'Live GPS (Distant)'}
              </div>
              <div className="text-[10px] font-bold mt-0.5 flex items-center justify-between">
                <span>{liveGpsDist !== null ? `${liveGpsDist.toFixed(1)} km` : 'No GPS'}</span>
                {liveGpsDist !== null && (
                  <span className={originMode === 'live' ? 'text-emerald-400' : 'text-emerald-700'}>
                    ₹{Math.round(30 + Math.max(0, liveGpsDist - 1.5) * 15)}
                  </span>
                )}
              </div>
            </button>
          </div>

          <div className="text-[9px] font-bold text-gray-600 flex items-center gap-1 truncate">
            <span>Route:</span>
            <span className="font-black text-black truncate">{currentOriginName}</span>
            <span>→</span>
            <span className="truncate">{destName}</span>
          </div>
        </div>

        {/* Real-world Kerala Availability Notice for non-app towns like Pattambi */}
        {availability.noAppCabs && (
          <div className="mx-3 mt-2.5 p-2 bg-amber-50 border-[2px] border-black rounded-xl text-xs text-black flex items-start gap-2 shadow-[0_1.5px_0_0_#000000]">
            <AlertCircle size={15} className="text-amber-700 shrink-0 mt-0.5" />
            <div className="leading-tight">
              <div className="font-black text-amber-950 uppercase text-[10px] tracking-wider">
                {availability.hubLabel} Availability
              </div>
              <div className="text-[10px] font-semibold text-amber-900 mt-0.5">
                No Uber or Rapido operates in this area. Verified Kerala Stand Auto & Station Taxi rates shown below.
              </div>
            </div>
          </div>
        )}

        {/* Filter Pills */}
        <div className="p-2.5 bg-[#F4F6F9] border-b-[2px] border-black flex gap-1.5 overflow-x-auto scrollbar-none">
          {[
            { id: 'cheapest', label: '💰 Lowest Fare', icon: ArrowUpDown },
            { id: 'fastest', label: '⚡ Fastest ETA', icon: Zap },
            { id: 'autos', label: '🛺 Autos' },
            { id: 'bikes', label: '🛵 Bikes' },
            { id: 'cabs', label: '🚗 Cabs & Taxis' },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setFilterMode(id)}
              className={`shrink-0 text-[10.5px] font-black px-3 py-1.5 rounded-xl border-[2px] border-black transition shadow-[0_1.5px_0_0_#000000] active:translate-y-0.5 flex items-center gap-1 cursor-pointer ${
                filterMode === id
                  ? 'bg-black text-[#FFE500]'
                  : 'bg-white text-black hover:bg-gray-100'
              }`}
            >
              {Icon && <Icon size={12} />}
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* Ride Options List */}
        <div className="p-3 space-y-2.5 overflow-y-auto flex-1">
          {displayedOptions.map((ride, idx) => {
            const isTopCheapest = idx === 0 && filterMode === 'cheapest' && ride.available;
            return (
              <div
                key={ride.id}
                className={`border-[2px] border-black rounded-2xl p-3 shadow-[0_3px_0_0_#000000] flex items-center justify-between gap-3 transition ${
                  ride.available
                    ? 'bg-white hover:bg-[#FFFDE6]'
                    : 'bg-gray-100 opacity-60'
                } ${isTopCheapest ? 'border-l-[6px] border-l-emerald-500' : ''}`}
              >
                {/* Left: Icon & Names */}
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="text-2xl p-2 bg-[#F4F6F9] border-[1.5px] border-black rounded-xl shrink-0">
                    {ride.icon}
                  </div>
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-black text-black truncate">
                        {ride.service}
                      </span>
                      <span className={`text-[8.5px] font-black px-1.5 py-0.2 rounded-md border ${ride.badgeColor}`}>
                        {ride.provider}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[9.5px] font-bold text-gray-600">
                      {ride.etaMins !== null ? (
                        <span className="flex items-center gap-0.5">
                          <Clock size={10} className="text-[#0B3BF4]" />
                          {ride.etaMins} mins
                        </span>
                      ) : (
                        <span className="text-red-600 font-black">Not Operating</span>
                      )}
                      <span>•</span>
                      <span className={ride.available ? 'text-emerald-700' : 'text-gray-500'}>
                        {ride.tag}
                      </span>
                    </div>
                    {ride.note && (
                      <div className="text-[9px] font-bold text-gray-500 truncate">
                        {ride.note}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Fare & Action Button */}
                <div className="flex items-center gap-2 shrink-0">
                  <div className="text-right">
                    {ride.basePrice !== null ? (
                      <>
                        <div className="text-sm font-black text-black">
                          {ride.basePrice === 0 ? 'Free' : `₹${ride.basePrice}`}
                        </div>
                        {ride.basePrice > 0 && (
                          <div className="text-[8.5px] font-bold text-gray-500">
                            ₹{ride.basePrice - 5}–₹{ride.basePrice + 10}
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-[10px] font-black text-red-600">
                        N/A
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleBookRide(ride)}
                    className={`text-xs font-black px-3 py-2 rounded-xl border-[2px] border-black shadow-[0_2px_0_0_#000000] flex items-center gap-1 transition active:translate-y-0.5 cursor-pointer ${
                      ride.available
                        ? 'bg-[#0B3BF4] hover:bg-blue-600 text-white'
                        : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                    }`}
                  >
                    <span>{ride.available ? (ride.id === 'kerala-stand-auto' ? 'Stand ↗' : 'Go') : 'Info'}</span>
                    <ExternalLink size={10} strokeWidth={3} />
                  </button>
                </div>
              </div>
            );
          })}

          {/* Integration Transparency Card */}
          <div className="mt-2 p-2.5 bg-blue-50 border-[1.5px] border-black rounded-xl space-y-1 text-black">
            <button
              type="button"
              onClick={() => setShowTechDetails(!showTechDetails)}
              className="w-full flex items-center justify-between text-[10px] font-black text-[#0B3BF4] cursor-pointer"
            >
              <div className="flex items-center gap-1">
                <Info size={12} />
                <span>How are these fares calculated & connected?</span>
              </div>
              <span>{showTechDetails ? '▲' : '▼'}</span>
            </button>

            {showTechDetails && (
              <div className="pt-1.5 space-y-1 text-[9.5px] font-semibold text-gray-700 leading-snug border-t border-black/10">
                <div className="flex items-start gap-1">
                  <CheckCircle2 size={11} className="text-emerald-600 shrink-0 mt-0.5" />
                  <span><b>Direct App Launch:</b> Tapping <b>Go</b> executes native Android URI schemes (<code>uber://</code> and <code>rapido://</code>) pre-filling pickup and exact spot coordinates directly into your installed app.</span>
                </div>
                <div className="flex items-start gap-1">
                  <CheckCircle2 size={11} className="text-emerald-600 shrink-0 mt-0.5" />
                  <span><b>Government Meter Precision:</b> Auto rates use the official <b>Kerala Motor Vehicles Department (MVD)</b> legal meter tariff: ₹30 minimum (1.5 km) + ₹15/km (+50% night charge 10pm–5am).</span>
                </div>
                <div className="flex items-start gap-1">
                  <CheckCircle2 size={11} className="text-emerald-600 shrink-0 mt-0.5" />
                  <span><b>Town Truth:</b> Neither Uber nor Rapido offer open third-party live driver socket APIs; furthermore, they do not operate in non-metro towns like Pattambi. Spot-Undoo displays verified Kerala stand options so you never get stranded.</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-white border-t-[2px] border-black flex items-center justify-between">
          <span className="text-[10px] font-bold text-gray-500">
            Kerala MVD Regulated Meter & Live Transit Distance
          </span>
          <button
            onClick={onClose}
            className="text-xs font-black text-black hover:underline cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
