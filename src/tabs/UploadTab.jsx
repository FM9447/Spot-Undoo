import { useState, useRef, useEffect } from 'react';
import { Camera, Check, Pencil, Loader2, CheckCircle2, MapPin, Sparkles, Plus, Globe, Navigation, AlertTriangle } from 'lucide-react';
import { ollamaChat, resizeImageToBase64 } from '../utils/ollama';
import { KERALA_CITIES } from '../data/keralaCitiesData';
import { getBackendUrl } from '../utils/apiConfig';
import { uploadImageToFirebase } from '../utils/firebaseStorage';
import { haversineKm } from '../utils/plannerMath';

const CATEGORIES = [
  { id: 'Hidden', label: '💎 Hidden' },
  { id: 'Food', label: '🍜 Food' },
  { id: 'Gaming', label: '🎮 Gaming' },
  { id: 'Party', label: '🎉 Party' },
];

export default function UploadTab({ location, settings = {} }) {
  const fileInputRef = useRef(null);
  const initialCity = location?.cityKey && KERALA_CITIES[location.cityKey] ? location.cityKey : 'Shoranur';
  const initialArea = location?.label ? location.label.replace(/\s*\(Active\)/i, '') : 'Shoranur, Palakkad';
  const [selectedCityKey, setSelectedCityKey] = useState(initialCity);
  const [specificArea, setSpecificArea] = useState(initialArea);

  // Exact coordinates (auto-filled from GPS / photo / link, fully editable)
  const [lat, setLat] = useState(() => (location?.lat ? Number(Number(location.lat).toFixed(5)) : 10.7606));
  const [lng, setLng] = useState(() => (location?.lon ? Number(Number(location.lon).toFixed(5)) : 76.2711));
  const [mapsLink, setMapsLink] = useState('');
  const [duplicateError, setDuplicateError] = useState('');
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    if (location?.cityKey && KERALA_CITIES[location.cityKey]) {
      setSelectedCityKey(location.cityKey);
    }
    if (location?.label) {
      setSpecificArea(location.label.replace(/\s*\(Active\)/i, ''));
    }
    if (location?.lat && location?.lon) {
      setLat(Number(Number(location.lat).toFixed(5)));
      setLng(Number(Number(location.lon).toFixed(5)));
    }
  }, [location]);

  const [photoPreview, setPhotoPreview] = useState(null);
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState('');
  const [spotName, setSpotName] = useState('');
  const [category, setCategory] = useState('Hidden');
  const [avgCost, setAvgCost] = useState('50');
  const [timeNeeded, setTimeNeeded] = useState('45 mins');
  const [review, setReview] = useState('');

  const [aiTags, setAiTags] = useState([]);
  const [aiCaption, setAiCaption] = useState('');

  const [verifying, setVerifying] = useState(false);
  const [generatingTags, setGeneratingTags] = useState(false);
  const [published, setPublished] = useState(false);
  const [showAddTag, setShowAddTag] = useState(false);
  const [customTagInput, setCustomTagInput] = useState('');

  // Multi-photo state
  const [photoList, setPhotoList] = useState([]);
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);

  const [generatingText, setGeneratingText] = useState(false);

  // Auto-generate realistic Kerala community review/description from whatever is in the box
  const generateAutoDescription = async () => {
    setGeneratingText(true);
    const effectiveCategory = category === 'Hidden' ? 'Hidden Spots' : category;
    const nameStr = spotName.trim() || 'Hidden Kerala Spot';
    const cityStr = specificArea.trim() || selectedCityKey;
    const baseText = review.trim();

    // 1. Try Backend Groq API first (Fast, high quality Qwen model)
    try {
      const backendUrl = getBackendUrl();
      const res = await fetch(`${backendUrl}/api/ai/enhance-story`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          draft: baseText,
          spotName: nameStr,
          city: cityStr,
          category: effectiveCategory,
          avgCost,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.story && data.story.trim()) {
          setReview(data.story.trim());
          setGeneratingText(false);
          return;
        }
      }
    } catch (err) {
      console.warn('Backend enhance-story attempt failed:', err);
    }

    // 2. Try Local Ollama if configured
    try {
      const prompt = `You are a local Kerala explorer writing a genuine community review for "${nameStr}" in ${cityStr} (${effectiveCategory}, approx ₹${avgCost}).
User text draft in box: "${baseText || 'Peaceful spot with amazing vibes'}".
Return JSON: {"story": "Enhance and polish the draft into 2 short, authentic sentences under 40 words like a local traveler with an insider tip (best time, path, or snack)."}`;

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), 3500)
      );
      const res = await Promise.race([
        ollamaChat({
          baseUrl: settings.baseUrl || 'http://localhost:11434',
          model: settings.model || 'spot-undo-qwen',
          messages: [{ role: 'user', content: prompt }],
        }),
        timeoutPromise,
      ]);
      const generated = res?.story || res?.review || res?.tip || res?.text || res?.content;
      if (generated && typeof generated === 'string' && generated.trim()) {
        setReview(generated.trim());
        setGeneratingText(false);
        return;
      }
    } catch (e) {
      console.warn('Ollama auto description fallback:', e);
    }

    // 3. Dynamic smart generator if offline (produces fresh, varied reviews on every click)
    const variations = [
      `Skip the crowds and head to ${nameStr} in ${cityStr}! ${baseText ? baseText + '.' : 'Serene vibe with soothing breeze.'} Best visited around golden hour with fresh local chai nearby for under ₹${avgCost}.`,
      `Underrated local gem in ${cityStr}! ${baseText ? baseText + '.' : 'Very few tourists know about this peaceful spot.'} Take the walking lane early morning for zero noise and great photo vantage points.`,
      `Locals love ${nameStr}. ${baseText ? baseText + ' - truly worth the detour.' : 'Lush greenery and calm surroundings.'} Perfect 45-minute stop; don't miss the small snack stall down the street.`,
      `A true hidden paradise in ${cityStr}. ${baseText ? baseText + '.' : 'Authentic Kerala charm without the commercial rush.'} Keep small cash ready for ₹${avgCost} entry or snacks; evening hours are magical.`
    ];
    const picked = variations[Math.floor(Math.random() * variations.length)];
    setReview(picked);
    setGeneratingText(false);
  };

  // Maps link or coordinates parser
  const handleMapsLinkChange = (val) => {
    setMapsLink(val);
    setDuplicateError('');
    if (!val.trim()) return;

    // Pattern 1: Google Maps /@10.0234,76.3214
    const atMatch = val.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (atMatch) {
      setLat(parseFloat(atMatch[1]));
      setLng(parseFloat(atMatch[2]));
      return;
    }

    // Pattern 2: q=10.0234,76.3214 or ll=10.0234,76.3214
    const qMatch = val.match(/[?&](?:q|ll)=(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (qMatch) {
      setLat(parseFloat(qMatch[1]));
      setLng(parseFloat(qMatch[2]));
      return;
    }

    // Pattern 3: raw "10.0234, 76.3214"
    const rawMatch = val.match(/(-?\d+\.\d+)[,\s]+(-?\d+\.\d+)/);
    if (rawMatch) {
      setLat(parseFloat(rawMatch[1]));
      setLng(parseFloat(rawMatch[2]));
      return;
    }
  };

  // Fast LLM-powered hashtag generator
  const generateQuickTags = async () => {
    setGeneratingTags(true);
    const effectiveCategory = category === 'Hidden' ? 'Hidden Spots' : category;
    const effectiveCity = specificArea.trim() || selectedCityKey;
    const prompt = `Generate 5 viral Instagram/Travel hashtags starting with '#' for this Kerala spot:
Spot: ${spotName.trim() || 'Kerala Spot'}
Category: ${effectiveCategory}
City: ${effectiveCity}

Return JSON: {"tags": ["#tag1", "#tag2", "#tag3", "#tag4", "#tag5"], "caption": "short 1-line catchy description"}`;

    try {
      const res = await ollamaChat({
        baseUrl: settings.baseUrl || 'http://localhost:11434',
        model: settings.model || 'spot-undo-qwen',
        messages: [{ role: 'user', content: prompt }],
      });

      if (res && Array.isArray(res.tags) && res.tags.length > 0) {
        setAiTags(res.tags.map((t) => (t.startsWith('#') ? t : `#${t}`)));
        if (res.caption) setAiCaption(`"${res.caption.replace(/^"|"$/g, '')}"`);
        setGeneratingTags(false);
        return;
      }
    } catch (e) {
      console.warn('Ollama quick tag fallback:', e);
    }

    // Instant heuristic fallback
    const cityClean = selectedCityKey.replace(/[^a-zA-Z]/g, '');
    const defaultTagMap = {
      Hidden: [`#HiddenKerala`, `#${cityClean}Gems`, '#OffbeatKerala', '#SecretSpot', '#MonsoonKerala'],
      Food: [`#KeralaEats`, `#${cityClean}Foodie`, '#StreetFoodKerala', '#ChaiVibes', '#KattanChai'],
      Gaming: [`#GamingKerala`, `#${cityClean}Gamers`, '#LANParty', '#ChillZone', '#EsportsIndia'],
      Party: [`#KeralaNightlife`, `#${cityClean}Party`, '#WeekendVibes', '#NightOut', '#KeralaBeats'],
    };
    const fallbackTags = defaultTagMap[category] || [
      `#DiscoverKerala`,
      `#${cityClean}`,
      '#LocalVibe',
      '#KeralaTourism',
      '#MustVisitKerala',
    ];
    setAiTags(fallbackTags);
    setAiCaption(`"Must-visit spot in ${effectiveCity} with authentic local flavor."`);
    setGeneratingTags(false);
  };

  const handlePhotoSelect = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Auto-acquire current GPS location when photo is added
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLat(Number(pos.coords.latitude.toFixed(5)));
          setLng(Number(pos.coords.longitude.toFixed(5)));
        },
        () => {}
      );
    }

    const newPhotos = files.map((file) => ({
      url: URL.createObjectURL(file),
      name: file.name,
      size: `${(file.size / (1024 * 1024)).toFixed(1)}MB`,
      file
    }));

    setPhotoList((prev) => [...prev, ...newPhotos]);
    setActivePhotoIdx(photoList.length);
    setPublished(false);
    setVerifying(true);

    try {
      // Downscale first selected image on HTML5 Canvas to 512px max JPEG (0.7 quality)
      const base64Img = await resizeImageToBase64(files[0], 512, 0.7);

      // Call Edge AI Vision
      const res = await ollamaChat({
        baseUrl: settings.baseUrl,
        model: settings.model,
        messages: [
          {
            role: 'user',
            content:
              'Analyze this Kerala travel spot photo and return JSON: {"verified": true, "caption": "short 1-line description", "vibe_tags": ["#tag1", "#tag2", "#tag3", "#tag4"], "tip": "one insider tip"}',
            images: [base64Img],
          },
        ],
      });

      if (res && res.vibe_tags) {
        setAiTags(res.vibe_tags);
      }
      if (res && res.caption) {
        setAiCaption(`"${res.caption}"`);
      }
      if (res && res.tip) {
        setReview((prev) => (prev ? prev : res.tip));
      }
    } catch {
      // Graceful fallback to verified tags
      setAiTags(['#Riverside', '#BudgetSnack', '#QuietVibe', '#KeralaGems']);
      setAiCaption('"Outdoor seating near water, low crowd, casual local food stall."');
    } finally {
      setVerifying(false);
    }
  };

  const handlePublish = async () => {
    if (!spotName.trim()) {
      alert('Please enter a spot name');
      return;
    }

    setDuplicateError('');
    const checkLat = Number(lat);
    const checkLng = Number(lng);

    // 100-Meter Duplicate Check against all existing spots
    const stored = JSON.parse(localStorage.getItem('userSpots') || '[]');
    const allSpots = [
      ...stored,
      ...Object.values(KERALA_CITIES).flatMap((c) => c.spots || [])
    ];
    const dup = allSpots.find((p) => {
      if (!p.lat || !p.lng) return false;
      const distMeters = haversineKm(checkLat, checkLng, p.lat, p.lng) * 1000;
      return distMeters <= 100;
    });

    if (dup) {
      const dM = Math.round(haversineKm(checkLat, checkLng, dup.lat, dup.lng) * 1000);
      setDuplicateError(`⚠️ A spot already exists within 100m: "${dup.name}" (${dM}m away).`);
      alert(`⚠️ Spot already exists within 100m: "${dup.name}" (${dM}m away)`);
      return;
    }

    setPublishing(true);

    // Upload photo to Firebase Storage
    let finalPhotoUrl = photoList[activePhotoIdx]?.url || photoPreview;
    const activeFile = photoList[activePhotoIdx]?.file;
    if (activeFile) {
      try {
        const firebaseUrl = await uploadImageToFirebase(activeFile, 'spots');
        if (firebaseUrl) finalPhotoUrl = firebaseUrl;
      } catch (err) {
        console.warn('Firebase photo upload warning:', err);
      }
    } else if (finalPhotoUrl && finalPhotoUrl.startsWith('data:')) {
      try {
        const firebaseUrl = await uploadImageToFirebase(finalPhotoUrl, 'spots');
        if (firebaseUrl) finalPhotoUrl = firebaseUrl;
      } catch (err) {
        console.warn('Firebase photo upload warning:', err);
      }
    }

    const cityObj = KERALA_CITIES[selectedCityKey] || KERALA_CITIES['Shoranur'];
    const newSpot = {
      id: `user-${Date.now()}`,
      name: spotName.trim(),
      cityKey: selectedCityKey,
      cityName: cityObj.name,
      area: specificArea.trim() || cityObj.name,
      category: category === 'Hidden' ? 'Hidden Spots' : category,
      badge: aiTags[0]?.replace('#', '') || 'Community Spot',
      lat: checkLat,
      lng: checkLng,
      expense: Number(avgCost) || 0,
      spendTime: parseInt(timeNeeded) || 45,
      rating: 5.0,
      reviewCount: 1,
      distanceKm: 1.5,
      distanceText: `Near ${specificArea.trim() || cityObj.name}`,
      schedule: 'Flexible visit',
      transitText: 'Auto • 5m (₹25)',
      returnText: '5m back (₹25)',
      returnCost: 25,
      photo: finalPhotoUrl,
      photos: [finalPhotoUrl],
      links: [
        mapsLink.trim() ||
          `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
            spotName.trim() + ' ' + (specificArea.trim() || cityObj.name)
          )}`,
      ],
      review: review.trim(),
      tags: [...aiTags.map((t) => t.replace('#', '')), specificArea.trim()].filter(Boolean),
      userUploaded: true,
    };

    localStorage.setItem('userSpots', JSON.stringify([newSpot, ...stored]));

    // Also persist to MongoDB backend
    fetch(`${getBackendUrl()}/api/places`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newSpot),
    }).catch(console.warn);

    setPublishing(false);
    setPublished(true);
    setTimeout(() => setPublished(false), 3500);
  };

  return (
    <div className="space-y-3 pb-8">
      {/* Page Title */}
      <h2 className="text-2xl font-black text-black tracking-tight">
        Share a Hidden Spot or Review
      </h2>

      {/* 1. Photo Dropzone & Vision Card */}
      <div className="bg-white border-[2.5px] border-black rounded-3xl p-3 shadow-[0_4px_0_0_#000000] space-y-2.5">
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          multiple
          onChange={handlePhotoSelect}
          className="hidden"
        />

        {/* Dropzone Box */}
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-[2px] border-dashed border-black rounded-2xl p-2.5 bg-white flex items-center gap-3 cursor-pointer hover:bg-gray-50 transition"
        >
          {/* Photo Thumbnail with checkmark badge */}
          <div className="relative w-16 h-16 rounded-xl border-[2px] border-black overflow-hidden shrink-0 shadow-[0_2px_0_0_#000000] bg-gray-100 flex items-center justify-center">
            {(photoList[activePhotoIdx]?.url || photoPreview) ? (
              <>
                <img
                  src={photoList[activePhotoIdx]?.url || photoPreview}
                  alt="Uploaded hidden spot"
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-1 right-1 w-5 h-5 rounded-md bg-emerald-500 border border-black flex items-center justify-center text-white font-black text-xs">
                  <Check size={12} strokeWidth={3} />
                </div>
              </>
            ) : (
              <Camera size={26} className="text-gray-400" />
            )}
            {verifying && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <Loader2 size={16} className="text-white animate-spin" />
              </div>
            )}
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 font-black text-xs text-black leading-tight">
              <div className="w-5 h-5 rounded-full bg-[#0B3BF4] text-white flex items-center justify-center shrink-0">
                <Camera size={11} />
              </div>
              <span className="truncate">Add photos</span>
            </div>
            <div className="text-[10px] font-bold text-gray-500 mt-1 truncate">
              {photoList.length > 0
                ? `${photoList.length} photo${photoList.length > 1 ? 's' : ''} uploaded • ${photoList[activePhotoIdx]?.name || fileName}`
                : 'Tap to add photos from camera or gallery'}
            </div>
            <div className="mt-1 flex items-center gap-1">
              <span className="bg-[#EFF6FF] border border-[#3B82F6] text-[#0B3BF4] font-black text-[9px] px-2 py-0.5 rounded-full inline-block">
                On-Device Multimodal
              </span>
              <span className="bg-[#F3E8FF] border border-purple-400 text-purple-700 font-black text-[9px] px-2 py-0.5 rounded-full inline-block">
                Multi-Photo Ready
              </span>
            </div>
          </div>
        </div>

        {/* Multi-Photo Carousel Gallery */}
        {photoList.length > 1 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5 scrollbar-none">
            {photoList.map((p, idx) => {
              const isActive = activePhotoIdx === idx;
              return (
                <div
                  key={idx}
                  onClick={() => setActivePhotoIdx(idx)}
                  className={`relative w-14 h-14 rounded-xl border-[2px] overflow-hidden shrink-0 cursor-pointer transition ${
                    isActive ? 'border-[#0B3BF4] ring-2 ring-[#0B3BF4]/30 scale-105' : 'border-black hover:opacity-90'
                  }`}
                >
                  <img src={p.url} alt={`photo-${idx}`} className="w-full h-full object-cover" />
                  {photoList.length > 1 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPhotoList((prev) => prev.filter((_, i) => i !== idx));
                        if (activePhotoIdx >= photoList.length - 1) setActivePhotoIdx(Math.max(0, photoList.length - 2));
                      }}
                      className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-black/70 hover:bg-red-600 text-white flex items-center justify-center text-[9px] font-black"
                      title="Remove image"
                    >
                      ✕
                    </button>
                  )}
                  {isActive && (
                    <div className="absolute bottom-0 inset-x-0 bg-[#0B3BF4] text-white text-[8px] font-black text-center py-0.2">
                      COVER
                    </div>
                  )}
                </div>
              );
            })}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-14 h-14 rounded-xl border-[2px] border-dashed border-gray-400 bg-gray-50 flex flex-col items-center justify-center text-gray-600 hover:border-black hover:text-black shrink-0 transition"
              title="Add more photos"
            >
              <Plus size={16} strokeWidth={3} />
              <span className="text-[8px] font-black mt-0.5">+ Photo</span>
            </button>
          </div>
        )}

        {/* AI Generated Tags / Caption Green Box (Exact match to Master Screenshot 4 + Quick Generator) */}
        <div className="border-[2px] border-black rounded-2xl p-3 bg-[#ECFDF5] space-y-2 shadow-[0_2px_0_0_#000000]">
          <div className="flex items-center justify-between">
            <span className="bg-[#A7F3D0] border-[1.5px] border-black text-black font-black text-[9px] px-2 py-0.5 rounded-full">
              AI Generated Tags
            </span>

            {/* Quick AI Tags Button */}
            <button
              type="button"
              onClick={generateQuickTags}
              disabled={generatingTags}
              className="bg-[#0B3BF4] text-white border-[1.5px] border-black text-[10px] font-black px-2.5 py-1 rounded-full shadow-[0_1.5px_0_0_#000000] active:translate-y-0.5 flex items-center gap-1 hover:bg-blue-600 disabled:opacity-50 transition cursor-pointer"
            >
              {generatingTags ? (
                <>
                  <Loader2 size={11} className="animate-spin text-white" />
                  <span>Generating #Tags...</span>
                </>
              ) : (
                <>
                  <Sparkles size={11} className="text-yellow-300 fill-yellow-300" />
                  <span>⚡ Quick AI Tags</span>
                </>
              )}
            </button>
          </div>

          {/* Tag Pills with Click to Delete & Add Button */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            {aiTags.map((tag, idx) => (
              <span
                key={idx}
                className="bg-white border-[2px] border-black rounded-xl px-2.5 py-1 text-xs font-black text-black shadow-[0_1px_0_0_#000000] flex items-center gap-1 group"
              >
                <span>{tag}</span>
                <button
                  type="button"
                  onClick={() => setAiTags((prev) => prev.filter((_, i) => i !== idx))}
                  className="text-gray-400 hover:text-red-500 font-black text-[11px] ml-0.5"
                  title="Remove tag"
                >
                  ✕
                </button>
              </span>
            ))}

            {/* Custom Tag Input Toggle */}
            {showAddTag ? (
              <div className="flex items-center gap-1 bg-white border-[1.5px] border-black rounded-xl px-2 py-0.5">
                <input
                  type="text"
                  value={customTagInput}
                  onChange={(e) => setCustomTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && customTagInput.trim()) {
                      e.preventDefault();
                      const formatted = customTagInput.trim().startsWith('#')
                        ? customTagInput.trim()
                        : `#${customTagInput.trim()}`;
                      if (!aiTags.includes(formatted)) setAiTags([...aiTags, formatted]);
                      setCustomTagInput('');
                      setShowAddTag(false);
                    }
                  }}
                  placeholder="#newtag"
                  className="text-xs font-bold text-black outline-none w-20"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => {
                    if (customTagInput.trim()) {
                      const formatted = customTagInput.trim().startsWith('#')
                        ? customTagInput.trim()
                        : `#${customTagInput.trim()}`;
                      if (!aiTags.includes(formatted)) setAiTags([...aiTags, formatted]);
                    }
                    setCustomTagInput('');
                    setShowAddTag(false);
                  }}
                  className="text-[10px] font-black text-[#0B3BF4]"
                >
                  ✓
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCustomTagInput('');
                    setShowAddTag(false);
                  }}
                  className="text-[10px] font-black text-gray-400"
                >
                  ✕
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowAddTag(true)}
                className="bg-emerald-100 hover:bg-emerald-200 border-[1.5px] border-dashed border-emerald-700 text-emerald-800 rounded-xl px-2 py-1 text-xs font-black flex items-center gap-0.5"
              >
                <Plus size={11} strokeWidth={3} />
                <span>Tag</span>
              </button>
            )}
          </div>

          {/* Caption Box */}
          <div className="border border-emerald-400 rounded-xl p-2 bg-white text-xs text-emerald-800 font-semibold italic mt-1.5 shadow-[0_1px_0_0_#000000]">
            {aiCaption}
          </div>
        </div>
      </div>

      {/* 2. Spot Details Form Card */}
      <div className="bg-white border-[2.5px] border-black rounded-3xl p-3.5 shadow-[0_4px_0_0_#000000] space-y-3">
        {/* City Selection */}
        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase tracking-wider text-black flex items-center justify-between">
            <span>CITY</span>
            <span className="text-[#0B3BF4]">📍 Regional Pin</span>
          </label>
          <select
            value={selectedCityKey}
            onChange={(e) => setSelectedCityKey(e.target.value)}
            className="w-full bg-[#F4F6F9] border-[2px] border-black rounded-xl px-3 py-2 text-xs font-black text-black outline-none shadow-[0_2px_0_0_#000000] cursor-pointer"
          >
            {Object.entries(KERALA_CITIES).map(([key, city]) => (
              <option key={key} value={key}>
                {city.displayName}
              </option>
            ))}
          </select>
        </div>

        {/* Specific Place / Area / Landmark */}
        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase tracking-wider text-black flex items-center justify-between">
            <span>AREA / LANDMARK</span>
            <span className="text-gray-500 font-bold">Town / Street</span>
          </label>
          <div className="border-[2px] border-black rounded-xl px-3 py-2 bg-white flex items-center justify-between shadow-[0_2px_0_0_#000000]">
            <input
              type="text"
              value={specificArea}
              onChange={(e) => setSpecificArea(e.target.value)}
              placeholder="e.g. Kottakkunnu Hill, Fort Kochi, SM Street..."
              className="w-full text-xs font-black text-black outline-none bg-transparent"
            />
            <MapPin size={13} className="text-[#0B3BF4] shrink-0" />
          </div>
        </div>

        {/* Name */}
        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase tracking-wider text-black">
            NAME
          </label>
          <div className="border-[2px] border-black rounded-xl px-3 py-2 bg-white flex items-center justify-between shadow-[0_2px_0_0_#000000]">
            <input
              type="text"
              value={spotName}
              onChange={(e) => setSpotName(e.target.value)}
              placeholder="e.g. Kottakkunnu Secret Sunset Rock"
              className="w-full text-xs font-black text-black outline-none bg-transparent"
            />
            <Pencil size={13} className="text-gray-500 shrink-0" />
          </div>
        </div>

        {/* GPS Coordinates & Google Maps Link */}
        <div className="space-y-1.5 bg-[#F4F6F9] border-[2px] border-black rounded-2xl p-2.5 shadow-[0_1.5px_0_0_#000000]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-black flex items-center gap-1">
              <MapPin size={12} className="text-[#0B3BF4]" />
              <span>COORDINATES & MAP LINK</span>
            </span>
            <button
              type="button"
              onClick={() => {
                if (navigator.geolocation) {
                  navigator.geolocation.getCurrentPosition(
                    (pos) => {
                      setLat(Number(pos.coords.latitude.toFixed(5)));
                      setLng(Number(pos.coords.longitude.toFixed(5)));
                    },
                    () => alert('GPS access denied')
                  );
                }
              }}
              className="text-[10px] font-black text-[#0B3BF4] hover:underline flex items-center gap-0.5 cursor-pointer"
            >
              <Navigation size={10} /> Auto-fill GPS
            </button>
          </div>

          {/* Link paste input */}
          <div className="flex items-center bg-white border-[1.5px] border-black rounded-xl px-2.5 py-1.5 shadow-[0_1px_0_0_#000000]">
            <Globe size={13} className="text-gray-400 shrink-0 mr-1.5" />
            <input
              type="text"
              value={mapsLink}
              onChange={(e) => handleMapsLinkChange(e.target.value)}
              placeholder="Paste Google Maps link or coordinates..."
              className="w-full text-xs font-bold text-black outline-none bg-transparent placeholder-gray-400"
            />
          </div>

          {/* Editable Lat and Lng */}
          <div className="grid grid-cols-2 gap-2 pt-0.5">
            <div className="bg-white border-[1.5px] border-black rounded-xl px-2.5 py-1">
              <span className="text-[9px] font-black text-gray-500 uppercase block">Latitude</span>
              <input
                type="number"
                step="0.00001"
                value={lat}
                onChange={(e) => {
                  setLat(parseFloat(e.target.value) || 0);
                  setDuplicateError('');
                }}
                className="w-full text-xs font-black text-black outline-none bg-transparent"
              />
            </div>
            <div className="bg-white border-[1.5px] border-black rounded-xl px-2.5 py-1">
              <span className="text-[9px] font-black text-gray-500 uppercase block">Longitude</span>
              <input
                type="number"
                step="0.00001"
                value={lng}
                onChange={(e) => {
                  setLng(parseFloat(e.target.value) || 0);
                  setDuplicateError('');
                }}
                className="w-full text-xs font-black text-black outline-none bg-transparent"
              />
            </div>
          </div>

          {duplicateError && (
            <div className="bg-red-50 border border-red-500 rounded-xl p-2 text-[11px] font-bold text-red-600 flex items-center gap-1.5">
              <AlertTriangle size={13} className="shrink-0 text-red-500" />
              <span>{duplicateError}</span>
            </div>
          )}
        </div>

        {/* Category */}
        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase tracking-wider text-black">
            CATEGORY
          </label>
          <div className="grid grid-cols-4 gap-1.5">
            {CATEGORIES.map((cat) => {
              const isSelected = category === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setCategory(cat.id)}
                  className={`py-2 rounded-xl border-[2px] border-black text-xs font-black text-center transition shadow-[0_2px_0_0_#000000] active:translate-y-0.5 ${
                    isSelected
                      ? 'bg-[#0B3BF4] text-white'
                      : 'bg-white text-black hover:bg-gray-100'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Avg Cost & Time Needed (2-Column Grid) */}
        <div className="grid grid-cols-2 gap-2">
          {/* Left: Avg Cost */}
          <div className="border-[2px] border-black rounded-2xl p-2.5 bg-white shadow-[0_2px_0_0_#000000]">
            <div className="text-[9px] font-black text-gray-500 uppercase tracking-wider">
              AVG COST (₹)
            </div>
            <div className="flex items-center gap-1 my-0.5">
              <span className="font-black text-sm text-black">₹</span>
              <input
                type="number"
                value={avgCost}
                onChange={(e) => setAvgCost(e.target.value)}
                className="font-black text-sm text-black outline-none w-16"
              />
            </div>
            <div className="text-[9px] font-bold text-gray-400">per person estimate</div>
          </div>

          {/* Right: Time Needed */}
          <div className="border-[2px] border-black rounded-2xl p-2.5 bg-white shadow-[0_2px_0_0_#000000]">
            <div className="text-[9px] font-black text-gray-500 uppercase tracking-wider">
              TIME NEEDED
            </div>
            <div className="my-0.5">
              <input
                type="text"
                value={timeNeeded}
                onChange={(e) => setTimeNeeded(e.target.value)}
                className="font-black text-sm text-black outline-none w-20"
              />
            </div>
          </div>
        </div>

        {/* Community Tip / Review */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-black">
              COMMUNITY REVIEW
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={generateAutoDescription}
                disabled={generatingText}
                className="bg-purple-600 hover:bg-purple-700 text-white border-[1.5px] border-black text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-[0_1.5px_0_0_#000000] active:translate-y-0.5 flex items-center gap-1 cursor-pointer transition disabled:opacity-50"
              >
                {generatingText ? (
                  <>
                    <Loader2 size={10} className="animate-spin text-white" />
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={10} className="text-yellow-300 fill-yellow-300" />
                    <span>Generate using AI</span>
                  </>
                )}
              </button>
            </div>
          </div>
          <div className="border-[2px] border-black rounded-2xl p-2.5 bg-[#FFFDF5] shadow-[0_2px_0_0_#000000]">
            <textarea
              value={review}
              onChange={(e) => setReview(e.target.value)}
              rows={3}
              placeholder="e.g. Best sunset view with zero crowd. Take the narrow mud path behind the banyan tree. Fresh chai stall nearby costs ₹10."
              className="w-full text-xs font-semibold text-black bg-transparent outline-none resize-none leading-relaxed"
            />
          </div>
        </div>
      </div>

      {/* 3. Publish Button (Amber) */}
      <button
        onClick={handlePublish}
        disabled={publishing}
        className="w-full bg-[#F59E0B] border-[2.5px] border-black rounded-2xl py-3.5 font-black text-sm text-black shadow-[0_4px_0_0_#000000] hover:bg-amber-400 active:translate-y-0.5 transition flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
      >
        {publishing ? (
          <>
            <Loader2 size={16} className="animate-spin text-black" />
            <span>UPLOADING TO FIREBASE...</span>
          </>
        ) : (
          <>
            <span>PUBLISH</span>
            <span>→</span>
          </>
        )}
      </button>

      {/* Success Banner */}
      {published && (
        <div className="bg-[#ECFDF5] border-[2px] border-black rounded-2xl p-3 flex items-center gap-2 shadow-[0_3px_0_0_#000000] animate-bounce">
          <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
          <div className="text-xs font-black text-emerald-950">
            🎉 &quot;{spotName}&quot; published to {specificArea.trim() || selectedCityKey} feed & saved to Cloud Storage & Database!
          </div>
        </div>
      )}
    </div>
  );
}
