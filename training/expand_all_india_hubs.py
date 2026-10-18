#!/usr/bin/env python3
import json
import random

CITIES_DATA = {
    # ── KERALA HUBS ─────────────────────────────────────────────
    "Shoranur": {
        "displayName": "Shoranur Jn Hub (Palakkad)",
        "state": "Kerala",
        "hub": {"name": "Shoranur Jn Hub (Active)", "stationName": "Shoranur Jn Pl. 1", "lat": 10.7606, "lng": 76.2711},
        "spots": [
            {"id": "shn-1", "name": "River Ghat Step Walk", "category": "Hidden Spots", "expense": 0, "time": 30, "dist": 0.8, "transit": "🚶 8m • Free", "rating": 5.0, "review": "Serene stepped ghat overlooking Bharathapuzha. Perfect quiet walk before train."},
            {"id": "shn-2", "name": "Nila River Secret Banyan", "category": "Hidden Spots", "expense": 40, "time": 45, "dist": 2.1, "transit": "🛺 10m • ₹30", "rating": 4.8, "review": "Quiet riverside shade with hot pazhampori and chai."},
            {"id": "shn-3", "name": "Amma's Crispy Vada", "category": "Food", "expense": 25, "time": 20, "dist": 1.2, "transit": "🚶 6m • Free", "rating": 4.9, "review": "Golden uzhunnu vada hot off the oil pan with coconut chutney."},
            {"id": "shn-4", "name": "LevelUp Cyber Hub", "category": "Gaming & Chill", "expense": 80, "time": 60, "dist": 3.0, "transit": "🛺 8m • ₹25", "rating": 4.7, "review": "High-speed broadband, esports gaming setups, chilled AC."},
            {"id": "shn-5", "name": "Varikkasseri Mana Heritage", "category": "Hidden Spots", "expense": 50, "time": 60, "dist": 6.8, "transit": "🛺 18m • ₹65", "rating": 4.9, "review": "Magnificent traditional aristocratic illam where Malayalam movies are shot."},
            {"id": "shn-6", "name": "Shaji's Street Tapioca", "category": "Food", "expense": 40, "time": 25, "dist": 1.5, "transit": "🚶 7m • Free", "rating": 4.7, "review": "Hot kappa and spicy fish curry served fast on plantain leaf."},
            {"id": "shn-7", "name": "Clay Craft Village", "category": "Hidden Spots", "expense": 0, "time": 40, "dist": 4.2, "transit": "🛺 10m • ₹35", "rating": 4.6, "review": "Generations of potters shaping terracotta by the water."},
            {"id": "shn-8", "name": "Old Banyan Chai Stall", "category": "Food", "expense": 15, "time": 20, "dist": 1.0, "transit": "🚶 5m • Free", "rating": 4.8, "review": "Cardamom tea with hot banana fritters under ancient tree canopy."}
        ]
    },
    "Kochi": {
        "displayName": "Kochi / Ernakulam Hub",
        "state": "Kerala",
        "hub": {"name": "Ernakulam Jn (South)", "stationName": "Ernakulam South Pl. 1", "lat": 9.9678, "lng": 76.2905},
        "spots": [
            {"id": "cok-1", "name": "Fort Kochi Spice Lane", "category": "Hidden Spots", "expense": 0, "time": 45, "dist": 4.5, "transit": "⛴️ 20m • ₹20 (Water Metro)", "rating": 4.8, "review": "Aromatic back-alleys with antique spice warehouses, no crowds."},
            {"id": "cok-2", "name": "Kayees Rahmathulla Biryani", "category": "Food", "expense": 180, "time": 30, "dist": 3.8, "transit": "🛺 12m • ₹40", "rating": 4.9, "review": "Iconic tender Malabar mutton biryani with ghee aroma."},
            {"id": "cok-3", "name": "Mangalavanam Bird Sanctuary", "category": "Hidden Spots", "expense": 10, "time": 40, "dist": 2.2, "transit": "🛺 8m • ₹25", "rating": 4.5, "review": "The green lung of Kochi, quiet mangrove walk in the city center."},
            {"id": "cok-4", "name": "Broadway Kulukki & Snacks", "category": "Food", "expense": 35, "time": 20, "dist": 1.5, "transit": "🚶 7m • Free", "rating": 4.7, "review": "Spicy green-chilli kulukki sarbath and hot banana chips."},
            {"id": "cok-5", "name": "Water Metro High Court Jetty", "category": "Hidden Spots", "expense": 30, "time": 40, "dist": 2.8, "transit": "🛺 10m • ₹30", "rating": 4.8, "review": "Ultra-modern electric boat cruise overlooking Vembanad backwaters."},
            {"id": "cok-6", "name": "Mattancherry Jew Town Antique Walk", "category": "Hidden Spots", "expense": 0, "time": 50, "dist": 4.2, "transit": "🛺 14m • ₹45", "rating": 4.7, "review": "16th-century cobblestone alleys, curio shops, and heritage cafes."},
            {"id": "cok-7", "name": "Galaxy Cyber Gaming Hub", "category": "Gaming & Chill", "expense": 90, "time": 60, "dist": 2.0, "transit": "🚶 10m • Free", "rating": 4.6, "review": "Fast 500Mbps fiber, RTX gaming rigs, chilled AC atmosphere."},
            {"id": "cok-8", "name": "Subhash Bose Park Waterfront", "category": "Hidden Spots", "expense": 0, "time": 35, "dist": 1.2, "transit": "🚶 6m • Free", "rating": 4.4, "review": "Breezy harbor promenade with sunset views over ships."}
        ]
    },
    "Calicut": {
        "displayName": "Calicut (Kozhikode) Hub",
        "state": "Kerala",
        "hub": {"name": "Kozhikode Main", "stationName": "Kozhikode Main Pl. 1", "lat": 11.2464, "lng": 75.7804},
        "spots": [
            {"id": "clt-1", "name": "Mananchira Square Park Walk", "category": "Hidden Spots", "expense": 0, "time": 40, "dist": 1.2, "transit": "🚶 7m • Free", "rating": 4.7, "review": "Clear water square reservoir enclosed by traditional red-tile gates."},
            {"id": "clt-2", "name": "Paragon Restaurant Biryani", "category": "Food", "expense": 190, "time": 40, "dist": 1.5, "transit": "🚶 8m • Free", "rating": 4.9, "review": "Legendary Calicut dum biryani with melt-in-mouth chicken and pickle."},
            {"id": "clt-3", "name": "Kozhikode Beach Old Pier", "category": "Hidden Spots", "expense": 0, "time": 45, "dist": 2.0, "transit": "🛺 6m • ₹25", "rating": 4.8, "review": "Century-old collapsed shipping pier jutting into Arabian sea waves."},
            {"id": "clt-4", "name": "SM Street Halwa Lane", "category": "Food", "expense": 50, "time": 35, "dist": 0.9, "transit": "🚶 5m • Free", "rating": 4.8, "review": "Pedestrian heritage street with warm black halwa and banana chips."},
            {"id": "clt-5", "name": "LevelUp Esports Cafe", "category": "Gaming & Chill", "expense": 80, "time": 60, "dist": 2.2, "transit": "🛺 8m • ₹25", "rating": 4.7, "review": "Ultra-low latency LAN gaming and bubble tea in AC lounge."},
            {"id": "clt-6", "name": "Zains Heritage Moplah Snacks", "category": "Food", "expense": 75, "time": 25, "dist": 1.8, "transit": "🚶 10m • Free", "rating": 4.9, "review": "Authentic unnakkaya, chattipathiri, and Sulaimani tea."},
            {"id": "clt-7", "name": "Kallayi River Timber Footbridge", "category": "Hidden Spots", "expense": 0, "time": 40, "dist": 3.1, "transit": "🛺 10m • ₹30", "rating": 4.6, "review": "Historical timber floating river with tranquil iron railway bridge."}
        ]
    },
    "Trivandrum": {
        "displayName": "Trivandrum Central Hub",
        "state": "Kerala",
        "hub": {"name": "Trivandrum Central", "stationName": "Trivandrum Central Pl. 1", "lat": 8.4875, "lng": 76.9532},
        "spots": [
            {"id": "tvm-1", "name": "Kuthira Malika Palace Grounds", "category": "Hidden Spots", "expense": 40, "time": 45, "dist": 1.1, "transit": "🚶 8m • Free", "rating": 4.7, "review": "122 carved wooden horses, teakwood silence, historic temple vibe."},
            {"id": "tvm-2", "name": "Maha Chips & Boli Stall", "category": "Food", "expense": 60, "time": 20, "dist": 0.9, "transit": "🚶 6m • Free", "rating": 4.9, "review": "Fresh hot Trivandrum yellow Boli with sweet condensed milk."},
            {"id": "tvm-3", "name": "Napier Museum Heritage Gardens", "category": "Hidden Spots", "expense": 20, "time": 50, "dist": 3.0, "transit": "🛺 10m • ₹30", "rating": 4.8, "review": "Indo-Saracenic masterpiece nestled under massive rain trees."},
            {"id": "tvm-4", "name": "Villa Maya Courtyard Chai", "category": "Food", "expense": 120, "time": 40, "dist": 2.1, "transit": "🛺 8m • ₹25", "rating": 4.6, "review": "18th-century restored Dutch manor for quiet filter coffee."},
            {"id": "tvm-5", "name": "Shanghumukham Beach Mermaid", "category": "Hidden Spots", "expense": 0, "time": 60, "dist": 6.5, "transit": "🛺 18m • ₹60", "rating": 4.6, "review": "Kanayi Kunhiraman's colossal Sagarakanyaka sculpture at dusk."},
            {"id": "tvm-6", "name": "Chala Market Spice Alley", "category": "Food", "expense": 40, "time": 30, "dist": 0.8, "transit": "🚶 5m • Free", "rating": 4.5, "review": "Centuries-old bazaar alley serving cardamom black tea and piping parotta."}
        ]
    },
    "Palakkad": {
        "displayName": "Palakkad Town Hub",
        "state": "Kerala",
        "hub": {"name": "Palakkad Jn (Olavakkode)", "stationName": "Palakkad Jn Pl. 1", "lat": 10.8268, "lng": 76.6433},
        "spots": [
            {"id": "pkd-1", "name": "Palakkad Tipu Fort & Moat", "category": "Hidden Spots", "expense": 20, "time": 50, "dist": 4.5, "transit": "🛺 12m • ₹40", "rating": 4.8, "review": "Granite fortress surrounded by a tranquil water moat."},
            {"id": "pkd-2", "name": "Kalpathy Heritage Agraharam Lane", "category": "Hidden Spots", "expense": 0, "time": 45, "dist": 2.8, "transit": "🛺 8m • ₹25", "rating": 4.8, "review": "Ancient Brahmin settlement with row houses and historic chariot grounds."},
            {"id": "pkd-3", "name": "Indian Coffee House Olavakkode", "category": "Food", "expense": 55, "time": 25, "dist": 0.5, "transit": "🚶 3m • Free", "rating": 4.6, "review": "Retro spiral tables serving filter coffee and beetroot cutlets."},
            {"id": "pkd-4", "name": "Malampuzha Garden Canal Walk", "category": "Hidden Spots", "expense": 30, "time": 60, "dist": 8.0, "transit": "🛺 20m • ₹70", "rating": 4.7, "review": "Green mountain reservoir backdrop with ropeway and peaceful canal paths."},
            {"id": "pkd-5", "name": "Kava Valley Sunset Point", "category": "Hidden Spots", "expense": 0, "time": 60, "dist": 9.5, "transit": "🛺 25m • ₹90", "rating": 4.9, "review": "Pristine reservoir backwaters flanked by the misty Western Ghats."}
        ]
    },
    "Thrissur": {
        "displayName": "Thrissur Cultural Capital",
        "state": "Kerala",
        "hub": {"name": "Thrissur Railway Station", "stationName": "Thrissur Jn Pl. 1", "lat": 10.5186, "lng": 76.2144},
        "spots": [
            {"id": "tsr-1", "name": "Vadakkumnathan Temple Round", "category": "Hidden Spots", "expense": 0, "time": 45, "dist": 1.2, "transit": "🚶 8m • Free", "rating": 4.9, "review": "Massive 9-acre hilltop teakwood grove in the center of Thrissur Round."},
            {"id": "tsr-2", "name": "Roast Town Ghee Roast & Tea", "category": "Food", "expense": 70, "time": 25, "dist": 0.8, "transit": "🚶 6m • Free", "rating": 4.8, "review": "Paper-thin crispy ghee roast dosa and strong Malabar filter coffee."},
            {"id": "tsr-3", "name": "Shakthan Thampuran Palace", "category": "Hidden Spots", "expense": 25, "time": 40, "dist": 2.5, "transit": "🛺 7m • ₹25", "rating": 4.6, "review": "Kochi king's Dutch-Kerala style palace with sprawling heritage lawns."},
            {"id": "tsr-4", "name": "Thrissur Boli & Payasam Corner", "category": "Food", "expense": 50, "time": 20, "dist": 1.0, "transit": "🚶 6m • Free", "rating": 4.7, "review": "Hot palada pradhaman and warm yellow boli."},
            {"id": "tsr-5", "name": "Vilangan Hills Sunset Point", "category": "Hidden Spots", "expense": 15, "time": 60, "dist": 6.8, "transit": "🛺 16m • ₹55", "rating": 4.8, "review": "Panoramic 360-degree hill view over Thrissur's green paddy basins."}
        ]
    },
    "Alappuzha": {
        "displayName": "Alappuzha (Venice of the East)",
        "state": "Kerala",
        "hub": {"name": "Alappuzha Railway Station", "stationName": "Alappuzha Pl. 1", "lat": 9.4925, "lng": 76.3242},
        "spots": [
            {"id": "alp-1", "name": "Alappuzha Old Sea Bridge Pier", "category": "Hidden Spots", "expense": 0, "time": 45, "dist": 1.4, "transit": "🚶 9m • Free", "rating": 4.7, "review": "Atmospheric 160-year-old rusted iron pier into the crashing waves."},
            {"id": "alp-2", "name": "Punnamada Backwater Canal Walk", "category": "Hidden Spots", "expense": 0, "time": 50, "dist": 3.8, "transit": "🛺 10m • ₹35", "rating": 4.9, "review": "Home of Nehru Trophy Snake Boat Race. Shaded coconut palm banks."},
            {"id": "alp-3", "name": "Brothers Hotel Duck Roast", "category": "Food", "expense": 160, "time": 30, "dist": 2.2, "transit": "🛺 7m • ₹25", "rating": 4.8, "review": "Spicy Kuttanad duck roast with hot appams and coconut gravy."},
            {"id": "alp-4", "name": "Alappuzha Lighthouse View", "category": "Hidden Spots", "expense": 20, "time": 35, "dist": 1.6, "transit": "🚶 10m • Free", "rating": 4.6, "review": "Spiral climb giving unmatched panoramic view over the Arabian Sea."}
        ]
    },
    "Kannur": {
        "displayName": "Kannur (Land of Looms & Lores)",
        "state": "Kerala",
        "hub": {"name": "Kannur Main", "stationName": "Kannur Pl. 1", "lat": 11.8745, "lng": 75.3704},
        "spots": [
            {"id": "knr-1", "name": "St. Angelo Fort Ramparts", "category": "Hidden Spots", "expense": 25, "time": 50, "dist": 3.2, "transit": "🛺 9m • ₹30", "rating": 4.8, "review": "16th-century Portuguese coastal fortress overlooking Moppila Bay."},
            {"id": "knr-2", "name": "Muzhappilangad Drive-in Beach", "category": "Hidden Spots", "expense": 50, "time": 60, "dist": 11.0, "transit": "🛺 22m • ₹80", "rating": 4.9, "review": "Asia's longest natural drive-in beach with packed golden sands."},
            {"id": "knr-3", "name": "Ondens Mussels & Fish Fry", "category": "Food", "expense": 140, "time": 30, "dist": 1.2, "transit": "🚶 7m • Free", "rating": 4.9, "review": "Kallummakkaya (spiced fried mussels) and fresh catch of the day."},
            {"id": "knr-4", "name": "Arakkal Museum Heritage Palace", "category": "Hidden Spots", "expense": 30, "time": 40, "dist": 2.8, "transit": "🛺 8m • ₹25", "rating": 4.6, "review": "The royal residence of the only Muslim royal dynasty of Kerala."}
        ]
    },
    "Wayanad": {
        "displayName": "Wayanad (Kalpetta Gateway)",
        "state": "Kerala",
        "hub": {"name": "Kalpetta Old Bus Stand", "stationName": "Kalpetta Hub", "lat": 11.6080, "lng": 76.0828},
        "spots": [
            {"id": "wyd-1", "name": "Karapuzha Reservoir Lakeside", "category": "Hidden Spots", "expense": 30, "time": 50, "dist": 9.5, "transit": "🛺 22m • ₹85", "rating": 4.8, "review": "Earthen dam lake flanked by rolling tea hills and misty waters."},
            {"id": "wyd-2", "name": "1980's A Nostalgic Restaurant", "category": "Food", "expense": 160, "time": 40, "dist": 2.1, "transit": "🛺 6m • ₹25", "rating": 4.7, "review": "Traditional Kerala sadhya and bamboo biryani served on banana leaves."},
            {"id": "wyd-3", "name": "Edakkal Prehistoric Rock Caves", "category": "Hidden Spots", "expense": 50, "time": 60, "dist": 14.0, "transit": "🛺 30m • ₹120", "rating": 4.8, "review": "Stone Age petroglyphs carved high inside mountain rock clefts."},
            {"id": "wyd-4", "name": "Wayanad Bamboo Village Walk", "category": "Hidden Spots", "expense": 0, "time": 45, "dist": 6.2, "transit": "🛺 15m • ₹50", "rating": 4.6, "review": "Shaded bamboo groves and eco-artisan workshops along stream."}
        ]
    },
    "Munnar": {
        "displayName": "Munnar Tea Highlands",
        "state": "Kerala",
        "hub": {"name": "Munnar Central Town Hub", "stationName": "Munnar KSRTC", "lat": 10.0889, "lng": 77.0595},
        "spots": [
            {"id": "mnr-1", "name": "KDHP Tea Museum & Factory", "category": "Hidden Spots", "expense": 75, "time": 50, "dist": 2.0, "transit": "🛺 6m • ₹25", "rating": 4.7, "review": "Aromatic tea manufacturing history and fresh garden tea tasting."},
            {"id": "mnr-2", "name": "Pothanmedu Viewpoint", "category": "Hidden Spots", "expense": 0, "time": 45, "dist": 4.2, "transit": "🛺 12m • ₹45", "rating": 4.9, "review": "Sweeping vista of emerald tea carpets, cardamom plants, and misty cliffs."},
            {"id": "mnr-3", "name": "Rapsy Restaurant Spanish Omelette", "category": "Food", "expense": 80, "time": 25, "dist": 0.5, "transit": "🚶 3m • Free", "rating": 4.6, "review": "Legendary backpacker cafe serving Kerala parottas and hot spiced tea."},
            {"id": "mnr-4", "name": "Mattupetty Lake Echo Point", "category": "Hidden Spots", "expense": 20, "time": 50, "dist": 9.0, "transit": "🛺 20m • ₹75", "rating": 4.7, "review": "High-altitude water reservoir reflecting cloud-capped Western Ghats."}
        ]
    },
    "Kollam": {
        "displayName": "Kollam Jn (Ashtamudi Hub)",
        "state": "Kerala",
        "hub": {"name": "Kollam Jn", "stationName": "Kollam Jn Pl. 1", "lat": 8.8879, "lng": 76.5956},
        "spots": [
            {"id": "klm-1", "name": "Tangasseri British Lighthouse", "category": "Hidden Spots", "expense": 20, "time": 40, "dist": 4.5, "transit": "🛺 11m • ₹35", "rating": 4.7, "review": "144-foot red-and-white striped tower with coastal breakers view."},
            {"id": "klm-2", "name": "Ashtamudi Lake Waterfront Walk", "category": "Hidden Spots", "expense": 0, "time": 45, "dist": 1.2, "transit": "🚶 7m • Free", "rating": 4.8, "review": "Palm-fringed gateway to Kerala's most picturesque backwaters."},
            {"id": "klm-3", "name": "Fayaz Cashew Halwa Stall", "category": "Food", "expense": 90, "time": 20, "dist": 0.9, "transit": "🚶 5m • Free", "rating": 4.8, "review": "Kollam's world-famous export-quality roasted cashews and sweet halwa."}
        ]
    },

    # ── TAMIL NADU HUBS ─────────────────────────────────────────
    "Chennai": {
        "displayName": "Chennai Central Hub (Tamil Nadu)",
        "state": "Tamil Nadu",
        "hub": {"name": "Puratchi Thalaivar Dr. MGR Central", "stationName": "Chennai Central Pl. 1", "lat": 13.0827, "lng": 80.2755},
        "spots": [
            {"id": "maa-1", "name": "Marina Beach Old Lighthouse", "category": "Hidden Spots", "expense": 20, "time": 50, "dist": 3.8, "transit": "🛺 12m • ₹40", "rating": 4.8, "review": "Elevator to top floor overlooking world's second longest urban beach."},
            {"id": "maa-2", "name": "Murugan Idli Shop & Podi Dosa", "category": "Food", "expense": 110, "time": 30, "dist": 2.5, "transit": "🛺 8m • ₹30", "rating": 4.9, "review": "Steaming hot mallipoo idlis with 4 signature chutneys and spicy podi."},
            {"id": "maa-3", "name": "Mylapore Kapaleeshwarar Temple Lane", "category": "Hidden Spots", "expense": 0, "time": 45, "dist": 5.2, "transit": "🛺 15m • ₹50", "rating": 4.9, "review": "7th-century Dravidian gopuram with ancient temple tank and flower bazaar."},
            {"id": "maa-4", "name": "Santhome Cathedral Basilica", "category": "Hidden Spots", "expense": 0, "time": 35, "dist": 4.6, "transit": "🛺 14m • ₹45", "rating": 4.7, "review": "Historic neo-Gothic cathedral built over the tomb of Apostle Thomas."},
            {"id": "maa-5", "name": "Triplicane Biryani Corner", "category": "Food", "expense": 130, "time": 25, "dist": 2.0, "transit": "🛺 7m • ₹25", "rating": 4.7, "review": "Famous Chennai street-style fragrant seeraga samba rice biryani."}
        ]
    },
    "Coimbatore": {
        "displayName": "Coimbatore Jn (Manchester of South)",
        "state": "Tamil Nadu",
        "hub": {"name": "Coimbatore Jn", "stationName": "Coimbatore Jn Pl. 1", "lat": 11.0018, "lng": 76.9629},
        "spots": [
            {"id": "cbe-1", "name": "Sree Annapoorna Sambar Vadai", "category": "Food", "expense": 60, "time": 25, "dist": 0.8, "transit": "🚶 5m • Free", "rating": 4.9, "review": "Coimbatore's pride: medu vada soaked in piping hot signature sambar."},
            {"id": "cbe-2", "name": "Valankulam Lake Promenade Walk", "category": "Hidden Spots", "expense": 0, "time": 40, "dist": 1.5, "transit": "🚶 9m • Free", "rating": 4.6, "review": "Clean boardwalk with pedal boats and cool breezes from Western Ghats."},
            {"id": "cbe-3", "name": "Marudhamalai Hill Temple", "category": "Hidden Spots", "expense": 20, "time": 60, "dist": 13.0, "transit": "🛺 25m • ₹90", "rating": 4.8, "review": "Ancient granite temple nestled among herbal forests atop misty ridge."},
            {"id": "cbe-4", "name": "RS Puram Coffee Street", "category": "Food", "expense": 45, "time": 25, "dist": 3.2, "transit": "🛺 10m • ₹30", "rating": 4.7, "review": "Traditional brass tumbler Kumbakonam degree filter coffee."}
        ]
    },
    "Madurai": {
        "displayName": "Madurai Jn (Temple City)",
        "state": "Tamil Nadu",
        "hub": {"name": "Madurai Jn", "stationName": "Madurai Jn Pl. 1", "lat": 9.9252, "lng": 78.1102},
        "spots": [
            {"id": "ixm-1", "name": "Meenakshi Amman Temple Gopuram", "category": "Hidden Spots", "expense": 0, "time": 60, "dist": 1.2, "transit": "🚶 8m • Free", "rating": 5.0, "review": "14 monumental gopurams with thousand-pillar hall of architectural genius."},
            {"id": "ixm-2", "name": "Famous Jigarthanda Shop", "category": "Food", "expense": 50, "time": 15, "dist": 0.9, "transit": "🚶 6m • Free", "rating": 4.9, "review": "The royal refreshing drink: condensed milk, badam pisin, and nannari."},
            {"id": "ixm-3", "name": "Thirumalai Nayakkar Mahal", "category": "Hidden Spots", "expense": 20, "time": 45, "dist": 2.2, "transit": "🛺 7m • ₹25", "rating": 4.7, "review": "17th-century Italian-Rajput architecture with colossal stone pillars."},
            {"id": "ixm-4", "name": "Murugan Idli Shop West Masi St", "category": "Food", "expense": 90, "time": 25, "dist": 0.8, "transit": "🚶 5m • Free", "rating": 4.8, "review": "The birthplace of soft idlis with rich tomato and onion chutneys."}
        ]
    },

    # ── KARNATAKA HUBS ──────────────────────────────────────────
    "Bengaluru": {
        "displayName": "Bengaluru City (SBC / Silicon Valley)",
        "state": "Karnataka",
        "hub": {"name": "KSR Bengaluru (City)", "stationName": "Bengaluru City Pl. 1", "lat": 12.9774, "lng": 77.5671},
        "spots": [
            {"id": "blr-1", "name": "Cubbon Park Bamboo Grove Walk", "category": "Hidden Spots", "expense": 0, "time": 50, "dist": 2.8, "transit": "🚇 8m • ₹15 (Namma Metro)", "rating": 4.8, "review": "300 acres of green oxygen, red colonial library, and shady dog park."},
            {"id": "blr-2", "name": "Vidyarthi Bhavan Crispy Masala Dosa", "category": "Food", "expense": 85, "time": 35, "dist": 3.8, "transit": "🛺 12m • ₹40", "rating": 4.9, "review": "80-year-old Gandhi Bazaar institution serving thick golden ghee dosas."},
            {"id": "blr-3", "name": "Bangalore Fort & Tipu Sultan Summer Palace", "category": "Hidden Spots", "expense": 25, "time": 45, "dist": 2.2, "transit": "🛺 8m • ₹30", "rating": 4.6, "review": "Intricate teakwood carved arches and historic stone bastions."},
            {"id": "blr-4", "name": "Brahmin's Coffee Bar Shankarpuram", "category": "Food", "expense": 50, "time": 20, "dist": 3.5, "transit": "🛺 10m • ₹35", "rating": 4.9, "review": "Piping hot button idli with copious coconut chutney and filter coffee."}
        ]
    },
    "Mysuru": {
        "displayName": "Mysuru Jn (Heritage City)",
        "state": "Karnataka",
        "hub": {"name": "Mysuru Jn", "stationName": "Mysuru Jn Pl. 1", "lat": 12.3164, "lng": 76.6450},
        "spots": [
            {"id": "mys-1", "name": "Mysore Palace Royal Gateways", "category": "Hidden Spots", "expense": 100, "time": 60, "dist": 2.0, "transit": "🛺 7m • ₹25", "rating": 4.9, "review": "World-famous Indo-Saracenic royal seat of the Wadiyar dynasty."},
            {"id": "mys-2", "name": "Hotel Original Mylari Dosa", "category": "Food", "expense": 65, "time": 25, "dist": 2.5, "transit": "🛺 8m • ₹30", "rating": 4.8, "review": "Melt-in-mouth cloud-soft butter dosas with spiced onion sagu."},
            {"id": "mys-3", "name": "Devaraja Market Heritage Walk", "category": "Hidden Spots", "expense": 0, "time": 40, "dist": 1.2, "transit": "🚶 7m • Free", "rating": 4.7, "review": "Vibrant market filled with Mysore Pak, sandalwood, and piles of marigolds."},
            {"id": "mys-4", "name": "Guru Sweet Mart Authentic Mysore Pak", "category": "Food", "expense": 70, "time": 15, "dist": 1.5, "transit": "🚶 9m • Free", "rating": 4.9, "review": "The royal kitchen descendants who first invented Mysore Pak."}
        ]
    },
    "Mangaluru": {
        "displayName": "Mangaluru Central (Coastal Hub)",
        "state": "Karnataka",
        "hub": {"name": "Mangaluru Central", "stationName": "Mangaluru Central Pl. 1", "lat": 12.8634, "lng": 74.8431},
        "spots": [
            {"id": "ixe-1", "name": "Giri Manja's Fish Fry Corner", "category": "Food", "expense": 160, "time": 35, "dist": 1.8, "transit": "🛺 6m • ₹25", "rating": 4.9, "review": "Tawa-fried fresh anjal (kingfish) in home-style spicy masala."},
            {"id": "ixe-2", "name": "Panambur Beach Sea Breeze Point", "category": "Hidden Spots", "expense": 0, "time": 50, "dist": 9.0, "transit": "🛺 18m • ₹65", "rating": 4.7, "review": "Golden sands, kite flying, and clear Arabian sea sunsets."},
            {"id": "ixe-3", "name": "Ideal Ice Cream Gadbad Lounge", "category": "Food", "expense": 95, "time": 25, "dist": 1.2, "transit": "🚶 7m • Free", "rating": 4.9, "review": "Famous Mangalorean Gadbad ice cream with nuts and jelly."}
        ]
    },

    # ── GOA HUB ─────────────────────────────────────────────────
    "Goa": {
        "displayName": "Goa (Madgaon Jn Hub)",
        "state": "Goa",
        "hub": {"name": "Madgaon Jn", "stationName": "Madgaon Jn Pl. 1", "lat": 15.2736, "lng": 73.9782},
        "spots": [
            {"id": "goa-1", "name": "Colva Beach White Sands Walk", "category": "Hidden Spots", "expense": 0, "time": 50, "dist": 6.5, "transit": "🛺 15m • ₹50", "rating": 4.7, "review": "Endless stretches of powdery white sand and fishing trawlers."},
            {"id": "goa-2", "name": "Longuinhos Heritage Cafe & Bebinca", "category": "Food", "expense": 90, "time": 30, "dist": 1.8, "transit": "🛺 6m • ₹25", "rating": 4.8, "review": "Goan Portuguese heritage cafe serving warm bebinca and croquettes."},
            {"id": "goa-3", "name": "Church of the Holy Spirit Square", "category": "Hidden Spots", "expense": 0, "time": 35, "dist": 2.2, "transit": "🛺 8m • ₹30", "rating": 4.6, "review": "Colonial Portuguese square framed by mango trees and baroque facade."}
        ]
    },

    # ── MAHARASHTRA HUB ─────────────────────────────────────────
    "Mumbai": {
        "displayName": "Mumbai (CSMT / Heritage Gateway)",
        "state": "Maharashtra",
        "hub": {"name": "Chhatrapati Shivaji Maharaj Terminus", "stationName": "Mumbai CSMT Pl. 1", "lat": 18.9400, "lng": 72.8354},
        "spots": [
            {"id": "bom-1", "name": "Marine Drive Queen's Necklace Walk", "category": "Hidden Spots", "expense": 0, "time": 50, "dist": 2.1, "transit": "🛺 8m • ₹30", "rating": 4.9, "review": "Iconic seaside promenade with cooling Arabian sea breeze and art deco buildings."},
            {"id": "bom-2", "name": "Kyani & Co. Bun Maska & Irani Chai", "category": "Food", "expense": 65, "time": 25, "dist": 0.9, "transit": "🚶 6m • Free", "rating": 4.8, "review": "Mumbai's oldest surviving Irani cafe (1904) with chequered tablecloths."},
            {"id": "bom-3", "name": "Gateway of India & Taj Promenade", "category": "Hidden Spots", "expense": 0, "time": 45, "dist": 2.8, "transit": "🛺 10m • ₹35", "rating": 4.8, "review": "Monumental basalt arch overlooking harbor ferry boats and sea gulls."}
        ]
    },

    # ── DELHI HUB ───────────────────────────────────────────────
    "Delhi": {
        "displayName": "New Delhi (NDLS Hub)",
        "state": "Delhi",
        "hub": {"name": "New Delhi Railway Station", "stationName": "New Delhi Pl. 1", "lat": 28.6431, "lng": 77.2197},
        "spots": [
            {"id": "del-1", "name": "Chandni Chowk Paranthe Wali Gali", "category": "Food", "expense": 90, "time": 35, "dist": 1.8, "transit": "🚇 5m • ₹10 (Yellow Line)", "rating": 4.8, "review": "Historic alleyway serving deep-fried stuffed paranthas with spicy chutneys."},
            {"id": "del-2", "name": "Connaught Place Central Park Walk", "category": "Hidden Spots", "expense": 0, "time": 40, "dist": 1.2, "transit": "🚶 8m • Free", "rating": 4.7, "review": "Georgian colonial circular colonnade with massive tricolor Indian flag."},
            {"id": "del-3", "name": "Agrasen Ki Baoli Ancient Stepwell", "category": "Hidden Spots", "expense": 0, "time": 35, "dist": 2.2, "transit": "🛺 7m • ₹25", "rating": 4.7, "review": "108-step dramatic historical stepwell hidden in heart of central Delhi."}
        ]
    }
}

MODES = ["Layover (Train/Flight)", "Quick Free Time", "Full Day Trip"]
VIBE_COMBOS = [
    ["Street Food", "Hidden Nature"],
    ["Gaming & Chill", "Chai & View"],
    ["Heritage Walk", "Street Food"],
    ["Chai & View", "Local Market"],
    ["Scenic Waterfront", "Quiet Solitude"],
    ["Historic Monolith", "Traditional Cuisine"],
]

def format_cost(exp):
    return "Free" if exp == 0 else f"₹{exp}"

def generate_chatml_row(city_name, city_info, sample_idx):
    hub = city_info["hub"]
    spots = city_info["spots"]
    mode = random.choice(MODES)
    time_hrs = random.choice([2, 3, 4, 5])
    budget = random.choice([200, 300, 500, 800, 1200])
    vibes = random.choice(VIBE_COMBOS)
    
    num_spots = min(len(spots), random.randint(3, 5))
    selected = random.sample(spots, num_spots)
    
    prompt = f"""Mode: {mode}
Available Time: {time_hrs} Hours (30m buffer locked)
Max Budget: ₹{budget} PER PERSON
Location: {hub['name']} ({city_name})
Quick Vibes: {', '.join(vibes)}
User Request: "Find me authentic {vibes[0].lower()} and {vibes[1].lower()} near {hub['name']} within safe return time."

Filtered Local Candidates:
"""
    for i, s in enumerate(selected, 1):
        prompt += f"{i}. {s['name']} ({s['category']}) | {format_cost(s['expense'])} | {s['time']}m | {s['transit']} | Rating: {s['rating']} | \"{s['review']}\"\n"
    
    prompt += "\nOutput exactly 3 distinct travel plans as valid JSON matching the schema."
    
    s1 = selected[0]
    s2 = selected[1] if len(selected) > 1 else selected[0]
    s3 = selected[2] if len(selected) > 2 else selected[0]
    
    c1 = s1["expense"] + 40
    c2 = s1["expense"] + s2["expense"] + 70
    c3 = s3["expense"] + 20
    
    assistant_json = {
        "plans": [
            {
                "id": "plan-1",
                "title": f"Plan 1: {vibes[0]} & {s1['name']} Trail",
                "badge": f"{time_hrs}h Fast Discovery",
                "totalTime": f"{time_hrs-1}h 15m",
                "totalCost": f"₹{min(budget, c1)}",
                "transitSummary": s1["transit"],
                "returnLeg": f"↩ Back to {hub['stationName']} • ₹30",
                "reasoning": f"Curated for '{vibes[0]}' in {city_name}. Guarantees return to {hub['stationName']}.",
                "stops": [
                    {
                        "step": 1,
                        "name": s1["name"],
                        "category": s1["category"],
                        "arrive": "14:15",
                        "leave": "14:55",
                        "transit": s1["transit"],
                        "expense": s1["expense"],
                        "tip": s1["review"]
                    }
                ]
            },
            {
                "id": "plan-2",
                "title": f"Plan 2: Complete {city_name} Dual-Stop Experience",
                "badge": f"{time_hrs}h Full Circuit",
                "totalTime": f"{time_hrs}h 00m",
                "totalCost": f"₹{min(budget, c2)}",
                "transitSummary": "Auto & Walk Blend",
                "returnLeg": f"↩ Back to {hub['stationName']} • ₹45",
                "reasoning": f"Balances {s1['name']} with {s2['name']}, staying strictly inside ₹{budget}.",
                "stops": [
                    {
                        "step": 1,
                        "name": s1["name"],
                        "category": s1["category"],
                        "arrive": "14:10",
                        "leave": "14:40",
                        "transit": s1["transit"],
                        "expense": s1["expense"],
                        "tip": s1["review"]
                    },
                    {
                        "step": 2,
                        "name": s2["name"],
                        "category": s2["category"],
                        "arrive": "15:00",
                        "leave": "15:35",
                        "transit": s2["transit"],
                        "expense": s2["expense"],
                        "tip": s2["review"]
                    }
                ]
            },
            {
                "id": "plan-3",
                "title": f"Plan 3: Ultra-Budget {vibes[1]} Saver",
                "badge": "Budget Saver",
                "totalTime": "1h 30m",
                "totalCost": f"₹{min(budget, c3)}",
                "transitSummary": "Minimal Transit",
                "returnLeg": f"↩ Swift return to {hub['stationName']} • Free",
                "reasoning": f"Lowest spend, minimal walking, safe return to {hub['name']}.",
                "stops": [
                    {
                        "step": 1,
                        "name": s3["name"],
                        "category": s3["category"],
                        "arrive": "14:15",
                        "leave": "14:50",
                        "transit": s3["transit"],
                        "expense": s3["expense"],
                        "tip": s3["review"]
                    }
                ]
            }
        ]
    }
    
    return {
        "messages": [
            {
                "role": "system",
                "content": "You are Spot Undo AI, an edge travel planner. You output strictly valid JSON with exactly 3 feasible itineraries based on user constraints."
            },
            {"role": "user", "content": prompt},
            {"role": "assistant", "content": json.dumps(assistant_json, ensure_ascii=False)}
        ]
    }

# Generate 1500 training pairs
rows = []
for city_name, city_info in CITIES_DATA.items():
    # 75 diverse samples per city = 1500 samples
    for i in range(75):
        rows.append(generate_chatml_row(city_name, city_info, i))

random.shuffle(rows)

out_jsonl = "training/spot_undo_train.jsonl"
with open(out_jsonl, "w", encoding="utf-8") as f:
    for r in rows:
        f.write(json.dumps(r, ensure_ascii=False) + "\n")

print(f"✅ Generated {len(rows)} training samples across {len(CITIES_DATA)} cities in {out_jsonl}")
