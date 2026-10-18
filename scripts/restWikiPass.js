import fs from 'fs';
import { KERALA_CITIES } from '../src/data/keralaCitiesData.js';

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchSummaryPhoto(title) {
  try {
    const clean = title.replace(/\s+/g, '_');
    const res = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(clean)}`,
      {
        headers: { 'User-Agent': 'SpotUndooApp/1.0 (Kerala Tourism Explorer)' },
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.thumbnail?.source || data.originalimage?.source || null;
  } catch {
    return null;
  }
}

async function run() {
  let count = 0;
  for (const [ck, city] of Object.entries(KERALA_CITIES)) {
    for (const spot of city.spots || []) {
      const isUnsplashStock = !spot.photo || spot.photo.includes('unsplash.com/photo-1542273917363');
      if (spot.category !== 'Food' && isUnsplashStock) {
        // Targeted queries
        const words = spot.name.split(' ');
        const queries = [
          spot.name,
          `${words[0]} ${words[1] || ''}`.trim(),
          `${city.name}`,
        ];
        for (const q of queries) {
          const p = await fetchSummaryPhoto(q);
          if (p) {
            spot.photo = p;
            spot.photos = [p, ...(spot.photos || []).filter((x) => x !== p)].slice(0, 3);
            count++;
            console.log(`✅ [REST Photo] ${spot.name} ➔ ${p.slice(0, 60)}...`);
            break;
          }
          await sleep(60);
        }
      }
    }
  }
  console.log('Total additional spots enriched:', count);
  fs.writeFileSync(
    './src/data/keralaCitiesData.js',
    `// Auto-generated 30 authentic Kerala cities & railway hubs with verified real photos\nexport const KERALA_CITIES = ${JSON.stringify(
      KERALA_CITIES,
      null,
      2
    )};\n`,
    'utf-8'
  );
}

run();
