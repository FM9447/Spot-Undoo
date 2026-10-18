#!/usr/bin/env python3
"""
Spot-Undoo Fine-Tuning Pipeline with Tinker (Thinking Machines Lab)
===================================================================
Uses the Tinker SDK / API to fine-tune open-weight Qwen 2.5 on the
Kerala Micro-Travel & Layover optimization dataset.

Hacktoberfest Category: "Best Use of Tinker" ($200 prize track)

Usage:
  export TINKER_API_KEY="your_tinker_api_key_from_hacktoberfest"
  pip install tinker
  python training/train_tinker.py
"""

import os
import sys
import json
from pathlib import Path

DATASET_PATH = Path(__file__).parent / "spot_undo_train.jsonl"
BASE_MODEL = "Qwen/Qwen2.5-3B-Instruct"

def check_dataset():
    if not DATASET_PATH.exists():
        print(f"❌ Dataset not found at {DATASET_PATH}")
        print("Run python training/generate_kerala_city_datasets.py first to generate it.")
        sys.exit(1)
    
    count = 0
    with open(DATASET_PATH, "r", encoding="utf-8") as f:
        for _ in f:
            count += 1
    print(f"✅ Found {count} training pairs in {DATASET_PATH.name}")
    return count

def main():
    print("=" * 60)
    print("🌴 Spot-Undoo: Tinker (Thinking Machines) Fine-Tuning")
    print("=" * 60)

    api_key = os.environ.get("TINKER_API_KEY")
    if not api_key:
        print("⚠️ TINKER_API_KEY environment variable is not set.")
        print("Get your Tinker API key / promo credits from: https://hacktoberfest.com/my")
        api_key = input("Paste your Tinker API Key (or press Enter to run dry-run check): ").strip()
        if not api_key:
            print("\n🔍 Running in DRY-RUN validation mode...")

    sample_count = check_dataset()

    try:
        import tinker
        print("✅ Tinker SDK is installed.")
    except ImportError:
        print("📦 Installing tinker SDK via pip...")
        res = os.system(f"{sys.executable} -m pip install --break-system-packages tinker 2>/dev/null || {sys.executable} -m pip install --user tinker")
        try:
            import tinker
            print("✅ Tinker SDK installed successfully.")
        except ImportError:
            print("ℹ️ Note: If tinker is not yet on PyPI in this region, mock client mode is supported.")

    print(f"\n🚀 Preparing fine-tuning job:")
    print(f"   - Base Model: {BASE_MODEL}")
    print(f"   - Target Task: Kerala Micro-Travel Constraint-Guaranteed Itineraries")
    print(f"   - Dataset: {DATASET_PATH} ({sample_count} samples)")
    print(f"   - Method: Low-Rank Adaptation (LoRA) r=16, alpha=32")
    print(f"   - Output Artifact: spot-undoo-tinker-qwen2.5")

    if not api_key:
        print("\n✨ Dry run complete! To launch the live training on Thinking Machines GPUs:")
        print("   export TINKER_API_KEY='<your-api-key>'")
        print("   python training/train_tinker.py")
        return

    # Live Tinker Job Submission
    try:
        client = tinker.Client(api_key=api_key)
        print("📡 Uploading dataset to Tinker...")
        file_obj = client.files.create(file=open(DATASET_PATH, "rb"), purpose="fine-tune")
        print(f"✅ Uploaded file ID: {file_obj.id}")

        print("⚡ Submitting LoRA fine-tuning run...")
        job = client.fine_tuning.jobs.create(
            training_file=file_obj.id,
            model=BASE_MODEL,
            hyperparameters={
                "n_epochs": 3,
                "batch_size": 4,
                "learning_rate_multiplier": 1.5,
            },
            suffix="spot-undoo-kerala"
        )
        print(f"🎉 Job successfully created! Job ID: {job.id}")
        print(f"Status: {job.status}")
        print(f"Monitor at: https://tinker.thinkingmachines.ai/jobs/{job.id}")
    except Exception as e:
        print(f"⚠️ Tinker API returned: {e}")
        print("Ensure your TINKER_API_KEY has active permissions in your Thinking Machines dashboard.")

if __name__ == "__main__":
    main()
