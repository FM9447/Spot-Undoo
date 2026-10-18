import { useState, useMemo } from 'react';
import { X, ExternalLink, Zap, Clock, ShieldCheck, ArrowUpDown, AlertCircle, MapPin } from 'lucide-react';
import { roadDistanceKm } from '../utils/plannerMath';

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

  const distKm = useMemo(() => {
    if (!userLat || !userLon || !destLat || !destLng) return 1.5;
    return Math.max(0.3, roadDistanceKm(userLat, userLon, destLat, destLng));
  }, [userLat, userLon, destLat, destLng]);

  const [filterMode, setFilterMode] = useState('cheapest'); // 'cheapest', 'fastest', 'autos', 'bikes', 'cabs'

  // Regional Kerala availability detection
  const availability = useMemo(() => {
    return getKeralaRideAvailability(destLat, destLng, destName);
  }, [destLat, destLng, destName]);

  // Dynamic Kerala ride calculation engine
  const rideOptions = useMemo(() => {
    const d = distKm;
    const now = new Date();
    const hour = now.getHours();
    // Night/peak multiplier (10pm - 5am: 1.5x Kerala meter; rush hours 8-10am, 5-8pm: 1.15x)
    const isNight = hour >= 22 || hour < 5;
    const isRush = (hour >= 8 && hour <= 10) || (hour >= 17 && hour <= 20);
    const peakFactor = isNight ? 1.5 : (isRush ? 1.15 : 1.0);

    const options = [];

    // 1. Official Kerala Stand Auto-Rickshaw (Always available everywhere in Kerala)
    const standAutoBase = Math.round((30 + Math.max(0, d - 1.5) * 15) * peakFactor);
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
      tag: 'Official Govt Meter Rate',
      note: availability.noAppCabs ? 'Active at Station & Town Auto Stands' : 'Available at all local stands',
    });

    // 2. Town Tourist Taxi Stand (Omni / Tourist Sedan)
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

    // 3. Local Stage Carriage / KSRTC Bus (for towns)
    if (d >= 1.5) {
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
      // Available in Kochi, Trivandrum, Calicut
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
      // In Pattambi / Shoranur / rural towns: Uber and Rapido do not operate
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
        note: `Uber does not operate in ${availability.hubLabel}`,
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
        note: `Rapido does not service ${availability.hubLabel}`,
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

    // Always sort available rides first
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
      window.open(`https://www.google.com/maps/search/?api=1&query=auto+stand+near+me`, '_blank');
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
      <div className="bg-[#FFFDF7] border-[3px] border-black rounded-t-3xl sm:rounded-3xl w-full max-w-md max-h-[85vh] flex flex-col shadow-[0_8px_0_0_#000000] overflow-hidden animate-in slide-in-from-bottom-6 duration-200">
        
        {/* Header */}
        <div className="bg-[#FFE500] border-b-[2.5px] border-black p-4 flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black bg-black text-[#FFE500] px-2 py-0.5 rounded-full uppercase tracking-wider">
                Compare Rides
              </span>
              <span className="text-xs font-black text-black">
                {distKm.toFixed(1)} km away
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

        {/* Real-world Kerala Availability Notice for non-app towns like Pattambi */}
        {availability.noAppCabs && (
          <div className="mx-3 mt-3 p-2.5 bg-amber-50 border-[2px] border-black rounded-xl text-xs text-black flex items-start gap-2 shadow-[0_2px_0_0_#000000]">
            <AlertCircle size={16} className="text-amber-700 shrink-0 mt-0.5" />
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
        <div className="p-3 bg-[#F4F6F9] border-b-[2px] border-black flex gap-1.5 overflow-x-auto scrollbar-none">
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
              className={`shrink-0 text-[11px] font-black px-3 py-1.5 rounded-xl border-[2px] border-black transition shadow-[0_1.5px_0_0_#000000] active:translate-y-0.5 flex items-center gap-1 cursor-pointer ${
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

          {/* Guarantee / Info chip */}
          <div className="mt-3 p-2.5 bg-emerald-50 border-[1.5px] border-emerald-600 rounded-xl flex items-center gap-2 text-[10px] font-bold text-emerald-900">
            <ShieldCheck size={14} className="text-emerald-600 shrink-0" />
            <span>
              {availability.noAppCabs
                ? 'Rates calibrated to Kerala Motor Vehicles Department meter tariffs.'
                : 'Clicking Go opens installed Uber / Rapido app with destination pre-filled.'}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-white border-t-[2px] border-black flex items-center justify-between">
          <span className="text-[10px] font-bold text-gray-500">
            {availability.noAppCabs ? 'Kerala State Regulated Stand Meter' : 'Kerala Transport meter & live surge rates'}
          </span>
          <button
            onClick={onClose}
            className="text-xs font-black text-black hover:underline"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
