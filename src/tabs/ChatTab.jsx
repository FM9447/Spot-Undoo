import { useState, useEffect } from 'react';
import { Sparkles, MapPin, ExternalLink, Bookmark, Clock, ArrowRight, Loader2, Star, ArrowLeft, History, Check, X, Navigation, Send, CheckCircle2 } from 'lucide-react';
import { KERALA_CITIES } from '../data/keralaCitiesData';
import { ollamaChat } from '../utils/ollama';
import ImageCarousel from '../components/ImageCarousel';
import { getBackendUrl } from '../utils/apiConfig';
import { haversineKm } from '../utils/plannerMath';

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

  // Live GPS Tracking & Interactive Plan Chat Modifier
  const [visitedStopIds, setVisitedStopIds] = useState([]);
  const [chatModifierInput, setChatModifierInput] = useState('');
  const [isModifyingPlan, setIsModifyingPlan] = useState(false);
  const [modificationMsg, setModificationMsg] = useState('');

  const currentCity = KERALA_CITIES[selectedCityKey] || KERALA_CITIES['Shoranur'];

  const toggleCheckIn = (stopIdentifier) => {
    setVisitedStopIds((prev) =>
      prev.includes(stopIdentifier)
        ? prev.filter((id) => id !== stopIdentifier)
        : [...prev, stopIdentifier]
    );
  };

  const handleModifyPlan = async (customPrompt) => {
    const promptToUse = customPrompt || chatModifierInput;
    if (!promptToUse.trim()) return;

    setIsModifyingPlan(true);
    setModificationMsg('');

    try {
      const currentP = plans[activePlanIdx];
      const currentStops = currentP.stops || [];
      const prompt = `You are Spot Undo AI travel planner for Kerala.
User wants to modify this existing itinerary:
Current stops: ${currentStops.map((s) => s.name).join(', ')}
User request: "${promptToUse}"

City: ${currentCity.name} (Hub: ${currentCity.hub?.name || currentCity.name})
Available spots:
${(currentCity.spots || []).map((s) => `- ${s.name} (${s.category}, ₹${s.expense}, ${s.time}m)`).join('\n')}

Rules:
- If user says "remove X" or "drop X", do NOT include X.
- If user says "add Y", include Y from Available spots.
- Return valid JSON only starting immediately with {:
{
  "updatedTitle": "short plan title",
  "reasoning": "short 1-sentence note of what changed",
  "stops": [
    {"name": "spot name", "time": "30m", "expense": 0, "transit": "🚶 6m • Free"}
  ]
}`;

      const res = await ollamaChat({
        baseUrl: settings.baseUrl,
        model: settings.model,
        messages: [{ role: 'user', content: prompt }],
      });

      if (res && Array.isArray(res.stops) && res.stops.length > 0) {
        const updatedStops = res.stops.map((s, idx) => {
          const matched = (currentCity.spots || []).find((c) =>
            c.name.toLowerCase().includes(s.name.toLowerCase()) ||
            s.name.toLowerCase().includes(c.name.toLowerCase())
          );
          return {
            id: matched?.id || `mod-${idx}-${Date.now()}`,
            step: idx + 1,
            name: matched?.name || s.name,
            time: s.time || (matched?.time ? `${matched.time}m` : '30m'),
            costText: `₹${s.expense ?? matched?.expense ?? 0} • ${s.time || (matched?.time ? `${matched.time}m` : '30m')}`,
            transitPill: s.transit || matched?.transit || '🚶 6m • Free',
            photo: matched?.photo || currentCity.spots[0]?.photo || 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400&q=70',
            expense: s.expense ?? matched?.expense ?? 0,
            data: matched || currentCity.spots[0],
            lat: matched?.lat || currentCity.hub?.lat || 10.76,
            lng: matched?.lng || currentCity.hub?.lng || 76.27,
          };
        });

        const updatedPlan = {
          ...currentP,
          title: res.updatedTitle || currentP.title,
          vibe: res.reasoning || `Modified via: "${promptToUse}"`,
          stops: updatedStops,
        };

        const newPlans = [...plans];
        newPlans[activePlanIdx] = updatedPlan;
        setPlans(newPlans);
        setModificationMsg(`✨ Plan updated: ${res.reasoning || `Adapted to "${promptToUse}"`}`);
        setChatModifierInput('');
        setIsModifyingPlan(false);
        return;
      }
    } catch (err) {
      console.warn('AI modify plan fallback:', err);
    }

    // Heuristic instant modifier for remove/add/swap operations
    const lower = promptToUse.toLowerCase();
    const currentP = plans[activePlanIdx];
    let newStops = [...(currentP.stops || [])];
    let actionReason = '';

    // Check for remove / drop keywords
    const isRemove = lower.includes('remove') || lower.includes('drop') || lower.includes('delete') || lower.includes('cut');
    const isAdd = lower.includes('add') || lower.includes('include') || lower.includes('put') || lower.includes('swap');

    // 1. Handle REMOVE
    if (isRemove) {
      // Check if user specified 1st, 2nd, last, etc.
      if (lower.includes('1st') || lower.includes('first') || lower.includes('stop 1')) {
        if (newStops.length > 1) {
          const removed = newStops.shift();
          actionReason = `Dropped 1st stop (${removed.name})`;
        }
      } else if (lower.includes('2nd') || lower.includes('second') || lower.includes('stop 2')) {
        if (newStops.length > 1) {
          const removed = newStops.splice(1, 1);
          actionReason = `Dropped 2nd stop (${removed[0]?.name})`;
        }
      } else if (lower.includes('last')) {
        if (newStops.length > 1) {
          const removed = newStops.pop();
          actionReason = `Dropped last stop (${removed.name})`;
        }
      } else {
        // Try matching by stop name
        const foundIdx = newStops.findIndex((s) =>
          lower.includes(s.name.toLowerCase().split(' ')[0]) ||
          lower.includes(s.name.toLowerCase())
        );
        if (foundIdx !== -1 && newStops.length > 1) {
          const removed = newStops.splice(foundIdx, 1);
          actionReason = `Removed ${removed[0]?.name}`;
        } else if (newStops.length > 1) {
          // Drop furthest
          const removed = newStops.pop();
          actionReason = `Removed ${removed.name}`;
        }
      }
    }

    // 2. Handle ADD
    if (isAdd || lower.includes('tea') || lower.includes('chai') || lower.includes('food') || lower.includes('beach') || lower.includes('fort')) {
      // Find candidate from available spots not already in plan
      const candidate = (currentCity.spots || []).find((s) => {
        const sLower = s.name.toLowerCase();
        const catLower = (s.category || '').toLowerCase();
        const inPlan = newStops.some((ns) => ns.name.toLowerCase() === sLower);
        if (inPlan) return false;

        if (lower.includes('tea') || lower.includes('chai')) return sLower.includes('tea') || sLower.includes('chai') || catLower.includes('food');
        if (lower.includes('food') || lower.includes('snack') || lower.includes('eat')) return catLower.includes('food') || sLower.includes('biryani') || sLower.includes('baje');
        if (lower.includes('beach')) return sLower.includes('beach');
        if (lower.includes('fort') || lower.includes('heritage')) return sLower.includes('fort') || catLower.includes('hidden');
        if (lower.includes('game') || lower.includes('gaming')) return catLower.includes('gaming');
        
        // Match any part of spot name in user prompt
        return lower.includes(sLower.split(' ')[0]) || lower.includes(sLower);
      }) || (currentCity.spots || []).find((s) => !newStops.some((ns) => ns.name === s.name));

      if (candidate) {
        newStops.push({
          id: candidate.id,
          step: newStops.length + 1,
          name: candidate.name,
          time: `${candidate.time}m`,
          costText: `₹${candidate.expense} • ${candidate.time}m`,
          transitPill: candidate.transit || '🚶 5m • Free',
          photo: candidate.photo,
          expense: candidate.expense,
          data: candidate,
          lat: candidate.lat,
          lng: candidate.lng,
        });
        actionReason += (actionReason ? ' and added ' : 'Added ') + candidate.name;
      }
    }

    if (!actionReason) {
      if (lower.includes('budget') || lower.includes('cheap') || lower.includes('free')) {
        newStops.sort((a, b) => (a.expense || 0) - (b.expense || 0));
        actionReason = 'Prioritized free & low-cost spots';
      } else {
        actionReason = `Re-balanced plan for "${promptToUse}"`;
      }
    }

    // Renumber steps
    newStops = newStops.map((s, i) => ({ ...s, step: i + 1 }));

    const updatedPlan = {
      ...currentP,
      stops: newStops,
      vibe: actionReason,
    };
    const newPlans = [...plans];
    newPlans[activePlanIdx] = updatedPlan;
    setPlans(newPlans);
    setModificationMsg(`✨ Plan updated: ${actionReason}!`);
    setChatModifierInput('');
    setIsModifyingPlan(false);
  };

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

  // Fetch past plans from MongoDB Atlas specific to current logged-in user
  const loadHistory = async () => {
    setHistoryLoading(true);
    setShowHistory(true);

    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const userEmail = currentUser.email || 'hadhy@spotundoo.local';
    const localKey = `savedPlansHistory_${userEmail}`;

    // 1. Get user-specific local cached plans immediately
    const localSaved = JSON.parse(localStorage.getItem(localKey) || '[]');
    setHistoryItems(localSaved);

    // 2. Fetch from MongoDB Atlas scoped to userEmail
    try {
      const res = await fetch(`${BACKEND_URL}/api/plans?userEmail=${encodeURIComponent(userEmail)}`);
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

  // Save plan to both user-scoped LocalStorage AND MongoDB Atlas
  const savePlanToDatabase = async (plansToSave, cityObj) => {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const userEmail = currentUser.email || 'hadhy@spotundoo.local';
    const localKey = `savedPlansHistory_${userEmail}`;

    const newRecord = {
      id: Date.now().toString(),
      hub: cityObj.displayName || cityObj.name,
      prompt: promptText,
      imageUrl: plansToSave[0]?.stops[0]?.photo || cityObj.spots[0]?.photo,
      plans: plansToSave,
      userEmail,
      createdAt: new Date().toISOString(),
    };

    // 1. Instantly persist to user-scoped localStorage
    try {
      const existing = JSON.parse(localStorage.getItem(localKey) || '[]');
      const updated = [newRecord, ...existing].slice(0, 30);
      localStorage.setItem(localKey, JSON.stringify(updated));
    } catch (err) {
      console.warn('Local plan storage error:', err);
    }

    // 2. Persist to MongoDB Atlas cloud with userEmail ownership
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
            {/* Refined Neon Cyan & Dark Sleek Trail S-curve SVG Line */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none"
              viewBox="0 0 360 520"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="neonCyanGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#38BDF8" />
                  <stop offset="50%" stopColor="#06B6D4" />
                  <stop offset="100%" stopColor="#0284C7" />
                </linearGradient>
                <filter id="trailGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="1" stdDeviation="3" floodColor="#38BDF8" floodOpacity="0.45" />
                </filter>
              </defs>

              {/* Refined Outer casing: Sleek Dark Slate Border */}
              <path
                d="M 280 40 C 100 80, 20 140, 100 200 S 300 280, 220 355 S 80 405, 180 415"
                fill="none"
                stroke="#090D16"
                strokeWidth="10"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Refined Inner Path: Vibrant Electric Sky-Blue / Neon Cyan */}
              <path
                d="M 280 40 C 100 80, 20 140, 100 200 S 300 280, 220 355 S 80 405, 180 415"
                fill="none"
                stroke="url(#neonCyanGlow)"
                strokeWidth="5"
                strokeDasharray="9 5"
                strokeLinecap="round"
                filter="url(#trailGlow)"
              />

              {/* Waypoint Nodes along the path */}
              <circle cx="280" cy="40" r="5" fill="#38BDF8" stroke="#090D16" strokeWidth="2" />
              <circle
                cx="100"
                cy="200"
                r="6"
                fill={visitedStopIds.length > 0 ? '#10B981' : '#06B6D4'}
                stroke="#090D16"
                strokeWidth="2"
              />
              <circle
                cx="220"
                cy="355"
                r="6"
                fill={visitedStopIds.length > 1 ? '#10B981' : '#06B6D4'}
                stroke="#090D16"
                strokeWidth="2"
              />
              <circle cx="180" cy="415" r="7" fill="#F59E0B" stroke="#090D16" strokeWidth="2.5" />
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

            {/* Dynamic Trail Steps with Live GPS Distance & Check-in */}
            <div className="relative z-10 space-y-4">
              {(currentPlan.stops || []).map((stop, sIdx) => {
                const isLeft = sIdx % 2 === 0;
                const stopId = stop.id || stop.name;
                const isReached = visitedStopIds.includes(stopId);
                const stopLat = stop.lat || stop.data?.lat || currentCity.hub.lat;
                const stopLng = stop.lng || stop.data?.lng || currentCity.hub.lng;
                const distKm = location?.lat
                  ? haversineKm(location.lat, location.lon, stopLat, stopLng)
                  : null;
                const distMeters = distKm !== null ? Math.round(distKm * 1000) : null;

                return (
                  <div key={sIdx} className="space-y-1">
                    {/* Transit pill & GPS Check-in badge above card */}
                    <div className={`flex items-center gap-1.5 ${isLeft ? 'justify-start pl-16' : 'justify-center pr-6'}`}>
                      <span className="bg-[#FEF3C7] border-[1.5px] border-black rounded-full px-2.5 py-0.5 text-[10px] font-black text-black shadow-[0_1px_0_0_#000000]">
                        {stop.transitPill || '🚶 8m • Free'}
                      </span>

                      {/* GPS Check-In Button / Reached Status */}
                      <button
                        type="button"
                        onClick={() => toggleCheckIn(stopId)}
                        className={`text-[9px] font-black px-2 py-0.5 rounded-full border border-black flex items-center gap-1 shadow-[0_1px_0_0_#000000] active:translate-y-0.5 transition cursor-pointer ${
                          isReached
                            ? 'bg-emerald-500 text-white'
                            : distMeters && distMeters < 300
                            ? 'bg-emerald-100 text-emerald-800 animate-pulse'
                            : 'bg-white text-gray-700 hover:bg-gray-100'
                        }`}
                        title="Click to check in or mark reached"
                      >
                        {isReached ? (
                          <>
                            <Check size={9} strokeWidth={3} />
                            <span>Reached</span>
                          </>
                        ) : (
                          <>
                            <Navigation size={8} />
                            <span>{distMeters ? `${distMeters}m away` : 'Check In'}</span>
                          </>
                        )}
                      </button>
                    </div>

                    {isLeft ? (
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-7 h-7 rounded-full border-[2px] border-black font-black text-xs flex items-center justify-center shrink-0 shadow-[0_2px_0_0_#000000] transition ${
                            isReached ? 'bg-emerald-500 text-white' : 'bg-[#0B3BF4] text-white'
                          }`}
                        >
                          {isReached ? <Check size={14} strokeWidth={3} /> : sIdx + 1}
                        </div>
                        <div
                          onClick={() => setSelectedSpot(stop.data || stop)}
                          className={`bg-white border-[2.5px] rounded-2xl p-1.5 shadow-[0_3px_0_0_#000000] flex items-center gap-2 cursor-pointer hover:scale-102 transition flex-1 max-w-[220px] ${
                            isReached ? 'border-emerald-600 ring-2 ring-emerald-400/30' : 'border-black'
                          }`}
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
                              {isReached ? (
                                <span className="bg-emerald-500 text-white font-black text-[7px] px-1 rounded uppercase shrink-0">
                                  VISITED
                                </span>
                              ) : stop.badge ? (
                                <span className="bg-[#F59E0B] border border-black text-black font-black text-[8px] px-1 rounded uppercase shrink-0">
                                  {stop.badge}
                                </span>
                              ) : null}
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
                          className={`bg-white border-[2px] rounded-2xl p-1.5 shadow-[0_3px_0_0_#000000] flex items-center gap-2 cursor-pointer hover:scale-102 transition max-w-[210px] ${
                            isReached ? 'border-emerald-600 ring-2 ring-emerald-400/30' : 'border-black'
                          }`}
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
                        <div
                          className={`w-7 h-7 rounded-full border-[2px] border-black font-black text-xs flex items-center justify-center shrink-0 shadow-[0_2px_0_0_#000000] transition ${
                            isReached ? 'bg-emerald-500 text-white' : 'bg-[#0B3BF4] text-white'
                          }`}
                        >
                          {isReached ? <Check size={14} strokeWidth={3} /> : sIdx + 1}
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

          {/* Interactive AI Chat Plan Modifier */}
          <div className="bg-white border-[2.5px] border-black rounded-3xl p-3.5 shadow-[0_4px_0_0_#000000] space-y-2.5 mt-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-black text-xs text-black">
                <Sparkles size={13} className="text-[#0B3BF4] fill-[#0B3BF4]" />
                <span>Prompt AI to Update / Adapt Plan</span>
              </div>
              <span className="text-[9px] font-black bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full border border-purple-300">
                Live AI Co-Pilot
              </span>
            </div>

            {/* Quick prompt chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {[
                '⚡ Make it 30m faster',
                '☕ Add a chai stop',
                '💰 Cut budget by ₹100',
                '🚶 Only walking distance',
                '🌿 More quiet nature',
              ].map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => handleModifyPlan(chip)}
                  disabled={isModifyingPlan}
                  className="text-[10px] font-bold px-2.5 py-1 rounded-full border border-black bg-[#F4F6F9] hover:bg-[#EFF6FF] hover:border-[#0B3BF4] text-black shrink-0 transition cursor-pointer disabled:opacity-50"
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Chat Prompt Input Bar */}
            <div className="flex items-center gap-1.5 border-[2px] border-black rounded-2xl p-1 bg-[#F9FAFB] shadow-[0_2px_0_0_#000000]">
              <input
                type="text"
                value={chatModifierInput}
                onChange={(e) => setChatModifierInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleModifyPlan();
                  }
                }}
                placeholder="e.g. Train delayed 20m, drop stop 2 & add snacks..."
                className="flex-1 bg-transparent text-xs font-bold text-black px-2.5 outline-none placeholder:text-gray-400"
              />
              <button
                type="button"
                onClick={() => handleModifyPlan()}
                disabled={isModifyingPlan || !chatModifierInput.trim()}
                className="bg-[#0B3BF4] hover:bg-blue-600 disabled:opacity-40 text-white border-[1.5px] border-black rounded-xl px-3 py-1.5 text-xs font-black flex items-center gap-1 shadow-[0_1.5px_0_0_#000000] active:translate-y-0.5 transition cursor-pointer"
              >
                {isModifyingPlan ? (
                  <Loader2 size={13} className="animate-spin text-white" />
                ) : (
                  <>
                    <span>Update</span>
                    <Send size={11} />
                  </>
                )}
              </button>
            </div>

            {/* Status Toast */}
            {modificationMsg && (
              <div className="bg-[#ECFDF5] border border-emerald-400 rounded-xl p-2 text-xs font-bold text-emerald-900 flex items-center gap-1.5 animate-fadeIn">
                <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                <span>{modificationMsg}</span>
              </div>
            )}
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
