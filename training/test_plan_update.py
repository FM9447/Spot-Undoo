#!/usr/bin/env python3
"""
Test Live Tinker Model Inference for Spot-Undoo Plan Adaptation
==============================================================
Runs an inference test on the fine-tuned Spot-Undoo multi-task model
hosted on Thinking Machines Lab (Tinker) serverless sampler.
"""

import os
import sys
import json
import tinker
from tinker import types

SAMPLER_PATH = "tinker://f3775cb4-c170-53d3-a54b-2d84fc66c6f3:train:0/sampler_weights/spot-undoo-multitask-live"
FALLBACK_SAMPLER = "tinker://4c8dc007-5e86-5cbf-95b8-e09a240cc71c:train:0/sampler_weights/spot-undoo-live"

def test_plan_update():
    api_key = os.environ.get("TINKER_API_KEY", "tml-FeD5KTURD9SgNn4pTyjjXvu6lf6ayflfsoDnmw4L8tP9utOo9kXEwMQrzBvUl45FBAAAA")
    print("=" * 65)
    print("🧪 Spot-Undoo: Live Tinker Inference Test for Plan Modification")
    print("=" * 65)

    client = tinker.ServiceClient(api_key=api_key)
    
    # Try current multi-task sampler or fallback
    target_path = SAMPLER_PATH
    try:
        print(f"\n📡 Connecting to Tinker Sampler: {target_path}...")
        sampler = client.create_sampling_client(model_path=target_path)
    except Exception as e:
        print(f"⚠️ Primary sampler error: {e}. Trying fallback sampler...")
        target_path = FALLBACK_SAMPLER
        sampler = client.create_sampling_client(model_path=target_path)

    tokenizer = sampler.get_tokenizer()
    print("✅ Sampler ready on Thinking Machines GPU cluster.")

    # Scenario: User currently at Shoranur station with an active plan
    current_city = "Shoranur"
    hub_name = "Shoranur Jn Hub (Palakkad)"
    current_stops = ["River Ghat Step Walk (Hidden Spots)", "Varikkasseri Mana Heritage (Hidden Spots)"]
    user_adjustment_prompt = "Train got delayed by 25 mins. Drop the far heritage house and add an authentic hot tea/pazhampori stall with quick walking return."

    system_prompt = "You are Spot Undo AI travel planner for Kerala. You adapt itineraries dynamically based on real-time user requests."

    user_content = f"""You are Spot Undo AI travel planner for Kerala.
User wants to modify this existing itinerary:
Current stops: River Ghat Step Walk, Varikkasseri Mana Heritage
User request: "Train delayed by 20m, need fastest route and add a tea stop"

City: Shoranur (Hub: Shoranur Jn Hub (Palakkad))
Available spots:
- River Ghat Step Walk (Hidden Spots, ₹0, 30m)
- Amma's Crispy Vada & Chai (Food, ₹25, 20m)
- Nila River Secret Banyan (Hidden Spots, ₹40, 45m)
- LevelUp Cyber Hub (Gaming & Chill, ₹80, 60m)

Output format: Start immediately with the opening brace {{{{ without ANY thinking process, analysis, or introductory text:
{{
  "updatedTitle": "short plan title",
  "reasoning": "short 1-sentence note of what changed",
  "stops": [
    {{"name": "spot name", "time": "30m", "expense": 0, "transit": "🚶 6m • Free"}}
  ]
}}"""

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_content}
    ]

    print("\n" + "-" * 65)
    print("📥 INPUT PROMPT SENT TO MODEL:")
    print("-" * 65)
    print(f"📍 Location: {hub_name}")
    print(f"💬 User Modification Prompt: \"Train delayed by 20m, need fastest route and add a tea stop\"")
    print("-" * 65)

    # Format using tokenizer chat template and prefill JSON start
    formatted = tokenizer.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)
    # Prefill assistant start with opening brace so model generates raw JSON directly
    formatted += '{\n  "updatedTitle": "'
    tokens = tokenizer.encode(formatted)
    model_input = types.ModelInput.from_ints(tokens)

    print("\n⏳ Executing live sampling on Tinker remote GPU...")
    future = sampler.sample(
        model_input,
        num_samples=1,
        sampling_params=types.SamplingParams(max_tokens=600, temperature=0.3, top_p=0.9)
    )
    res = future.result()

    generated_tokens = res.sequences[0].tokens
    raw_output = tokenizer.decode(generated_tokens)

    print("\n" + "=" * 65)
    print("📤 LIVE MODEL OUTPUT RECEIVED FROM TINKER:")
    print("=" * 65)
    
    clean_text = raw_output.strip()
    if not clean_text.startswith("{"):
        clean_text = '{\n  "updatedTitle": "' + clean_text
    
    # Strip any trailing ChatML end tags
    for tag in ["<|im_end|>", "<|endoftext|>"]:
        clean_text = clean_text.replace(tag, "")
    clean_text = clean_text.strip()
    
    print(clean_text)

    # Validate JSON
    try:
        start = clean_text.find("{")
        if start != -1:
            # Match matching closing brace for the first object
            depth = 0
            end = -1
            for idx in range(start, len(clean_text)):
                if clean_text[idx] == '{':
                    depth += 1
                elif clean_text[idx] == '}':
                    depth -= 1
                    if depth == 0:
                        end = idx
                        break
            
            if end != -1:
                parsed = json.loads(clean_text[start:end+1])
                print("\n" + "-" * 65)
                print("✅ VALIDATED JSON STRUCTURE:")
                print("-" * 65)
                print(json.dumps(parsed, indent=2, ensure_ascii=False))
                print(f"\n🎉 Updated Title: {parsed.get('updatedTitle')}")
                print(f"💡 AI Reasoning: {parsed.get('reasoning')}")
                print("🗺️ Modified Stops:")
                for s in parsed.get("stops", []):
                    print(f"   • {s.get('name')} | Time: {s.get('time')} | Expense: ₹{s.get('expense')} | Transit: {s.get('transit')}")
    except Exception as parse_err:
        print(f"\n⚠️ JSON Parse Note: {parse_err}")

    print("\n" + "=" * 65)

if __name__ == "__main__":
    test_plan_update()
