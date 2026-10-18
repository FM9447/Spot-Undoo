#!/usr/bin/env python3
import json
from expand_all_india_hubs import CITIES_DATA

def main():
    formatted_cities = {}
    for city_key, city_obj in CITIES_DATA.items():
        spots_formatted = []
        for s in city_obj["spots"]:
            spots_formatted.append({
                "id": s["id"],
                "name": s["name"],
                "category": s["category"],
                "badge": s["category"],
                "lat": city_obj["hub"]["lat"] + (random_offset()),
                "lng": city_obj["hub"]["lng"] + (random_offset()),
                "expense": s["expense"],
                "spendTime": s["time"],
                "rating": s["rating"],
                "reviewCount": 85,
                "distanceKm": s["dist"],
                "transitText": s["transit"],
                "returnText": f"Back to {city_obj['hub']['stationName']}",
                "returnCost": 30 if "₹" in s["transit"] else 0,
                "photo": "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=800&q=80",
                "photos": [
                    "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=800&q=80",
                    "https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?w=800&q=80",
                    "https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?w=800&q=80"
                ],
                "review": s["review"],
                "tags": [s["category"], "Chai & View", "Verified"]
            })
        
        formatted_cities[city_key] = {
            "name": city_key,
            "displayName": city_obj["displayName"],
            "state": city_obj.get("state", "Kerala"),
            "hub": city_obj["hub"],
            "spots": spots_formatted
        }

    js_code = "// Auto-generated multi-city Kerala & National Transit Hubs\n"
    js_code += "export const KERALA_CITIES = " + json.dumps(formatted_cities, indent=2) + ";\n"
    
    with open("src/data/keralaCitiesData.js", "w", encoding="utf-8") as f:
        f.write(js_code)
    
    print(f"✅ Exported {len(formatted_cities)} cities to src/data/keralaCitiesData.js")

def random_offset():
    import random
    return round((random.random() - 0.5) * 0.04, 4)

if __name__ == "__main__":
    main()
