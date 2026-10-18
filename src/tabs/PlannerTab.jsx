import { useState } from 'react';
import places from '../data/placesSeed';
import { filterCandidates, buildFallbackPlans } from '../utils/plannerMath';
import { ollamaChat } from '../utils/ollama';
import { Loader2, BrainCircuit, IndianRupee, Clock, MapPin } from 'lucide-react';
import SpotUndooLoadingScreen from '../components/SpotUndooLoadingScreen';

const MOODS = ['Chill', 'Street Food', 'Hidden Nature', 'Gaming', 'Party'];
const MODES = ['Quick Free Time', 'Waiting for Train/Flight', 'Few Days Trip'];

export default function PlannerTab({ location, settings }) {
  const [mode, setMode] = useState('Quick Free Time');
  const [timeHrs, setTimeHrs] = useState(3);
  const [budget, setBudget] = useState(500);
  const [moods, setMoods] = useState([]);
  const [customMood, setCustomMood] = useState('');
  const [loading, setLoading] = useState(false);
  const [plans, setPlans] = useState([]);
  const [error, setError] = useState('');

  const toggleMood = (m) => setMoods((prev) => prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]);

  const generate = async () => {
    setLoading(true);
    setPlans([]);
    setError('');
    const buffer = mode === 'Waiting for Train/Flight' ? 30 : 0;
    const usableTimeMins = timeHrs * 60 - buffer;
    const stored = JSON.parse(localStorage.getItem('userSpots') || '[]');
    const all = [...places, ...stored];
    const candidates = filterCandidates(all, location.lat, location.lon, usableTimeMins, budget);
    const startTime = new Date();

    try {
      if (candidates.length === 0) throw new Error('No candidates match your filters');
      const prompt = `You are a local Kerala travel planner. Based on these ${candidates.length} filtered spots (already within time and budget), create EXACTLY 3 travel plans as JSON.

User preferences: Mode=${mode}, Time=${timeHrs}hrs (usable=${usableTimeMins}min), Budget=₹${budget}, Moods=${[...moods, customMood].filter(Boolean).join(', ')}

Spots (pre-filtered):
${candidates.map((c, i) => `${i + 1}. ${c.name} (${c.category}) | ₹${c.expense} entry | ${c.spendTime}min | ${c.transit.mode} ₹${c.transit.cost} | Rating: ${c.rating} | Review: "${c.review}"`).join('\n')}

Return this JSON structure:
{
  "plans": [
    {
      "label": "Plan 1: Best Mood & Review Match",
      "reasoning": "short explanation",
      "stops": [{"name": "spot name", "arrive": "HH:MM", "leave": "HH:MM", "mode": "Walk/Auto", "fare": 0, "expense": 0, "review_quote": "quote"}],
      "totalCost": 0,
      "bufferMins": 0
    }
  ]
}`;

      const result = await ollamaChat({
        baseUrl: settings.baseUrl,
        model: settings.model,
        messages: [{ role: 'user', content: prompt }],
      });
      // Support both modern {plans: [...]} and legacy flat plan objects
      if (Array.isArray(result?.plans) && result.plans.length) {
        setPlans(result.plans);
      } else if (result && typeof result === 'object') {
        const legacyPlans = Object.entries(result)
          .filter(([k]) => k.startsWith('Plan'))
          .map(([, v]) => ({
            label: v.title || v.id || 'Plan',
            reasoning: v.vibe || '',
            stops: (v.stops || []).map((s) => ({
              name: s.location || s.name,
              arriveStr: s.startTime || s.arrive || '',
              leaveStr: s.returnTime || s.leave || '',
              mode: s.transitPill?.split(' ')[0] || 'Walk',
              fare: 0,
              expense: s.expense || 0,
              review: s.review_quote || s.review || '',
            })),
            totalCost: v.totalCost ?? 0,
            bufferMins: 0,
          }));
        if (legacyPlans.length) setPlans(legacyPlans);
        else throw new Error('Invalid AI response');
      } else {
        throw new Error('Invalid AI response');
      }
    } catch (err) {
      setError(`AI offline or error: ${err.message}. Showing math-based plans.`);
      setPlans(buildFallbackPlans(candidates, startTime, budget));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 space-y-5">
      {loading && <SpotUndooLoadingScreen />}
      {/* Mode */}
      <div className="space-y-2">
        <label className="text-xs text-gray-400 uppercase tracking-wider">Mode</label>
        <div className="flex gap-2 flex-wrap">
          {MODES.map((m) => (
            <button key={m} onClick={() => setMode(m)}
              className={`text-xs px-3 py-1.5 rounded-full border transition ${
                mode === m ? 'bg-blue-600 border-blue-500 text-white' : 'bg-white/5 border-white/10 text-gray-400'
              }`}>{m}</button>
          ))}
        </div>
      </div>

      {/* Time Slider */}
      <div className="space-y-2">
        <label className="text-xs text-gray-400 uppercase tracking-wider">Available Time: <span className="text-white">{timeHrs} hrs</span></label>
        <input type="range" min={1} max={8} value={timeHrs} onChange={(e) => setTimeHrs(+e.target.value)}
          className="w-full accent-purple-500" />
      </div>

      {/* Budget Slider */}
      <div className="space-y-2">
        <label className="text-xs text-gray-400 uppercase tracking-wider">Max Budget: <span className="text-white">₹{budget}</span></label>
        <input type="range" min={50} max={2000} step={50} value={budget} onChange={(e) => setBudget(+e.target.value)}
          className="w-full accent-orange-500" />
      </div>

      {/* Mood Tags */}
      <div className="space-y-2">
        <label className="text-xs text-gray-400 uppercase tracking-wider">Mood / Vibe</label>
        <div className="flex gap-2 flex-wrap">
          {MOODS.map((m) => (
            <button key={m} onClick={() => toggleMood(m)}
              className={`text-xs px-3 py-1.5 rounded-full border transition ${
                moods.includes(m) ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-white/5 border-white/10 text-gray-400'
              }`}>{m}</button>
          ))}
        </div>
        <input value={customMood} onChange={(e) => setCustomMood(e.target.value)}
          placeholder="Custom vibe (e.g. rainy day, first date)..."
          className="w-full bg-white/5 rounded-xl px-3 py-2 text-sm text-white border border-white/10 focus:border-purple-500 outline-none" />
      </div>

      {/* Generate Button */}
      <button onClick={generate} disabled={loading}
        className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50 transition">
        {loading ? <><Loader2 size={16} className="animate-spin" /> Generating Plans...</> : <><BrainCircuit size={16} /> Generate Plans with Qwen 2.5</>}
      </button>

      {error && <p className="text-xs text-orange-400 bg-orange-400/10 rounded-lg p-2">{error}</p>}

      {/* Plans */}
      {plans.map((plan, i) => (
        <div key={i} className="bg-[#1a1a24] rounded-2xl border border-white/10 overflow-hidden">
          <div className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 px-4 py-3">
            <h3 className="font-bold text-sm text-white">{plan.label}</h3>
            {plan.reasoning && <p className="text-xs text-gray-300 mt-1">{plan.reasoning}</p>}
          </div>
          <div className="p-3 space-y-2">
            {(plan.stops || []).map((stop, j) => (
              <div key={j} className="flex gap-3 items-start">
                <div className="text-center min-w-[48px]">
                  <div className="text-xs text-purple-400 font-mono">{stop.arrive || stop.arriveStr}</div>
                  <div className="text-[10px] text-gray-500">↓</div>
                  <div className="text-xs text-gray-400 font-mono">{stop.leave || stop.leaveStr}</div>
                </div>
                <div className="flex-1 bg-white/5 rounded-xl p-2">
                  <div className="font-medium text-sm text-white">{stop.name}</div>
                  <div className="flex gap-2 mt-1">
                    <span className="text-[10px] text-blue-400">{stop.mode || stop.transit?.mode} ₹{stop.fare ?? stop.roundTripCost ?? 0}</span>
                    <span className="text-[10px] text-orange-400">Entry ₹{stop.expense ?? 0}</span>
                  </div>
                  {(stop.review_quote || stop.review) && (
                    <p className="text-[10px] text-gray-400 italic mt-1 line-clamp-1">"{stop.review_quote || stop.review}"</p>
                  )}
                </div>
              </div>
            ))}
            <div className="flex items-center justify-between pt-2 border-t border-white/5">
              <div className="flex items-center gap-1 text-sm font-semibold">
                <IndianRupee size={12} className="text-orange-400" />
                <span className="text-white">{plan.totalCost ?? 0}</span>
                <span className="text-gray-500 text-xs">/ ₹{budget}</span>
              </div>
              <div className="w-32 h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-green-500 to-orange-500 rounded-full"
                  style={{ width: `${Math.min(100, ((plan.totalCost ?? 0) / budget) * 100)}%` }} />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
