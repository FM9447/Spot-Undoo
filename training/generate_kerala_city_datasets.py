import json
import random

# Authentic Spots across 4 major Kerala hubs + Shoranur
KERALA_CITIES_SPOTS = {
    "Kochi (Ernakulam)": {
        "hub": {"name": "Ernakulam Jn (South)", "platform": "Ernakulam South Pl. 1", "lat": 9.9678, "lng": 76.2905},
        "spots": [
            {"name": "Fort Kochi Spice Lane", "category": "Hidden Spots", "expense": 0, "time": 45, "dist": 4.5, "transit": "⛴️ 20m • ₹20 (Water Metro)", "rating": 4.8, "review": "Aromatic back-alleys with antique spice warehouses, no crowds."},
            {"name": "Kayees Rahmathulla Biryani", "category": "Food", "expense": 180, "time": 30, "dist": 3.8, "transit": "🛺 12m • ₹40", "rating": 4.9, "review": "Iconic tender Malabar mutton biryani with ghee aroma."},
            {"name": "Mangalavanam Bird Sanctuary Park", "category": "Hidden Spots", "expense": 10, "time": 40, "dist": 2.2, "transit": "🛺 8m • ₹25", "rating": 4.5, "review": "The green lung of Kochi, quiet mangrove walk in the city center."},
            {"name": "Broadway Kulukki & Snacks", "category": "Food", "expense": 35, "time": 20, "dist": 1.5, "transit": "🚶 7m • Free", "rating": 4.7, "review": "Spicy green-chilli kulukki sarbath and hot banana chips."},
            {"name": "Galaxy Cyber Gaming Hub", "category": "Gaming & Chill", "expense": 90, "time": 60, "dist": 2.0, "transit": "🚶 10m • Free", "rating": 4.6, "review": "Fast 500Mbps fiber, RTX gaming rigs, chilled AC atmosphere."},
            {"name": "Water Metro High Court Jetty", "category": "Hidden Spots", "expense": 30, "time": 40, "dist": 2.8, "transit": "🛺 10m • ₹30", "rating": 4.8, "review": "Ultra-modern electric boat cruise overlooking Vembanad backwaters."},
            {"name": "Mattancherry Jew Town Antique Walk", "category": "Hidden Spots", "expense": 0, "time": 50, "dist": 4.2, "transit": "🛺 14m • ₹45", "rating": 4.7, "review": "16th-century cobblestone alleys, curio shops, and heritage cafes."},
            {"name": "Subhash Bose Park Waterfront", "category": "Hidden Spots", "expense": 0, "time": 35, "dist": 1.2, "transit": "🚶 6m • Free", "rating": 4.4, "review": "Breezy harbor promenade with sunset views over ships."},
        ]
    },
    "Trivandrum (Thiruvananthapuram)": {
        "hub": {"name": "Trivandrum Central", "platform": "Trivandrum Central Pl. 1", "lat": 8.4875, "lng": 76.9532},
        "spots": [
            {"name": "Kuthira Malika Palace Grounds", "category": "Hidden Spots", "expense": 40, "time": 45, "dist": 1.1, "transit": "🚶 8m • Free", "rating": 4.7, "review": "122 carved wooden horses, teakwood silence, historic temple vibe."},
            {"name": "Maha Chips & Boli Stall", "category": "Food", "expense": 60, "time": 20, "dist": 0.9, "transit": "🚶 6m • Free", "rating": 4.9, "review": "Fresh hot Trivandrum yellow Boli with sweet condensed milk."},
            {"name": "Napier Museum Heritage Gardens", "category": "Hidden Spots", "expense": 20, "time": 50, "dist": 3.0, "transit": "🛺 10m • ₹30", "rating": 4.8, "review": "Indo-Saracenic masterpiece nestled under massive rain trees."},
            {"name": "Villa Maya Courtyard Chai", "category": "Food", "expense": 120, "time": 40, "dist": 2.1, "transit": "🛺 8m • ₹25", "rating": 4.6, "review": "18th-century restored Dutch manor for quiet filter coffee."},
            {"name": "Pixel Play Lounge", "category": "Gaming & Chill", "expense": 80, "time": 60, "dist": 2.4, "transit": "🛺 9m • ₹25", "rating": 4.5, "review": "PS5 and PC setups, plush sofas, cold beverages and snacks."},
            {"name": "Shanghumukham Beach Giant Mermaid", "category": "Hidden Spots", "expense": 0, "time": 60, "dist": 6.5, "transit": "🛺 18m • ₹60", "rating": 4.6, "review": "Kanayi Kunhiraman's iconic colossal Sagarakanyaka sculpture at dusk."},
            {"name": "Chala Market Spice Alley", "category": "Food", "expense": 40, "time": 30, "dist": 0.8, "transit": "🚶 5m • Free", "rating": 4.5, "review": "Centuries-old bazaar alley serving cardamom black tea and piping parotta."},
        ]
    },
    "Calicut (Kozhikode)": {
        "hub": {"name": "Kozhikode Main", "platform": "Kozhikode Main Pl. 1", "lat": 11.2464, "lng": 75.7804},
        "spots": [
            {"name": "Mananchira Square Park Walk", "category": "Hidden Spots", "expense": 0, "time": 40, "dist": 1.2, "transit": "🚶 7m • Free", "rating": 4.7, "review": "Clear water square reservoir enclosed by traditional red-tile gates."},
            {"name": "Paragon Restaurant Biryani", "category": "Food", "expense": 190, "time": 40, "dist": 1.5, "transit": "🚶 8m • Free", "rating": 4.9, "review": "Legendary Calicut dum biryani with melt-in-mouth chicken and pickle."},
            {"name": "Kozhikode Beach Old Sea Pier", "category": "Hidden Spots", "expense": 0, "time": 45, "dist": 2.0, "transit": "🛺 6m • ₹25", "rating": 4.8, "review": "Century-old collapsed shipping pier jutting into Arabian sea waves."},
            {"name": "SM Street (Mittai Theruvu) Halwa Lane", "category": "Food", "expense": 50, "time": 35, "dist": 0.9, "transit": "🚶 5m • Free", "rating": 4.8, "review": "Pedestrian heritage street with warm black halwa and banana chips."},
            {"name": "LevelUp Esports Cafe", "category": "Gaming & Chill", "expense": 80, "time": 60, "dist": 2.2, "transit": "🛺 8m • ₹25", "rating": 4.7, "review": "Ultra-low latency LAN gaming and bubble tea in AC lounge."},
            {"name": "Zains Heritage Moplah Snacks", "category": "Food", "expense": 75, "time": 25, "dist": 1.8, "transit": "🚶 10m • Free", "rating": 4.9, "review": "Authentic unnakkaya, chattipathiri, and Sulaimani tea."},
            {"name": "Kallayi River Timber Yard Footbridge", "category": "Hidden Spots", "expense": 0, "time": 40, "dist": 3.1, "transit": "🛺 10m • ₹30", "rating": 4.6, "review": "Historical timber floating river with tranquil iron railway bridge."},
        ]
    },
    "Palakkad": {
        "hub": {"name": "Palakkad Jn (Olavakkode)", "platform": "Palakkad Jn Pl. 1", "lat": 10.8268, "lng": 76.6433},
        "spots": [
            {"name": "Palakkad Tipu Fort & Moat", "category": "Hidden Spots", "expense": 20, "time": 50, "dist": 4.5, "transit": "🛺 12m • ₹40", "rating": 4.8, "review": "Well-preserved granite fortress surrounded by a tranquil water moat."},
            {"name": "Noorjehan Fort View Biryani", "category": "Food", "expense": 150, "time": 30, "dist": 4.2, "transit": "🛺 11m • ₹35", "rating": 4.7, "review": "Spicy Malabar biryani with roasted chicken and fragrant ghee rice."},
            {"name": "Kalpathy Heritage Agraharam Lane", "category": "Hidden Spots", "expense": 0, "time": 45, "dist": 2.8, "transit": "🛺 8m • ₹25", "rating": 4.8, "review": "Ancient Brahmin settlement with row houses and historic chariot festival grounds."},
            {"name": "Indian Coffee House Olavakkode", "category": "Food", "expense": 55, "time": 25, "dist": 0.5, "transit": "🚶 3m • Free", "rating": 4.6, "review": "Retro spiral tables serving filter coffee, beetroot cutlets, and dosas."},
            {"name": "Malampuzha Garden Canal Walkway", "category": "Hidden Spots", "expense": 30, "time": 60, "dist": 8.0, "transit": "🛺 20m • ₹70", "rating": 4.7, "review": "Green mountain reservoir backdrop with ropeway and peaceful canal paths."},
            {"name": "Gamerz Zone Cyber Point", "category": "Gaming & Chill", "expense": 70, "time": 60, "dist": 1.5, "transit": "🚶 8m • Free", "rating": 4.5, "review": "AC private gaming booths, racing simulator, and cold frappes."},
            {"name": "Kava Hidden Valley Sunset Point", "category": "Hidden Spots", "expense": 0, "time": 60, "dist": 9.5, "transit": "🛺 25m • ₹90", "rating": 4.9, "review": "Pristine reservoir backwaters flanked by the misty Western Ghats."},
        ]
    },
    "Shoranur": {
        "hub": {"name": "Shoranur Jn Hub (Active)", "platform": "Shoranur Jn Pl. 1", "lat": 10.7606, "lng": 76.2711},
        "spots": [
            {"name": "River Ghat Step Walk", "category": "Hidden Spots", "expense": 0, "time": 30, "dist": 0.8, "transit": "🚶 8m • Free", "rating": 5.0, "review": "Serene stepped ghat overlooking Bharathapuzha. Perfect quiet walk."},
            {"name": "Nila River Secret Banyan", "category": "Hidden Spots", "expense": 40, "time": 45, "dist": 2.1, "transit": "🛺 10m • ₹30", "rating": 4.8, "review": "Quiet riverside shade with hot pazhampori and chai."},
            {"name": "Amma's Crispy Vada", "category": "Food", "expense": 25, "time": 20, "dist": 1.2, "transit": "🚶 6m • Free", "rating": 4.9, "review": "Golden uzhunnu vada hot off the oil pan with coconut chutney."},
            {"name": "LevelUp Cyber Hub", "category": "Gaming & Chill", "expense": 80, "time": 60, "dist": 3.0, "transit": "🛺 8m • ₹25", "rating": 4.7, "review": "High-speed broadband, esports gaming setups, chilled AC."},
            {"name": "Clay Craft Village", "category": "Hidden Spots", "expense": 0, "time": 30, "dist": 4.2, "transit": "🛺 10m • ₹35", "rating": 4.6, "review": "Generations of potters shaping terracotta lamps and pots by hand."},
            {"name": "Varikkasseri Mana Heritage", "category": "Hidden Spots", "expense": 50, "time": 60, "dist": 7.5, "transit": "🛺 18m • ₹65", "rating": 4.9, "review": "Magnificent traditional aristocratic illam where Malayalam movies are shot."},
            {"name": "Old Banyan Chai Stall", "category": "Food", "expense": 15, "time": 20, "dist": 0.6, "transit": "🚶 4m • Free", "rating": 4.8, "review": "Strong ginger tea with fresh banana fritters under shady tree canopy."},
        ]
    }
}

# Save structured multi-city database
with open("training/kerala_cities_places.json", "w", encoding="utf-8") as f:
    json.dump(KERALA_CITIES_SPOTS, f, indent=2, ensure_ascii=False)
print("✓ Saved training/kerala_cities_places.json with Kochi, Trivandrum, Calicut, Palakkad, Shoranur.")

# Generate Comprehensive ChatML Dataset
MODES = ["Layover (Train/Flight)", "Quick Free Time", "Full Day Trip"]
VIBE_COMBOS = [
    ["Street Food", "Hidden Nature"],
    ["Gaming & Chill", "Chai & View"],
    ["Hidden Nature", "Chai & View"],
    ["Street Food", "Gaming & Chill"],
    ["Riverside Peace", "Budget Snacks"],
    ["Heritage Walk", "Local Sweets"],
    ["Backwaters Breeze", "Chilled AC Gaming"]
]

dataset_rows = []

for city_name, city_data in KERALA_CITIES_SPOTS.items():
    hub = city_data["hub"]
    spots = city_data["spots"]
    
    for i in range(100):  # 100 variations per city = 500 high-quality training pairs
        mode = random.choice(MODES)
        time_hrs = random.choice([2, 3, 4, 5])
        budget = random.choice([200, 300, 450, 600, 800, 1000])
        vibes = random.choice(VIBE_COMBOS)
        
        sample_spots = random.sample(spots, min(len(spots), random.randint(4, 6)))
        
        user_prompt = f"""Mode: {mode}
Available Time: {time_hrs} Hours (30m buffer locked)
Max Budget: ₹{budget} PER PERSON
Location: {hub['name']} ({city_name})
Quick Vibes: {', '.join(vibes)}
User Request: "Find me authentic {vibes[0].lower()} and {vibes[1].lower()} near {hub['name']} within safe return time."

Filtered Local Candidates:
"""
        for idx, sp in enumerate(sample_spots, 1):
            cost_str = "Free" if sp["expense"] == 0 else f"₹{sp['expense']}"
            user_prompt += f"{idx}. {sp['name']} ({sp['category']}) | {cost_str} | {sp['time']}m | {sp['transit']} | Rating: {sp['rating']} | \"{sp['review']}\"\n"
        
        user_prompt += "\nOutput exactly 3 distinct travel plans as valid JSON matching the schema."
        
        # Build 3 valid plans
        s1, s2, s3 = sample_spots[0], sample_spots[1], sample_spots[2]
        
        c1 = s1["expense"] + 30
        c2 = s1["expense"] + s2["expense"] + 60
        c3 = s3["expense"] + 25
        
        assistant_json = {
            "plans": [
                {
                    "id": "plan-1",
                    "title": f"Plan 1: {vibes[0]} & {s1['name']} Trail",
                    "badge": f"{time_hrs - 1}h Fast Discovery",
                    "totalTime": f"{time_hrs - 1}h 15m",
                    "totalCost": f"₹{min(budget, c1)}",
                    "transitSummary": f"{s1['transit'].split('•')[0].strip()} Transit",
                    "returnLeg": f"↩ 12m back to {hub['platform']} • ₹35",
                    "reasoning": f"Perfect match for '{vibes[0]}' in {city_name}. Keeps 30-minute safety buffer for {mode}.",
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
                    "returnLeg": f"↩ 15m back to {hub['platform']} • ₹45",
                    "reasoning": f"Balances {s1['name']} with {s2['name']}, staying strictly inside the ₹{budget} ceiling.",
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
                    "totalTime": f"1h 45m",
                    "totalCost": f"₹{min(budget, c3)}",
                    "transitSummary": "Minimal Transit",
                    "returnLeg": f"↩ 8m back to {hub['platform']} • Free",
                    "reasoning": f"Zero stress, lowest spend, guaranteeing a swift return to {hub['name']}.",
                    "stops": [
                        {
                            "step": 1,
                            "name": s3["name"],
                            "category": s3["category"],
                            "arrive": "14:15",
                            "leave": "15:00",
                            "transit": s3["transit"],
                            "expense": s3["expense"],
                            "tip": s3["review"]
                        }
                    ]
                }
            ]
        }
        
        chatml_row = {
            "messages": [
                {
                    "role": "system",
                    "content": "You are Spot Undo AI, an edge travel planner for Kerala. You output strictly valid JSON with exactly 3 feasible itineraries based on user constraints."
                },
                {"role": "user", "content": user_prompt},
                {"role": "assistant", "content": json.dumps(assistant_json, ensure_ascii=False)}
            ]
        }
        dataset_rows.append(chatml_row)

random.shuffle(dataset_rows)

with open("training/spot_undo_train.jsonl", "w", encoding="utf-8") as f:
    for row in dataset_rows:
        f.write(json.dumps(row, ensure_ascii=False) + "\n")

print(f"✓ Generated {len(dataset_rows)} multi-city ChatML training pairs in training/spot_undo_train.jsonl.")
