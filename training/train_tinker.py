#!/usr/bin/env python3
"""
Spot-Undoo Fine-Tuning Pipeline with Tinker (Thinking Machines Lab)
===================================================================
Uses the official Tinker SDK (`tinker-0.34.0`) to fine-tune open-weight
Qwen/Qwen3.5-4B LoRA on curated Kerala & All-India Micro-Travel training samples.

Hacktoberfest Track: "Best Use of Tinker" ($200 prize category)

Usage:
  export TINKER_API_KEY="tml-your-api-key-here"
  python3 training/train_tinker.py [--steps 30] [--batch-size 2] [--lr 2e-5]
"""

import os
import sys
import json
import time
import argparse
from pathlib import Path

DATASET_PATH = Path(__file__).parent / "spot_undo_train.jsonl"
BASE_MODEL = "Qwen/Qwen3.5-4B"

def parse_args():
    parser = argparse.ArgumentParser(description="Tinker LoRA Fine-Tuning for Spot-Undoo")
    parser.add_argument("--steps", type=int, default=30, help="Number of training steps to run (default: 30)")
    parser.add_argument("--batch-size", type=int, default=2, help="Batch size per step (default: 2)")
    parser.add_argument("--lr", type=float, default=2e-5, help="Learning rate (default: 2e-5)")
    parser.add_argument("--rank", type=int, default=32, help="LoRA rank (default: 32)")
    parser.add_argument("--save-every", type=int, default=15, help="Save checkpoint every N steps")
    parser.add_argument("--checkpoint-name", type=str, default="spot-undoo-kerala-qwen3.5", help="Checkpoint name")
    return parser.parse_args()

def load_dataset(limit=None):
    if not DATASET_PATH.exists():
        print(f"❌ Dataset not found at {DATASET_PATH}")
        sys.exit(1)
    
    samples = []
    with open(DATASET_PATH, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            samples.append(json.loads(line))
            if limit and len(samples) >= limit:
                break
    return samples

def main():
    args = parse_args()
    print("=" * 65)
    print("🌴 Spot-Undoo: Tinker (Thinking Machines) Multi-City Fine-Tuning")
    print("=" * 65)

    samples = load_dataset()
    print(f"✅ Loaded {len(samples)} ChatML training samples from {DATASET_PATH.name}")

    api_key = os.environ.get("TINKER_API_KEY", "").strip()
    if not api_key:
        api_key = input("\nEnter your TINKER_API_KEY (starts with tml-...): ").strip()

    if not api_key:
        print("❌ TINKER_API_KEY is required to run remote GPU fine-tuning.")
        sys.exit(1)

    if not api_key.startswith("tml-"):
        api_key = f"tml-{api_key}"

    print(f"\n🚀 Training Parameters:")
    print(f"   • Base Model: {BASE_MODEL}")
    print(f"   • LoRA Rank: {args.rank}")
    print(f"   • Total Steps: {args.steps}")
    print(f"   • Batch Size: {args.batch_size}")
    print(f"   • Learning Rate: {args.lr}")
    print(f"   • Target Checkpoint: {args.checkpoint_name}")

    import tinker
    from tinker import types

    try:
        print(f"\n📡 Connecting to Thinking Machines Lab...")
        service_client = tinker.ServiceClient(api_key=api_key)
        
        print(f"⚡ Provisioning LoRA training session on remote GPU cluster for {BASE_MODEL}...")
        training_client = service_client.create_lora_training_client(
            base_model=BASE_MODEL,
            rank=args.rank,
            train_attn=True,
            train_mlp=True,
            user_metadata={"project": "spot-undoo", "region": "kerala-30-cities"}
        )
        
        console_url = training_client.get_console_url()
        print(f"🎉 Training session initialized!")
        print(f"🔗 Console Dashboard: {console_url}")

        print("\n⏳ Fetching tokenizer...")
        tokenizer = training_client.get_tokenizer()
        print("✅ Tokenizer ready.")

        # Pre-tokenize dataset into batches for ultra-fast GPU pipelining
        total_samples_needed = args.steps * args.batch_size
        print(f"\n⚙️ Pre-tokenizing {total_samples_needed} samples for maximum GPU throughput...")
        
        prepped_data = []
        for i in range(total_samples_needed):
            item = samples[i % len(samples)]
            messages = item.get("messages", [])
            if len(messages) < 3:
                continue

            prompt_text = tokenizer.apply_chat_template(messages[:2], tokenize=False, add_generation_prompt=True)
            prompt_tokens = tokenizer.encode(prompt_text)
            
            full_text = tokenizer.apply_chat_template(messages, tokenize=False)
            full_tokens = tokenizer.encode(full_text)

            if len(full_tokens) <= len(prompt_tokens):
                continue

            model_input = types.ModelInput.from_ints(full_tokens[:-1])
            target_tokens = full_tokens[1:]
            
            prompt_len = len(prompt_tokens)
            weights = [0.0 if idx < (prompt_len - 1) else 1.0 for idx in range(len(target_tokens))]

            prepped_data.append((
                types.Datum(
                    model_input=model_input,
                    loss_fn_inputs={"target_tokens": target_tokens, "weights": weights}
                ),
                sum(weights)
            ))
            if (i + 1) % 50 == 0 or (i + 1) == total_samples_needed:
                print(f"   • Tokenized {i + 1}/{total_samples_needed} samples...")

        print(f"✅ Ready! Launching {args.steps} GPU optimization steps with batch_size={args.batch_size}...")
        sample_idx = 0
        total_tokens = 0
        start_time = time.time()

        for step in range(1, args.steps + 1):
            batch_data = []
            step_tokens = 0

            for _ in range(args.batch_size):
                if sample_idx < len(prepped_data):
                    datum, num_tokens = prepped_data[sample_idx]
                    batch_data.append(datum)
                    step_tokens += num_tokens
                    sample_idx += 1

            if not batch_data:
                continue

            # Forward + Backward Pass
            fwd_future = training_client.forward_backward(batch_data, "cross_entropy")
            # Optimizer Step (AdamW)
            optim_future = training_client.optim_step(adam_params=types.AdamParams(learning_rate=args.lr))

            fwd_res = fwd_future.result()
            _ = optim_future.result()

            loss_sum = fwd_res.metrics.get("loss:sum", 0.0)
            avg_loss = loss_sum / max(1.0, step_tokens)
            total_tokens += int(step_tokens)

            elapsed = time.time() - start_time
            print(f"   [Step {step:02d}/{args.steps:02d}] Loss: {avg_loss:.4f} | Batch Tokens: {int(step_tokens):,} (Cumulative: {total_tokens:,}) | Elapsed: {elapsed:.1f}s")

            # Periodic checkpoint save
            if step % args.save_every == 0 and step < args.steps:
                chk_name = f"{args.checkpoint_name}-step-{step}"
                print(f"   💾 Saving intermediate checkpoint '{chk_name}' to Tinker...")
                save_future = training_client.save_state(name=chk_name)
                save_res = save_future.result()
                print(f"   ✅ Saved: {save_res.path}")

        # Final Checkpoint Save
        print(f"\n💾 Saving final LoRA weights '{args.checkpoint_name}'...")
        final_save_future = training_client.save_state(name=args.checkpoint_name)
        final_res = final_save_future.result()
        print(f"🎉 Final Checkpoint Saved Successfully: {final_res.path}")

        print("\n" + "=" * 65)
        print("🏆 Spot-Undoo Fine-Tuning Complete!")
        print(f"   • Total Steps: {args.steps}")
        print(f"   • Total Trained Tokens: {total_tokens:,}")
        print(f"   • Dashboard URL: {console_url}")
        print(f"   • Remote Checkpoint: {final_res.path}")
        print("=" * 65)

    except Exception as e:
        print(f"\n⚠️ Tinker Training Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
