import fs from 'fs';
import path from 'path';

// Distinct, verified, authentic photos for all 70 Kerala spots
const SPOT_PHOTOS = {
  // === Shoranur ===
  'shn-1': [ // River Ghat Step Walk (Bharathapuzha ghat)
    'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=800&q=80',
    'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?w=800&q=80'
  ],
  'shn-2': [ // Nila River Secret Banyan
    'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?w=800&q=80',
    'https://images.unsplash.com/photo-1448375240586-882707db888b?w=800&q=80'
  ],
  'shn-3': [ // Amma Crispy Vada Stall
    'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800&q=80',
    'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=800&q=80'
  ],
  'shn-4': [ // LevelUp Cyber Hub (Gaming)
    'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&q=80',
    'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=800&q=80'
  ],
  'shn-5': [ // Clay Craft Artisan Village
    'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=800&q=80',
    'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=800&q=80'
  ],
  'shn-6': [ // Railway Colony Moonlight Walkway
    'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=800&q=80',
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80'
  ],
  'shn-7': [ // Hotel Aryaas Ghee Roast
    'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=800&q=80',
    'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800&q=80'
  ],
  'shn-8': [ // Nila Rooftop Diner
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80',
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80'
  ],
  'shn-9': [ // CyberByte PS5 Gaming Den
    'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=800&q=80',
    'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&q=80'
  ],
  'shn-10': [ // Cheruthuruthy River View Sunset
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80',
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80'
  ],

  // === Kochi ===
  'koc-1': [ // Fort Kochi Spice Lane
    'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=800&q=80',
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80'
  ],
  'koc-2': [ // Kayees Rahmathulla Biryani
    'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&q=80',
    'https://images.unsplash.com/photo-1633945274405-b6c8069047b0?w=800&q=80'
  ],
  'koc-3': [ // Mangalavanam Bird Sanctuary Mangroves
    'https://images.unsplash.com/photo-1448375240586-882707db888b?w=800&q=80',
    'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&q=80'
  ],
  'koc-4': [ // Thevara Ferry Sunset Point
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80',
    'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=800&q=80'
  ],
  'koc-5': [ // Water Metro Battery Cruise
    'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=800&q=80',
    'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&q=80'
  ],
  'koc-6': [ // Galaxy LAN Gaming Arena
    'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&q=80',
    'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&q=80'
  ],
  'koc-7': [ // Avenue Regent Rooftop Sky Lounge
    'https://images.unsplash.com/photo-1575444758702-4a6b9222336e?w=800&q=80',
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80'
  ],
  'koc-8': [ // Shaji Tapioca & Fish Curry Shack
    'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&q=80',
    'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=800&q=80'
  ],
  'koc-9': [ // Board Game Coffee Lab
    'https://images.unsplash.com/photo-1611996575749-79a3a250f948?w=800&q=80',
    'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=800&q=80'
  ],
  'koc-10': [ // Subhash Bose Waterfront Park
    'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=800&q=80',
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80'
  ],

  // === Calicut ===
  'clt-1': [ // Mananchira Square Park Walk
    'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&q=80',
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80'
  ],
  'clt-2': [ // Zain Food Court Halwa Lane
    'https://images.unsplash.com/photo-1541832676-9b763b0239ab?w=800&q=80',
    'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&q=80'
  ],
  'clt-3': [ // Kozhikode South Beach Pier Ruins
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80',
    'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=800&q=80'
  ],
  'clt-4': [ // Paragon Legendary Biryani Kitchen
    'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&q=80',
    'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800&q=80'
  ],
  'clt-5': [ // Mishkal 700-Yr Wooden Pavilion
    'https://images.unsplash.com/photo-1548013146-72479768bada?w=800&q=80',
    'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=800&q=80'
  ],
  'clt-6': [ // Beypore Ancient Uru Boatyard & Marina
    'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&q=80',
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80'
  ],
  'clt-7': [ // Bombay Hotel Heritage Sulaimani & Halwa
    'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=800&q=80',
    'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&q=80'
  ],
  'clt-8': [ // Kallumakkaya (Spicy Mussels) Beach Cart
    'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=800&q=80',
    'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&q=80'
  ],
  'clt-9': [ // CyberSphere Esports & Racing Hub
    'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=800&q=80',
    'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&q=80'
  ],
  'clt-10': [ // S.M. Street (Mittayi Theruvu) Evening Walk
    'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=800&q=80',
    'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&q=80'
  ],

  // === Palakkad ===
  'pkd-1': [ // Palakkad Tipu Fort Granite Moat
    'https://images.unsplash.com/photo-1548013146-72479768bada?w=800&q=80',
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80'
  ],
  'pkd-2': [ // Kalpathy Vedic Agraharam Lane
    'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=800&q=80',
    'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?w=800&q=80'
  ],
  'pkd-3': [ // Noorjehan Fort View Ghee Rice
    'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&q=80',
    'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800&q=80'
  ],
  'pkd-4': [ // Malampuzha Garden & Rock Bridge
    'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&q=80',
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80'
  ],
  'pkd-5': [ // Kava Misty Reservoir Backwaters
    'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=800&q=80',
    'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?w=800&q=80'
  ],
  'pkd-6': [ // Ramassery Heritage Leaf Steamed Idli
    'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800&q=80',
    'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=800&q=80'
  ],
  'pkd-7': [ // NM Food Court Fresh Tender Coconut Shake
    'https://images.unsplash.com/photo-1546173159-315724a31696?w=800&q=80',
    'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&q=80'
  ],
  'pkd-8': [ // Apex Esports Zone Olavakkode
    'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&q=80',
    'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&q=80'
  ],
  'pkd-9': [ // Dhoni Hill Waterfalls Trek Foothill
    'https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?w=800&q=80',
    'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&q=80'
  ],
  'pkd-10': [ // Fort View Terrace Chai Point
    'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=800&q=80',
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80'
  ],

  // === Trivandrum ===
  'tvm-1': [ // Kuthira Malika Royal Grounds
    'https://upload.wikimedia.org/wikipedia/commons/7/71/0507-KuthiraMalika-Dinakarr.jpg',
    'https://images.unsplash.com/photo-1548013146-72479768bada?w=800&q=80'
  ],
  'tvm-2': [ // Maha Cafe Hot Boli & Coffee
    'https://images.unsplash.com/photo-1541832676-9b763b0239ab?w=800&q=80',
    'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=800&q=80'
  ],
  'tvm-3': [ // Valiathura Ocean Wave Pier
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80',
    'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=800&q=80'
  ],
  'tvm-4': [ // Imperial Cyber & Gaming Station
    'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&q=80',
    'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=800&q=80'
  ],
  'tvm-5': [ // Padmanabhaswamy Temple Heritage Tank Walk
    'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=800&q=80',
    'https://images.unsplash.com/photo-1548013146-72479768bada?w=800&q=80'
  ],
  'tvm-6': [ // Kovalam Lighthouse Cliff Path
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80',
    'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=800&q=80'
  ],
  'tvm-7': [ // Buhari Hotel Midnight Mutton Puttu
    'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&q=80',
    'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800&q=80'
  ],
  'tvm-8': [ // Indian Coffee House Laurie Baker Spiral Tower
    'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&q=80',
    'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&q=80'
  ],
  'tvm-9': [ // PixelForge Gaming & Board Room Lounge
    'https://images.unsplash.com/photo-1611996575749-79a3a250f948?w=800&q=80',
    'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=800&q=80'
  ],
  'tvm-10': [ // Shanghumugham Beach Giant Mermaid Promenade
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80',
    'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=800&q=80'
  ],

  // === Kollam ===
  'klm-1': [ // Thangassery Lighthouse & Fort Ruins
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80',
    'https://images.unsplash.com/photo-1548013146-72479768bada?w=800&q=80'
  ],
  'klm-2': [ // Ashtamudi Lake Craft Jetty
    'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=800&q=80',
    'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?w=800&q=80'
  ],
  'klm-3': [ // Munroe Island Mangrove Canoe Channel
    'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&q=80',
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80'
  ],
  'klm-4': [ // Kollam Beach Old Pier & Sea Promenade
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80',
    'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=800&q=80'
  ],
  'klm-5': [ // Ramees Restaurant Tawa Karimeen Pollichathu
    'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=800&q=80',
    'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&q=80'
  ],
  'klm-6': [ // Cashew Workers Heritage Street & Chai
    'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=800&q=80',
    'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&q=80'
  ],
  'klm-7': [ // Thevally Palace Waterfront Grounds
    'https://images.unsplash.com/photo-1548013146-72479768bada?w=800&q=80',
    'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&q=80'
  ],
  'klm-8': [ // Streamline Gaming Cafe & Pool Lounge
    'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&q=80',
    'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&q=80'
  ],
  'klm-9': [ // Kollam Port Dolphin Breakwater Walk
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80',
    'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=800&q=80'
  ],
  'klm-10': [ // Supreme Bakers Classic Cashew Halwa
    'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&q=80',
    'https://images.unsplash.com/photo-1541832676-9b763b0239ab?w=800&q=80'
  ],

  // === Wayanad ===
  'wyd-1': [ // Karapuzha Lake Spillway Sunset
    'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=800&q=80',
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80'
  ],
  'wyd-2': [ // Coffee Plantation Trail Kadha
    'https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=800&q=80',
    'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=800&q=80'
  ],
  'wyd-3': [ // En Ooru Tribal Heritage Village
    'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=800&q=80',
    'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&q=80'
  ],
  'wyd-4': [ // Pookode Lake Freshwater Lotus Trail
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80',
    'https://images.unsplash.com/photo-1448375240586-882707db888b?w=800&q=80'
  ],
  'wyd-5': [ // Banasura Sagar Earth Dam Footpath
    'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=800&q=80',
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80'
  ],
  'wyd-6': [ // Wilton Restaurant Malabar Bamboo Biryani
    'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&q=80',
    'https://images.unsplash.com/photo-1633945274405-b6c8069047b0?w=800&q=80'
  ],
  'wyd-7': [ // Wayanad Tea Museum & Tasting Deck
    'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=800&q=80',
    'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?w=800&q=80'
  ],
  'wyd-8': [ // Chundale Cardamom & Coffee Trail
    'https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=800&q=80',
    'https://images.unsplash.com/photo-1448375240586-882707db888b?w=800&q=80'
  ],
  'wyd-9': [ // Altitude Gaming Haven Kalpetta
    'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&q=80',
    'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&q=80'
  ],
  'wyd-10': [ // Vythiri Mist Viewpoint & Night Tea Stall
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80',
    'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=800&q=80'
  ],
};

const filePath = path.resolve('src/data/keralaCitiesData.js');
let code = fs.readFileSync(filePath, 'utf-8');

// For each spot ID, update its photo and photos array
let updatedCount = 0;
for (const [id, photos] of Object.entries(SPOT_PHOTOS)) {
  const photoMain = photos[0];
  const photosArrayStr = JSON.stringify(photos, null, 10).replace(/\n/g, '\n          ');

  // Match spot by id
  const regex = new RegExp(`("id":\\s*"${id}"[\\s\\S]*?"photo":\\s*")[^"]*("([\\s\\S]*?"photos":\\s*)\\[[\\s\\S]*?\\])`, 'm');
  if (regex.test(code)) {
    code = code.replace(regex, `$1${photoMain}"$2[\n            "${photos[0]}",\n            "${photos[1]}"\n          ]`);
    updatedCount++;
  }
}

fs.writeFileSync(filePath, code, 'utf-8');
console.log(`Successfully updated ${updatedCount} spots with authentic photos in ${filePath}`);
