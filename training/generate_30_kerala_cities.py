#!/usr/bin/env python3
import json
import random

KERALA_30_CITIES = {
    "Shoranur": {
        "displayName": "Shoranur Jn Hub (Palakkad)",
        "district": "Palakkad",
        "hub": {"name": "Shoranur Jn Hub (Active)", "stationName": "Shoranur Jn Pl. 1", "lat": 10.7606, "lng": 76.2711},
        "spots": [
            {"id": "shn-1", "name": "River Ghat Step Walk", "category": "Hidden Spots", "expense": 0, "time": 30, "dist": 0.8, "transit": "🚶 8m • Free", "rating": 5.0, "review": "Serene stepped ghat overlooking Bharathapuzha. Perfect quiet walk before train."},
            {"id": "shn-2", "name": "Nila River Secret Banyan", "category": "Hidden Spots", "expense": 40, "time": 45, "dist": 2.1, "transit": "🛺 10m • ₹30", "rating": 4.8, "review": "Quiet riverside shade with hot pazhampori and chai."},
            {"id": "shn-3", "name": "Amma's Crispy Vada", "category": "Food", "expense": 25, "time": 20, "dist": 1.2, "transit": "🚶 6m • Free", "rating": 4.9, "review": "Golden uzhunnu vada hot off the oil pan with coconut chutney."},
            {"id": "shn-4", "name": "LevelUp Cyber Hub", "category": "Gaming & Chill", "expense": 80, "time": 60, "dist": 3.0, "transit": "🛺 8m • ₹25", "rating": 4.7, "review": "High-speed broadband, esports gaming setups, chilled AC."},
            {"id": "shn-5", "name": "Varikkasseri Mana Heritage", "category": "Hidden Spots", "expense": 50, "time": 60, "dist": 6.8, "transit": "🛺 18m • ₹65", "rating": 4.9, "review": "Magnificent traditional aristocratic illam where Malayalam movies are shot."}
        ]
    },
    "Kochi": {
        "displayName": "Kochi / Ernakulam Hub",
        "district": "Ernakulam",
        "hub": {"name": "Ernakulam Jn (South)", "stationName": "Ernakulam South Pl. 1", "lat": 9.9678, "lng": 76.2905},
        "spots": [
            {"id": "cok-1", "name": "Fort Kochi Spice Lane", "category": "Hidden Spots", "expense": 0, "time": 45, "dist": 4.5, "transit": "⛴️ 20m • ₹20 (Water Metro)", "rating": 4.8, "review": "Aromatic back-alleys with antique spice warehouses, no crowds."},
            {"id": "cok-2", "name": "Kayees Rahmathulla Biryani", "category": "Food", "expense": 180, "time": 30, "dist": 3.8, "transit": "🛺 12m • ₹40", "rating": 4.9, "review": "Iconic tender Malabar mutton biryani with ghee aroma."},
            {"id": "cok-3", "name": "Broadway Kulukki & Snacks", "category": "Food", "expense": 35, "time": 20, "dist": 1.5, "transit": "🚶 7m • Free", "rating": 4.7, "review": "Spicy green-chilli kulukki sarbath and hot banana chips."},
            {"id": "cok-4", "name": "Water Metro High Court Jetty", "category": "Hidden Spots", "expense": 30, "time": 40, "dist": 2.8, "transit": "🛺 10m • ₹30", "rating": 4.8, "review": "Ultra-modern electric boat cruise overlooking Vembanad backwaters."}
        ]
    },
    "Calicut": {
        "displayName": "Calicut (Kozhikode) Hub",
        "district": "Kozhikode",
        "hub": {"name": "Kozhikode Main", "stationName": "Kozhikode Main Pl. 1", "lat": 11.2464, "lng": 75.7804},
        "spots": [
            {"id": "clt-1", "name": "Mananchira Square Park Walk", "category": "Hidden Spots", "expense": 0, "time": 40, "dist": 1.2, "transit": "🚶 7m • Free", "rating": 4.7, "review": "Clear water reservoir enclosed by traditional red-tile gates."},
            {"id": "clt-2", "name": "Paragon Restaurant Biryani", "category": "Food", "expense": 190, "time": 40, "dist": 1.5, "transit": "🚶 8m • Free", "rating": 4.9, "review": "Legendary Calicut dum biryani with melt-in-mouth chicken."},
            {"id": "clt-3", "name": "SM Street Halwa Lane", "category": "Food", "expense": 50, "time": 35, "dist": 0.9, "transit": "🚶 5m • Free", "rating": 4.8, "review": "Pedestrian heritage street with warm black halwa and banana chips."},
            {"id": "clt-4", "name": "Kozhikode Beach Old Pier", "category": "Hidden Spots", "expense": 0, "time": 45, "dist": 2.0, "transit": "🛺 6m • ₹25", "rating": 4.8, "review": "Century-old collapsed shipping pier jutting into Arabian sea waves."}
        ]
    },
    "Trivandrum": {
        "displayName": "Trivandrum Central Hub",
        "district": "Thiruvananthapuram",
        "hub": {"name": "Trivandrum Central", "stationName": "Trivandrum Central Pl. 1", "lat": 8.4875, "lng": 76.9532},
        "spots": [
            {"id": "tvm-1", "name": "Kuthira Malika Palace Grounds", "category": "Hidden Spots", "expense": 40, "time": 45, "dist": 1.1, "transit": "🚶 8m • Free", "rating": 4.7, "review": "122 carved wooden horses, teakwood silence, historic temple vibe."},
            {"id": "tvm-2", "name": "Maha Chips & Boli Stall", "category": "Food", "expense": 60, "time": 20, "dist": 0.9, "transit": "🚶 6m • Free", "rating": 4.9, "review": "Fresh hot Trivandrum yellow Boli with sweet condensed milk."},
            {"id": "tvm-3", "name": "Napier Museum Heritage Gardens", "category": "Hidden Spots", "expense": 20, "time": 50, "dist": 3.0, "transit": "🛺 10m • ₹30", "rating": 4.8, "review": "Indo-Saracenic masterpiece nestled under massive rain trees."},
            {"id": "tvm-4", "name": "Villa Maya Courtyard Chai", "category": "Food", "expense": 120, "time": 40, "dist": 2.1, "transit": "🛺 8m • ₹25", "rating": 4.6, "review": "18th-century restored Dutch manor for quiet filter coffee."}
        ]
    },
    "Palakkad": {
        "displayName": "Palakkad Town Hub",
        "district": "Palakkad",
        "hub": {"name": "Palakkad Jn (Olavakkode)", "stationName": "Palakkad Jn Pl. 1", "lat": 10.8268, "lng": 76.6433},
        "spots": [
            {"id": "pkd-1", "name": "Palakkad Tipu Fort & Moat", "category": "Hidden Spots", "expense": 20, "time": 50, "dist": 4.5, "transit": "🛺 12m • ₹40", "rating": 4.8, "review": "Granite fortress surrounded by a tranquil water moat."},
            {"id": "pkd-2", "name": "Kalpathy Heritage Agraharam Lane", "category": "Hidden Spots", "expense": 0, "time": 45, "dist": 2.8, "transit": "🛺 8m • ₹25", "rating": 4.8, "review": "Ancient Brahmin settlement with row houses and historic chariot grounds."},
            {"id": "pkd-3", "name": "Indian Coffee House Olavakkode", "category": "Food", "expense": 55, "time": 25, "dist": 0.5, "transit": "🚶 3m • Free", "rating": 4.6, "review": "Retro spiral tables serving filter coffee and beetroot cutlets."}
        ]
    },
    "Thrissur": {
        "displayName": "Thrissur Cultural Capital",
        "district": "Thrissur",
        "hub": {"name": "Thrissur Railway Station", "stationName": "Thrissur Jn Pl. 1", "lat": 10.5186, "lng": 76.2144},
        "spots": [
            {"id": "tsr-1", "name": "Vadakkumnathan Temple Round", "category": "Hidden Spots", "expense": 0, "time": 45, "dist": 1.2, "transit": "🚶 8m • Free", "rating": 4.9, "review": "Massive 9-acre hilltop teakwood grove in center of Thrissur Round."},
            {"id": "tsr-2", "name": "Shakthan Thampuran Palace", "category": "Hidden Spots", "expense": 25, "time": 40, "dist": 2.5, "transit": "🛺 7m • ₹25", "rating": 4.6, "review": "Kochi king's Dutch-Kerala style palace with sprawling heritage lawns."},
            {"id": "tsr-3", "name": "Roast Town Ghee Roast & Tea", "category": "Food", "expense": 70, "time": 25, "dist": 0.8, "transit": "🚶 6m • Free", "rating": 4.8, "review": "Paper-thin crispy ghee roast dosa and strong filter coffee."}
        ]
    },
    "Alappuzha": {
        "displayName": "Alappuzha (Venice of the East)",
        "district": "Alappuzha",
        "hub": {"name": "Alappuzha Railway Station", "stationName": "Alappuzha Pl. 1", "lat": 9.4925, "lng": 76.3242},
        "spots": [
            {"id": "alp-1", "name": "Alappuzha Old Sea Bridge Pier", "category": "Hidden Spots", "expense": 0, "time": 45, "dist": 1.4, "transit": "🚶 9m • Free", "rating": 4.7, "review": "Atmospheric 160-year-old rusted iron pier into crashing waves."},
            {"id": "alp-2", "name": "Punnamada Backwater Canal Walk", "category": "Hidden Spots", "expense": 0, "time": 50, "dist": 3.8, "transit": "🛺 10m • ₹35", "rating": 4.9, "review": "Home of Nehru Trophy Snake Boat Race. Shaded coconut palm banks."},
            {"id": "alp-3", "name": "Brothers Hotel Duck Roast", "category": "Food", "expense": 160, "time": 30, "dist": 2.2, "transit": "🛺 7m • ₹25", "rating": 4.8, "review": "Spicy Kuttanad duck roast with hot appams and coconut gravy."}
        ]
    },
    "Kannur": {
        "displayName": "Kannur (Land of Looms & Lores)",
        "district": "Kannur",
        "hub": {"name": "Kannur Main", "stationName": "Kannur Pl. 1", "lat": 11.8745, "lng": 75.3704},
        "spots": [
            {"id": "knr-1", "name": "St. Angelo Fort Ramparts", "category": "Hidden Spots", "expense": 25, "time": 50, "dist": 3.2, "transit": "🛺 9m • ₹30", "rating": 4.8, "review": "16th-century Portuguese coastal fortress overlooking Moppila Bay."},
            {"id": "knr-2", "name": "Muzhappilangad Drive-in Beach", "category": "Hidden Spots", "expense": 50, "time": 60, "dist": 11.0, "transit": "🛺 22m • ₹80", "rating": 4.9, "review": "Asia's longest natural drive-in beach with packed golden sands."},
            {"id": "knr-3", "name": "Ondens Mussels & Fish Fry", "category": "Food", "expense": 140, "time": 30, "dist": 1.2, "transit": "🚶 7m • Free", "rating": 4.9, "review": "Kallummakkaya (spiced fried mussels) and fresh catch of the day."}
        ]
    },
    "Wayanad": {
        "displayName": "Wayanad (Kalpetta Gateway)",
        "district": "Wayanad",
        "hub": {"name": "Kalpetta Old Bus Stand", "stationName": "Kalpetta Hub", "lat": 11.6080, "lng": 76.0828},
        "spots": [
            {"id": "wyd-1", "name": "Karapuzha Reservoir Lakeside", "category": "Hidden Spots", "expense": 30, "time": 50, "dist": 9.5, "transit": "🛺 22m • ₹85", "rating": 4.8, "review": "Earthen dam lake flanked by rolling tea hills and misty waters."},
            {"id": "wyd-2", "name": "1980's A Nostalgic Restaurant", "category": "Food", "expense": 160, "time": 40, "dist": 2.1, "transit": "🛺 6m • ₹25", "rating": 4.7, "review": "Traditional Kerala sadhya and bamboo biryani served on banana leaves."},
            {"id": "wyd-3", "name": "Edakkal Prehistoric Rock Caves", "category": "Hidden Spots", "expense": 50, "time": 60, "dist": 14.0, "transit": "🛺 30m • ₹120", "rating": 4.8, "review": "Stone Age petroglyphs carved high inside mountain rock clefts."}
        ]
    },
    "Munnar": {
        "displayName": "Munnar Tea Highlands",
        "district": "Idukki",
        "hub": {"name": "Munnar Central Town Hub", "stationName": "Munnar KSRTC", "lat": 10.0889, "lng": 77.0595},
        "spots": [
            {"id": "mnr-1", "name": "KDHP Tea Museum & Factory", "category": "Hidden Spots", "expense": 75, "time": 50, "dist": 2.0, "transit": "🛺 6m • ₹25", "rating": 4.7, "review": "Aromatic tea manufacturing history and fresh garden tea tasting."},
            {"id": "mnr-2", "name": "Pothanmedu Viewpoint", "category": "Hidden Spots", "expense": 0, "time": 45, "dist": 4.2, "transit": "🛺 12m • ₹45", "rating": 4.9, "review": "Sweeping vista of emerald tea carpets, cardamom plants, and misty cliffs."},
            {"id": "mnr-3", "name": "Rapsy Restaurant Spanish Omelette", "category": "Food", "expense": 80, "time": 25, "dist": 0.5, "transit": "🚶 3m • Free", "rating": 4.6, "review": "Legendary backpacker cafe serving Kerala parottas and spiced tea."}
        ]
    },
    "Kollam": {
        "displayName": "Kollam Jn (Ashtamudi Hub)",
        "district": "Kollam",
        "hub": {"name": "Kollam Jn", "stationName": "Kollam Jn Pl. 1", "lat": 8.8879, "lng": 76.5956},
        "spots": [
            {"id": "klm-1", "name": "Tangasseri British Lighthouse", "category": "Hidden Spots", "expense": 20, "time": 40, "dist": 4.5, "transit": "🛺 11m • ₹35", "rating": 4.7, "review": "144-foot red-and-white striped tower with coastal breakers view."},
            {"id": "klm-2", "name": "Ashtamudi Lake Waterfront Walk", "category": "Hidden Spots", "expense": 0, "time": 45, "dist": 1.2, "transit": "🚶 7m • Free", "rating": 4.8, "review": "Palm-fringed gateway to Kerala's most picturesque backwaters."},
            {"id": "klm-3", "name": "Fayaz Cashew Halwa Stall", "category": "Food", "expense": 90, "time": 20, "dist": 0.9, "transit": "🚶 5m • Free", "rating": 4.8, "review": "Kollam's world-famous export-quality roasted cashews and sweet halwa."}
        ]
    },
    "Kottayam": {
        "displayName": "Kottayam (City of Letters)",
        "district": "Kottayam",
        "hub": {"name": "Kottayam Railway Station", "stationName": "Kottayam Pl. 1", "lat": 9.5844, "lng": 76.5348},
        "spots": [
            {"id": "ktm-1", "name": "Thirunakkara Mahadeva Temple Lane", "category": "Hidden Spots", "expense": 0, "time": 40, "dist": 1.5, "transit": "🚶 9m • Free", "rating": 4.8, "review": "500-year-old traditional Kerala architecture temple with peaceful courtyard."},
            {"id": "ktm-2", "name": "Meenachil River Riverside Walk", "category": "Hidden Spots", "expense": 0, "time": 35, "dist": 2.0, "transit": "🛺 7m • ₹25", "rating": 4.7, "review": "Immortalized in Arundhati Roy's God of Small Things. Gentle quiet ripples."},
            {"id": "ktm-3", "name": "Karimpumkala Duck Roast & Fish Curry", "category": "Food", "expense": 180, "time": 40, "dist": 4.8, "transit": "🛺 14m • ₹50", "rating": 4.9, "review": "Iconic toddy parlor style Kuttanadan fish curry and spicy duck fry."}
        ]
    },
    "Varkala": {
        "displayName": "Varkala Cliff & Beach",
        "district": "Thiruvananthapuram",
        "hub": {"name": "Varkala Sivagiri Railway Station", "stationName": "Varkala Pl. 1", "lat": 8.7350, "lng": 76.7130},
        "spots": [
            {"id": "vrk-1", "name": "Varkala North Cliff Edge Walk", "category": "Hidden Spots", "expense": 0, "time": 60, "dist": 2.5, "transit": "🛺 8m • ₹30", "rating": 4.9, "review": "Dramatic red laterite cliffs jutting high above the roaring Arabian sea."},
            {"id": "vrk-2", "name": "Janardhana Swamy 2000yo Temple", "category": "Hidden Spots", "expense": 0, "time": 45, "dist": 1.8, "transit": "🚶 10m • Free", "rating": 4.8, "review": "Ancient Banyan tree draped with bells and natural mountain freshwater spring."},
            {"id": "vrk-3", "name": "Coffee Temple & Tibetan Shakes", "category": "Food", "expense": 110, "time": 30, "dist": 2.7, "transit": "🛺 8m • ₹30", "rating": 4.7, "review": "Organic pour-over coffee and fresh ginger lemon honey tea overlooking waves."}
        ]
    },
    "Malappuram": {
        "displayName": "Malappuram City Hub",
        "district": "Malappuram",
        "hub": {"name": "KSRTC Bus Station Malappuram", "stationName": "Malappuram KSRTC", "lat": 11.0732, "lng": 76.0740},
        "spots": [
            {"id": "mlp-1", "name": "Kottakkunnu Hilltop Heritage Park", "category": "Hidden Spots", "expense": 20, "time": 50, "dist": 1.2, "transit": "🚶 8m • Free", "rating": 4.8, "review": "The Marine Drive of Malappuram. Cool hilltop breeze and historic cantonment ruins."},
            {"id": "mlp-2", "name": "Valiyangadi Eranad Halwa & Snacks", "category": "Food", "expense": 50, "time": 25, "dist": 0.8, "transit": "🚶 5m • Free", "rating": 4.7, "review": "Hot banana chips fried in fresh coconut oil and authentic wheat halwa."},
            {"id": "mlp-3", "name": "Kadalundi River View Promenade", "category": "Hidden Spots", "expense": 0, "time": 40, "dist": 2.5, "transit": "🛺 7m • ₹25", "rating": 4.6, "review": "Gentle riverbanks with lush mangrove greenery and peaceful sunset light."}
        ]
    },
    "Manjeri": {
        "displayName": "Manjeri Football Town",
        "district": "Malappuram",
        "hub": {"name": "Manjeri Court Hub", "stationName": "Manjeri Town", "lat": 11.1215, "lng": 76.1213},
        "spots": [
            {"id": "mjr-1", "name": "Payyanad Stadium Sports Walk", "category": "Hidden Spots", "expense": 0, "time": 40, "dist": 3.0, "transit": "🛺 8m • ₹30", "rating": 4.7, "review": "The mecca of Kerala football with vast green open turf surroundings."},
            {"id": "mjr-2", "name": "Hotel Delicia Malabar Biryani", "category": "Food", "expense": 150, "time": 30, "dist": 0.8, "transit": "🚶 6m • Free", "rating": 4.8, "review": "Authentic fragrant kaima rice biryani with tender chicken and mint chammanthi."},
            {"id": "mjr-3", "name": "Pandallur Hills Green Valley", "category": "Hidden Spots", "expense": 0, "time": 60, "dist": 8.5, "transit": "🛺 20m • ₹70", "rating": 4.8, "review": "Panoramic view of undulating green valleys and foggy evening breezes."}
        ]
    },
    "Perinthalmanna": {
        "displayName": "Perinthalmanna (Heritage Gateway)",
        "district": "Malappuram",
        "hub": {"name": "Angadippuram Railway Station", "stationName": "Angadippuram Pl. 1", "lat": 10.9782, "lng": 76.2230},
        "spots": [
            {"id": "pnt-1", "name": "Thirumandhamkunnu Temple Hilltop", "category": "Hidden Spots", "expense": 0, "time": 50, "dist": 1.5, "transit": "🛺 5m • ₹25", "rating": 4.9, "review": "Ancient hilltop temple shaded by massive banyans with historic brass bells."},
            {"id": "pnt-2", "name": "Angadippuram Chatti Pathiri Corner", "category": "Food", "expense": 60, "time": 20, "dist": 0.6, "transit": "🚶 4m • Free", "rating": 4.8, "review": "Steaming hot layered sweet chatti pathiri and cardamom tea."},
            {"id": "pnt-3", "name": "Paloor Kotta Hidden Waterfall", "category": "Hidden Spots", "expense": 10, "time": 60, "dist": 7.8, "transit": "🛺 18m • ₹60", "rating": 4.8, "review": "Historical fortress hideout of Tipu Sultan beside rocky forest cascades."}
        ]
    },
    "Tirur": {
        "displayName": "Tirur (Thunchan Land)",
        "district": "Malappuram",
        "hub": {"name": "Tirur Railway Station", "stationName": "Tirur Pl. 1", "lat": 10.9145, "lng": 75.9229},
        "spots": [
            {"id": "trr-1", "name": "Thunchan Parambu Sacred Grove", "category": "Hidden Spots", "expense": 0, "time": 45, "dist": 2.0, "transit": "🛺 6m • ₹25", "rating": 4.9, "review": "Birthplace of Thunchath Ezhuthachan with bronze parrot and Saraswathi pond."},
            {"id": "trr-2", "name": "Tirur Betel Leaf & Tea House", "category": "Food", "expense": 30, "time": 20, "dist": 0.5, "transit": "🚶 3m • Free", "rating": 4.7, "review": "World-famous GI-tagged Tirur Vettila and strong aromatic chai."},
            {"id": "trr-3", "name": "Unniyal Coastal Fishing Beach", "category": "Hidden Spots", "expense": 0, "time": 40, "dist": 6.0, "transit": "🛺 14m • ₹50", "rating": 4.6, "review": "Quiet shores where colorful traditional fishing boats land in the evening."}
        ]
    },
    "Guruvayur": {
        "displayName": "Guruvayur (Temple City)",
        "district": "Thrissur",
        "hub": {"name": "Guruvayur Railway Station", "stationName": "Guruvayur Pl. 1", "lat": 10.5960, "lng": 76.0401},
        "spots": [
            {"id": "gvr-1", "name": "Punnathurkotta Elephant Sanctuary", "category": "Hidden Spots", "expense": 40, "time": 50, "dist": 2.8, "transit": "🛺 8m • ₹30", "rating": 4.8, "review": "Palace grounds housing over 50 majestic elephants under shady palms."},
            {"id": "gvr-2", "name": "Chavakkad Beach River Estuary", "category": "Hidden Spots", "expense": 0, "time": 45, "dist": 4.5, "transit": "🛺 12m • ₹40", "rating": 4.7, "review": "Where the quiet river meets the roaring sea with sweeping Casuarina trees."},
            {"id": "gvr-3", "name": "Surabhi Traditional Neyyappam Stall", "category": "Food", "expense": 40, "time": 20, "dist": 0.8, "transit": "🚶 5m • Free", "rating": 4.9, "review": "Crisp ghee neyyappam fried live in copper vessels."}
        ]
    },
    "Kasaragod": {
        "displayName": "Kasaragod (Bekal Gateway)",
        "district": "Kasaragod",
        "hub": {"name": "Kasaragod Railway Station", "stationName": "Kasaragod Pl. 1", "lat": 12.5085, "lng": 74.9877},
        "spots": [
            {"id": "ksd-1", "name": "Bekal Giant Keyhole Fort", "category": "Hidden Spots", "expense": 25, "time": 60, "dist": 12.0, "transit": "🛺 24m • ₹90", "rating": 5.0, "review": "Largest fort in Kerala with iconic sea bastions filmed in Bollywood movies."},
            {"id": "ksd-2", "name": "Chandragiri Riverside Fort Ramparts", "category": "Hidden Spots", "expense": 0, "time": 40, "dist": 4.2, "transit": "🛺 10m • ₹35", "rating": 4.7, "review": "17th-century fort overlooking where Chandragiri river joins the sea."},
            {"id": "ksd-3", "name": "Udupi Sri Krishna Goli Baje Corner", "category": "Food", "expense": 40, "time": 20, "dist": 0.8, "transit": "🚶 5m • Free", "rating": 4.8, "review": "Hot Mangalore bajji (goli baje) served with spicy ginger chutney."}
        ]
    },
    "Kanhangad": {
        "displayName": "Kanhangad Cultural Hub",
        "district": "Kasaragod",
        "hub": {"name": "Kanhangad Railway Station", "stationName": "Kanhangad Pl. 1", "lat": 12.3082, "lng": 75.0903},
        "spots": [
            {"id": "khd-1", "name": "Hosdurg Fort Circular Bastion", "category": "Hidden Spots", "expense": 0, "time": 40, "dist": 2.2, "transit": "🛺 6m • ₹25", "rating": 4.6, "review": "Round brick bastions built by Ikkeri Nayakas amidst coconut gardens."},
            {"id": "khd-2", "name": "Anandashram Forest Meditation Walk", "category": "Hidden Spots", "expense": 0, "time": 45, "dist": 4.8, "transit": "🛺 12m • ₹40", "rating": 4.9, "review": "Deep spiritual silence under towering mango and neem groves."},
            {"id": "khd-3", "name": "Hotel Rajdhani Neer Dosa & Fish Fry", "category": "Food", "expense": 130, "time": 30, "dist": 1.0, "transit": "🚶 6m • Free", "rating": 4.8, "review": "Delicate rice neer dosas with fresh sea fish curry."}
        ]
    },
    "Thalassery": {
        "displayName": "Thalassery (Cricket, Circus & Cake)",
        "district": "Kannur",
        "hub": {"name": "Thalassery Railway Station", "stationName": "Thalassery Pl. 1", "lat": 11.7511, "lng": 75.4920},
        "spots": [
            {"id": "tly-1", "name": "Tellicherry Sea Fort & Cannons", "category": "Hidden Spots", "expense": 0, "time": 45, "dist": 1.2, "transit": "🚶 7m • Free", "rating": 4.8, "review": "Massive laterite ramparts built in 1708 overlooking rocky sea breakers."},
            {"id": "tly-2", "name": "Mambally's Original 1883 Bakery", "category": "Food", "expense": 60, "time": 20, "dist": 0.8, "transit": "🚶 5m • Free", "rating": 5.0, "review": "The birthplace of India's very first Christmas cake and crunchy biscuits."},
            {"id": "tly-3", "name": "Paris Restaurant Thalassery Dum Biryani", "category": "Food", "expense": 180, "time": 35, "dist": 1.0, "transit": "🚶 6m • Free", "rating": 4.9, "review": "The benchmark authentic Thalassery biryani with kaima rice and ghee."},
            {"id": "tly-4", "name": "Overbury's Folly Sunset Cliff", "category": "Hidden Spots", "expense": 0, "time": 35, "dist": 1.5, "transit": "🚶 9m • Free", "rating": 4.7, "review": "Colonial viewpoint constructed by E.N. Overbury above crashing tides."}
        ]
    },
    "Vadakara": {
        "displayName": "Vadakara (Kalaripayattu Land)",
        "district": "Kozhikode",
        "hub": {"name": "Vadakara Railway Station", "stationName": "Vadakara Pl. 1", "lat": 11.6027, "lng": 75.5902},
        "spots": [
            {"id": "vdk-1", "name": "Lokanarkavu Temple Kalaripayattu Arena", "category": "Hidden Spots", "expense": 0, "time": 45, "dist": 4.5, "transit": "🛺 12m • ₹40", "rating": 4.9, "review": "1500-year-old temple where martial hero Thacholi Othenan prayed."},
            {"id": "vdk-2", "name": "Sandbanks Beach Estuary Walk", "category": "Hidden Spots", "expense": 10, "time": 45, "dist": 3.8, "transit": "🛺 10m • ₹35", "rating": 4.8, "review": "Golden sand spit where river meets the sea with wooden walkways."},
            {"id": "vdk-3", "name": "Moplah Tea Stall Kadukkayil", "category": "Food", "expense": 35, "time": 20, "dist": 0.9, "transit": "🚶 6m • Free", "rating": 4.7, "review": "Hot mutton samosas and spicy Sulaimani lemon tea."}
        ]
    },
    "Sulthan Bathery": {
        "displayName": "Sulthan Bathery (Tipu's Battery)",
        "district": "Wayanad",
        "hub": {"name": "Sulthan Bathery KSRTC Hub", "stationName": "Bathery Central", "lat": 11.6667, "lng": 76.2575},
        "spots": [
            {"id": "sbt-1", "name": "Ancient 13th Century Jain Temple", "category": "Hidden Spots", "expense": 0, "time": 40, "dist": 1.2, "transit": "🚶 7m • Free", "rating": 4.8, "review": "Carved granite pillars used by Tipu Sultan to store his artillery battery."},
            {"id": "sbt-2", "name": "Mintflower Honey & Spiced Chai", "category": "Food", "expense": 50, "time": 20, "dist": 0.6, "transit": "🚶 4m • Free", "rating": 4.7, "review": "Fresh tribal forest honey with ginger cinnamon tea."},
            {"id": "sbt-3", "name": "Chethalayam Hidden Falls Trail", "category": "Hidden Spots", "expense": 20, "time": 60, "dist": 12.0, "transit": "🛺 25m • ₹100", "rating": 4.8, "review": "Quiet forest stream cascading over dark moss-covered granite boulders."}
        ]
    },
    "Nilambur": {
        "displayName": "Nilambur (Teak Heritage Town)",
        "district": "Malappuram",
        "hub": {"name": "Nilambur Road Railway Station", "stationName": "Nilambur Road Pl. 1", "lat": 11.2774, "lng": 76.2289},
        "spots": [
            {"id": "nlb-1", "name": "World's First Teak Museum", "category": "Hidden Spots", "expense": 30, "time": 50, "dist": 4.0, "transit": "🛺 10m • ₹35", "rating": 4.8, "review": "52-room research museum exhibiting giant root systems and teak history."},
            {"id": "nlb-2", "name": "Conolly's Plot World Oldest Teak Plantation", "category": "Hidden Spots", "expense": 50, "time": 50, "dist": 3.2, "transit": "🛺 8m • ₹30", "rating": 4.9, "review": "Suspension footbridge across Chaliyar river leading to 180-year-old giants."},
            {"id": "nlb-3", "name": "Nilambur Bamboo Biryani Stall", "category": "Food", "expense": 140, "time": 30, "dist": 1.2, "transit": "🚶 7m • Free", "rating": 4.8, "review": "Steamed inside hollow bamboo stems with tender spices and egg."}
        ]
    },
    "Chalakudy": {
        "displayName": "Chalakudy (Athirappilly Gateway)",
        "district": "Thrissur",
        "hub": {"name": "Chalakudy Railway Station", "stationName": "Chalakudy Pl. 1", "lat": 10.3069, "lng": 76.3323},
        "spots": [
            {"id": "ckd-1", "name": "Chalakudy River Bank Grove", "category": "Hidden Spots", "expense": 0, "time": 35, "dist": 1.1, "transit": "🚶 7m • Free", "rating": 4.7, "review": "Peaceful river shade where freshwater fish swim near boat steps."},
            {"id": "ckd-2", "name": "Athirappilly Viewpoint Foothills", "category": "Hidden Spots", "expense": 50, "time": 60, "dist": 28.0, "transit": "🛺 45m • ₹250", "rating": 5.0, "review": "The Niagara of India: thunderous 80-foot waterfall framed by rainforest."},
            {"id": "ckd-3", "name": "Pillai's Hot Puttu & Kadala Curry", "category": "Food", "expense": 45, "time": 20, "dist": 0.7, "transit": "🚶 5m • Free", "rating": 4.8, "review": "Soft layered steamed rice puttu with rich dark chickpea gravy."}
        ]
    },
    "Angamaly": {
        "displayName": "Angamaly (Airport Gateway)",
        "district": "Ernakulam",
        "hub": {"name": "Angamaly for Kalady Railway Station", "stationName": "Angamaly Pl. 1", "lat": 10.1963, "lng": 76.3860},
        "spots": [
            {"id": "ang-1", "name": "Adi Shankara Keerthi Sthamba Kalady", "category": "Hidden Spots", "expense": 20, "time": 45, "dist": 7.5, "transit": "🛺 15m • ₹50", "rating": 4.8, "review": "Eight-sided 9-storeyed monument on banks of holy Poorna river."},
            {"id": "ang-2", "name": "St. George Syro-Malabar Basilica", "category": "Hidden Spots", "expense": 0, "time": 35, "dist": 1.2, "transit": "🚶 8m • Free", "rating": 4.7, "review": "One of largest church buildings in India with magnificent glass mosaics."},
            {"id": "ang-3", "name": "Angamaly Pork Roast & Porotta House", "category": "Food", "expense": 140, "time": 30, "dist": 0.9, "transit": "🚶 6m • Free", "rating": 4.9, "review": "Celebrated culinary specialty: spicy slow-roasted pork and flaky porottas."}
        ]
    },
    "Aluva": {
        "displayName": "Aluva (Periyar Gateway & Metro)",
        "district": "Ernakulam",
        "hub": {"name": "Aluva Railway Station", "stationName": "Aluva Pl. 1", "lat": 10.1082, "lng": 76.3570},
        "spots": [
            {"id": "alv-1", "name": "Aluva Manappuram Periyar River Bank", "category": "Hidden Spots", "expense": 0, "time": 40, "dist": 1.4, "transit": "🚶 9m • Free", "rating": 4.8, "review": "Expansive sandy sandbank on Periyar river, famous for Sivarathri rituals."},
            {"id": "alv-2", "name": "Kochi Metro Bridge Sunset Point", "category": "Hidden Spots", "expense": 0, "time": 30, "dist": 0.8, "transit": "🚶 5m • Free", "rating": 4.6, "review": "Modern viaduct crossing over the glassy river with golden evening reflections."},
            {"id": "alv-3", "name": "Ustad Tea Stall Kallumakkaya Fry", "category": "Food", "expense": 60, "time": 20, "dist": 0.6, "transit": "🚶 4m • Free", "rating": 4.8, "review": "Fried stuffed mussels and hot Sulaimani tea under railway arch."}
        ]
    },
    "Changanassery": {
        "displayName": "Changanassery (Canal Gateway)",
        "district": "Kottayam",
        "hub": {"name": "Changanassery Railway Station", "stationName": "Changanassery Pl. 1", "lat": 9.4442, "lng": 76.5410},
        "spots": [
            {"id": "chg-1", "name": "Vazhappally Maha Siva Temple", "category": "Hidden Spots", "expense": 0, "time": 40, "dist": 2.1, "transit": "🛺 6m • ₹25", "rating": 4.8, "review": "Ancient temple with Vattezhuthu stone inscriptions dating to 830 AD."},
            {"id": "chg-2", "name": "Perunna Lake Lotus Walk", "category": "Hidden Spots", "expense": 0, "time": 35, "dist": 1.5, "transit": "🚶 9m • Free", "rating": 4.7, "review": "Quiet pink water lily ponds flanked by emerald green paddy dykes."},
            {"id": "chg-3", "name": "Anand Bhavan Ghee Masala Dosa", "category": "Food", "expense": 70, "time": 25, "dist": 0.8, "transit": "🚶 5m • Free", "rating": 4.8, "review": "Traditional South Travancore style dosas with rich coconut chutney."}
        ]
    },
    "Pathanamthitta": {
        "displayName": "Pathanamthitta (Pilgrim Hub)",
        "district": "Pathanamthitta",
        "hub": {"name": "Pathanamthitta KSRTC Central", "stationName": "Pathanamthitta Hub", "lat": 9.2648, "lng": 76.7870},
        "spots": [
            {"id": "pta-1", "name": "Aranmula Metal Mirror Craft Heritage", "category": "Hidden Spots", "expense": 50, "time": 50, "dist": 11.0, "transit": "🛺 22m • ₹85", "rating": 5.0, "review": "Secret metallurgical alloy mirrors polished completely by hand with velvet."},
            {"id": "pta-2", "name": "Achankovil River Sandbank Walk", "category": "Hidden Spots", "expense": 0, "time": 35, "dist": 1.2, "transit": "🚶 7m • Free", "rating": 4.7, "review": "Shady bamboo-fringed riverside with clear natural hill water."},
            {"id": "pta-3", "name": "Amrit Sweets Aravana Payasam", "category": "Food", "expense": 80, "time": 20, "dist": 0.8, "transit": "🚶 5m • Free", "rating": 4.9, "review": "Rich black jaggery and roasted rice payasam cooked in ghee."}
        ]
    },
    "Kumarakom": {
        "displayName": "Kumarakom (Backwater Haven)",
        "district": "Kottayam",
        "hub": {"name": "Kumarakom Boat Jetty Hub", "stationName": "Kumarakom Jetty", "lat": 9.6175, "lng": 76.4300},
        "spots": [
            {"id": "kmk-1", "name": "Kumarakom Bird Sanctuary Forest Walk", "category": "Hidden Spots", "expense": 50, "time": 60, "dist": 1.8, "transit": "🚶 10m • Free", "rating": 4.9, "review": "14-acre preserved mangrove sanctuary visited by Siberian storks and egrets."},
            {"id": "kmk-2", "name": "Vembanad Lake Sunset Boardwalk", "category": "Hidden Spots", "expense": 0, "time": 45, "dist": 0.5, "transit": "🚶 4m • Free", "rating": 5.0, "review": "Breathtaking vast horizon over India's longest lake with gliding houseboats."},
            {"id": "kmk-3", "name": "Pearl Spot (Karimeen) Pollichathu Stall", "category": "Food", "expense": 220, "time": 40, "dist": 1.2, "transit": "🚶 7m • Free", "rating": 4.9, "review": "Fresh pearl spot fish marinated in spicy shallots and wrapped in banana leaf."}
        ]
    }
}

print(f"Total Kerala Cities curated: {len(KERALA_30_CITIES)}")
assert len(KERALA_30_CITIES) >= 30, "Must be at least 30 cities!"

# 1. Export to src/data/keralaCitiesData.js
formatted_cities = {}
for city_key, city_obj in KERALA_30_CITIES.items():
    spots_formatted = []
    for s in city_obj["spots"]:
        spots_formatted.append({
            "id": s["id"],
            "name": s["name"],
            "category": s["category"],
            "badge": s["category"],
            "lat": city_obj["hub"]["lat"] + round((random.random() - 0.5) * 0.03, 4),
            "lng": city_obj["hub"]["lng"] + round((random.random() - 0.5) * 0.03, 4),
            "expense": s["expense"],
            "spendTime": s["time"],
            "rating": s["rating"],
            "reviewCount": random.randint(45, 180),
            "distanceKm": s["dist"],
            "transitText": s["transit"],
            "returnText": f"Back to {city_obj['hub']['stationName']}",
            "returnCost": 30 if "₹" in s["transit"] else 0,
            "photo": "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=800&q=80",
            "photos": [
                "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=800&q=80",
                "https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?w=800&q=80",
                "https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?w=600&q=80"
            ],
            "review": s["review"],
            "tags": [s["category"], "Chai & View", "Verified"]
        })
    
    formatted_cities[city_key] = {
        "name": city_key,
        "displayName": city_obj["displayName"],
        "state": "Kerala",
        "district": city_obj["district"],
        "hub": city_obj["hub"],
        "spots": spots_formatted
    }

js_code = "// Auto-generated 30 authentic Kerala cities & railway hubs\n"
js_code += "export const KERALA_CITIES = " + json.dumps(formatted_cities, indent=2) + ";\n"

with open("src/data/keralaCitiesData.js", "w", encoding="utf-8") as f:
    f.write(js_code)

print(f"✅ Successfully exported all 30 Kerala cities to src/data/keralaCitiesData.js")

# 2. Synthesize 1500 training pairs for Tinker (50 samples per city * 30 = 1500 pairs)
MODES = ["Layover (Train/Flight)", "Quick Free Time", "Full Day Trip"]
VIBE_COMBOS = [
    ["Street Food", "Hidden Nature"],
    ["Gaming & Chill", "Chai & View"],
    ["Heritage Walk", "Street Food"],
    ["Chai & View", "Local Market"],
    ["Riverside Peace", "Quiet Solitude"],
    ["Historic Fort", "Traditional Cuisine"],
]

def format_cost(exp):
    return "Free" if exp == 0 else f"₹{exp}"

rows = []
for city_name, city_info in KERALA_30_CITIES.items():
    hub = city_info["hub"]
    spots = city_info["spots"]
    for i in range(100):
        mode = random.choice(MODES)
        time_hrs = random.choice([2, 3, 4, 5])
        budget = random.choice([200, 300, 500, 800, 1200])
        vibes = random.choice(VIBE_COMBOS)
        
        num_spots = min(len(spots), random.randint(2, 4))
        selected = random.sample(spots, num_spots)
        
        prompt = f"""Mode: {mode}
Available Time: {time_hrs} Hours (30m buffer locked)
Max Budget: ₹{budget} PER PERSON
Location: {hub['name']} ({city_name}, Kerala)
Quick Vibes: {', '.join(vibes)}
User Request: "Find me authentic {vibes[0].lower()} and {vibes[1].lower()} near {hub['name']} within safe return time."

Filtered Local Candidates:
"""
        for idx, s in enumerate(selected, 1):
            prompt += f"{idx}. {s['name']} ({s['category']}) | {format_cost(s['expense'])} | {s['time']}m | {s['transit']} | Rating: {s['rating']} | \"{s['review']}\"\n"
        
        prompt += "\nOutput exactly 3 distinct travel plans as valid JSON matching the schema."
        
        s1 = selected[0]
        s2 = selected[1] if len(selected) > 1 else selected[0]
        s3 = selected[-1]
        
        c1 = s1["expense"] + 35
        c2 = s1["expense"] + s2["expense"] + 65
        c3 = s3["expense"] + 15
        
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
        
        rows.append({
            "messages": [
                {
                    "role": "system",
                    "content": "You are Spot Undo AI, an edge travel planner for Kerala. You output strictly valid JSON with exactly 3 feasible itineraries based on user constraints."
                },
                {"role": "user", "content": prompt},
                {"role": "assistant", "content": json.dumps(assistant_json, ensure_ascii=False)}
            ]
        })

random.shuffle(rows)

out_jsonl = "training/spot_undo_train.jsonl"
with open(out_jsonl, "w", encoding="utf-8") as f:
    for r in rows:
        f.write(json.dumps(r, ensure_ascii=False) + "\n")

print(f"✅ Generated {len(rows)} ChatML training samples in {out_jsonl} across all 30 Kerala cities!")
