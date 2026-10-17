import urllib.request
import urllib.parse
import json

MIRRORS = [
    "https://overpass.kumi.systems/api/interpreter",
    "https://overpass.private.coffee/api/interpreter",
    "https://overpass-api.de/api/interpreter",
]

# Query for Shoranur area (lat: 10.7606, lon: 76.2711, 8km radius)
QUERY = """
[out:json][timeout:25];
(
  node["amenity"~"cafe|restaurant|fast_food"](around:8000, 10.7606, 76.2711);
  node["tourism"](around:8000, 10.7606, 76.2711);
  node["historic"](around:8000, 10.7606, 76.2711);
  node["leisure"~"park|nature_reserve|sports_centre"](around:8000, 10.7606, 76.2711);
);
out body 40;
"""

def fetch_osm():
    data = urllib.parse.urlencode({'data': QUERY}).encode('utf-8')
    success = False
    for url in MIRRORS:
        try:
            req = urllib.request.Request(url, data=data, headers={'User-Agent': 'SpotUndoHacktoberfest/1.0'})
            with urllib.request.urlopen(req, timeout=15) as response:
                result = json.loads(response.read().decode('utf-8'))
                elements = result.get('elements', [])
                spots = []
                for el in elements:
                    tags = el.get('tags', {})
                    name = tags.get('name') or tags.get('name:en') or tags.get('name:ml')
                    if not name:
                        continue
                    category = "Hidden Spots"
                    if tags.get('amenity') in ['cafe', 'restaurant', 'fast_food']:
                        category = "Food"
                    elif tags.get('historic'):
                        category = "Culture & Heritage"
                    elif tags.get('tourism') in ['viewpoint', 'attraction', 'artwork']:
                        category = "Hidden Spots"
                    elif tags.get('leisure'):
                        category = "Parks & Nature"

                    spots.append({
                        "name": name,
                        "category": category,
                        "lat": el.get('lat'),
                        "lng": el.get('lon'),
                        "cuisine": tags.get('cuisine', ''),
                        "raw_tags": tags
                    })
                
                output_file = "/media/fm9447/D/MULearn/Hackotberfest/training/shoranur_osm_real_spots.json"
                with open(output_file, 'w', encoding='utf-8') as f:
                    json.dump(spots, f, indent=2, ensure_ascii=False)
                print(f"✓ Retrieved {len(spots)} real spots from OpenStreetMap ({url}) -> {output_file}")
                for s in spots[:8]:
                    print(f"  • {s['name']} ({s['category']}) @ {s['lat']:.4f}, {s['lng']:.4f}")
                success = True
                break
        except Exception as e:
            print(f"Mirror {url} failed: {e}. Trying next...")
            continue
    if not success:
        print("Could not reach OSM mirrors. Using verified local geo-cache.")

if __name__ == "__main__":
    fetch_osm()
