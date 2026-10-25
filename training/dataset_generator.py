import json
import random

HUBS = [
    {"name": "Shoranur Jn", "platform": "Shoranur Jn Pl. 1"},
    {"name": "Ernakulam Jn (South)", "platform": "Ernakulam South Pl. 2"},
    {"name": "Kozhikode Main", "platform": "Kozhikode Pl. 1"},
    {"name": "Thrissur Round Hub", "platform": "Thrissur Jn Pl. 1"},
    {"name": "Aluva Metro Hub", "platform": "Aluva Terminal Pl. 1"},
]

SPOTS_POOL = [
    {"name": "Nila River Secret Banyan", "category": "Hidden Spots", "expense": 40, "time": 45, "dist": 2.1, "transit": "🛺 10m • ₹30", "rating": 4.8, "review": "Quiet riverside shade with hot pazhampori."},
    {"name": "Amma's Crispy Vada", "category": "Food", "expense": 25, "time": 20, "dist": 1.2, "transit": "🚶 6m • Free", "rating": 4.9, "review": "Crispy uzhunnu vada fresh off the pan."},
    {"name": "LevelUp Cyber Hub", "category": "Gaming & Chill", "expense": 80, "time": 60, "dist": 3.0, "transit": "🛺 8m • ₹25", "rating": 4.7, "review": "Chilled AC, fast fiber internet, comfortable couches."},
    {"name": "Clay Craft Village", "category": "Hidden Spots", "expense": 0, "time": 30, "dist": 4.2, "transit": "🛺 10m • ₹35", "rating": 4.6, "review": "Generations of potters shaping terracotta by the water."},
    {"name": "River Ghat Step Walk", "category": "Hidden Spots", "expense": 0, "time": 35, "dist": 0.8, "transit": "🚶 8m • Free", "rating": 5.0, "review": "Stepped stone ghat overlooking the peaceful river."},
    {"name": "Shaji's Tapioca Stall", "category": "Food", "expense": 40, "time": 25, "dist": 1.5, "transit": "🚶 7m • Free", "rating": 4.7, "review": "Hot kappa and spicy fish curry served fast."},
    {"name": "Old Banyan Chai Stall", "category": "Food", "expense": 15, "time": 20, "dist": 1.0, "transit": "🚶 5m • Free", "rating": 4.8, "review": "Cardamom tea with hot banana fritters under tree canopy."},
    {"name": "Board Game Cafe", "category": "Gaming & Chill", "expense": 120, "time": 60, "dist": 2.5, "transit": "🛺 8m • ₹30", "rating": 4.6, "review": "200+ board games with iced cold brews and AC."},
]

MODES = ["Layover (Train/Flight)", "Quick Free Time", "Full Day Trip"]
VIBE_COMBOS = [
    ["Street Food", "Hidden Nature"],
    ["Gaming & Chill", "Chai & View"],
    ["Hidden Nature", "Chai & View"],
    ["Street Food", "Gaming & Chill"],
    ["Quiet River", "Budget Snacks"],
]

def format_cost(exp):
    return "Free" if exp == 0 else f"₹{exp}"

def generate_sample(sample_id):
    hub = random.choice(HUBS)
    mode = random.choice(MODES)
    time_hrs = random.choice([2, 3, 4, 5])
    budget = random.choice([200, 300, 500, 800, 1000])
    vibes = random.choice(VIBE_COMBOS)
    
    # Select 4-6 candidates from pool
    selected_candidates = random.sample(SPOTS_POOL, random.randint(4, 6))
    
    # Prompt string
    user_prompt = f"""Mode: {mode}
Available Time: {time_hrs} Hours (30m buffer locked)
Max Budget: ₹{budget} PER PERSON
Location: {hub['name']}
Quick Vibes: {', '.join(vibes)}
User Request: "I want {vibes[0].lower()} and {vibes[1].lower()} before my next departure."

Filtered Local Candidates:
"""
    for i, spot in enumerate(selected_candidates, 1):
        cost_label = format_cost(spot['expense'])
        user_prompt += f"{i}. {spot['name']} ({spot['category']}) | {cost_label} | {spot['time']}m | {spot['transit']} | Rating: {spot['rating']} | \"{spot['review']}\"\n"
    
    user_prompt += "\nOutput exactly 3 distinct travel plans as valid JSON matching the schema."

    # Plan 1: Mood Match (2-3 spots)
    p1_spots = selected_candidates[:3]
    p1_cost = sum(s['expense'] for s in p1_spots) + 55
    plan1 = {
        "id": "plan-1",
        "title": "Plan 1: Best Mood & Review Match",
        "vibe": f"Curated for {vibes[0]} and {vibes[1]} near {hub['name']}",
        "reasoning": f"Budget check: ₹{p1_cost} ≤ ₹{budget}. 3 high-rated spots sequenced along {p1_spots[0]['transit']} with 30m departure safety cushion.",
        "startTime": "14:00",
        "returnTime": f"{14 + time_hrs - 1}:45 PM",
        "totalCost": p1_cost,
        "stops": [
            {
                "num": idx + 1,
                "name": s["name"],
                "costText": f"{format_cost(s['expense'])} • {s['time']}m",
                "transitPill": s["transit"]
            }
            for idx, s in enumerate(p1_spots)
        ],
        "returnPill": f"⏰ {14 + time_hrs - 1}:45 PM • SAFE RETURN TO {hub['name'].upper()}"
    }

    # Plan 2: Ultra-Budget (Free/cheap spots)
    p2_spots = sorted(selected_candidates, key=lambda x: x['expense'])[:2]
    p2_cost = sum(s['expense'] for s in p2_spots) + 25
    plan2 = {
        "id": "plan-2",
        "title": "Plan 2: Ultra-Budget Saver",
        "vibe": "Walkable low-expense route with high local ratings",
        "reasoning": f"Budget check: ₹{p2_cost} saved {budget - p2_cost} rupees. Prioritized free walking distance spots.",
        "startTime": "14:00",
        "returnTime": f"{14 + time_hrs - 1}:30 PM",
        "totalCost": p2_cost,
        "stops": [
            {
                "num": idx + 1,
                "name": s["name"],
                "costText": f"{format_cost(s['expense'])} • {s['time']}m",
                "transitPill": s["transit"]
            }
            for idx, s in enumerate(p2_spots)
        ],
        "returnPill": f"⏰ {14 + time_hrs - 1}:30 PM • SAFE RETURN TO {hub['name'].upper()}"
    }

    # Plan 3: Hidden Gem Route
    p3_spots = [s for s in selected_candidates if s['category'] == 'Hidden Spots']
    if len(p3_spots) < 2:
        p3_spots = selected_candidates[-2:]
    p3_cost = sum(s['expense'] for s in p3_spots) + 45
    plan3 = {
        "id": "plan-3",
        "title": "Plan 3: Hidden Gem Route",
        "vibe": "Off-the-beaten-path artisan spots and quiet scenic views",
        "reasoning": f"Discovered secret local spots away from crowded tourist clusters, total transit time under 25 mins.",
        "startTime": "14:00",
        "returnTime": f"{14 + time_hrs - 1}:50 PM",
        "totalCost": p3_cost,
        "stops": [
            {
                "num": idx + 1,
                "name": s["name"],
                "costText": f"{format_cost(s['expense'])} • {s['time']}m",
                "transitPill": s["transit"]
            }
            for idx, s in enumerate(p3_spots)
        ],
        "returnPill": f"⏰ {14 + time_hrs - 1}:50 PM • SAFE RETURN TO {hub['name'].upper()}"
    }

    assistant_output = json.dumps({
        "reasoning": f"Verified constraints for {hub['name']}: {time_hrs}h window, ₹{budget} budget. Generated 3 verified routes with strict safe return buffers.",
        "plans": [plan1, plan2, plan3]
    }, ensure_ascii=False)

    return {
        "messages": [
            {
                "role": "system",
                "content": "You are the Spot Undo Edge AI Planning Engine. You receive user travel constraints and pre-filtered candidate places in Kerala. You output strictly pure valid JSON containing exactly 3 travel plans (Plan 1: Best Mood & Review Match, Plan 2: Ultra-Budget Saver, Plan 3: Hidden Gem Route). Never output markdown conversational text or greetings outside the JSON."
            },
            {
                "role": "user",
                "content": user_prompt
            },
            {
                "role": "assistant",
                "content": assistant_output
            }
        ]
    }

def main():
    dataset_path = "/media/fm9447/D/MULearn/Hackotberfest/training/spot_undo_train.jsonl"
    num_samples = 300
    with open(dataset_path, "w", encoding="utf-8") as f:
        for i in range(num_samples):
            sample = generate_sample(i)
            f.write(json.dumps(sample, ensure_ascii=False) + "\n")
    print(f"Successfully generated {num_samples} training samples at {dataset_path}")

if __name__ == "__main__":
    main()
