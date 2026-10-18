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

    const lower = promptToUse.toLowerCase();
    const currentP = plans[activePlanIdx] || plans[0];
    const currentStops = [...(currentP.stops || [])];
    let actionReason = '';
    let modifiedStops = [...currentStops];
    let updatedReturnTime = currentP.returnTime || '17:10 PM';

    // Helper: Push return time by hours
    const incrementTime = (timeStr, hrs) => {
      try {
        const parts = timeStr.match(/(\d+):(\d+)\s*(AM|PM)?/i);
        if (parts) {
          let h = parseInt(parts[1]);
          const m = parts[2];
          const period = (parts[3] || 'PM').toUpperCase();
          h = h + hrs;
          if (period === 'PM' && h > 12) h = h - 12;
          return `${h}:${m} ${period}`;
        }
      } catch {}
      return timeStr;
    };

    // Candidate pool: current city spots + user uploaded spots + authentic local fallbacks
    const stored = JSON.parse(localStorage.getItem('userSpots') || '[]');
    const userCitySpots = stored.filter(
      (s) =>
        s.cityKey === selectedCityKey ||
        (s.cityName && s.cityName.toLowerCase() === currentCity.name.toLowerCase())
    );
    const candidatePool = [
      ...(currentCity.spots || []),
      ...userCitySpots,
      {
        id: `fb-${currentCity.name}-1`,
        name: `${currentCity.name} River Viewpoint`,
        category: 'Hidden Spots',
        badge: 'VIEWPOINT',
        expense: 0,
        spendTime: 30,
        transitText: '🚶 6m • Free',
        photo: currentCity.spots[0]?.photo,
        lat: currentCity.hub.lat + 0.008,
        lng: currentCity.hub.lng + 0.006,
      },
      {
        id: `fb-${currentCity.name}-2`,
        name: `${currentCity.name} Malabar Tea & Snacks`,
        category: 'Food',
        badge: 'LOCAL FOOD',
        expense: 30,
        spendTime: 25,
        transitText: '🚶 4m • Free',
        photo: currentCity.spots[1]?.photo || currentCity.spots[0]?.photo,
        lat: currentCity.hub.lat - 0.005,
        lng: currentCity.hub.lng - 0.004,
      },
      {
        id: `fb-${currentCity.name}-3`,
        name: `${currentCity.name} Heritage Lane Walk`,
        category: 'Hidden Spots',
        badge: 'HERITAGE',
        expense: 0,
        spendTime: 40,
        transitText: '🚶 8m • Free',
        photo: currentCity.spots[2]?.photo || currentCity.spots[0]?.photo,
        lat: currentCity.hub.lat + 0.004,
        lng: currentCity.hub.lng - 0.006,
      },
      {
        id: `fb-${currentCity.name}-4`,
        name: `${currentCity.name} Spice Corner Market`,
        category: 'Shopping',
        badge: 'MARKET',
        expense: 120,
        spendTime: 45,
        transitText: '🛺 10m • ₹30',
        photo: currentCity.spots[0]?.photo,
        lat: currentCity.hub.lat - 0.007,
        lng: currentCity.hub.lng + 0.005,
      },
    ];

    const createStopObject = (cand, idx, customBadge) => {
      const exp = cand.expense || 0;
      const mins = cand.spendTime || cand.time || 30;
      return {
        id: cand.id || `stop-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        num: idx + 1,
        step: idx + 1,
        name: cand.name,
        badge: customBadge || cand.badge || 'ACTIVE',
        costText: exp === 0 ? `Free • ${mins}m` : `₹${exp} • ${mins}m`,
        transitPill: cand.transitText || cand.transitPill || cand.transit || '🚶 6m • Free',
        photo: cand.photo || (cand.photos && cand.photos[0]) || currentCity.spots[0]?.photo,
        photos: cand.photos || (cand.photo ? [cand.photo] : [currentCity.spots[0]?.photo]),
        links: cand.links || [],
        expense: exp,
        data: cand,
        lat: cand.lat || currentCity.hub.lat,
        lng: cand.lng || currentCity.hub.lng,
      };
    };

    // 0a. Check for TIME INCREASE ("got one more hour", "have 2 more hours", "extra hour", "add 1 hr", "1 more hour", "more time")
    const isTimeAdd =
      /(?:got|have|add|give|with|extra)?\s*(\d+|one|two|three|four)?\s*(?:more|extra)?\s*(?:hour|hr|time)s?(?:\s*(?:more|extra))?/i.test(lower) ||
      /more time/i.test(lower);

    if (isTimeAdd && !lower.includes('faster') && !lower.includes('short') && !lower.includes('quick') && !lower.includes('delay')) {
      let addHrs = 1;
      const numMatch = lower.match(/(\d+)\s*(?:hour|hr)/i);
      if (numMatch) {
        addHrs = parseInt(numMatch[1]);
      } else if (lower.includes('two') || lower.includes('2')) addHrs = 2;
      else if (lower.includes('three') || lower.includes('3')) addHrs = 3;
      else if (lower.includes('four') || lower.includes('4')) addHrs = 4;

      setAvailableTimeHrs((prev) => Math.min(8, prev + addHrs));
      updatedReturnTime = incrementTime(updatedReturnTime, addHrs);

      // Add spot(s) to fill the extra hour
      const unusedCandidates = candidatePool.filter(
        (c) => !modifiedStops.some((ms) => (ms.name || '').toLowerCase() === c.name.toLowerCase())
      );
      const toAdd = unusedCandidates.slice(0, Math.min(addHrs, unusedCandidates.length));
      if (toAdd.length === 0 && candidatePool.length > 0) {
        toAdd.push(candidatePool[modifiedStops.length % candidatePool.length]);
      }

      toAdd.forEach((cand) => {
        modifiedStops.push(createStopObject(cand, modifiedStops.length, 'EXTRA HOUR'));
      });

      actionReason = `⏰ Added ${addHrs} hr! Pushed safe return to ${updatedReturnTime} & added ${toAdd.map((c) => c.name).join(', ')}`;
    }

    // 0b. Check for BUDGET INCREASE ("1000 rs more", "got 1000 rs more", "have 1000 rs", "add 500 budget", "₹1000 more")
    const isBudgetAdd =
      /(?:got|have|add|increase|extra|more)?\s*(?:₹|rs\.?|inr)?\s*(\d+)\s*(?:rs|rupees|more|inr|bucks)?(?:\s*(?:more|extra))?/i.test(lower) ||
      /more budget|more money|can spend more/i.test(lower);

    if (isBudgetAdd && !lower.includes('cut') && !lower.includes('cheap') && !lower.includes('reduce') && !lower.includes('free')) {
      const bMatch = lower.match(/(\d+)/);
      const addAmount = bMatch ? parseInt(bMatch[1]) : 500;

      setMaxBudget((prev) => prev + addAmount);

      // Unlock high-value or new spot
      const candidate =
        candidatePool.find(
          (c) =>
            (c.expense || 0) > 0 &&
            !modifiedStops.some((ms) => (ms.name || '').toLowerCase() === c.name.toLowerCase())
        ) ||
        candidatePool.find(
          (c) => !modifiedStops.some((ms) => (ms.name || '').toLowerCase() === c.name.toLowerCase())
        ) ||
        candidatePool[1];

      if (candidate) {
        modifiedStops.push(createStopObject(candidate, modifiedStops.length, 'UNLOCKED'));
        actionReason = `💰 Added ₹${addAmount} budget! Added ${candidate.name} (₹${candidate.expense || 0})`;
      } else {
        actionReason = `💰 Max budget increased by ₹${addAmount}`;
      }
    }

    // 1. Check for explicit DROP / REMOVE commands
    const isRemove =
      lower.includes('remove') ||
      lower.includes('drop') ||
      lower.includes('delete') ||
      lower.includes('cut') ||
      lower.includes('leave');

    const isAdd =
      lower.includes('add') ||
      lower.includes('include') ||
      lower.includes('put') ||
      lower.includes('want') ||
      lower.includes('swap');

    if (isRemove) {
      if (lower.includes('1st') || lower.includes('first') || lower.includes('stop 1')) {
        const removed = modifiedStops.shift();
        actionReason = `Dropped 1st stop (${removed?.name || 'first stop'})`;
      } else if (lower.includes('2nd') || lower.includes('second') || lower.includes('stop 2')) {
        const removed = modifiedStops.splice(1, 1);
        actionReason = `Dropped 2nd stop (${removed[0]?.name || 'second stop'})`;
      } else if (lower.includes('last')) {
        const removed = modifiedStops.pop();
        actionReason = `Dropped last stop (${removed?.name || 'last stop'})`;
      } else {
        const matchIdx = modifiedStops.findIndex((s) => {
          const sName = (s.name || '').toLowerCase();
          const firstWord = sName.split(' ')[0];
          return lower.includes(sName) || (firstWord.length > 3 && lower.includes(firstWord));
        });
        if (matchIdx !== -1) {
          const removed = modifiedStops.splice(matchIdx, 1);
          actionReason = `Removed ${removed[0]?.name}`;
        } else if (modifiedStops.length > 1) {
          const removed = modifiedStops.pop();
          actionReason = `Removed ${removed?.name}`;
        }
      }
    }

    // 2. Check for explicit ADD commands or category keywords ("add one more place", "add tea spot", etc.)
    if (
      (isAdd && !isTimeAdd && !isBudgetAdd) ||
      lower.includes('tea') ||
      lower.includes('chai') ||
      lower.includes('snack') ||
      lower.includes('food') ||
      lower.includes('beach') ||
      lower.includes('fort') ||
      lower.includes('game') ||
      /add.*(?:place|spot)/i.test(lower)
    ) {
      const candidate =
        candidatePool.find((s) => {
          const sLower = s.name.toLowerCase();
          const catLower = (s.category || '').toLowerCase();
          const alreadyIn = modifiedStops.some(
            (ms) =>
              (ms.name || '').toLowerCase().includes(sLower) ||
              sLower.includes((ms.name || '').toLowerCase())
          );
          if (alreadyIn) return false;

          if (lower.includes('tea') || lower.includes('chai'))
            return sLower.includes('chai') || sLower.includes('tea') || catLower.includes('food');
          if (
            lower.includes('food') ||
            lower.includes('snack') ||
            lower.includes('vada') ||
            lower.includes('biryani')
          )
            return catLower.includes('food') || sLower.includes('vada');
          if (lower.includes('beach')) return sLower.includes('beach');
          if (lower.includes('fort') || lower.includes('heritage'))
            return sLower.includes('fort') || catLower.includes('hidden');
          if (lower.includes('game') || lower.includes('gaming')) return catLower.includes('gaming');

          return lower.includes(sLower.split(' ')[0]) || lower.includes(sLower);
        }) ||
        candidatePool.find(
          (s) =>
            !modifiedStops.some((ms) => (ms.name || '').toLowerCase() === s.name.toLowerCase())
        ) ||
        candidatePool[modifiedStops.length % candidatePool.length];

      if (candidate) {
        modifiedStops.push(createStopObject(candidate, modifiedStops.length, 'ADDED SPOT'));
        actionReason = (actionReason ? actionReason + ' & added ' : 'Added ') + candidate.name;
      }
    }

    // 3. Shorter / Faster / Delay requests
    if (
      lower.includes('faster') ||
      lower.includes('short') ||
      lower.includes('delay') ||
      lower.includes('quick') ||
      lower.includes('hurry')
    ) {
      if (modifiedStops.length > 1) {
        const dropped = modifiedStops.pop();
        actionReason = `Dropped furthest stop (${dropped?.name}) to guarantee 30m faster return`;
      } else {
        const fastestSpot = [...candidatePool].sort(
          (a, b) => (a.spendTime || 30) - (b.spendTime || 30)
        )[0];
        if (fastestSpot) {
          modifiedStops = [createStopObject(fastestSpot, 0, 'FASTEST')];
          actionReason = `Switched to fastest local stop (${fastestSpot.name}, ${fastestSpot.spendTime || 30}m)`;
        }
      }
    }

    // 4. Budget cuts
    if (
      lower.includes('budget') &&
      (lower.includes('cut') ||
        lower.includes('cheap') ||
        lower.includes('reduce') ||
        lower.includes('less'))
    ) {
      const freeSpot = candidatePool.find((s) => (s.expense || 0) === 0);
      if (
        freeSpot &&
        !modifiedStops.some((ms) => (ms.name || '').toLowerCase() === freeSpot.name.toLowerCase())
      ) {
        modifiedStops = [createStopObject(freeSpot, 0, 'FREE GEM'), ...modifiedStops.slice(0, 1)];
      }
      modifiedStops.sort((a, b) => (a.expense || 0) - (b.expense || 0));
      actionReason = 'Prioritized free & low-cost stops to cut budget';
    }

    // Safety check: if modifiedStops is empty, populate with first available spot
    if (modifiedStops.length === 0 && candidatePool.length > 0) {
      const fallback = candidatePool[0];
      modifiedStops = [createStopObject(fallback, 0, 'ACTIVE')];
      if (!actionReason) actionReason = `Updated route to ${fallback.name}`;
    }

    // Renumber steps
    modifiedStops = modifiedStops.map((s, i) => ({
      ...s,
      num: i + 1,
      step: i + 1,
    }));

    // Apply immediate local update so UI changes in 0ms!
    const updatedPlan = {
      ...currentP,
      title: `${currentCity.name} Custom Trail`,
      vibe: actionReason || `Modified: "${promptToUse}"`,
      returnTime: updatedReturnTime,
      returnPill: `⏰ ${updatedReturnTime} • SAFE RETURN TO ${currentCity.hub.stationName}`,
      stops: modifiedStops,
      totalCost: modifiedStops.reduce((sum, s) => sum + (s.expense || 0), 0)
    };

    const newPlans = [...plans];
    newPlans[activePlanIdx] = updatedPlan;
    setPlans(newPlans);
    if (modifiedStops[0]?.data) {
      setSelectedSpot(modifiedStops[0].data);
    }
    setModificationMsg(`✨ Plan updated: ${actionReason || `Adapted to "${promptToUse}"`}!`);
    setChatModifierInput('');
    setIsModifyingPlan(false);

    // Save updated plan to database history
    savePlanToDatabase(newPlans, currentCity);
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

  // Fetch past plans from MongoDB Atlas and local cache
  const loadHistory = async () => {
    setHistoryLoading(true);
    setShowHistory(true);

    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const userEmail = currentUser.email || 'guest@spotundoo.local';
    const localKey = `savedPlansHistory_${userEmail}`;

    // 1. Merge all possible local history records
    const localUser = JSON.parse(localStorage.getItem(localKey) || '[]');
    const localGen = JSON.parse(localStorage.getItem('savedPlansHistory') || '[]');
    const localGuest = JSON.parse(localStorage.getItem('savedPlansHistory_guest@spotundoo.local') || '[]');
    const localHadhy = JSON.parse(localStorage.getItem('savedPlansHistory_hadhy@spotundoo.local') || '[]');

    const allLocal = [...localUser, ...localGen, ...localGuest, ...localHadhy];
    const itemMap = new Map();
    allLocal.forEach((item) => {
      const key = item.id || item._id || `${item.hub}_${item.createdAt}`;
      if (!itemMap.has(key)) itemMap.set(key, item);
    });
    setHistoryItems(Array.from(itemMap.values()));

    // 2. Fetch from MongoDB Atlas
    try {
      const res = await fetch(`${BACKEND_URL}/api/plans?userEmail=${encodeURIComponent(userEmail)}`);
      if (res.ok) {
        const mongoPlans = await res.json();
        if (Array.isArray(mongoPlans)) {
          mongoPlans.forEach((p) => {
            const key = p._id || p.id || `${p.hub}_${p.createdAt}`;
            itemMap.set(key, p);
          });
          setHistoryItems(Array.from(itemMap.values()));
        }
      }
    } catch (e) {
      console.warn('History fetch from MongoDB failed, showing local:', e);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Save plan to both user-scoped LocalStorage, general LocalStorage AND MongoDB Atlas
  const savePlanToDatabase = async (plansToSave, cityObj) => {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const userEmail = currentUser.email || 'guest@spotundoo.local';
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

    // 1. Instantly persist to localStorage
    try {
      const existingUser = JSON.parse(localStorage.getItem(localKey) || '[]');
      localStorage.setItem(localKey, JSON.stringify([newRecord, ...existingUser].slice(0, 30)));

      const existingGen = JSON.parse(localStorage.getItem('savedPlansHistory') || '[]');
      localStorage.setItem('savedPlansHistory', JSON.stringify([newRecord, ...existingGen].slice(0, 30)));
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
      console.warn('Could not save plan to MongoDB:', e.message);
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
      {/* FULLSCREEN AI PROCESSING & LOCATION LOADING MODAL */}
      {loading && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white border-[3px] border-black rounded-3xl p-6 shadow-[0_10px_0_0_#000000] max-w-sm w-full text-center space-y-4">
            {/* Animated Pin / Radar Pulse */}
            <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-dashed border-[#0B3BF4] animate-spin" />
              <div className="w-10 h-10 rounded-full bg-amber-400 border-2 border-black flex items-center justify-center font-black text-xl shadow-[0_2px_0_0_#000000]">
                📍
              </div>
            </div>

            <div className="space-y-1">
              <h3 className="font-black text-lg text-black tracking-tight">
                Processing Location & Itinerary...
              </h3>
              <p className="text-xs font-bold text-gray-600">
                Anchored to <span className="text-[#0B3BF4] font-black">{currentCity.displayName}</span>
              </p>
            </div>

            {/* Live Progress Milestones */}
            <div className="bg-[#F4F6F9] border-[2px] border-black rounded-2xl p-3 text-left space-y-2 text-xs font-bold">
              <div className="flex items-center gap-2 text-emerald-800">
                <CheckCircle2 size={15} className="shrink-0 text-emerald-600" />
                <span>Station Hub: {currentCity.hub.stationName}</span>
              </div>
              <div className="flex items-center gap-2 text-[#0B3BF4] animate-pulse">
                <Loader2 size={15} className="shrink-0 animate-spin" />
                <span>LLM reasoning local spots within ₹{maxBudget}...</span>
              </div>
              <div className="flex items-center gap-2 text-amber-800">
                <Clock size={15} className="shrink-0 text-amber-600" />
                <span>Locking {availableTimeHrs}hr safety return buffer...</span>
              </div>
            </div>

            {/* Glowing Gradient Progress Line */}
            <div className="w-full bg-gray-200 h-2.5 rounded-full border border-black overflow-hidden">
              <div className="h-full bg-gradient-to-r from-[#0B3BF4] via-cyan-400 to-[#F59E0B] rounded-full animate-pulse w-4/5" />
            </div>

            <p className="text-[10px] font-black uppercase text-gray-400 tracking-wider">
              ✦ Spot-Undoo Kerala Edge Intelligence ✦
            </p>
          </div>
        </div>
      )}

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
          <div className="relative bg-[#F4F6F9] border-[2.5px] border-black rounded-3xl p-3 shadow-[0_4px_0_0_#000000] min-h-[460px] overflow-hidden">
            {/* Dynamic Trail SVG Line: Starts at START at top, terminates at END at bottom */}
            {(() => {
              const stopsCount = (currentPlan.stops || []).length;
              let pathD = "M 240 42 C 150 55, 45 105, 85 155 C 125 205, 180 230, 180 260";
              let endPoint = { cx: 180, cy: 260 };
              let node2 = null;
              let node3 = null;

              if (stopsCount === 2) {
                pathD = "M 240 42 C 150 55, 45 105, 85 150 C 130 205, 190 215, 245 270 C 275 320, 210 350, 180 375";
                endPoint = { cx: 180, cy: 375 };
                node2 = { cx: 245, cy: 270 };
              } else if (stopsCount >= 3) {
                pathD = "M 240 42 C 150 50, 45 95, 85 140 C 130 195, 190 205, 245 250 C 285 290, 180 320, 85 355 C 20 390, 120 435, 180 460";
                endPoint = { cx: 180, cy: 460 };
                node2 = { cx: 245, cy: 250 };
                node3 = { cx: 85, cy: 355 };
              }

              return (
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

                  {/* Outer casing: Sleek Dark Slate Border */}
                  <path
                    d={pathD}
                    fill="none"
                    stroke="#090D16"
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* Inner Path: Electric Sky-Blue / Neon Cyan */}
                  <path
                    d={pathD}
                    fill="none"
                    stroke="url(#neonCyanGlow)"
                    strokeWidth="5"
                    strokeDasharray="9 5"
                    strokeLinecap="round"
                    filter="url(#trailGlow)"
                  />

                  {/* Start Waypoint Node (Top right at Start Station) */}
                  <circle cx="240" cy="42" r="5.5" fill="#0B3BF4" stroke="#090D16" strokeWidth="2" />

                  {/* Stop 1 Waypoint */}
                  <circle
                    cx="85"
                    cy={stopsCount >= 3 ? 140 : stopsCount === 2 ? 150 : 155}
                    r="6.5"
                    fill={visitedStopIds.length > 0 ? '#10B981' : '#06B6D4'}
                    stroke="#090D16"
                    strokeWidth="2"
                  />

                  {/* Stop 2 Waypoint (if present) */}
                  {node2 && (
                    <circle
                      cx={node2.cx}
                      cy={node2.cy}
                      r="6.5"
                      fill={visitedStopIds.length > 1 ? '#10B981' : '#06B6D4'}
                      stroke="#090D16"
                      strokeWidth="2"
                    />
                  )}

                  {/* Stop 3 Waypoint (if present) */}
                  {node3 && (
                    <circle
                      cx={node3.cx}
                      cy={node3.cy}
                      r="6.5"
                      fill={visitedStopIds.length > 2 ? '#10B981' : '#06B6D4'}
                      stroke="#090D16"
                      strokeWidth="2"
                    />
                  )}

                  {/* END Waypoint Node placed right at the top of the END location box at the bottom */}
                  <circle cx={endPoint.cx} cy={endPoint.cy} r="7" fill="#F59E0B" stroke="#090D16" strokeWidth="2.5" />
                </svg>
              );
            })()}

            {/* TOP HEADER: STARTING PLACE */}
            <div className="relative z-10 flex items-center justify-between gap-1 mb-4">
              <div className="bg-[#FEF3C7] border-[2px] border-black rounded-full px-2.5 py-0.5 text-[10px] font-black text-amber-900 shadow-[0_2px_0_0_#000000] flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
                <span>STARTING PLACE</span>
              </div>

              {/* START Station Pill */}
              <div className="bg-white border-[2px] border-black rounded-full px-3 py-1 flex items-center gap-1.5 text-xs font-black shadow-[0_2px_0_0_#000000]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#0B3BF4] border border-black inline-block" />
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

            {/* MANDATORY SAFE RETURN END LOCATION ALWAYS ON THE BOTTOM OF THAT BOX */}
            <div className="relative z-10 mt-6 mb-1">
              <div className="bg-[#F59E0B] border-[2.5px] border-black rounded-2xl py-3 px-3.5 flex items-center justify-between shadow-[0_4px_0_0_#000000]">
                <div className="flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-full bg-black text-amber-400 font-black text-sm flex items-center justify-center shrink-0 shadow-[0_1px_0_0_#000000]">
                    🏁
                  </span>
                  <div className="leading-tight text-left">
                    <div className="text-[10px] font-black uppercase tracking-wider text-black/80">
                      FINAL DESTINATION • SAFE RETURN
                    </div>
                    <div className="font-black text-xs text-black">
                      {currentPlan.returnPill || `Safe Return to ${currentCity.hub.stationName}`}
                    </div>
                  </div>
                </div>
                <div className="bg-black text-white text-xs font-black px-3 py-1 rounded-full shrink-0 shadow-[0_1px_0_0_#000000]">
                  {currentPlan.returnTime || '17:10 PM'}
                </div>
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

                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="bg-white border border-black text-black font-black text-[9px] px-2 py-0.5 rounded-full">
                        {item.plans?.[0]?.stops?.length || 3} Stops
                      </span>
                      <span className="bg-emerald-100 border border-emerald-500 text-emerald-800 font-black text-[9px] px-2 py-0.5 rounded-full">
                        ₹{item.plans?.[0]?.totalCost || 120} Total
                      </span>
                      {item.plans?.[0]?.returnTime && (
                        <span className="bg-amber-100 border border-amber-500 text-amber-900 font-black text-[9px] px-2 py-0.5 rounded-full">
                          Return {item.plans[0].returnTime}
                        </span>
                      )}
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
                          // 1. Sync city key from item.hub
                          const matchedKey =
                            Object.keys(KERALA_CITIES).find(
                              (k) =>
                                (item.hub || '').toLowerCase().includes(k.toLowerCase()) ||
                                KERALA_CITIES[k].displayName
                                  .toLowerCase()
                                  .includes((item.hub || '').toLowerCase())
                            ) || 'Shoranur';

                          setSelectedCityKey(matchedKey);
                          const cityData = KERALA_CITIES[matchedKey];
                          if (cityData && setLocation) {
                            setLocation({
                              lat: cityData.hub.lat,
                              lon: cityData.hub.lng,
                              label: `${cityData.hub.name} (Active)`,
                            });
                          }

                          setPlans(item.plans);
                          setActivePlanIdx(0);
                          const firstStop = item.plans[0]?.stops?.[0];
                          if (firstStop) {
                            setSelectedSpot(firstStop.data || firstStop);
                          } else if (cityData) {
                            setSelectedSpot(cityData.spots[0]);
                          }

                          setViewState('trail');
                          setShowHistory(false);
                        }
                      }}
                      className="w-full bg-[#0B3BF4] hover:bg-blue-600 text-white border-[1.5px] border-black rounded-xl py-1.5 text-xs font-black shadow-[0_1.5px_0_0_#000000] active:translate-y-0.5 cursor-pointer transition"
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
