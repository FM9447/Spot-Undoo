import { useState } from 'react';
import { ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';

export default function ImageCarousel({
  images = [],
  alt = 'Spot photo',
  className = 'w-full h-44',
  links = [],
  children,
}) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Normalize images to array
  const imageList = Array.isArray(images)
    ? images.filter(Boolean)
    : images
    ? [images]
    : [];

  const safeImages = imageList.length > 0
    ? imageList
    : ['https://upload.wikimedia.org/wikipedia/commons/thumb/8/81/The_View_of_the_Athirapally_Falls_during_the_onset_of_Monsoon.jpg/960px-The_View_of_the_Athirapally_Falls_during_the_onset_of_Monsoon.jpg'];

  const total = safeImages.length;
  const currentImage = safeImages[currentIndex % total];
  const currentLink = Array.isArray(links) && links[currentIndex % total]
    ? links[currentIndex % total]
    : null;

  // Cycle forward: 1 > 2 > 3 > 1
  const handleNext = (e) => {
    e.stopPropagation();
    e.preventDefault();
    setCurrentIndex((prev) => (prev + 1) % total);
  };

  // Cycle backward: 2 < 1 < 3 < 2
  const handlePrev = (e) => {
    e.stopPropagation();
    e.preventDefault();
    setCurrentIndex((prev) => (prev - 1 + total) % total);
  };

  return (
    <div className={`relative overflow-hidden group select-none ${className}`}>
      {/* Active Image */}
      <img
        src={currentImage}
        alt={`${alt} (${currentIndex + 1} of ${total})`}
        className="w-full h-full object-cover transition-opacity duration-300"
        loading="lazy"
      />

      {/* Subtle overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20 pointer-events-none" />

      {/* Navigation Controls (Visible when more than 1 image) */}
      {total > 1 && (
        <>
          {/* Left Arrow < */}
          <button
            type="button"
            onClick={handlePrev}
            aria-label="Previous image"
            className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-7 h-7 rounded-full bg-white/95 hover:bg-white text-black border-[2px] border-black flex items-center justify-center font-black shadow-[0_2px_0_0_#000000] active:translate-y-0.5 cursor-pointer transition hover:scale-105"
          >
            <ChevronLeft size={16} strokeWidth={3} />
          </button>

          {/* Right Arrow > */}
          <button
            type="button"
            onClick={handleNext}
            aria-label="Next image"
            className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-7 h-7 rounded-full bg-white/95 hover:bg-white text-black border-[2px] border-black flex items-center justify-center font-black shadow-[0_2px_0_0_#000000] active:translate-y-0.5 cursor-pointer transition hover:scale-105"
          >
            <ChevronRight size={16} strokeWidth={3} />
          </button>

          {/* Counter Badge Pill (Top Right) */}
          <div className="absolute top-2 right-2 z-10 bg-black/70 backdrop-blur-xs text-white border border-white/30 text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm tracking-wider">
            {currentIndex + 1} / {total}
          </div>

          {/* Dot Indicators (Bottom Center) */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5 bg-black/40 backdrop-blur-xs px-2 py-1 rounded-full border border-white/20">
            {safeImages.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIndex(idx);
                }}
                aria-label={`Go to image ${idx + 1}`}
                className={`transition-all rounded-full ${
                  idx === currentIndex % total
                    ? 'w-4 h-1.5 bg-[#F59E0B]'
                    : 'w-1.5 h-1.5 bg-white/60 hover:bg-white'
                }`}
              />
            ))}
          </div>
        </>
      )}

      {/* Optional Link Pill */}
      {currentLink && (
        <a
          href={currentLink}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="absolute top-2 left-2 z-10 bg-white/90 hover:bg-white text-black border-[1.5px] border-black text-[9px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 shadow-[0_1px_0_0_#000000]"
        >
          <span>Link</span>
          <ExternalLink size={10} />
        </a>
      )}

      {/* Children overlay slot (for custom badges, categories, etc.) */}
      {children}
    </div>
  );
}
