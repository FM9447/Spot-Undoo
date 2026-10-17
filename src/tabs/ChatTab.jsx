import { useState, useEffect } from 'react';
import { Sparkles, MapPin, ExternalLink, Bookmark, Clock, ArrowRight, Loader2, Star, ArrowLeft, History, Check, X } from 'lucide-react';
import { KERALA_CITIES } from '../data/keralaCitiesData';
import { ollamaChat } from '../utils/ollama';
import ImageCarousel from '../components/ImageCarousel';
import { getBackendUrl } from '../utils/apiConfig';

const MODES = [
  { id: 'layover', label: '🚆 Layover (Train/Flight)' },
  { id: 'quick', label: '⚡ Quick Free Time' },
  { id: 'day', label: '🎒 Full Day Trip' },
];

const VIBE_CHIPS = [
  '🍜 Street Food',
  '🌿 Hidden Nature',
  '🎮 Gaming & Chill',
  '🌙 Night Vibe',
  '☕ Chai & View',
];

const BACKEND_URL = getBackendUrl();

export default function ChatTab({ location, setLocation, settings }) {
  // Start on 'form' so user sees "What's the Plan Today? ✦" first!
  const [viewState, setViewState] = useState('form'); // 'form' | 'trail'
  const [selectedCityKey, setSelectedCityKey] = useState('Shoranur');
  const [activePlanIdx, setActivePlanIdx] = useState(0);
  const [trailMode, setTrailMode] = useState('trail');
  const [selectedSpot, setSelectedSpot] = useState(KERALA_CITIES['Shoranur'].spots[0]);
  const [bookmarkedIds, setBookmarkedIds] = useState([]);
  const [userRating, setUserRating] = useState(5);
  const [userReviewText, setUserReviewText] = useState('');
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  // Form inputs
  const [tripMode, setTripMode] = useState('layover');
  const [availableTimeHrs, setAvailableTimeHrs] = useState(3);
  const [maxBudget, setMaxBudget] = useState(500);
  const [promptText, setPromptText] = useState(
    "I want quiet nature spots near water, amazing local pazhampori, and a gaming cafe with AC before my 5 PM train..."
  );
  const [selectedVibes, setSelectedVibes] = useState(['🍜 Street Food', '🌿 Hidden Nature']);
  const [loading, setLoading] = useState(false);
  const [aiError, setAiError] = useState('');

  // History modal
  const [showHistory, setShowHistory] = useState(false);
  const [historyItems, setHistoryItems] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const currentCity = KERALA_CITIES[selectedCityKey] || KERALA_CITIES['Shoranur'];

  // Dynamic plan generator that intelligently filters by budget, available time, vibes, and prompt keywords
  const makeDynamicPlans = (
    city,
    budget = maxBudget,
    timeHrs = availableTimeHrs,
    vibes = selectedVibes,
    prompt = promptText
  ) => {
    // 1. Gather all spots: city built-ins + user uploaded spots for this city
    const stored = JSON.parse(localStorage.getItem('userSpots') || '[]');
    const userCitySpots = stored.filter(
      (s) =>
        s.cityKey === selectedCityKey ||
        (s.cityName && s.cityName.toLowerCase() === city.name.toLowerCase())
    );
    const allSpots = [...(city.spots || []), ...userCitySpots];

    // 2. Budget constraint filter: exclude spots strictly over maxBudget
    let budgetFiltered = allSpots.filter(
      (s) => (s.expense || 0) <= budget
    );
    if (budgetFiltered.length < 2) {
      const sortedByCost = [...allSpots].sort((a, b) => (a.expense || 0) - (b.expense || 0));
      budgetFiltered = sortedByCost.slice(0, Math.max(3, sortedByCost.length));
    }

    // 3. Time calculation: max stops based on available time
    const maxStopsCount = timeHrs <= 1 ? 1 : timeHrs <= 3 ? 2 : timeHrs <= 5 ? 3 : 4;

    // 4. Scoring function for matching vibes & prompt keywords
    const scoreSpot = (s) => {
      let score = s.rating || 4.5;
      const combined = `${s.name} ${s.category} ${s.badge || ''} ${(s.tags || []).join(' ')} ${s.review || ''}`.toLowerCase();

      // Vibe matching: split into words (e.g. 'street', 'food', 'gaming', 'chill', 'nature', 'chai')
      (vibes || []).forEach((v) => {
        const words = v.toLowerCase().replace(/[^\w\s]/g, ' ').split(/\s+/).filter((w) => w.length > 2);
        words.forEach((w) => {
          if (combined.includes(w)) score += 4.0;
        });
      });

      // Prompt keywords
      const words = (prompt || '').toLowerCase().split(/\s+/).filter((w) => w.length > 3);
      words.forEach((w) => {
        if (combined.includes(w)) score += 2;
      });

      // Budget scaling: if user set generous budget (e.g. ₹200+), give quality experiences a slight boost
      if (budget >= 200 && (s.expense || 0) >= 60) {
        score += 0.8;
      }

      return score;
    };

    const scored = [...budgetFiltered].sort((a, b) => scoreSpot(b) - scoreSpot(a));

    const buildPlanStops = (selectedList) => {
      let cumulativeCost = 0;
      let cumulativeMins = 0;
      return {
        stops: selectedList.map((s, idx) => {
          cumulativeCost += (s.expense || 0) + (s.returnCost || 15);
          cumulativeMins += (s.spendTime || 30) + 15;
          return {
            num: idx + 1,
            name: s.name,
            badge: idx === 0 ? 'ACTIVE' : (s.badge || ''),
            costText: `₹${s.expense || 0} • ${s.spendTime || 30}m`,
            transitPill: s.transitText || '🚶 8m • Free',
            photo: s.photo,
            photos: s.photos || (s.photo ? [s.photo] : []),
            links: s.links || [],
            data: s,
          };
        }),
        totalCost: cumulativeCost,
        totalDuration: `${Math.floor(cumulativeMins / 60)}h ${cumulativeMins % 60}m`,
      };
    };

    // Plan 1: Best Mood & Review Match (Vibe tailored)
    const plan1Spots = scored.slice(0, maxStopsCount);
    const p1 = buildPlanStops(plan1Spots);

    // Plan 2: Ultra-Budget Saver (Sorted by lowest cost first, avoiding duplicates where possible)
    const budgetSorted = [...budgetFiltered].sort((a, b) => (a.expense || 0) - (b.expense || 0));
    const p1Ids = new Set(plan1Spots.map((s) => s.id));
    const p2Candidates = [
      ...budgetSorted.filter((s) => !p1Ids.has(s.id)),
      ...budgetSorted.filter((s) => p1Ids.has(s.id)),
    ];
    const plan2Spots = p2Candidates.slice(0, Math.min(maxStopsCount, p2Candidates.length));
    const p2 = buildPlanStops(plan2Spots);

    // Plan 3: Hidden Gem / Scenic Transit (Prioritizing Hidden Gems & distinct spots)
    const gemSorted = [...budgetFiltered].sort((a, b) => {
      const aGem = (a.category === 'Hidden Spots' || a.category === 'Hidden') ? 2 : 0;
      const bGem = (b.category === 'Hidden Spots' || b.category === 'Hidden') ? 2 : 0;
      return (b.rating + bGem) - (a.rating + aGem);
    });
    const p12Ids = new Set([...p1Ids, ...plan2Spots.map((s) => s.id)]);
    const p3Candidates = [
      ...gemSorted.filter((s) => !p12Ids.has(s.id)),
      ...gemSorted.filter((s) => !p1Ids.has(s.id)),
      ...gemSorted,
    ];
    const plan3Spots = p3Candidates.slice(0, Math.min(maxStopsCount, p3Candidates.length));
    const p3 = buildPlanStops(plan3Spots);

    return [
      {
        id: 'plan-1',
        title: 'Plan 1: Best Mood & Review Match',
        vibe: `${plan1Spots[0]?.name || 'Scenic Walk'} • Matches your vibe`,
        startTime: '14:00',
        returnTime: '17:00 PM',
        totalCost: p1.totalCost,
        totalDuration: p1.totalDuration,
        stops: p1.stops,
        returnPill: `⏰ 17:00 PM • SAFE RETURN TO ${city.hub.stationName}`,
      },
      {
        id: 'plan-2',
        title: 'Plan 2: Ultra-Budget Saver',
        vibe: `Budget route under ₹${budget} per person`,
        startTime: '14:00',
        returnTime: '16:45 PM',
        totalCost: p2.totalCost,
        totalDuration: p2.totalDuration,
        stops: p2.stops,
        returnPill: `⏰ 16:45 PM • SAFE RETURN TO ${city.hub.stationName}`,
      },
      {
        id: 'plan-3',
        title: 'Plan 3: Hidden Gem Route',
        vibe: 'Top-rated spots with short transit time',
        startTime: '14:00',
        returnTime: '17:15 PM',
        totalCost: p3.totalCost,
        totalDuration: p3.totalDuration,
        stops: p3.stops,
        returnPill: `⏰ 17:15 PM • SAFE RETURN TO ${city.hub.stationName}`,
      },
    ];
  };

  const [plans, setPlans] = useState(() => makeDynamicPlans(currentCity));

  // When city changes from dropdown
  const handleCityChange = (key) => {
    setSelectedCityKey(key);
    const newCity = KERALA_CITIES[key];
    if (newCity) {
      if (setLocation) {
        setLocation({
          lat: newCity.hub.lat,
          lon: newCity.hub.lng,
          label: `${newCity.hub.name} (Active)`,
        });
      }
      setSelectedSpot(newCity.spots[0]);
      setPlans(makeDynamicPlans(newCity, maxBudget, availableTimeHrs, selectedVibes, promptText));
    }
  };

  const toggleVibe = (vibe) => {
    setSelectedVibes((prev) =>
      prev.includes(vibe) ? prev.filter((v) => v !== vibe) : [...prev, vibe]
    );
  };

  // Fetch past plans from MongoDB Atlas + LocalStorage fallback
  const loadHistory = async () => {
    setHistoryLoading(true);
    setShowHistory(true);
    // 1. Get local cached plans immediately
    const localSaved = JSON.parse(localStorage.getItem('savedPlansHistory') || '[]');
    setHistoryItems(localSaved);

    // 2. Fetch from MongoDB Atlas and merge without duplicates
    try {
      const res = await fetch(`${BACKEND_URL}/api/plans`);
      if (res.ok) {
        const mongoPlans = await res.json();
        if (Array.isArray(mongoPlans)) {
          const seen = new Set();
          const merged = [];
          for (const p of [...localSaved, ...mongoPlans]) {
            const key = p._id || `${p.hub}_${p.createdAt}_${p.prompt?.slice(0, 20)}`;
            if (!seen.has(key)) {
              seen.add(key);
              merged.push(p);
            }
          }
          setHistoryItems(merged);
        }
      }
    } catch (e) {
      console.warn('History fetch from MongoDB failed, showing local:', e);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Save plan to both LocalStorage AND MongoDB Atlas
  const savePlanToDatabase = async (plansToSave, cityObj) => {
    const newRecord = {
      id: Date.now().toString(),
      hub: cityObj.displayName || cityObj.name,
      prompt: promptText,
      imageUrl: plansToSave[0]?.stops[0]?.photo || cityObj.spots[0]?.photo,
      plans: plansToSave,
      createdAt: new Date().toISOString(),
    };

    // 1. Instantly persist to localStorage
    try {
      const existing = JSON.parse(localStorage.getItem('savedPlansHistory') || '[]');
      const updated = [newRecord, ...existing].slice(0, 30);
      localStorage.setItem('savedPlansHistory', JSON.stringify(updated));
    } catch (err) {
      console.warn('Local plan storage error:', err);
    }

    // 2. Persist to MongoDB Atlas cloud
    try {
      await fetch(`${BACKEND_URL}/api/plans`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRecord),
      });
    } catch (e) {
      console.warn('Could not save plan to MongoDB (backend may be offline):', e.message);
    }
  };

  // Submit review to MongoDB Atlas
  const submitReviewToDb = async (spot, rating, text) => {
    try {
      await fetch(`${BACKEND_URL}/api/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          spotId: spot.id || spot.name,
          spotName: spot.name,
          rating,
          reviewText: text,
          author: 'Hadhy',
        }),
      });
    } catch (e) {
      console.warn('Could not post review to MongoDB:', e.message);
    }
  };

  const handleGenerate = async () => {
    setLoading(true);
    setAiError('');
    try {
      // 1. Gather all spots: built-in city spots + community uploaded spots
      const stored = JSON.parse(localStorage.getItem('userSpots') || '[]');
      const userCitySpots = stored.filter(
        (s) =>
          s.cityKey === selectedCityKey ||
          (s.cityName && s.cityName.toLowerCase() === currentCity.name.toLowerCase())
      );
      const allCitySpots = [...(currentCity.spots || []), ...userCitySpots];

      // 2. Pre-filter by user's maxBudget
      let candidates = allCitySpots.filter((s) => (s.expense || 0) <= maxBudget);
      if (candidates.length < 3) {
        const sorted = [...allCitySpots].sort((a, b) => (a.expense || 0) - (b.expense || 0));
        candidates = sorted.slice(0, Math.max(4, sorted.length));
      }

      const topCandidates = candidates.slice(0, 6);
      const targetStops = availableTimeHrs <= 1 ? 1 : availableTimeHrs <= 3 ? 2 : availableTimeHrs <= 5 ? 3 : 4;

      const prompt = `You are an expert Kerala travel planner at ${currentCity.displayName}.
User constraints:
Mode: ${tripMode}
Available Time: ${availableTimeHrs} hours (with safety return buffer)
Budget: ₹${maxBudget} per person
Prompt: "${promptText}"
Selected vibes: ${selectedVibes.join(', ')}

Available local spots matching constraints:
${topCandidates.map((c, i) => `${i + 1}. "${c.name}" (${c.category}) | Expense: ₹${c.expense} | ${c.spendTime}m | Dist: ${c.distanceKm}km`).join('\n')}

Generate 3 diverse itinerary plans strictly within ₹${maxBudget} and ${availableTimeHrs} hours in JSON format.
Rules:
1. Each plan MUST contain exactly ${targetStops} stops chosen from the spots list above.
2. Plan 1: Best Mood & Review Match (matching ${selectedVibes[0] || 'popular'}).
3. Plan 2: Ultra-Budget Saver (lowest expense spots).
4. Plan 3: Hidden Gem Route (scenic / local heritage).
5. Pick DIFFERENT spots across the plans so that they do not all recommend the exact same places.

Return JSON in this format:
{
  "plans": [
    {
      "title": "Plan 1: Best Mood & Review Match",
      "vibe": "description matching ${selectedVibes[0] || 'vibe'}",
      "startTime": "14:00",
      "returnTime": "17:10 PM",
      "totalCost": 120,
      "totalDuration": "${availableTimeHrs} Hours",
      "stops": [
        {"num": 1, "name": "${candidates[0]?.name}", "badge": "ACTIVE", "costText": "₹${candidates[0]?.expense} • ${candidates[0]?.spendTime}m", "transitPill": "🚶 8m • Free"}
      ],
      "returnPill": "⏰ 17:10 PM • SAFE RETURN TO ${currentCity.hub.stationName}"
    }
  ]
}`;

      const res = await ollamaChat({
        baseUrl: settings.baseUrl,
        model: settings.model || 'spot-undo-qwen',
        messages: [{ role: 'user', content: prompt }],
      });

      let rawPlans = [];
      if (Array.isArray(res?.plans) && res.plans.length > 0) {
        rawPlans = res.plans;
      } else if (res && typeof res === 'object') {
        rawPlans = Object.entries(res)
          .filter(([k]) => k.startsWith('Plan'))
          .map(([, v], i) => ({
            id: `plan-${i + 1}`,
            title: v.title || `Plan ${i + 1}`,
            vibe: v.vibe || 'Curated Route',
            startTime: v.startTime || '14:00',
            returnTime: v.returnTime || '17:00 PM',
            totalCost: v.totalCost ?? 120,
            totalDuration: `${availableTimeHrs} Hours`,
            stops: v.stops || [],
            returnPill: v.returnPill || `⏰ 17:00 PM • SAFE RETURN TO ${currentCity.hub.stationName}`,
          }));
      }

      if (rawPlans.length > 0) {
        // Enrich stops with photos, links & coordinates from candidates
        const enriched = rawPlans.map((p, pIdx) => ({
          ...p,
          id: p.id || `plan-${pIdx + 1}`,
          stops: (p.stops || []).map((s, idx) => {
            const match = candidates.find(
              (c) =>
                c.name.toLowerCase().includes((s.name || s.location || '').toLowerCase()) ||
                (s.name || s.location || '').toLowerCase().includes(c.name.toLowerCase())
            ) || candidates[idx % candidates.length];
            return {
              ...s,
              num: idx + 1,
              name: s.name || s.location || match.name,
              badge: idx === 0 ? 'ACTIVE' : (match.badge || ''),
              costText: s.costText || `₹${match.expense} • ${match.spendTime}m`,
              transitPill: s.transitPill || match.transitText || '🚶 8m • Free',
              photo: match.photo,
              photos: match.photos || (match.photo ? [match.photo] : []),
              links: match.links || [],
              data: match,
            };
          }),
        }));
        setPlans(enriched);
        setActivePlanIdx(0);
        setSelectedSpot(enriched[0]?.stops[0]?.data || candidates[0]);
        setViewState('trail');
        // Save to MongoDB Atlas
        savePlanToDatabase(enriched, currentCity);
      } else {
        throw new Error('No valid plans returned by AI');
      }
    } catch {
      // Smart dynamic fallback tailored to user budget, time, and vibes
      const dynamicPlans = makeDynamicPlans(
        currentCity,
        maxBudget,
        availableTimeHrs,
        selectedVibes,
        promptText
      );
      setPlans(dynamicPlans);
      setActivePlanIdx(0);
      setSelectedSpot(dynamicPlans[0]?.stops[0]?.data || currentCity.spots[0]);
      setViewState('trail');
      savePlanToDatabase(dynamicPlans, currentCity);
    } finally {
      setLoading(false);
    }
  };

  const currentPlan = plans[activePlanIdx] || plans[0];

  return (
    <div className="space-y-3 pb-8">
      {/* VIEW 1: PRE-INTENT PROMPT SCREEN (Exact match to User Screenshot) */}
      {viewState === 'form' ? (
        <div className="space-y-3">
          {/* Page Title & History Button */}
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black text-black tracking-tight">
              What's the Plan Today? ✦
            </h2>
            <button
              onClick={loadHistory}
              className="flex items-center gap-1 bg-white border-[2px] border-black rounded-full px-2.5 py-1 text-[11px] font-black text-black shadow-[0_2px_0_0_#000000] hover:bg-gray-100 transition active:translate-y-0.5"
              title="View saved plans in MongoDB"
            >
              <History size={13} />
              <span>History</span>
            </button>
          </div>

          <div className="text-[10px] font-black uppercase tracking-wider text-gray-500">
            POWERED BY LOCAL QWEN 2.5:3B / QWEN 3:4B
          </div>

          {/* Master Form Card */}
          <div className="bg-white border-[2.5px] border-black rounded-3xl p-4 shadow-[0_4px_0_0_#000000] space-y-4">
            {/* CITY / HUB SELECTOR (Requested Feature) */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase tracking-wider text-black flex items-center justify-between">
                <span>SELECT CITY / REGION HUB</span>
                <span className="text-[#0B3BF4] font-bold">📍 Active Pin</span>
              </label>
              <select
                value={selectedCityKey}
                onChange={(e) => handleCityChange(e.target.value)}
                className="w-full bg-[#F4F6F9] border-[2px] border-black rounded-2xl px-3 py-2.5 text-xs font-black text-black outline-none shadow-[0_2px_0_0_#000000] cursor-pointer"
              >
                {Object.entries(KERALA_CITIES).map(([key, city]) => (
                  <option key={key} value={key}>
                    {city.displayName}
                  </option>
                ))}
              </select>
            </div>

            {/* Trip Context Mode */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase tracking-wider text-black">
                TRIP CONTEXT MODE
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {MODES.map((mode) => {
                  const isSelected = tripMode === mode.id;
                  return (
                    <button
                      key={mode.id}
                      onClick={() => setTripMode(mode.id)}
                      className={`py-2.5 px-1 rounded-2xl border-[2px] border-black text-[11px] font-black leading-tight text-center transition shadow-[0_2px_0_0_#000000] active:translate-y-0.5 ${
                        isSelected
                          ? 'bg-[#0B3BF4] text-white'
                          : 'bg-white text-black hover:bg-gray-100'
                      }`}
                    >
                      {mode.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Available Time Slider */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-xs font-black">
                <span>
                  Available Time:{' '}
                  <span className="text-[#0B3BF4]">{availableTimeHrs} Hours</span>{' '}
                  <span className="text-gray-500 font-bold">(30m buffer locked)</span>
                </span>
              </div>
              <div className="relative pt-1">
                <input
                  type="range"
                  min="1"
                  max="8"
                  value={availableTimeHrs}
                  onChange={(e) => setAvailableTimeHrs(Number(e.target.value))}
                  className="w-full h-3 bg-gray-200 border-[2px] border-black rounded-lg appearance-none cursor-pointer accent-[#0B3BF4]"
                />
                <div className="flex justify-between text-[10px] font-bold text-gray-500 mt-1">
                  <span>1 hour</span>
                  <span>8 hours</span>
                </div>
              </div>
            </div>

            {/* Max Budget Input */}
            <div className="border-[2px] border-black rounded-2xl px-3 py-2.5 flex items-center justify-between bg-white shadow-[0_2px_0_0_#000000]">
              <div className="flex items-center gap-1.5">
                <span className="font-black text-sm text-black">Max Budget:</span>
                <span className="font-black text-sm text-black">₹</span>
                <input
                  type="number"
                  value={maxBudget}
                  onChange={(e) => setMaxBudget(Number(e.target.value))}
                  className="w-20 font-black text-sm text-black outline-none bg-transparent"
                />
              </div>
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
                PER PERSON
              </span>
            </div>

            {/* Tell us your kind of adventure */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-xs font-black text-black">
                <span>Tell us your kind of adventure</span>
                <span className="text-[#0B3BF4]">✦</span>
              </div>
              <textarea
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
                rows={3}
                placeholder="e.g., 'I want quiet nature spots near water, amazing local pazhampori, and a gaming cafe with AC before my 5 PM train...'"
                className="w-full bg-white border-[2px] border-black rounded-2xl p-3 text-xs font-bold text-black placeholder-gray-400 outline-none resize-none shadow-[0_2px_0_0_#000000]"
              />
            </div>

            {/* Quick Vibes Tap to Add */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-wider text-black">
                QUICK VIBES • TAP TO ADD
              </label>
              <div className="flex flex-wrap gap-1.5">
                {VIBE_CHIPS.map((chip) => {
                  const isSelected = selectedVibes.includes(chip);
                  return (
                    <button
                      key={chip}
                      onClick={() => toggleVibe(chip)}
                      className={`text-xs font-black px-3 py-1.5 rounded-full border-[2px] border-black transition shadow-[0_2px_0_0_#000000] active:translate-y-0.5 ${
                        isSelected
                          ? 'bg-[#0B3BF4] text-white'
                          : 'bg-white text-black hover:bg-gray-100'
                      }`}
                    >
                      {chip}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Generate Button (Amber Orange) */}
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full bg-[#F59E0B] border-[2.5px] border-black rounded-2xl py-3.5 font-black text-black text-sm shadow-[0_4px_0_0_#000000] hover:bg-amber-400 active:translate-y-0.5 transition flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Qwen Reasoning Itinerary...</span>
              </>
            ) : (
              <>
                <span>Generate 3 AI Travel Plans</span>
                <span>⚡</span>
              </>
            )}
          </button>
        </div>
      ) : (
        /* VIEW 2: ADVENTURE TRAIL MAP (Results Screen) */
        <div className="space-y-3">
          {/* Subheader Status / Filter Bar with Back Button */}
          <div className="bg-white border-[2.5px] border-black rounded-full p-1.5 flex items-center justify-between shadow-[0_3px_0_0_#000000]">
            <button
              onClick={() => setViewState('form')}
              className="flex items-center gap-1 text-xs font-black px-3 py-1 rounded-full border-[2px] border-black bg-white hover:bg-gray-100 transition shadow-[0_2px_0_0_#000000]"
            >
              <ArrowLeft size={13} strokeWidth={2.5} />
              <span>New Plan</span>
            </button>
            <div className="flex items-center gap-1.5 px-2">
              <span className="font-black text-xs text-black">
                {currentCity.name} • ₹{maxBudget} Max
              </span>
            </div>
            <button
              onClick={loadHistory}
              className="text-xs font-black px-2.5 py-1 rounded-full border-[2px] border-black bg-white text-black hover:bg-gray-100 shadow-[0_2px_0_0_#000000] flex items-center gap-1"
            >
              <History size={12} />
              <span>History</span>
            </button>
          </div>

          {/* 3-Plan Tabs Selector */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {plans.map((p, idx) => {
              const isSelected = activePlanIdx === idx;
              return (
                <button
                  key={p.id || idx}
                  onClick={() => {
                    setActivePlanIdx(idx);
                    if (p.stops?.[0]?.data) {
                      setSelectedSpot(p.stops[0].data);
                    }
                  }}
                  className={`text-xs font-black px-3 py-1.5 rounded-full border-[2px] border-black transition shadow-[0_2px_0_0_#000000] shrink-0 active:translate-y-0.5 ${
                    isSelected
                      ? 'bg-[#0B3BF4] text-white'
                      : 'bg-white text-black hover:bg-gray-100'
                  }`}
                >
                  {p.title?.split(':')[0] || `Plan ${idx + 1}`}
                </button>
              );
            })}
          </div>

          {/* Trail Map Canvas */}
          <div className="relative bg-[#F4F6F9] border-[2.5px] border-black rounded-3xl p-3 shadow-[0_4px_0_0_#000000] min-h-[500px] overflow-hidden">
            {/* Winding Blue Trail S-curve SVG Line — ends at the Safe Return card */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none"
              viewBox="0 0 360 520"
              preserveAspectRatio="none"
            >
              {/* Black outline */}
              <path
                d="M 280 40 C 100 80, 20 140, 100 200 S 300 280, 220 355 S 80 405, 180 415"
                fill="none"
                stroke="#000000"
                strokeWidth="10"
                strokeLinecap="round"
              />
              {/* Blue dashed trail */}
              <path
                d="M 280 40 C 100 80, 20 140, 100 200 S 300 280, 220 355 S 80 405, 180 415"
                fill="none"
                stroke="#0B3BF4"
                strokeWidth="6"
                strokeDasharray="8 6"
                strokeLinecap="round"
              />
              {/* Terminal dot at the return card */}
              <circle cx="180" cy="415" r="7" fill="#F59E0B" stroke="#000000" strokeWidth="2.5" />
            </svg>

            {/* 1. START Station Pill (Top Right) */}
            <div className="relative z-10 flex justify-end mb-4">
              <div className="bg-white border-[2px] border-black rounded-full px-3 py-1 flex items-center gap-1.5 text-xs font-black shadow-[0_2px_0_0_#000000]">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 border border-black inline-block" />
                <span>START • {currentPlan.startTime || '14:00'}</span>
                <span className="text-gray-400">|</span>
                <span>{currentCity.hub.stationName}</span>
                <span className="text-[#0B3BF4]">↗</span>
              </div>
            </div>

            {/* Dynamic Trail Steps */}
            <div className="relative z-10 space-y-4">
              {(currentPlan.stops || []).map((stop, sIdx) => {
                const isLeft = sIdx % 2 === 0;
                return (
                  <div key={sIdx} className="space-y-1">
                    {/* Transit pill above card */}
                    <div className={`flex ${isLeft ? 'justify-start pl-16' : 'justify-center pr-6'}`}>
                      <span className="bg-[#FEF3C7] border-[1.5px] border-black rounded-full px-2.5 py-0.5 text-[10px] font-black text-black shadow-[0_1px_0_0_#000000]">
                        {stop.transitPill || '🚶 8m • Free'}
                      </span>
                    </div>

                    {isLeft ? (
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-[#0B3BF4] border-[2px] border-black text-white font-black text-xs flex items-center justify-center shrink-0 shadow-[0_2px_0_0_#000000]">
                          {sIdx + 1}
                        </div>
                        <div
                          onClick={() => setSelectedSpot(stop.data || stop)}
                          className="bg-white border-[2.5px] border-black rounded-2xl p-1.5 shadow-[0_3px_0_0_#000000] flex items-center gap-2 cursor-pointer hover:scale-102 transition flex-1 max-w-[220px]"
                        >
                          <img
                            src={stop.photo || currentCity.spots[0].photo}
                            alt={stop.name}
                            className="w-12 h-12 rounded-xl border-[1.5px] border-black object-cover shrink-0"
                          />
                          <div className="leading-tight overflow-hidden">
                            <div className="flex items-center gap-1 truncate">
                              <span className="font-black text-xs text-black truncate">
                                {stop.name}
                              </span>
                              {stop.badge && (
                                <span className="bg-[#F59E0B] border border-black text-black font-black text-[8px] px-1 rounded uppercase shrink-0">
                                  {stop.badge}
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] font-bold text-emerald-700 mt-0.5">
                              {stop.costText || 'Free • 30m'} ↗
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end gap-2 pr-1">
                        <div
                          onClick={() => setSelectedSpot(stop.data || stop)}
                          className="bg-white border-[2px] border-black rounded-2xl p-1.5 shadow-[0_3px_0_0_#000000] flex items-center gap-2 cursor-pointer hover:scale-102 transition max-w-[210px]"
                        >
                          <div className="leading-tight text-right flex-1 overflow-hidden">
                            <div className="font-black text-xs text-black truncate">
                              {stop.name}
                            </div>
                            <div className="text-[11px] font-bold text-emerald-700 mt-0.5">
                              {stop.costText || 'Free • 30m'} ↗
                            </div>
                          </div>
                          <img
                            src={stop.photo || currentCity.spots[1]?.photo}
                            alt={stop.name}
                            className="w-12 h-12 rounded-xl border-[1.5px] border-black object-cover shrink-0"
                          />
                        </div>
                        <div className="w-7 h-7 rounded-full bg-[#0B3BF4] border-[2px] border-black text-white font-black text-xs flex items-center justify-center shrink-0 shadow-[0_2px_0_0_#000000]">
                          {sIdx + 1}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* MANDATORY SAFE RETURN LEG */}
            <div className="relative z-10 mt-6 mb-1">
              <div className="bg-[#F59E0B] border-[2.5px] border-black rounded-2xl py-2.5 px-3 text-center shadow-[0_3px_0_0_#000000]">
                <span className="font-black text-xs text-black tracking-wide">
                  {currentPlan.returnPill || `⏰ 17:10 PM • SAFE RETURN TO ${currentCity.hub.stationName}`}
                </span>
              </div>
            </div>
          </div>

          {/* Selected Spot Bottom Sheet */}
          {selectedSpot && (
            <div className="bg-white border-[2.5px] border-black rounded-3xl p-4 shadow-[0_5px_0_0_#000000] space-y-3 relative mt-2">
              <div className="w-12 h-1 bg-black rounded-full mx-auto" />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="bg-[#FEF3C7] border-[1.5px] border-black rounded-full px-2.5 py-0.5 text-xs font-black text-black">
                    {selectedSpot.badge || selectedSpot.category || 'Local Spot'}
                  </span>
                  <div className="flex items-center gap-1 text-xs font-black text-black">
                    <Star size={13} className="text-amber-500 fill-amber-500" />
                    <span>{selectedSpot.rating || 4.8}</span>
                    <span className="text-gray-500 font-bold">
                      ({selectedSpot.reviewCount || 120})
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedSpot(null)}
                  className="w-7 h-7 rounded-full border-[2px] border-black bg-white flex items-center justify-center hover:bg-gray-100 font-black text-xs shadow-[0_1px_0_0_#000000]"
                >
                  ✕
                </button>
              </div>

              {/* Spot Photos Carousel with real Unsplash links and cyclic < > navigation */}
              <ImageCarousel
                images={selectedSpot.photos || (selectedSpot.photo ? [selectedSpot.photo] : [])}
                links={selectedSpot.links || []}
                alt={selectedSpot.name}
                className="w-full h-44 rounded-2xl border-[2px] border-black shadow-[0_2px_0_0_#000000]"
              />

              <h3 className="text-xl font-black text-black leading-tight">
                {selectedSpot.name}
              </h3>

              {/* 4-Box Stats Grid */}
              <div className="border-[2px] border-black rounded-2xl overflow-hidden grid grid-cols-4 divide-x-[2px] divide-black text-center py-2 bg-white shadow-[0_2px_0_0_#000000]">
                <div>
                  <div className="text-[9px] font-bold text-gray-500 uppercase">Schedule</div>
                  <div className="text-[11px] font-black text-black mt-0.5">
                    {selectedSpot.schedule || '14:15 - 15:00'}
                  </div>
                </div>
                <div>
                  <div className="text-[9px] font-bold text-gray-500 uppercase">Est. Spend</div>
                  <div className="text-[11px] font-black text-emerald-600 mt-0.5">
                    ₹{selectedSpot.expense ?? 0}
                  </div>
                </div>
                <div>
                  <div className="text-[9px] font-bold text-gray-500 uppercase">Transit</div>
                  <div className="text-[11px] font-black text-black mt-0.5">
                    {selectedSpot.distanceText || `${selectedSpot.distanceKm || 1.5} km`}
                  </div>
                </div>
                <div>
                  <div className="text-[9px] font-bold text-gray-500 uppercase">Return</div>
                  <div className="text-[11px] font-black text-[#0B3BF4] mt-0.5">
                    {selectedSpot.returnText || 'Free return'}
                  </div>
                </div>
              </div>

              {/* Community Review Quote */}
              <div className="border-[1.5px] border-black rounded-2xl p-3 bg-[#FFFDF5] text-xs font-semibold text-black leading-relaxed flex items-start gap-2 shadow-[0_1px_0_0_#000000]">
                <span className="text-gray-400 mt-0.5">💬</span>
                <p>"{selectedSpot.review || 'Authentic local spot recommended by the community.'}"</p>
              </div>

              {/* Interactive User Review & Rating Section (Saves to MongoDB Atlas) */}
              <div className="border-[2px] border-black rounded-2xl p-3 bg-white space-y-2 shadow-[0_2px_0_0_#000000]">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-black flex items-center gap-1">
                    <span>⭐</span> Rate & Add Review (MongoDB)
                  </span>
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
                    placeholder="Share your local tip or experience..."
                    className="flex-1 border-[1.5px] border-black rounded-xl px-2.5 py-1.5 text-xs font-bold text-black outline-none bg-[#F4F6F9]"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!userReviewText.trim()) return;
                      // Save locally
                      const key = `reviews_${selectedSpot.id || selectedSpot.name}`;
                      const existing = JSON.parse(localStorage.getItem(key) || '[]');
                      const newReview = { rating: userRating, text: userReviewText.trim(), date: new Date().toLocaleDateString() };
                      localStorage.setItem(key, JSON.stringify([newReview, ...existing]));
                      
                      // Save to MongoDB Atlas
                      submitReviewToDb(selectedSpot, userRating, userReviewText.trim());

                      setSelectedSpot({
                        ...selectedSpot,
                        review: userReviewText.trim(),
                        rating: Number(((selectedSpot.rating * (selectedSpot.reviewCount || 10) + userRating) / ((selectedSpot.reviewCount || 10) + 1)).toFixed(1)),
                        reviewCount: (selectedSpot.reviewCount || 10) + 1,
                      });
                      setUserReviewText('');
                      setReviewSubmitted(true);
                      setTimeout(() => setReviewSubmitted(false), 2500);
                    }}
                    className="bg-[#0B3BF4] text-white border-[1.5px] border-black rounded-xl px-3 py-1.5 text-xs font-black shadow-[0_2px_0_0_#000000] active:translate-y-0.5 cursor-pointer"
                  >
                    Post
                  </button>
                </div>
                {reviewSubmitted && (
                  <p className="text-[10px] font-black text-emerald-600 flex items-center gap-1">
                    ✓ Review saved to MongoDB Atlas!
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-1">
                <a
                  href={`https://www.google.com/maps/dir/?api=1&origin=${location?.lat || currentCity.hub.lat},${location?.lon || currentCity.hub.lng}&destination=${selectedSpot.lat || currentCity.hub.lat},${selectedSpot.lng || currentCity.hub.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 bg-[#F59E0B] border-[2.5px] border-black rounded-2xl py-3 px-4 font-black text-sm text-black shadow-[0_3px_0_0_#000000] flex items-center justify-center gap-1.5 hover:bg-amber-400 active:translate-y-0.5 transition text-center"
                >
                  <MapPin size={16} strokeWidth={2.5} />
                  <span>Open in Google Maps</span>
                  <ExternalLink size={13} strokeWidth={2.5} />
                </a>
                <button
                  onClick={() =>
                    setBookmarkedIds((prev) =>
                      prev.includes(selectedSpot.id)
                        ? prev.filter((x) => x !== selectedSpot.id)
                        : [...prev, selectedSpot.id]
                    )
                  }
                  className={`w-12 h-12 border-[2.5px] border-black rounded-2xl flex items-center justify-center shadow-[0_3px_0_0_#000000] active:translate-y-0.5 transition ${
                    bookmarkedIds.includes(selectedSpot.id)
                      ? 'bg-[#0B3BF4] text-white'
                      : 'bg-white text-black hover:bg-gray-100'
                  }`}
                  title="Bookmark"
                >
                  <Bookmark size={18} strokeWidth={2.4} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* HISTORY MODAL (Fetched from MongoDB Atlas) */}
      {showHistory && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="w-full max-w-sm bg-white border-[2.5px] border-black rounded-3xl p-4 shadow-[0_6px_0_0_#000000] max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b-[2px] border-black">
              <div className="flex items-center gap-2">
                <History size={18} strokeWidth={2.5} />
                <h3 className="font-black text-sm text-black">MongoDB Plan History</h3>
              </div>
              <button
                onClick={() => setShowHistory(false)}
                className="w-7 h-7 rounded-full border-[2px] border-black flex items-center justify-center hover:bg-gray-100 font-black text-xs"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-3 space-y-3">
              {historyLoading ? (
                <div className="text-center py-8">
                  <Loader2 size={24} className="animate-spin text-[#0B3BF4] mx-auto mb-2" />
                  <p className="text-xs font-bold text-gray-500">Loading history from MongoDB...</p>
                </div>
              ) : historyItems.length === 0 ? (
                <p className="text-center text-xs font-bold text-gray-500 py-8">
                  No plans saved yet. Generate one to see it here!
                </p>
              ) : (
                historyItems.map((item, idx) => (
                  <div
                    key={item._id || idx}
                    className="border-[2px] border-black rounded-2xl p-3 bg-[#F4F6F9] space-y-2 shadow-[0_2px_0_0_#000000]"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-black text-xs text-black">📍 {item.hub}</span>
                      <span className="text-[10px] font-bold text-gray-500">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    {item.prompt && (
                      <p className="text-[11px] font-medium text-gray-600 italic line-clamp-1">
                        "{item.prompt}"
                      </p>
                    )}
                    {item.imageUrl && (
                      <img
                        src={item.imageUrl}
                        alt="Plan cover"
                        className="w-full h-24 object-cover rounded-xl border-[1.5px] border-black"
                      />
                    )}
                    <button
                      onClick={() => {
                        if (item.plans && item.plans.length > 0) {
                          setPlans(item.plans);
                          setActivePlanIdx(0);
                          setViewState('trail');
                          setShowHistory(false);
                        }
                      }}
                      className="w-full bg-[#0B3BF4] text-white border-[1.5px] border-black rounded-xl py-1.5 text-xs font-black shadow-[0_1px_0_0_#000000] active:translate-y-0.5"
                    >
                      Load This Plan ↗
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
