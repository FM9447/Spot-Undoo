export function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function roadDistanceKm(lat1, lon1, lat2, lon2) {
  return haversineKm(lat1, lon1, lat2, lon2) * 1.3;
}

export function getTransit(distKm) {
  if (distKm <= 1.2) return { mode: "Walk", cost: 0, mins: Math.ceil(distKm * 12) };
  const autoCost = 30 + Math.ceil((distKm - 1) * 18);
  return { mode: "Auto", cost: autoCost, mins: Math.ceil(distKm * 3) };
}

export function filterCandidates(places, userLat, userLon, usableTimeMins, maxBudget) {
  return places
    .map((p) => {
      const dist = roadDistanceKm(userLat, userLon, p.lat, p.lng);
      const transit = getTransit(dist);
      const roundTripMins = transit.mins * 2;
      const roundTripCost = transit.cost * 2;
      const totalMins = roundTripMins + p.spendTime;
      const totalCost = roundTripCost + p.expense;
      return { ...p, dist, transit, roundTripMins, roundTripCost, totalMins, totalCost };
    })
    .filter((p) => p.totalMins <= usableTimeMins && p.totalCost <= maxBudget)
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 8);
}

export function buildFallbackPlans(candidates, startTime, maxBudget) {
  if (candidates.length === 0) return [];
  const fmt = (mins) => {
    const d = new Date(startTime.getTime() + mins * 60000);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const makePlan = (spots, label) => {
    let cursor = 0;
    let totalCost = 0;
    const stops = spots.map((s) => {
      const arriveStr = fmt(cursor + s.transit.mins);
      cursor += s.transit.mins + s.spendTime;
      const leaveStr = fmt(cursor);
      totalCost += s.roundTripCost + s.expense;
      return { ...s, arriveStr, leaveStr };
    });
    return { label, stops, totalCost };
  };

  const plans = [];
  if (candidates.length >= 1)
    plans.push(makePlan(candidates.slice(0, Math.min(3, candidates.length)), "Best Rated Route"));
  const budgetSorted = [...candidates].sort((a, b) => a.totalCost - b.totalCost);
  if (budgetSorted.length >= 1)
    plans.push(makePlan(budgetSorted.slice(0, Math.min(3, budgetSorted.length)), "Ultra-Budget Saver"));
  return plans;
}
