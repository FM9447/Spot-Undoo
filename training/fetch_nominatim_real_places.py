import urllib.request
import urllib.parse
import json
import time

QUERIES = [
    ("Nila River, Shoranur", "Hidden Spots", "Scenic Riverside"),
    ("Kerala Kalamandalam, Cheruthuruthy", "Culture & Heritage", "Kathakali & Traditional Arts"),
    ("Shoranur Junction Railway Station", "Transit Hub", "Railway Junction"),
    ("Ottappalam, Kerala", "Hidden Spots", "Quiet Town & Riverside"),
    ("Kavalappara Kottaram, Shoranur", "Culture & Heritage", "Historic Palace & Heritage"),
    ("Varikkasseri Mana, Ottappalam", "Culture & Heritage", "Traditional Illam & Heritage"),
    ("Bharathapuzha Viewpoint, Shoranur", "Hidden Spots", "River Viewpoint"),
    ("Indian Coffee House, Shoranur", "Food", "Classic Coffee & Cutlets"),
]

def fetch_real_kerala_spots():
    results = []
    print("=== Fetching Real OpenStreetMap POIs for Shoranur Region ===")
    for query, cat, badge in QUERIES:
        try:
            encoded = urllib.parse.quote(query)
            url = f"https://nominatim.openstreetmap.org/search?q={encoded}&format=json&limit=1"
            req = urllib.request.Request(url, headers={'User-Agent': 'SpotUndoApp/1.0 (faheem@mulearn)'})
            with urllib.request.urlopen(req, timeout=10) as resp:
                data = json.loads(resp.read().decode('utf-8'))
                if data:
                    item = data[0]
                    spot = {
                        "name": query.split(',')[0],
                        "category": cat,
                        "badge": badge,
                        "lat": float(item['lat']),
                        "lng": float(item['lon']),
                        "display_name": item['display_name'],
                        "osm_type": item.get('type', 'place')
                    }
                    results.append(spot)
                    print(f"✓ Found: {spot['name']} ({cat}) -> {spot['lat']:.4f}, {spot['lng']:.4f}")
            time.sleep(1.0) # respect Nominatim rate limit (1 req/sec)
        except Exception as e:
            print(f"Error querying {query}: {e}")

    out_file = "/media/fm9447/D/MULearn/Hackotberfest/training/real_shoranur_osm_places.json"
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2, ensure_ascii=False)
    print(f"\nSaved {len(results)} authentic OpenStreetMap places to {out_file}")

if __name__ == "__main__":
    fetch_real_kerala_spots()
