import { useState } from 'react';
import { Star, MapPin, Clock, IndianRupee, Volume2, VolumeX, Loader2 } from 'lucide-react';
import { roadDistanceKm, getTransit } from '../utils/plannerMath';
import { playAudioGuide, stopAudioGuide } from '../utils/audioGuide';
import ImageCarousel from './ImageCarousel';
import RideComparatorModal from './RideComparatorModal';

const CATEGORY_COLORS = {
  'Hidden Spots': 'bg-emerald-500/20 text-emerald-400',
  'Tourist': 'bg-blue-500/20 text-blue-400',
  'Food Spots': 'bg-orange-500/20 text-orange-400',
  'Gaming & Chill': 'bg-violet-500/20 text-violet-400',
  'Party/Night': 'bg-pink-500/20 text-pink-400',
};

import { getRealSpotPhotos } from '../utils/realPhotoResolver';

export default function PlaceCard({ place, userLat, userLon }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [showRides, setShowRides] = useState(false);
  const dist = roadDistanceKm(userLat, userLon, place.lat, place.lng);
  const transit = getTransit(dist);

  const toggleAudio = () => {
    if (isPlaying) {
      stopAudioGuide();
      setIsPlaying(false);
      setIsAudioLoading(false);
    } else {
      setIsAudioLoading(true);
      const text = `${place.name}. ${place.category}. ${place.spendTime} minutes average visit. ${place.review}`;
      playAudioGuide(
        text,
        () => {
          setIsAudioLoading(false);
          setIsPlaying(true);
        },
        () => {
          setIsPlaying(false);
          setIsAudioLoading(false);
        }
      );
    }
  };

  const photos = getRealSpotPhotos(place);

  const links = place.links || [
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name)}`,
    `https://en.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(place.name)}`,
  ];

  return (
    <div className="bg-[#1a1a24] rounded-2xl overflow-hidden border border-white/5 hover:border-white/15 transition">
      <div className="relative h-40">
        <ImageCarousel
          images={photos}
          links={links}
          alt={place.name}
          className="w-full h-full"
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 pointer-events-none" />
          <div className="absolute bottom-2 left-2 flex gap-1 z-10">
            <span className={`text-[10px] px-2 py-0.5 rounded-full ${CATEGORY_COLORS[place.category] || 'bg-gray-500/20 text-gray-400'}`}>
              {place.category}
            </span>
            {place.category === 'Hidden Spots' && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400">💎 Hidden Gem</span>
            )}
          </div>
          <div className="absolute top-2 right-12 flex items-center gap-0.5 bg-black/60 rounded-full px-2 py-0.5 z-10 border border-white/20">
            <Star size={10} className="text-yellow-400 fill-yellow-400" />
            <span className="text-xs text-white">{place.rating}</span>
          </div>
        </ImageCarousel>
      </div>

      <div className="p-3 space-y-2">
        <div className="flex items-start justify-between gap-1">
          <h3 className="font-semibold text-sm text-white leading-tight flex-1">{place.name}</h3>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={toggleAudio}
              title={isPlaying ? "Stop Audio Guide" : "Listen to Audio Guide"}
              className={`p-1 rounded-lg transition border ${
                isPlaying
                  ? 'bg-purple-500/30 text-purple-300 border-purple-500/50 animate-pulse'
                  : 'bg-white/5 hover:bg-purple-500/20 text-gray-400 hover:text-purple-300 border-white/10'
              }`}
            >
              {isAudioLoading ? (
                <Loader2 size={14} className="animate-spin text-purple-400" />
              ) : isPlaying ? (
                <VolumeX size={14} className="text-purple-300" />
              ) : (
                <Volume2 size={14} />
              )}
            </button>
            <a
              href={`https://www.google.com/maps/dir/?api=1&origin=${userLat},${userLon}&destination=${place.lat},${place.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              title="Open in Google Maps"
              className="p-1 bg-white/5 hover:bg-emerald-500/20 text-gray-400 hover:text-emerald-400 rounded-lg transition border border-white/10"
            >
              <MapPin size={14} />
            </a>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-1">
          <a
            href={`https://www.google.com/maps/dir/?api=1&origin=${userLat},${userLon}&destination=${place.lat},${place.lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-emerald-400 transition"
          >
            <MapPin size={10} className="text-emerald-400" />
            {dist.toFixed(1)} km ↗
          </a>
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <Clock size={10} className="text-blue-400" />
            {place.spendTime} min
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <IndianRupee size={10} className="text-orange-400" />
            {place.expense === 0 ? 'Free' : `₹${place.expense}`}
          </div>
        </div>

        {/* Interactive Ride Hailing Comparator (Uber, Rapido, Auto) */}
        <button
          type="button"
          onClick={() => setShowRides(true)}
          className="w-full flex items-center justify-between bg-white/5 hover:bg-white/10 active:bg-white/15 rounded-xl px-2.5 py-1.5 transition border border-white/10 group cursor-pointer"
          title="Compare Uber, Rapido, and Auto fares"
        >
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-xs">🛺</span>
            <span className="font-semibold text-white group-hover:text-[#FFE500] transition">Compare Rides</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-400">
            <span>{transit.mode} {transit.cost === 0 ? 'Free' : `₹${transit.cost}`}</span>
            <span className="text-gray-400">· {transit.mins}m</span>
            <span className="text-[#FFE500] text-xs font-bold">→</span>
          </div>
        </button>

        <p className="text-[11px] text-gray-400 italic leading-snug line-clamp-2">"{place.review}"</p>
      </div>

      {/* Ride Comparison Modal */}
      <RideComparatorModal
        isOpen={showRides}
        onClose={() => setShowRides(false)}
        destination={place}
        userLat={userLat}
        userLon={userLon}
      />
    </div>
  );
}
