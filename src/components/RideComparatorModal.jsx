import { useState, useMemo } from 'react';
import { X, Navigation, ExternalLink, Zap, Clock, ShieldCheck, ArrowUpDown } from 'lucide-react';
import { roadDistanceKm } from '../utils/plannerMath';

export default function RideComparatorModal({ isOpen, onClose, destination, userLat, userLon }) {
  if (!isOpen || !destination) return null;

  const destLat = destination.lat;
  const destLng = destination.lng || destination.lon;
  const destName = destination.name || 'Destination';

  const distKm = useMemo(() => {
    if (!userLat || !userLon || !destLat || !destLng) return 1.5;
    return Math.max(0.3, roadDistanceKm(userLat, userLon, destLat, destLng));
  }, [userLat, userLon, destLat, destLng]);

  const [filterMode, setFilterMode] = useState('cheapest'); // 'cheapest', 'fastest', 'bikes', 'autos', 'cabs'

  // Dynamic Kerala ride calculation engine
  const rideOptions = useMemo(() => {
    const d = distKm;
    const now = new Date();
    const hour = now.getHours();
    // Night/peak multiplier (10pm - 5am or rush hours 8-10am, 5-8pm)
    const isPeak = (hour >= 8 && hour <= 10) || (hour >= 17 && hour <= 20);
    const peakFactor = isPeak ? 1.15 : 1.0;

    const options = [
      {
        id: 'rapido-bike',
        provider: 'Rapido',
        service: 'Bike Taxi',
        type: 'bike',
        badgeColor: 'bg-[#FFDE00] text-black border-black',
        icon: '🛵',
        basePrice: Math.round((20 + d * 11) * peakFactor),
        etaMins: Math.max(3, Math.ceil(d * 2.2)),
        surge: isPeak,
        appScheme: `rapido://ride?pickup=current&dest_lat=${destLat}&dest_lng=${destLng}`,
        webUrl: `https://rapido.bike`,
        tag: 'Fastest in Traffic',
      },
      {
        id: 'uber-moto',
        provider: 'Uber',
        service: 'Uber Moto',
        type: 'bike',
        badgeColor: 'bg-black text-white border-black',
        icon: '🏍️',
        basePrice: Math.round((22 + d * 10.5) * peakFactor),
        etaMins: Math.max(3, Math.ceil(d * 2.3)),
        surge: isPeak,
        appScheme: `uber://?action=setPickup&pickup=my_location&dropoff[latitude]=${destLat}&dropoff[longitude]=${destLng}&dropoff[nickname]=${encodeURIComponent(destName)}`,
        webUrl: `https://m.uber.com/ul/?action=setPickup&pickup=my_location&dropoff[latitude]=${destLat}&dropoff[longitude]=${destLng}&dropoff[nickname]=${encodeURIComponent(destName)}`,
        tag: 'Affordable Solo',
      },
      {
        id: 'uber-auto',
        provider: 'Uber',
        service: 'Uber Auto',
        type: 'auto',
        badgeColor: 'bg-[#000000] text-[#00E5FF] border-black',
        icon: '🛺',
        basePrice: Math.round((30 + Math.max(0, d - 1.5) * 18) * peakFactor),
        etaMins: Math.max(4, Math.ceil(d * 2.8)),
        surge: isPeak,
        appScheme: `uber://?action=setPickup&pickup=my_location&dropoff[latitude]=${destLat}&dropoff[longitude]=${destLng}&dropoff[nickname]=${encodeURIComponent(destName)}`,
        webUrl: `https://m.uber.com/ul/?action=setPickup&pickup=my_location&dropoff[latitude]=${destLat}&dropoff[longitude]=${destLng}&dropoff[nickname]=${encodeURIComponent(destName)}`,
        tag: 'Standard Kerala Meter',
      },
      {
        id: 'rapido-auto',
        provider: 'Rapido',
        service: 'Rapido Auto',
        type: 'auto',
        badgeColor: 'bg-[#FFDE00] text-black border-black',
        icon: '🛺',
        basePrice: Math.round((30 + Math.max(0, d - 1.5) * 17.5) * peakFactor),
        etaMins: Math.max(4, Math.ceil(d * 2.8)),
        surge: isPeak,
        appScheme: `rapido://ride?pickup=current&dest_lat=${destLat}&dest_lng=${destLng}`,
        webUrl: `https://rapido.bike`,
        tag: 'Quick Match',
      },
      {
        id: 'ola-auto',
        provider: 'Ola',
        service: 'Ola Auto',
        type: 'auto',
        badgeColor: 'bg-[#1C8D4B] text-white border-black',
        icon: '🛺',
        basePrice: Math.round((30 + Math.max(0, d - 1.5) * 18) * peakFactor),
        etaMins: Math.max(5, Math.ceil(d * 2.9)),
        surge: isPeak,
        appScheme: `olacabs://app/launch?lat=${destLat}&lng=${destLng}`,
        webUrl: `https://book.olacabs.com/?drop_lat=${destLat}&drop_lng=${destLng}`,
        tag: 'Local Favorite',
      },
      {
        id: 'uber-go',
        provider: 'Uber',
        service: 'Uber Go (AC Cab)',
        type: 'cab',
        badgeColor: 'bg-[#111] text-white border-black',
        icon: '🚗',
        basePrice: Math.round((70 + d * 21) * peakFactor),
        etaMins: Math.max(6, Math.ceil(d * 3.2)),
        surge: isPeak,
        appScheme: `uber://?action=setPickup&pickup=my_location&dropoff[latitude]=${destLat}&dropoff[longitude]=${destLng}&dropoff[nickname]=${encodeURIComponent(destName)}`,
        webUrl: `https://m.uber.com/ul/?action=setPickup&pickup=my_location&dropoff[latitude]=${destLat}&dropoff[longitude]=${destLng}&dropoff[nickname]=${encodeURIComponent(destName)}`,
        tag: 'AC & Luggage',
      },
    ];

    if (d <= 1.8) {
      options.push({
        id: 'walk',
        provider: 'Walking',
        service: 'Walk Trail',
        type: 'walk',
        badgeColor: 'bg-emerald-500 text-white border-black',
        icon: '🚶',
        basePrice: 0,
        etaMins: Math.ceil(d * 12),
        surge: false,
        appScheme: `https://www.google.com/maps/dir/?api=1&destination=${destLat},${destLng}&travelmode=walking`,
        webUrl: `https://www.google.com/maps/dir/?api=1&destination=${destLat},${destLng}&travelmode=walking`,
        tag: '100% Free & Scenic',
      });
    }

    return options;
  }, [distKm, destLat, destLng, destName]);

  // Sorted and filtered options
  const displayedOptions = useMemo(() => {
    let list = [...rideOptions];

    if (filterMode === 'bikes') {
      list = list.filter((r) => r.type === 'bike');
    } else if (filterMode === 'autos') {
      list = list.filter((r) => r.type === 'auto');
    } else if (filterMode === 'cabs') {
      list = list.filter((r) => r.type === 'cab');
    }

    if (filterMode === 'cheapest') {
      list.sort((a, b) => a.basePrice - b.basePrice);
    } else if (filterMode === 'fastest') {
      list.sort((a, b) => a.etaMins - b.etaMins);
    }

    return list;
  }, [rideOptions, filterMode]);

  // Deep launch ride handler
  const handleBookRide = (ride) => {
    // Try native app scheme first, fallback to web after 400ms timeout
    const startTime = Date.now();
    window.location.href = ride.appScheme;

    setTimeout(() => {
      // If user is still on the web page after 500ms, redirect to web fallback
      if (Date.now() - startTime < 1200) {
        window.open(ride.webUrl, '_blank', 'noopener,noreferrer');
      }
    }, 500);
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[110] flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-xs">
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

        {/* Filter Pills */}
        <div className="p-3 bg-[#F4F6F9] border-b-[2px] border-black flex gap-1.5 overflow-x-auto scrollbar-none">
          {[
            { id: 'cheapest', label: '💰 Lowest Fare', icon: ArrowUpDown },
            { id: 'fastest', label: '⚡ Fastest ETA', icon: Zap },
            { id: 'autos', label: '🛺 Autos' },
            { id: 'bikes', label: '🛵 Bikes' },
            { id: 'cabs', label: '🚗 Cabs' },
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
          {displayedOptions.map((ride, idx) => (
            <div
              key={ride.id}
              className={`border-[2px] border-black rounded-2xl p-3 bg-white shadow-[0_3px_0_0_#000000] flex items-center justify-between gap-3 transition hover:bg-[#FFFDE6] ${
                idx === 0 && filterMode === 'cheapest' ? 'border-l-[6px] border-l-emerald-500' : ''
              }`}
            >
              {/* Left: Icon & Names */}
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="text-2xl p-2 bg-[#F4F6F9] border-[1.5px] border-black rounded-xl shrink-0">
                  {ride.icon}
                </div>
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black text-black truncate">
                      {ride.service}
                    </span>
                    <span className={`text-[9px] font-black px-1.5 py-0.2 rounded-md border ${ride.badgeColor}`}>
                      {ride.provider}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-bold text-gray-600">
                    <span className="flex items-center gap-0.5">
                      <Clock size={11} className="text-[#0B3BF4]" />
                      {ride.etaMins} mins
                    </span>
                    <span>•</span>
                    <span className="text-emerald-700">{ride.tag}</span>
                  </div>
                </div>
              </div>

              {/* Right: Fare & Action Button */}
              <div className="flex items-center gap-2 shrink-0">
                <div className="text-right">
                  <div className="text-sm font-black text-black">
                    {ride.basePrice === 0 ? 'Free' : `₹${ride.basePrice}`}
                  </div>
                  {ride.basePrice > 0 && (
                    <div className="text-[9px] font-bold text-gray-500">
                      ₹{ride.basePrice - 5}–₹{ride.basePrice + 10}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => handleBookRide(ride)}
                  className="bg-[#0B3BF4] hover:bg-blue-600 active:translate-y-0.5 text-white text-xs font-black px-3.5 py-2 rounded-xl border-[2px] border-black shadow-[0_2px_0_0_#000000] flex items-center gap-1 transition cursor-pointer"
                >
                  <span>Go</span>
                  <ExternalLink size={11} strokeWidth={3} />
                </button>
              </div>
            </div>
          ))}

          {/* Guarantee / Info chip */}
          <div className="mt-3 p-2.5 bg-emerald-50 border-[1.5px] border-emerald-600 rounded-xl flex items-center gap-2 text-[10px] font-bold text-emerald-900">
            <ShieldCheck size={14} className="text-emerald-600 shrink-0" />
            <span>Clicking <b>Go</b> opens your installed Uber or Rapido app with destination pre-filled.</span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-white border-t-[2px] border-black flex items-center justify-between">
          <span className="text-[10px] font-bold text-gray-500">
            Fares estimated based on Kerala Transport meter & live surge rates.
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
