import { useState, useEffect, useRef } from 'react';
import { Sparkles, MapPin, ExternalLink, Bookmark, Clock, ArrowRight, Loader2, Star, ArrowLeft, History, Check, X, Navigation, Send, CheckCircle2, Search, ChevronDown, Layers } from 'lucide-react';
import { KERALA_CITIES } from '../data/keralaCitiesData';
import { ollamaChat } from '../utils/ollama';
import ImageCarousel from '../components/ImageCarousel';
import InteractiveMap from '../components/InteractiveMap';
import { getBackendUrl } from '../utils/apiConfig';
import { haversineKm } from '../utils/plannerMath';
import SpotUndooLoadingScreen from '../components/SpotUndooLoadingScreen';

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
  // Persist view state so user returns to the last viewed trail/form
  const [viewState, setViewState] = useState(() => {
    return localStorage.getItem('spot_undoo_viewState') || 'form';
  });

  // Toggle between cartoon Trail Canvas and Live OpenStreetMap
  const [mapViewMode, setMapViewMode] = useState('trail'); // 'trail' | 'osm'
  const [selectedCityKey, setSelectedCityKey] = useState(() => {
    return localStorage.getItem('spot_undoo_cityKey') || 'Shoranur';
  });
  const [activePlanIdx, setActivePlanIdx] = useState(() => {
    return Number(localStorage.getItem('spot_undoo_activePlanIdx')) || 0;
  });
  const [trailMode, setTrailMode] = useState('trail');
  const [selectedSpot, setSelectedSpot] = useState(null);
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
  const [loadingStage, setLoadingStage] = useState(1);
  const [loadingStageText, setLoadingStageText] = useState('Anchoring to regional railway hub...');
  const [aiError, setAiError] = useState('');

  // Persist state across tabs
  useEffect(() => {
    localStorage.setItem('spot_undoo_viewState', viewState);
  }, [viewState]);

  useEffect(() => {
    localStorage.setItem('spot_undoo_cityKey', selectedCityKey);
  }, [selectedCityKey]);

  useEffect(() => {
    localStorage.setItem('spot_undoo_activePlanIdx', activePlanIdx.toString());
  }, [activePlanIdx]);

  // History modal
  const [showHistory, setShowHistory] = useState(false);
  const [historyItems, setHistoryItems] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Live GPS Tracking & Auto Reached Detection
  const [visitedStopIds, setVisitedStopIds] = useState([]);
  const [chatModifierInput, setChatModifierInput] = useState('');
  const [isModifyingPlan, setIsModifyingPlan] = useState(false);
  const [modificationMsg, setModificationMsg] = useState('');
  const [isLiveGpsActive, setIsLiveGpsActive] = useState(false);

  const syncLiveGps = () => {
    if (!navigator.geolocation) {
      alert('GPS is not supported on this device');
      return;
    }
    setIsLiveGpsActive(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const userLat = pos.coords.latitude;
        const userLng = pos.coords.longitude;
        setLocation({ lat: userLat, lon: userLng, label: 'Live GPS' });
        setTimeout(() => setIsLiveGpsActive(false), 2000);
      },
      (err) => {
        setIsLiveGpsActive(false);
        console.warn('GPS sync error:', err);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Searchable City Selector States
  const [citySearchQuery, setCitySearchQuery] = useState('');
  const [isCityDropdownOpen, setIsCityDropdownOpen] = useState(false);
  const cityDropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (cityDropdownRef.current && !cityDropdownRef.current.contains(e.target)) {
        setIsCityDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentCity = KERALA_CITIES[selectedCityKey] || KERALA_CITIES['Shoranur'];

  const filteredCities = Object.entries(KERALA_CITIES).filter(([key, city]) => {
    if (!citySearchQuery.trim()) return true;
    const q = citySearchQuery.toLowerCase().trim();
    return (
      key.toLowerCase().includes(q) ||
      (city.name && city.name.toLowerCase().includes(q)) ||
      (city.displayName && city.displayName.toLowerCase().includes(q)) ||
      (city.district && city.district.toLowerCase().includes(q)) ||
      (city.hub?.stationName && city.hub.stationName.toLowerCase().includes(q))
    );
  });

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

    // Detect if user is specifically requesting a spot or destination in another city
    let activeCityKey = selectedCityKey;
    let activeCity = currentCity;

    const cityAliasMap = {
      calicut: 'Calicut',
      kozhikode: 'Calicut',
      kochi: 'Kochi',
      ernakulam: 'Kochi',
      trivandrum: 'Trivandrum',
      thiruvananthapuram: 'Trivandrum',
      munnar: 'Munnar',
      wayanad: 'Wayanad',
      alappuzha: 'Alappuzha',
      alleppey: 'Alappuzha',
      thrissur: 'Thrissur',
      kannur: 'Kannur',
      kollam: 'Kollam',
      kottayam: 'Kottayam',
      varkala: 'Varkala',
      palakkad: 'Palakkad',
      shoranur: 'Shoranur',
      malappuram: 'Malappuram',
    };

    for (const [alias, key] of Object.entries(cityAliasMap)) {
      if (lower.includes(alias) && KERALA_CITIES[key]) {
        activeCityKey = key;
        activeCity = KERALA_CITIES[key];
        setSelectedCityKey(key);
        break;
      }
    }

    // Candidate pool: strictly target city spots + user uploaded spots for this city + authentic local fallbacks
    const stored = JSON.parse(localStorage.getItem('userSpots') || '[]');
    const userCitySpots = stored.filter(
      (s) =>
        s.cityKey === activeCityKey ||
        (s.cityName && s.cityName.toLowerCase() === activeCity.name.toLowerCase())
    );

    const candidatePool = [
      ...(activeCity.spots || []),
      ...userCitySpots,
      {
        id: `fb-${activeCity.name}-1`,
        name: `${activeCity.name} River Viewpoint`,
        category: 'Hidden Spots',
        badge: 'VIEWPOINT',
        expense: 0,
        spendTime: 30,
        transitText: '🚶 6m • Free',
        photo: activeCity.spots?.[0]?.photo,
        lat: activeCity.hub.lat + 0.008,
        lng: activeCity.hub.lng + 0.006,
      },
      {
        id: `fb-${activeCity.name}-2`,
        name: `${activeCity.name} Malabar Tea & Snacks`,
        category: 'Food',
        badge: 'LOCAL FOOD',
        expense: 30,
        spendTime: 25,
        transitText: '🚶 4m • Free',
        photo: activeCity.spots?.[1]?.photo || activeCity.spots?.[0]?.photo,
        lat: activeCity.hub.lat - 0.005,
        lng: activeCity.hub.lng - 0.004,
      },
      {
        id: `fb-${activeCity.name}-3`,
        name: `${activeCity.name} Heritage Lane Walk`,
        category: 'Hidden Spots',
        badge: 'HERITAGE',
        expense: 0,
        spendTime: 40,
        transitText: '🚶 8m • Free',
        photo: activeCity.spots?.[2]?.photo || activeCity.spots?.[0]?.photo,
        lat: activeCity.hub.lat + 0.004,
        lng: activeCity.hub.lng - 0.006,
      },
      {
        id: `fb-${activeCity.name}-4`,
        name: `${activeCity.name} Spice Corner Market`,
        category: 'Shopping',
        badge: 'MARKET',
        expense: 120,
        spendTime: 45,
        transitText: '🛺 10m • ₹30',
        photo: activeCity.spots?.[0]?.photo,
        lat: activeCity.hub.lat - 0.007,
        lng: activeCity.hub.lng + 0.005,
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
        photo: cand.photo || (cand.photos && cand.photos[0]) || activeCity.spots?.[0]?.photo,
        photos: cand.photos || (cand.photo ? [cand.photo] : [activeCity.spots?.[0]?.photo]),
        links: cand.links || [],
        expense: exp,
        data: cand,
        lat: cand.lat || activeCity.hub.lat,
        lng: cand.lng || activeCity.hub.lng,
      };
    };

    let llmHandled = false;
    let isRemoveAction = false;

    // STEP 1: Attempt LLM-Powered Conversational Reasoning (ChatGPT / Qwen intelligence)
    try {
      const topSpotsList = candidatePool
        .slice(0, 18)
        .map((c, i) => `${i + 1}. "${c.name}" (${c.category}, ₹${c.expense || 0}, ${c.spendTime || 30}m)`)
        .join('\n');
      const currentList = currentStops
        .map((s, i) => `${i + 1}. "${s.name}" (${s.costText || ''})`)
        .join('\n');

      const llmPrompt = `You are a ChatGPT-level intelligent Kerala travel AI copilot at ${currentCity.displayName}.
Current user itinerary (${currentStops.length} stops):
${currentList || '(Empty route)'}

Local candidate spots available:
${topSpotsList}

User natural request: "${promptToUse}"

Analyze what the user wants to accomplish. They can ask ANY conversational instruction:
- Remove specific or all spots ("skip river ghat", "don't want crowds", "remove everything")
- Add specific spots or types ("add Kappad beach", "want some authentic tea & snack", "add 3 spots")
- Swap or replace places ("change the first place to something quiet")
- Remove specific or all spots ("skip river ghat", "don't want crowds", "remove everything")
- Add specific spots or types ("add Kappad beach", "want some authentic tea & snack", "add 3 spots")
- Swap or replace places ("change the first place to something quiet")
- Shift time or speed up ("we have an extra hour", "make it 30 mins faster", "got 2 more hours")
- Adjust budget ("got ₹1000 more", "budget friendly", "cut expenses")
- Change vibe or constraints ("it's raining so indoor AC spots only")

Return JSON with this exact structure:
{
  "reason": "1 short conversational sentence explaining what was updated",
  "returnTime": "${updatedReturnTime}",
  "addedHours": 0,
  "addedBudget": 0,
  "stopNames": ["Exact", "names", "of", "all", "stops", "that", "should", "be", "in", "the", "final", "route. Empty array [] if clearing all"]
}
If user requests adding time (e.g. "got 1 more hour"), calculate new returnTime and set addedHours.
If user requests adding budget (e.g. "1000 rs more"), set addedBudget.`;

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('LLM Timeout')), 8500)
      );
      const res = await Promise.race([
        ollamaChat({
          baseUrl: settings.baseUrl || 'http://localhost:11434',
          model: settings.model || 'spot-undo-qwen',
          messages: [{ role: 'user', content: llmPrompt }],
        }),
        timeoutPromise,
      ]);

      if (res && Array.isArray(res.stopNames)) {
        if (res.addedHours && !isNaN(Number(res.addedHours))) {
          setAvailableTimeHrs((prev) => Math.min(12, prev + Number(res.addedHours)));
        }
        if (res.addedBudget && !isNaN(Number(res.addedBudget))) {
          setMaxBudget((prev) => prev + Number(res.addedBudget));
        }

        const newStops = [];
        for (const name of res.stopNames) {
          const nLower = (name || '').toLowerCase().trim();
          if (!nLower) continue;

          // Match from currentStops or candidatePool
          const matched =
            currentStops.find(
              (s) =>
                (s.name || '').toLowerCase() === nLower ||
                (s.name || '').toLowerCase().includes(nLower) ||
                nLower.includes((s.name || '').toLowerCase())
            ) ||
            candidatePool.find(
              (c) =>
                (c.name || '').toLowerCase() === nLower ||
                (c.name || '').toLowerCase().includes(nLower) ||
                nLower.includes((c.name || '').toLowerCase())
            ) ||
            candidatePool.find((c) => {
              const words = (c.name || '').toLowerCase().split(/\s+/).filter((w) => w.length >= 4);
              return words.some((w) => nLower.includes(w));
            });

          if (matched) {
            newStops.push(createStopObject(matched.data || matched, newStops.length, 'AI CO-PILOT'));
          } else {
            newStops.push(
              createStopObject(
                {
                  id: `custom-${Date.now()}-${newStops.length}`,
                  name: name,
                  category: 'Hidden Spots',
                  badge: 'CUSTOM',
                  expense: 20,
                  spendTime: 35,
                  transitText: '🛺 8m • ₹25',
                  photo: currentCity.spots[0]?.photo,
                  lat: currentCity.hub.lat + 0.005,
                  lng: currentCity.hub.lng + 0.005,
                },
                newStops.length,
                'CUSTOM'
              )
            );
          }
        }

        modifiedStops = newStops;
        actionReason = res.reason || `Adapted route to "${promptToUse}"`;
        if (res.returnTime) updatedReturnTime = res.returnTime;
        llmHandled = true;
      }
    } catch (llmErr) {
      console.warn('Local LLM plan modifier fallback to fast heuristic engine:', llmErr);
    }

    // STEP 2: Instant Fast Heuristic Fallback (if offline or LLM takes > 4.5s)
    if (!llmHandled) {
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

      // 1. Universal Removal & Exclusion Intent Detection
      const isRemove =
        /\b(?:remove|drop|delete|cut|leave|skip|cancel|omit|exclude|discard|clear|wipe|strip|erase|dump|toss)\b/i.test(lower) ||
        /\b(?:take|get)\s*(?:out|away|rid|off)\b/i.test(lower) ||
        /\b(?:leave\s*out)\b/i.test(lower) ||
        /\b(?:no\s*need|don'?t\s*want|do\s*not\s*want|not\s*interested|without|avoid|hate|dislike)\b/i.test(lower) ||
        /\b(?:don'?t\s*include|do\s*not\s*include|can\s*we\s*not|no\s*more)\b/i.test(lower) ||
        /\b(?:minus|\-|less|reduce|fewer)\s*(\d+|one|two|three|four|all)?\s*(?:place|spot|stop)s?\b/i.test(lower) ||
        /^(?:no|skip|drop|del|rm)\s+/i.test(lower.trim());

      isRemoveAction = isRemove;

      const isAdd =
        !isRemove &&
        (/\b(?:add|include|put|want|swap|replace|insert|attach)\b/i.test(lower) ||
         /^(?:add|put|give)\s+/i.test(lower.trim()));

      if (isRemove) {
        if (/\b(?:all|everything|entire|whole)\b/i.test(lower)) {
          modifiedStops = [];
          actionReason = 'Cleared all stops from route';
        } else if (/\b(?:1st|first|start|beginning)\b/i.test(lower)) {
          const removed = modifiedStops.shift();
          actionReason = `Dropped 1st stop (${removed?.name || 'first stop'})`;
        } else if (/\b(?:2nd|second)\b/i.test(lower)) {
          const removed = modifiedStops.splice(1, 1);
          actionReason = `Dropped 2nd stop (${removed[0]?.name || 'second stop'})`;
        } else if (/\b(?:3rd|third)\b/i.test(lower)) {
          const removed = modifiedStops.splice(2, 1);
          actionReason = `Dropped 3rd stop (${removed[0]?.name || 'third stop'})`;
        } else if (/\b(?:4th|fourth)\b/i.test(lower)) {
          const removed = modifiedStops.splice(3, 1);
          actionReason = `Dropped 4th stop (${removed[0]?.name || 'fourth stop'})`;
        } else if (/\b(?:last|end|final)\b/i.test(lower)) {
          const removed = modifiedStops.pop();
          actionReason = `Dropped last stop (${removed?.name || 'last stop'})`;
        } else {
          // Check if user specifically named or referenced a stop in modifiedStops
          let matchIdx = -1;
          for (let i = 0; i < modifiedStops.length; i++) {
            const sName = (modifiedStops[i].name || '').toLowerCase();
            if (lower.includes(sName)) {
              matchIdx = i;
              break;
            }
            // Match significant words from stop name
            const words = sName
              .replace(/[^\w\s]/g, '')
              .split(/\s+/)
              .filter((w) => !['and', 'the', 'walk', 'park', 'spot', 'lane', 'view', 'step', 'steps', 'road', 'near', 'hotel', 'restaurant'].includes(w) && w.length >= 3);
            if (words.some((w) => lower.includes(w))) {
              matchIdx = i;
              break;
            }
          }

          if (matchIdx !== -1) {
            const removed = modifiedStops.splice(matchIdx, 1);
            actionReason = `Removed ${removed[0]?.name}`;
          } else if (modifiedStops.length > 0) {
            // Parse numerical count if any ("remove 2 places", "drop two spots", "minus 3")
            const numWords = { one: 1, two: 2, three: 3, four: 4, five: 5, both: 2, a: 1, 'an': 1 };
            const cMatch = lower.match(/\b(?:remove|drop|delete|cut|skip|omit|minus|less)\s*(\d+|one|two|three|four|five|both|a|an)?\b/i);
            let countToRemove = 1;
            if (cMatch && cMatch[1]) {
              const parsed = parseInt(cMatch[1]);
              countToRemove = !isNaN(parsed) ? parsed : (numWords[cMatch[1].toLowerCase()] || 1);
            }

            const removedNames = [];
            for (let i = 0; i < countToRemove && modifiedStops.length > 0; i++) {
              const rem = modifiedStops.pop();
              if (rem?.name) removedNames.push(rem.name);
            }

            actionReason =
              removedNames.length > 1
                ? `Removed ${removedNames.length} stops (${removedNames.join(', ')})`
                : `Removed ${removedNames[0] || 'place'}`;
          }
        }
      }

      // 2. Check for explicit ADD commands or category keywords ("add kappad beach", "add a specific place", "add 10 more", "add tea spot", etc.)
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
        // Check for count (e.g. "add 10 more", "add 3 spots", "add 5 places")
        const countMatch =
          lower.match(/(?:add|include|put|more)?\s*(\d+)\s*(?:more|places|spots|stops)?/i) ||
          lower.match(/(\d+)\s*(?:more|places|spots|stops)/i);
        const countToAdd = countMatch && parseInt(countMatch[1]) > 0 ? Math.min(15, parseInt(countMatch[1])) : 1;

        // 1. Check if user specified a named spot from candidatePool
        let specificCandidate = null;
        const sortedPool = [...candidatePool].sort((a, b) => b.name.length - a.name.length);

        for (const cand of sortedPool) {
          const cLower = cand.name.toLowerCase();
          // Exact full name match
          if (lower.includes(cLower)) {
            specificCandidate = cand;
            break;
          }
          // Distinctive words (length >= 4, excluding generic words)
          const words = cLower
            .replace(/[^\w\s]/g, '')
            .split(/\s+/)
            .filter((w) => !['and', 'the', 'walk', 'park', 'spot', 'lane', 'view', 'step', 'steps', 'road', 'near', 'hotel', 'restaurant'].includes(w) && w.length >= 4);

          if (words.length > 0 && words.some((w) => lower.includes(w))) {
            specificCandidate = cand;
            break;
          }
        }

        if (specificCandidate) {
          const alreadyIn = modifiedStops.some(
            (ms) => (ms.name || '').toLowerCase() === specificCandidate.name.toLowerCase()
          );
          if (!alreadyIn) {
            modifiedStops.push(createStopObject(specificCandidate, modifiedStops.length, 'ADDED SPOT'));
            actionReason = (actionReason ? actionReason + ' & added ' : 'Added ') + specificCandidate.name;
          } else {
            actionReason = `${specificCandidate.name} is already in your trail!`;
          }
        } else {
          // Multi-add or generic add (e.g. "add a specific place", "add 10 more", "add a snack spot")
          const addedList = [];
          for (let i = 0; i < countToAdd; i++) {
            const candidate =
              candidatePool.find((s) => {
                const sLower = s.name.toLowerCase();
                const catLower = (s.category || '').toLowerCase();
                const alreadyIn = modifiedStops.some(
                  (ms) =>
                    (ms.name || '').toLowerCase() === sLower ||
                    (ms.name || '').toLowerCase().includes(sLower)
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

                return true;
              }) ||
              candidatePool.find(
                (s) =>
                  !modifiedStops.some((ms) => (ms.name || '').toLowerCase() === s.name.toLowerCase())
              ) || {
                id: `gen-${currentCity.name}-${Date.now()}-${i}`,
                name: `${currentCity.name} Local Spot #${modifiedStops.length + 1}`,
                category: 'Hidden Spots',
                badge: 'EXPLORE',
                expense: 20,
                spendTime: 35,
                transitText: '🛺 8m • ₹25',
                photo: currentCity.spots[i % currentCity.spots.length]?.photo,
                lat: currentCity.hub.lat + (Math.random() - 0.5) * 0.02,
                lng: currentCity.hub.lng + (Math.random() - 0.5) * 0.02,
              };

            if (candidate) {
              modifiedStops.push(createStopObject(candidate, modifiedStops.length, 'ADDED SPOT'));
              addedList.push(candidate.name);
            }
          }

          if (addedList.length > 0) {
            actionReason =
              (actionReason ? actionReason + ' & added ' : 'Added ') +
              (addedList.length === 1
                ? addedList[0]
                : `${addedList.length} spots (${addedList.slice(0, 2).join(', ')}${
                    addedList.length > 2 ? ` +${addedList.length - 2} more` : ''
                  })`);
          }
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

      // Safety check: if modifiedStops is empty and user was not explicitly removing, populate with first available spot
      if (modifiedStops.length === 0 && !isRemoveAction && candidatePool.length > 0) {
        const fallback = candidatePool[0];
        modifiedStops = [createStopObject(fallback, 0, 'ACTIVE')];
        if (!actionReason) actionReason = `Updated route to ${fallback.name}`;
      }
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
    if (budgetFiltered.length < 3) {
      const sortedByCost = [...allSpots].sort((a, b) => (a.expense || 0) - (b.expense || 0));
      budgetFiltered = sortedByCost.slice(0, Math.max(6, sortedByCost.length));
    }

    // 3. Time calculation: max stops based on available time (up to 6 stops for long layovers/day trips)
    const maxStopsCount =
      timeHrs <= 1
        ? 1
        : timeHrs <= 2
        ? 2
        : timeHrs <= 4
        ? 3
        : timeHrs <= 7
        ? 4
        : timeHrs <= 9
        ? 5
        : 6;

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

    let scored = [...budgetFiltered].sort((a, b) => scoreSpot(b) - scoreSpot(a));
    // Pad scored if city has fewer spots than maxStopsCount
    if (scored.length < maxStopsCount && allSpots.length > 0) {
      let padIdx = 0;
      while (scored.length < maxStopsCount) {
        const base = allSpots[padIdx % allSpots.length];
        scored.push({
          ...base,
          id: `${base.id}-ext-${scored.length}`,
          name: `${base.name} (Stop ${scored.length + 1})`,
        });
        padIdx++;
      }
    }

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

  const [plans, setPlans] = useState(() => {
    try {
      const saved = localStorage.getItem('spot_undoo_saved_plans');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return makeDynamicPlans(currentCity);
  });

  useEffect(() => {
    try {
      if (plans && plans.length > 0) {
        localStorage.setItem('spot_undoo_saved_plans', JSON.stringify(plans));
      }
    } catch {}
  }, [plans]);

  // Auto-detect stops reached via GPS (< 250m)
  useEffect(() => {
    if (!location?.lat || !location?.lon || !plans) return;
    const currentStops = plans[activePlanIdx]?.stops || [];
    const newlyReached = [];
    currentStops.forEach((stop) => {
      const sLat = stop.lat || stop.data?.lat;
      const sLng = stop.lng || stop.data?.lng;
      if (sLat && sLng) {
        const d = haversineKm(location.lat, location.lon, sLat, sLng);
        if (d <= 0.25) { // within 250 meters
          newlyReached.push(stop.id || stop.name);
        }
      }
    });
    if (newlyReached.length > 0) {
      setVisitedStopIds((prev) => Array.from(new Set([...prev, ...newlyReached])));
    }
  }, [location?.lat, location?.lon, activePlanIdx, plans]);

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
    setLoadingStage(1);
    setLoadingStageText(`Anchoring ${currentCity.displayName} railway hub & GPS...`);
    try {
      // Small visual pause for Stage 1 (Blue 1)
      await new Promise((r) => setTimeout(r, 350));

      // 1. Gather all spots: built-in city spots + community uploaded spots
      const stored = JSON.parse(localStorage.getItem('userSpots') || '[]');
      const userCitySpots = stored.filter(
        (s) =>
          s.cityKey === selectedCityKey ||
          (s.cityName && s.cityName.toLowerCase() === currentCity.name.toLowerCase())
      );
      const allCitySpots = [...(currentCity.spots || []), ...userCitySpots];

      setLoadingStage(2);
      setLoadingStageText(`Filtering spots within ₹${maxBudget} budget per person...`);
      await new Promise((r) => setTimeout(r, 350));

      // 2. Pre-filter by user's maxBudget
      let candidates = allCitySpots.filter((s) => (s.expense || 0) <= maxBudget);
      if (candidates.length < 3) {
        const sorted = [...allCitySpots].sort((a, b) => (a.expense || 0) - (b.expense || 0));
        candidates = sorted.slice(0, Math.max(6, sorted.length));
      }

      setLoadingStage(3);
      setLoadingStageText(`Calculating safe return buffer for ${availableTimeHrs} hours...`);
      await new Promise((r) => setTimeout(r, 350));

      const targetStops =
        availableTimeHrs <= 1
          ? 1
          : availableTimeHrs <= 2
          ? 2
          : availableTimeHrs <= 4
          ? 3
          : availableTimeHrs <= 7
          ? 4
          : availableTimeHrs <= 9
          ? 5
          : 6;

      const topCandidates = candidates.slice(0, Math.max(targetStops, 6));

      // Create few-shot template with targetStops items so LLM generates the requested number of stops
      const sampleStopsJson = topCandidates.slice(0, targetStops).map((c, i) => ({
        num: i + 1,
        name: c.name,
        badge: i === 0 ? 'ACTIVE' : (c.badge || 'RECOMMENDED'),
        costText: `₹${c.expense} • ${c.spendTime}m`,
        transitPill: c.transitText || '🚶 8m • Free'
      }));

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
      "stops": ${JSON.stringify(sampleStopsJson, null, 8)},
      "returnPill": "⏰ 17:10 PM • SAFE RETURN TO ${currentCity.hub.stationName}"
    }
  ]
}`;

      setLoadingStage(4);
      setLoadingStageText('Invoking Qwen AI local model reasoning...');

      const res = await ollamaChat({
        baseUrl: settings.baseUrl,
        model: settings.model || 'spot-undo-qwen',
        messages: [{ role: 'user', content: prompt }],
      });

      setLoadingStage(5);
      setLoadingStageText('Optimizing multi-modal transit & timings...');
      await new Promise((r) => setTimeout(r, 350));

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
        setLoadingStage(6);
        setLoadingStageText('Finalizing 3 curated adventure trails!');
        await new Promise((r) => setTimeout(r, 350));

        // Enrich stops with photos, links & coordinates from candidates, and guarantee targetStops count
        const enriched = rawPlans.map((p, pIdx) => {
          let pStops = [...(p.stops || [])];
          if (pStops.length < targetStops) {
            const existingNames = new Set(pStops.map((s) => (s.name || s.location || '').toLowerCase()));
            const remaining = candidates.filter((c) => !existingNames.has(c.name.toLowerCase()));
            let addIdx = 0;
            while (pStops.length < targetStops && addIdx < remaining.length) {
              const rem = remaining[addIdx++];
              pStops.push({
                num: pStops.length + 1,
                name: rem.name,
                badge: rem.badge || 'STOP',
                costText: `₹${rem.expense} • ${rem.spendTime}m`,
                transitPill: rem.transitText || '🛺 10m • ₹30',
              });
            }
          }

          return {
            ...p,
            id: p.id || `plan-${pIdx + 1}`,
            stops: pStops.map((s, idx) => {
              const match =
                candidates.find(
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
          };
        });

        setPlans(enriched);
        setActivePlanIdx(0);
        setViewState('trail');
        // Save to MongoDB Atlas
        savePlanToDatabase(enriched, currentCity);
      } else {
        throw new Error('No valid plans returned by AI');
      }
    } catch {
      setLoadingStage(5);
      setLoadingStageText('Synthesizing instant localized route...');
      await new Promise((r) => setTimeout(r, 350));
      setLoadingStage(6);
      setLoadingStageText('Curated trails ready!');
      await new Promise((r) => setTimeout(r, 300));

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
      setViewState('trail');
      savePlanToDatabase(dynamicPlans, currentCity);
    } finally {
      setLoading(false);
    }
  };

  const currentPlan = plans[activePlanIdx] || plans[0] || { stops: [] };

  return (
    <div className="space-y-3 pb-8">
      {/* BRAND NEW SPOT-UNDOO FULLSCREEN LOADING SCREEN (EXACT MATCH TO MOCKUP) */}
      {loading && (
        <SpotUndooLoadingScreen
          title="Good spots are on the way."
          subtitle="Finding little detours near you..."
          hubName={currentCity.displayName}
          progressStage={loadingStage}
          stageText={loadingStageText}
        />
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
            {/* SEARCHABLE CITY / REGION HUB SELECTOR */}
            <div className="space-y-1.5 relative" ref={cityDropdownRef}>
              <label className="text-[11px] font-black uppercase tracking-wider text-black flex items-center justify-between">
                <span>SELECT CITY / REGION HUB</span>
                <span className="text-[#0B3BF4] font-bold">📍 Active Pin</span>
              </label>

              {/* Trigger Button showing currently active city */}
              <button
                type="button"
                onClick={() => setIsCityDropdownOpen((prev) => !prev)}
                className="w-full bg-[#F4F6F9] border-[2px] border-black rounded-2xl px-3 py-2.5 text-xs font-black text-black outline-none shadow-[0_2px_0_0_#000000] flex items-center justify-between cursor-pointer hover:bg-gray-100 transition active:translate-y-0.5"
              >
                <div className="flex items-center gap-2 truncate text-left">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0 inline-block ring-2 ring-emerald-300" />
                  <span className="truncate">{currentCity.displayName}</span>
                  {currentCity.district && (
                    <span className="text-[9px] bg-black text-white px-1.5 py-0.5 rounded-full uppercase shrink-0 font-bold">
                      {currentCity.district}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-gray-500 shrink-0 ml-1">
                  <Search size={13} className="text-gray-400" />
                  <ChevronDown
                    size={14}
                    className={`transition-transform duration-200 ${
                      isCityDropdownOpen ? 'rotate-180 text-black' : ''
                    }`}
                  />
                </div>
              </button>

              {/* Dropdown Panel with Search Bar & Filtered Cities List */}
              {isCityDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1.5 z-40 bg-white border-[2.5px] border-black rounded-2xl p-2.5 shadow-[0_6px_0_0_#000000] space-y-2 animate-in fade-in duration-150">
                  {/* Search Input Field */}
                  <div className="relative flex items-center">
                    <Search
                      size={14}
                      className="absolute left-3 text-gray-400 pointer-events-none"
                    />
                    <input
                      type="text"
                      autoFocus
                      value={citySearchQuery}
                      onChange={(e) => setCitySearchQuery(e.target.value)}
                      placeholder="Search city, district, or station..."
                      className="w-full bg-[#F4F6F9] border-[1.5px] border-black rounded-xl pl-9 pr-8 py-2 text-xs font-bold text-black outline-none focus:ring-2 focus:ring-[#0B3BF4]/30 placeholder:text-gray-400"
                    />
                    {citySearchQuery && (
                      <button
                        type="button"
                        onClick={() => setCitySearchQuery('')}
                        className="absolute right-2.5 text-gray-400 hover:text-black p-0.5"
                      >
                        <X size={13} />
                      </button>
                    )}
                  </div>

                  {/* Filtered Cities Scrollable List */}
                  <div className="max-h-56 overflow-y-auto space-y-1 pr-1 scrollbar-thin">
                    {filteredCities.length === 0 ? (
                      <div className="p-3 text-center text-xs font-bold text-gray-400">
                        No Kerala cities found matching "{citySearchQuery}"
                      </div>
                    ) : (
                      filteredCities.map(([key, city]) => {
                        const isSelected = selectedCityKey === key;
                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => {
                              handleCityChange(key);
                              setIsCityDropdownOpen(false);
                              setCitySearchQuery('');
                            }}
                            className={`w-full text-left px-2.5 py-2 rounded-xl text-xs font-bold flex items-center justify-between transition cursor-pointer ${
                              isSelected
                                ? 'bg-[#0B3BF4] text-white border border-black shadow-[0_1px_0_0_#000000]'
                                : 'hover:bg-[#F4F6F9] text-black'
                            }`}
                          >
                            <div className="truncate text-left">
                              <div className="font-black flex items-center gap-1.5 truncate">
                                <span className="truncate">{city.name}</span>
                                {city.district && (
                                  <span
                                    className={`text-[8.5px] px-1.5 py-0.2 rounded-full uppercase font-bold shrink-0 ${
                                      isSelected
                                        ? 'bg-white text-black'
                                        : 'bg-gray-200 text-gray-700'
                                    }`}
                                  >
                                    {city.district}
                                  </span>
                                )}
                              </div>
                              <div
                                className={`text-[10px] truncate mt-0.5 ${
                                  isSelected ? 'text-blue-100' : 'text-gray-500'
                                }`}
                              >
                                🚉 {city.hub.stationName}
                              </div>
                            </div>
                            {isSelected && (
                              <Check
                                size={14}
                                className="shrink-0 ml-1 text-white"
                                strokeWidth={3}
                              />
                            )}
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
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
                  max="14"
                  value={availableTimeHrs}
                  onChange={(e) => setAvailableTimeHrs(Number(e.target.value))}
                  className="w-full h-3 bg-gray-200 border-[2px] border-black rounded-lg appearance-none cursor-pointer accent-[#0B3BF4]"
                />
                <div className="flex justify-between text-[10px] font-bold text-gray-500 mt-1">
                  <span>1 hour</span>
                  <span>14 hours</span>
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

          {/* Plan Switcher Pills & Interactive Route Map Toggle */}
          <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 scrollbar-none">
            <div className="flex items-center gap-1.5 shrink-0">
              {plans.map((p, idx) => {
                const isSelected = activePlanIdx === idx;
                return (
                  <button
                    key={p.id || idx}
                    onClick={() => {
                      setActivePlanIdx(idx);
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

            {/* Trail Canvas vs OSM Live Map Toggle */}
            <div className="flex items-center gap-1 bg-white border-[2px] border-black rounded-full p-0.5 shadow-[0_2px_0_0_#000000] shrink-0">
              <button
                type="button"
                onClick={() => setMapViewMode('trail')}
                className={`px-2.5 py-1 rounded-full text-[11px] font-black transition flex items-center gap-1 ${
                  mapViewMode === 'trail'
                    ? 'bg-[#0B3BF4] text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span>🗺️</span>
                <span>Trail</span>
              </button>
              <button
                type="button"
                onClick={() => setMapViewMode('osm')}
                className={`px-2.5 py-1 rounded-full text-[11px] font-black transition flex items-center gap-1 ${
                  mapViewMode === 'osm'
                    ? 'bg-[#0B3BF4] text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span>🛰️</span>
                <span>Map</span>
              </button>
            </div>
          </div>

          {/* VIEW MODE 1: OSM Live Map Mode */}
          {mapViewMode === 'osm' ? (
            <div className="space-y-3">
              <InteractiveMap
                center={[currentCity.hub.lat, currentCity.hub.lng]}
                zoom={13}
                spots={(currentPlan.stops || []).map((s, i) => ({
                  ...s,
                  lat: s.lat || s.data?.lat || (currentCity.hub.lat + 0.008 * (i + 1)),
                  lng: s.lng || s.data?.lng || (currentCity.hub.lng + 0.006 * (i + 1)),
                }))}
                selectedSpot={selectedSpot}
                onSelectSpot={setSelectedSpot}
                userLocation={{
                  lat: currentCity.hub.lat,
                  lon: currentCity.hub.lng,
                  label: currentCity.hub.stationName,
                }}
                showRoute={true}
                height="500px"
              />

              {/* SAFE RETURN BOX UNDER MAP */}
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
          ) : (
            /* VIEW MODE 2: Scrollable Neo-Brutalist Trail Canvas (Calibrated for ~3 compact Polaroid cards + scroll) */
            <div className="relative bg-[#F4F6F9] border-[2.5px] border-black rounded-3xl p-3 shadow-[0_4px_0_0_#000000] max-h-[460px] overflow-y-auto overflow-x-hidden scrollbar-thin scroll-smooth">
              {/* Dynamic Trail SVG Line: Sequential dotted line connecting Start -> Pin 1 -> Pin 2 -> Pin 3 -> Safe Return */}
              {(() => {
                const stops = currentPlan.stops || [];
                const stopsCount = stops.length;
                const stepGap = 162;
                const stopNodes = stops.map((_, sIdx) => {
                  const isLeft = sIdx % 2 === 0;
                  return {
                    cx: isLeft ? 90 : 270,
                    cy: 88 + sIdx * stepGap,
                    idx: sIdx,
                  };
                });

                const endCy = stopsCount === 0 ? 80 : 88 + stopsCount * stepGap - 10;
                const endPoint = { cx: 180, cy: endCy };
                const svgHeight = endCy + 60;

                // Build individual curved segments so visited sections become grey & white
                const segments = [];
                if (stopNodes.length > 0) {
                  // Segment 0: Circular Start -> Pin 1
                  const isFirstVisited = visitedStopIds.includes(stops[0]?.id || stops[0]?.name);
                  segments.push({
                    d: `M 28 24 C 28 60, 90 40, ${stopNodes[0].cx} ${stopNodes[0].cy}`,
                    isVisited: isFirstVisited,
                  });

                  // Sequential Segments: Pin i -> Pin i+1 (1 connects to 2, 2 connects to 3, etc.)
                  for (let i = 0; i < stopNodes.length - 1; i++) {
                    const curr = stopNodes[i];
                    const next = stopNodes[i + 1];
                    const isNextVisited = visitedStopIds.includes(stops[i + 1]?.id || stops[i + 1]?.name);
                    const c1x = curr.cx === 90 ? 150 : 210;
                    const c2x = next.cx === 270 ? 210 : 150;
                    segments.push({
                      d: `M ${curr.cx} ${curr.cy} C ${c1x} ${curr.cy + 55}, ${c2x} ${next.cy - 55}, ${next.cx} ${next.cy}`,
                      isVisited: isNextVisited,
                    });
                  }

                  // Last Stop Pin -> Safe Return
                  const last = stopNodes[stopNodes.length - 1];
                  const allStopsVisited = stops.length > 0 && stops.every((s) => visitedStopIds.includes(s.id || s.name));
                  const cLastX = last.cx === 90 ? 120 : 240;
                  segments.push({
                    d: `M ${last.cx} ${last.cy} C ${cLastX} ${last.cy + 45}, 180 ${endCy - 20}, ${endPoint.cx} ${endPoint.cy}`,
                    isVisited: allStopsVisited,
                  });
                } else {
                  segments.push({
                    d: `M 180 24 C 180 40, 180 60, ${endPoint.cx} ${endPoint.cy}`,
                    isVisited: false,
                  });
                }

                return (
                  <svg
                    className="absolute inset-0 w-full pointer-events-none"
                    style={{ height: `${svgHeight}px` }}
                    viewBox={`0 0 360 ${svgHeight}`}
                    preserveAspectRatio="none"
                  >
                    {/* Pure Dotted Path: Visited = Grey & White, Upcoming = Electric Blue */}
                    {segments.map((seg, sIdx) => (
                      <path
                        key={sIdx}
                        d={seg.d}
                        fill="none"
                        stroke={seg.isVisited ? '#9CA3AF' : '#0B3BF4'}
                        strokeWidth="3.5"
                        strokeDasharray="6 6"
                        strokeLinecap="round"
                      />
                    ))}

                    {/* Start Waypoint Node (at Start circle) */}
                    <circle cx="28" cy="24" r="5" fill="#10B981" stroke="#000000" strokeWidth="2" />

                    {/* Safe Return Destination Node */}
                    <circle cx={endPoint.cx} cy={endPoint.cy} r="5" fill="#F59E0B" stroke="#000000" strokeWidth="2" />
                  </svg>
                );
              })()}

              {/* TOP HEADER: CIRCULAR START NODE & STATION HUB */}
              <div className="relative z-10 flex items-center justify-between mb-3 px-0.5">
                <div className="flex items-center gap-2 min-w-0">
                  {/* Clean Circular Start Node */}
                  <div className="w-11 h-11 rounded-full bg-[#10B981] border-[2.5px] border-black flex flex-col items-center justify-center shadow-[0_2px_0_0_#000000] text-white shrink-0">
                    <span className="text-[8.5px] font-black uppercase tracking-wider leading-none">START</span>
                    <span className="text-[9.5px] font-black leading-none mt-0.5 text-emerald-100">{currentPlan.startTime || '14:00'}</span>
                  </div>

                  <div className="bg-white border-[2px] border-black rounded-2xl px-3 py-1.5 text-xs font-black text-black shadow-[0_2px_0_0_#000000] flex items-center gap-1.5 truncate">
                    <span className="text-sm shrink-0">🚆</span>
                    <span className="truncate">{currentCity.hub.stationName}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={syncLiveGps}
                  className="bg-white border-[2px] border-black rounded-full px-2.5 py-1 text-[10px] font-black text-emerald-800 shadow-[0_2px_0_0_#000000] flex items-center gap-1 hover:bg-emerald-50 active:translate-y-0.5 transition cursor-pointer shrink-0"
                  title="Detect reached locations on trail via GPS"
                >
                  <Navigation size={10} className={isLiveGpsActive ? "text-emerald-500 animate-spin" : "text-[#0B3BF4]"} />
                  <span>{isLiveGpsActive ? "Syncing..." : "GPS"}</span>
                </button>
              </div>

              {/* Dynamic Trail Steps: Sequential Cards with Red Push-Pins on the Dotted Path */}
              <div className="relative z-10 space-y-4">
                {(currentPlan.stops || []).length === 0 && (
                  <div className="py-4 px-3 text-center bg-white/70 border-[2px] border-dashed border-gray-400 rounded-2xl shadow-[0_2px_0_0_#000000]">
                    <p className="text-xs font-black text-black">Route cleared</p>
                    <p className="text-[10px] font-bold text-gray-500 mt-0.5">
                      Ask AI to "add [place]" or choose a vibe below
                    </p>
                  </div>
                )}
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
                  const isNearby = distMeters !== null && distMeters <= 250;

                  return (
                    <div key={sIdx} className={`w-1/2 flex flex-col items-center ${isLeft ? '' : 'ml-auto'}`}>
                      {/* Transit pill & GPS Check-in badge directly above the card */}
                      <div className="flex items-center gap-1 mb-2">
                        <span className={`border-[1.5px] rounded-full px-2 py-0.5 text-[9px] font-black shadow-[0_1px_0_0_#000000] ${
                          isReached
                            ? 'bg-[#F3F4F6] border-gray-300 text-gray-500'
                            : 'bg-[#FEF3C7] border-black text-black'
                        }`}>
                          {stop.transitPill || '🚶 8m • Free'}
                        </span>

                        <button
                          type="button"
                          onClick={() => toggleCheckIn(stopId)}
                          className={`text-[8.5px] font-black px-1.5 py-0.5 rounded-full border flex items-center gap-1 shadow-[0_1px_0_0_#000000] active:translate-y-0.5 transition cursor-pointer ${
                            isReached
                              ? 'bg-[#E5E7EB] text-gray-700 border-gray-400'
                              : isNearby
                              ? 'bg-emerald-100 text-emerald-900 border-emerald-600 animate-pulse'
                              : 'bg-white text-gray-700 border-black hover:bg-gray-100'
                          }`}
                          title="Click to check in or mark reached"
                        >
                          {isReached ? (
                            <>
                              <Check size={8} strokeWidth={3} className="text-gray-700" />
                              <span>Visited</span>
                            </>
                          ) : isNearby ? (
                            <>
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping inline-block" />
                              <span>At Spot</span>
                            </>
                          ) : (
                            <>
                              <Navigation size={7} />
                              <span>{distMeters ? `${distMeters < 1000 ? `${distMeters}m` : `${(distMeters / 1000).toFixed(1)}k`}` : 'Check In'}</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Compact Polaroid Snapshot Card: Pinned right onto the dotted path */}
                      <div
                        onClick={() => setSelectedSpot(stop.data || stop)}
                        className={`relative rounded-xl p-1.5 pt-2.5 pb-2 shadow-[0_3px_0_0_#000000] cursor-pointer hover:scale-[1.02] active:scale-98 transition w-[155px] ${
                          isLeft ? '-rotate-1 hover:rotate-0' : 'rotate-1 hover:rotate-0'
                        } ${
                          isReached
                            ? 'bg-white/85 border-[1.8px] border-gray-400 opacity-80'
                            : 'bg-white border-[2px] border-black'
                        }`}
                      >
                        {/* 3D Push-Pin with Number Pinned Directly on the Dotted Trail Path */}
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center pointer-events-none">
                          <div
                            className={`w-5 h-5 rounded-full border-[1.5px] shadow-[0_2px_0_0_rgba(0,0,0,0.4)] flex items-center justify-center font-black text-[10px] ${
                              isReached
                                ? 'bg-[#E5E7EB] text-gray-700 border-gray-500'
                                : 'bg-gradient-to-br from-red-400 via-red-500 to-red-600 border-black text-white ring-1 ring-red-300/60'
                            }`}
                          >
                            {isReached ? <Check size={11} strokeWidth={3} className="text-gray-700" /> : sIdx + 1}
                          </div>
                        </div>

                        {/* Polaroid Photo Frame */}
                        <div className="relative w-full h-[72px] rounded-md overflow-hidden border border-black mb-1 bg-gray-100 shadow-[inset_0_1px_2px_rgba(0,0,0,0.1)]">
                          <img
                            src={stop.photo || currentCity.spots[sIdx % currentCity.spots.length]?.photo}
                            alt={stop.name}
                            className={`w-full h-full object-cover ${
                              isReached ? 'grayscale contrast-110 opacity-75' : ''
                            }`}
                          />
                          <div className="absolute top-1 right-1">
                            {isReached ? (
                              <span className="bg-[#E5E7EB] border border-gray-400 text-gray-600 font-black text-[6.5px] px-1 py-0.2 rounded uppercase">
                                VISITED
                              </span>
                            ) : (
                              <span className="bg-[#F59E0B] border border-black text-black font-black text-[6.5px] px-1 py-0.2 rounded uppercase shadow-[0_0.5px_0_0_#000000]">
                                {stop.badge || stop.category || 'SPOT'}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Polaroid Bottom Chin */}
                        <div className="px-0.5 space-y-0.5">
                          <div className="font-black text-[10px] text-black truncate leading-tight">
                            {stop.name}
                          </div>
                          <div className={`text-[8.5px] font-bold flex items-center justify-between ${isReached ? 'text-gray-500' : 'text-emerald-700'}`}>
                            <span>{stop.costText || (stop.expense === 0 ? 'Free' : `₹${stop.expense}`) + ` • ${stop.spendTime || 30}m`}</span>
                            <span className="flex items-center gap-0.5">{stop.rating || stop.data?.rating || 5} ⭐</span>
                          </div>
                          <div className="text-[8px] font-semibold text-gray-500 flex items-center justify-between pt-0.5 border-t border-gray-200">
                            <span className="truncate max-w-[110px]">
                              📍 {distMeters ? `${distMeters < 1000 ? `${distMeters}m` : `${(distMeters / 1000).toFixed(1)}km`}` : (stop.distanceText || '0.8 km')}
                            </span>
                            <span className={isReached ? 'text-gray-400 font-black text-[8.5px]' : 'text-[#0B3BF4] font-black text-[8.5px]'}>↗</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* MANDATORY SAFE RETURN END LOCATION ALWAYS ON THE BOTTOM OF THAT BOX */}
              <div className="relative z-10 mt-4 mb-1">
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
          )}

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

          {/* Selected Spot Popup Modal Overlay */}
          {selectedSpot && (
            <div
              onClick={() => setSelectedSpot(null)}
              className="fixed inset-0 z-[999] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-3 animate-in fade-in duration-200"
            >
              <div
                onClick={(e) => e.stopPropagation()}
                className="bg-white border-[3px] border-black rounded-3xl p-4 shadow-[0_8px_0_0_#000000] w-full max-w-lg max-h-[88vh] overflow-y-auto space-y-3 relative"
              >
                <div className="w-12 h-1 bg-black/20 rounded-full mx-auto" />
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
