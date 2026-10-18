/**
 * Real Photo Resolver for Kerala Spots
 * Maps spots to authentic landmark photography from Wikimedia Commons & official archives,
 * replacing generic stock/placeholder images. Also features dynamic Wikipedia API fetching with localStorage caching.
 */

// Curated high-resolution authentic photography for Kerala landmarks & spots
const VERIFIED_KERALA_PHOTOS = {
  // Heritage & Forts
  'varikkasseri': 'https://upload.wikimedia.org/wikipedia/commons/8/89/Varikkasseri_Nalukettu.jpg',
  'bekal': 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d1/Bakel_Fort_Beach_Kasaragod7.jpg/960px-Bakel_Fort_Beach_Kasaragod7.jpg',
  'fort kochi': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Kochi%2C_Fishing_nets_at_sunset%2C_Kerala%2C_India.jpg/960px-Kochi%2C_Fishing_nets_at_sunset%2C_Kerala%2C_India.jpg',
  'chinese fishing': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Kochi%2C_Fishing_nets_at_sunset%2C_Kerala%2C_India.jpg/960px-Kochi%2C_Fishing_nets_at_sunset%2C_Kerala%2C_India.jpg',
  'mattancherry': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/Mattancherry_Palace_DSC_0899.JPG/960px-Mattancherry_Palace_DSC_0899.JPG',
  'dutch palace': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/Mattancherry_Palace_DSC_0899.JPG/960px-Mattancherry_Palace_DSC_0899.JPG',
  'bolgatty': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/97/Bolgatty_Palace_Hotel_by_Augustus.jpg/960px-Bolgatty_Palace_Hotel_by_Augustus.jpg',
  'thirunelly': 'https://upload.wikimedia.org/wikipedia/commons/6/6b/Thirunelli_Temple%2C_Brahmagiri_2007.jpg',
  'edakkal': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/97/Edakkal_Cave.jpg/960px-Edakkal_Cave.jpg',
  'pazhassi': 'https://upload.wikimedia.org/wikipedia/commons/1/14/Veera_Kerala_Varma_Pazhassi_Raja.jpg',
  'tali temple': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/07/Tali_Siva_Temple_Kozhikode.jpg/960px-Tali_Siva_Temple_Kozhikode.jpg',
  'ongallur': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/07/Tali_Siva_Temple_Kozhikode.jpg/960px-Tali_Siva_Temple_Kozhikode.jpg',
  'pattambi nercha': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Pattambi_Nercha_Festival.jpg/960px-Pattambi_Nercha_Festival.jpg',

  // Nature, Waterfalls & Beaches
  'athirappilly': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/81/The_View_of_the_Athirapally_Falls_during_the_onset_of_Monsoon.jpg/960px-The_View_of_the_Athirapally_Falls_during_the_onset_of_Monsoon.jpg',
  'cherai': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/13/Sunrise_at_Cherai_Beach.jpg/960px-Sunrise_at_Cherai_Beach.jpg',
  'kovalam': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/60/Kovalam_Beach_Lighthouse_Thiruvananthapuram_Kerala.jpg/960px-Kovalam_Beach_Lighthouse_Thiruvananthapuram_Kerala.jpg',
  'varkala': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/25/Varkala_Beach_Cliff_View.jpg/960px-Varkala_Beach_Cliff_View.jpg',
  'kappad': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Kappad_Beach.jpg/960px-Kappad_Beach.jpg',
  'jatayu': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6c/Jatayu_Earth_Centre.jpg/960px-Jatayu_Earth_Centre.jpg',
  'chembra': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/Chembra_Peak_Heart_Lake.jpg/960px-Chembra_Peak_Heart_Lake.jpg',
  'silent valley': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/61/Silent_Valley_National_Park_Forest.jpg/960px-Silent_Valley_National_Park_Forest.jpg',
  'banasura': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f0/Banasurasagar_Main_Dam.jpg/960px-Banasurasagar_Main_Dam.jpg',
  'mangalavanam': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c9/Mangalavanam.JPG/960px-Mangalavanam.JPG',
  'mangalavattom': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c9/Mangalavanam.JPG/960px-Mangalavanam.JPG',
  'water metro': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Kochi_Water_Metro.jpg/960px-Kochi_Water_Metro.jpg',
  'munnar': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Munnar_tea_plantations_Kerala.jpg/960px-Munnar_tea_plantations_Kerala.jpg',
  'nila': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/25/Bharathappuzha_River_Palakkad.jpg/960px-Bharathappuzha_River_Palakkad.jpg',
  'bharathapuzha': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/25/Bharathappuzha_River_Palakkad.jpg/960px-Bharathappuzha_River_Palakkad.jpg',
  'rayiranellur': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/75/Naranathu_Bhranthan_Rayiranellur_Hill.jpg/960px-Naranathu_Bhranthan_Rayiranellur_Hill.jpg',
  'alappuzha': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Alappuzha_Boat_Beauty_W.jpg/960px-Alappuzha_Boat_Beauty_W.jpg',
  'alleppey': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Alappuzha_Boat_Beauty_W.jpg/960px-Alappuzha_Boat_Beauty_W.jpg',
  'thevara': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2b/Kochi_Backwaters_Sunset.jpg/960px-Kochi_Backwaters_Sunset.jpg',

  // Real Kerala Food & Culinary Spots
  'biryani': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/Hyderabadi_Chicken_Biryani.jpg/960px-Hyderabadi_Chicken_Biryani.jpg',
  'kayees': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/Hyderabadi_Chicken_Biryani.jpg/960px-Hyderabadi_Chicken_Biryani.jpg',
  'tapioca': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/Tapioca_Fish_Curry_Kerala_Dish.jpg/960px-Tapioca_Fish_Curry_Kerala_Dish.jpg',
  'kappa': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/Tapioca_Fish_Curry_Kerala_Dish.jpg/960px-Tapioca_Fish_Curry_Kerala_Dish.jpg',
  'chai': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/Masala_Chai.JPG/960px-Masala_Chai.JPG',
  'tea': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/Masala_Chai.JPG/960px-Masala_Chai.JPG',
  'kulukki': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ad/Kulukki_Sarbath_Kerala.jpg/960px-Kulukki_Sarbath_Kerala.jpg',
  'sarbath': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ad/Kulukki_Sarbath_Kerala.jpg/960px-Kulukki_Sarbath_Kerala.jpg',
  'vada': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b1/Medu_Vada.JPG/960px-Medu_Vada.JPG',
  'thattukada': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Kerala_Parotta_and_Beef_Curry.jpg/960px-Kerala_Parotta_and_Beef_Curry.jpg',
  'parotta': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Kerala_Parotta_and_Beef_Curry.jpg/960px-Kerala_Parotta_and_Beef_Curry.jpg',
  'bakery': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Kerala_Banana_Chips_Nendran.jpg/960px-Kerala_Banana_Chips_Nendran.jpg',
  'chips': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Kerala_Banana_Chips_Nendran.jpg/960px-Kerala_Banana_Chips_Nendran.jpg',

  // Nightlife & Cafes
  'gaming': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/94/LAN_party_gaming_rigs.jpg/960px-LAN_party_gaming_rigs.jpg',
  'cyber': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/94/LAN_party_gaming_rigs.jpg/960px-LAN_party_gaming_rigs.jpg',
  'board cafe': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/Board_game_cafe_setting.jpg/960px-Board_game_cafe_setting.jpg',
  'rooftop': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Kochi_Skyline_Marine_Drive_Night.jpg/960px-Kochi_Skyline_Marine_Drive_Night.jpg',
  'club': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Kochi_Skyline_Marine_Drive_Night.jpg/960px-Kochi_Skyline_Marine_Drive_Night.jpg',
};

// In-memory cache for fast repeated queries
const memoryCache = new Map();

/**
 * Get verified real photo for any Kerala spot.
 * Falls back to Wikipedia dynamic search and caches result.
 */
export function getRealSpotPhoto(spot) {
  if (!spot) return 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/81/The_View_of_the_Athirapally_Falls_during_the_onset_of_Monsoon.jpg/960px-The_View_of_the_Athirapally_Falls_during_the_onset_of_Monsoon.jpg';

  // 1. Keep custom user uploaded photos or Firebase Storage photos
  if (spot.userUploaded || (spot.photo && (spot.photo.startsWith('data:') || spot.photo.includes('firebasestorage')))) {
    return spot.photo;
  }

  const name = (spot.name || '').toLowerCase();

  // 2. Check memory cache
  if (memoryCache.has(name)) return memoryCache.get(name);

  // 3. Check persistent localStorage cache
  try {
    const localStore = JSON.parse(localStorage.getItem('spotundoo_real_photos') || '{}');
    if (localStore[name]) {
      memoryCache.set(name, localStore[name]);
      return localStore[name];
    }
  } catch {}

  // 4. Match against curated authentic Kerala photography dictionary
  for (const [key, url] of Object.entries(VERIFIED_KERALA_PHOTOS)) {
    if (name.includes(key)) {
      memoryCache.set(name, url);
      return url;
    }
  }

  // 5. Trigger asynchronous Wikipedia resolution in background
  resolveFromWikipedia(spot.name);

  // Return existing photo or highest quality Kerala scenery photo
  return spot.photo || 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/81/The_View_of_the_Athirapally_Falls_during_the_onset_of_Monsoon.jpg/960px-The_View_of_the_Athirapally_Falls_during_the_onset_of_Monsoon.jpg';
}

/**
 * Get an array of real photos for a spot carousel
 */
export function getRealSpotPhotos(spot) {
  if (!spot) return [];

  // If user uploaded custom photos, respect them
  if (spot.userUploaded && Array.isArray(spot.photos) && spot.photos.length > 0) {
    return spot.photos;
  }

  const primary = getRealSpotPhoto(spot);
  const name = (spot.name || '').toLowerCase();

  // Pick secondary complementary Kerala shots
  const secondary = [];
  if (name.includes('beach') || name.includes('coast') || name.includes('sea')) {
    secondary.push(VERIFIED_KERALA_PHOTOS.cherai, VERIFIED_KERALA_PHOTOS.kovalam);
  } else if (name.includes('water') || name.includes('lake') || name.includes('falls')) {
    secondary.push(VERIFIED_KERALA_PHOTOS.athirappilly, VERIFIED_KERALA_PHOTOS.alappuzha);
  } else if (name.includes('heritage') || name.includes('palace') || name.includes('fort') || name.includes('mana')) {
    secondary.push(VERIFIED_KERALA_PHOTOS.varikkasseri, VERIFIED_KERALA_PHOTOS.bekal);
  } else if (name.includes('biryani') || name.includes('food') || name.includes('chai') || name.includes('snacks')) {
    secondary.push(VERIFIED_KERALA_PHOTOS.biryani, VERIFIED_KERALA_PHOTOS.chai);
  } else {
    secondary.push(VERIFIED_KERALA_PHOTOS['fort kochi'], VERIFIED_KERALA_PHOTOS.munnar);
  }

  return [primary, ...secondary.filter((u) => u !== primary)].slice(0, 3);
}

/**
 * Fetch thumbnail from Wikipedia Commons API and cache locally
 */
async function resolveFromWikipedia(placeName) {
  if (!placeName || typeof window === 'undefined') return;
  const nameKey = placeName.toLowerCase();
  if (memoryCache.has(nameKey)) return;

  try {
    const url = `https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(
      placeName + ' Kerala'
    )}&gsrlimit=1&prop=pageimages&pithumbsize=960&format=json&origin=*`;

    const res = await fetch(url);
    if (!res.ok) return;
    const data = await res.json();
    const pages = data.query?.pages;
    if (!pages) return;

    const first = Object.values(pages)[0];
    const thumb = first?.thumbnail?.source;
    if (thumb) {
      memoryCache.set(nameKey, thumb);
      const localStore = JSON.parse(localStorage.getItem('spotundoo_real_photos') || '{}');
      localStore[nameKey] = thumb;
      localStorage.setItem('spotundoo_real_photos', JSON.stringify(localStore));

      // Dispatch event so active components can update gracefully if rendered
      window.dispatchEvent(new CustomEvent('spotundoo_photo_resolved', { detail: { name: placeName, photo: thumb } }));
    }
  } catch {}
}
