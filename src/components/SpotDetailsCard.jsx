import { Star, MapPin, ExternalLink, Bookmark } from 'lucide-react';
import ImageCarousel from './ImageCarousel';
import { getRealSpotPhotos } from '../utils/realPhotoResolver';
import { sanitizeText } from '../utils/sanitize';
import { getBackendUrl } from '../utils/apiConfig';

export default function SpotDetailsCard({
  spot,
  onClose,
  onOpenRides,
  userRating,
  setUserRating,
  userReviewText,
  setUserReviewText,
  reviewSubmitted,
  setReviewSubmitted,
  communityReviews,
  setCommunityReviews,
  bookmarkedIds,
  toggleBookmark,
  location,
  isDesktop = false,
}) {
  if (!spot) return null;

  return (
    <div className="space-y-3">
      {/* Top Bar: Badge + Rating + Close */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          {isDesktop && (
            <button
              type="button"
              onClick={onClose}
              className="flex items-center gap-1 text-[11px] font-black px-2.5 py-1 rounded-full border-[1.5px] border-black bg-gray-100 hover:bg-gray-200 transition shadow-[0_1px_0_0_#000000] cursor-pointer"
            >
              ← Back to list
            </button>
          )}
          <span className="bg-[#FEF3C7] border-[1.5px] border-black rounded-full px-2.5 py-0.5 text-xs font-black text-black">
            {spot.badge || spot.category || 'Scenic Spot'}
          </span>
          <div className="flex items-center gap-1 text-xs font-black text-black">
            <Star size={13} className="text-amber-500 fill-amber-500" />
            <span>{spot.rating || 4.9}</span>
            <span className="text-gray-500 font-bold">({spot.reviewCount || 128})</span>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="w-7 h-7 rounded-full border-[2px] border-black bg-white flex items-center justify-center hover:bg-gray-100 font-black text-xs shadow-[0_1px_0_0_#000000] cursor-pointer shrink-0"
          title="Close details"
        >
          ✕
        </button>
      </div>

      {/* Title */}
      <h3 className="text-xl font-black text-black leading-tight">
        {spot.name}
      </h3>

      {/* Spot Photos Carousel */}
      <ImageCarousel
        images={getRealSpotPhotos(spot)}
        links={spot.links || []}
        alt={spot.name}
        className="w-full h-44 rounded-2xl border-[2px] border-black shadow-[0_2px_0_0_#000000]"
      />

      {/* 4-Box Stats Grid */}
      <div className="border-[2px] border-black rounded-2xl overflow-hidden grid grid-cols-4 divide-x-[2px] divide-black text-center py-2 bg-white shadow-[0_2px_0_0_#000000]">
        <div>
          <div className="text-[9px] font-bold text-gray-500 uppercase">Schedule</div>
          <div className="text-[11px] font-black text-black mt-0.5 truncate px-0.5">
            {spot.schedule || '14:15 - 15:00'}
          </div>
        </div>
        <div>
          <div className="text-[9px] font-bold text-gray-500 uppercase">Est. Cost</div>
          <div className="text-[11px] font-black text-emerald-600 mt-0.5">
            {spot.expense === 0 ? 'Free' : `₹${spot.expense}`}
          </div>
        </div>
        <div>
          <div className="text-[9px] font-bold text-gray-500 uppercase">Distance</div>
          <div className="text-[11px] font-black text-black mt-0.5 truncate px-0.5">
            {spot.distanceText || (spot.distanceKm ? `${spot.distanceKm}km` : 'Nearby')}
          </div>
        </div>
        <div>
          <div className="text-[9px] font-bold text-gray-500 uppercase">Return Time</div>
          <div className="text-[11px] font-black text-[#0B3BF4] mt-0.5 truncate px-0.5">
            {spot.returnText || '10m back (₹30)'}
          </div>
        </div>
      </div>

      {/* Multimodal Ride Hailing Comparator (Uber, Rapido, Ola) Button */}
      <button
        type="button"
        onClick={() => onOpenRides(spot)}
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
        <span className="text-gray-400 mt-0.5 shrink-0">💬</span>
        <p className="line-clamp-3">"{spot.review}"</p>
      </div>

      {/* Interactive User Review & Rating Section */}
      <div className="border-[2px] border-black rounded-2xl p-3 bg-white space-y-2 shadow-[0_2px_0_0_#000000]">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black uppercase tracking-wider text-black flex items-center gap-1">
            <span>⭐</span> Rate & Add Review
          </span>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setUserRating(star)}
                className="p-0.5 focus:outline-none cursor-pointer"
              >
                <Star
                  size={14}
                  className={star <= userRating ? 'text-amber-500 fill-amber-500' : 'text-gray-300'}
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
              const spotKey = spot.id || spot.name;
              try {
                const res = await fetch(`${getBackendUrl()}/api/reviews`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    spotId: spotKey,
                    spotName: spot.name,
                    rating: userRating,
                    reviewText: cleanedText,
                    author: 'Local Explorer',
                  }),
                });
                if (res.ok) {
                  const savedRev = await res.json();
                  setCommunityReviews((prev) => [savedRev.review, ...prev]);
                  setUserReviewText('');
                  setReviewSubmitted(true);
                  setTimeout(() => setReviewSubmitted(false), 3000);
                }
              } catch (e) {
                console.warn('Could not post review:', e);
              }
            }}
            className="bg-[#0B3BF4] text-white border-[1.5px] border-black rounded-xl px-3 py-1.5 text-xs font-black shadow-[0_1.5px_0_0_#000000] active:translate-y-0.5 transition cursor-pointer shrink-0"
          >
            Post
          </button>
        </div>

        {reviewSubmitted && (
          <div className="text-[10px] font-black text-emerald-600 bg-emerald-50 border border-emerald-300 rounded-lg p-1.5 text-center">
            ✓ Review saved to MongoDB Atlas!
          </div>
        )}

        {communityReviews.length > 0 && (
          <div className="pt-2 border-t border-gray-200 space-y-1.5">
            <div className="text-[10px] font-black uppercase tracking-wider text-gray-500">
              Community Reviews ({communityReviews.length})
            </div>
            <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin">
              {communityReviews.map((rev, idx) => (
                <div key={idx} className="bg-[#F8FAFC] border-[1.5px] border-black rounded-xl p-2 text-xs">
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
          onClick={() => onOpenRides(spot)}
          className="bg-[#FFE500] hover:bg-[#FACC15] border-[2.5px] border-black rounded-2xl py-2.5 px-3 font-black text-xs text-black shadow-[0_3px_0_0_#000000] flex items-center justify-center gap-1.5 active:translate-y-0.5 transition cursor-pointer"
          title="Compare Uber, Rapido, and Ola Auto"
        >
          <span className="text-base">🛺</span>
          <span>Rides</span>
        </button>
        <a
          href={`https://www.google.com/maps/dir/?api=1&origin=${location?.lat || 10.7606},${location?.lon || 76.2711}&destination=${spot.lat},${spot.lng}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 bg-[#F59E0B] border-[2.5px] border-black rounded-2xl py-2.5 px-3 font-black text-xs text-black shadow-[0_3px_0_0_#000000] flex items-center justify-center gap-1.5 hover:bg-amber-400 active:translate-y-0.5 transition text-center"
        >
          <MapPin size={15} strokeWidth={2.5} />
          <span>Google Maps</span>
          <ExternalLink size={12} strokeWidth={2.5} />
        </a>
        <button
          type="button"
          onClick={() => toggleBookmark(spot.id || spot.name)}
          className={`w-11 h-11 border-[2.5px] border-black rounded-2xl flex items-center justify-center shadow-[0_3px_0_0_#000000] active:translate-y-0.5 transition shrink-0 cursor-pointer ${
            bookmarkedIds.includes(spot.id || spot.name)
              ? 'bg-[#0B3BF4] text-white'
              : 'bg-white text-black hover:bg-gray-100'
          }`}
          title="Save spot"
        >
          <Bookmark size={17} strokeWidth={2.4} />
        </button>
      </div>
    </div>
  );
}
