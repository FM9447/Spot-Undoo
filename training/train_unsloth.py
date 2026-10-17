"""
Spot Undo - Qwen 2.5/3 (3B/4B) QLoRA Fine-Tuning Script
Runs on any machine with NVIDIA GPU (CUDA), Kaggle, or Google Colab (Free T4).
"""

import os
import torch
from datasets import load_dataset
from trl import SFTTrainer
from transformers import TrainingArguments
from unsloth import FastLanguageModel

# 1. Configuration
MAX_SEQ_LENGTH = 2048
DTYPE = None  # None for auto-detection (Float16 / Bfloat16)
LOAD_IN_4BIT = True  # QLoRA 4-bit quantization
MODEL_NAME = "Qwen/Qwen2.5-3B-Instruct"  # Base model
OUTPUT_DIR = "./spot_undo_qwen_lora"
DATASET_PATH = "./spot_undo_train.jsonl"

def main():
    print("=== Loading Qwen Base Model with Unsloth 4-bit ===")
    model, tokenizer = FastLanguageModel.from_pretrained(
        model_name=MODEL_NAME,
        max_seq_length=MAX_SEQ_LENGTH,
        dtype=DTYPE,
        load_in_4bit=LOAD_IN_4BIT,
    )

    # 2. Add LoRA Adapters
    print("=== Adding LoRA Adapters ===")
    model = FastLanguageModel.get_peft_model(
        model,
        r=16,
        target_modules=["q_proj", "k_proj", "v_proj", "o_proj", "gate_proj", "up_proj", "down_proj"],
        lora_alpha=32,
        lora_dropout=0,  # 0 is optimized for Unsloth
        bias="none",
        use_gradient_checkpointing="unsloth",
        random_state=42,
    )

    # 3. Load & Format Dataset
    print(f"=== Loading Dataset from {DATASET_PATH} ===")
    dataset = load_dataset("json", data_files=DATASET_PATH, split="train")

    def formatting_prompts_func(examples):
        convos = examples["messages"]
        texts = [tokenizer.apply_chat_template(convo, tokenize=False, add_generation_prompt=False) for convo in convos]
        return {"text": texts}

    dataset = dataset.map(formatting_prompts_func, batched=True)

    # 4. Training Arguments
    training_args = TrainingArguments(
        per_device_train_batch_size=2,
        gradient_accumulation_steps=4,
        warmup_steps=10,
        max_steps=100,  # ~3 epochs for 300 samples
        learning_rate=2e-4,
        fp16=not torch.cuda.is_bf16_supported(),
        bf16=torch.cuda.is_bf16_supported(),
        logging_steps=5,
        optim="adamw_8bit",
        weight_decay=0.01,
        lr_scheduler_type="cosine",
        seed=42,
        output_dir=OUTPUT_DIR,
        report_to="none",
    )

    # 5. Trainer
    trainer = SFTTrainer(
        model=model,
        tokenizer=tokenizer,
        train_dataset=dataset,
        dataset_text_field="text",
        max_seq_length=MAX_SEQ_LENGTH,
        dataset_num_proc=2,
        packing=False,
        args=training_args,
    )

    print("=== Starting QLoRA Fine-Tuning ===")
    trainer.train()

    # 6. Save LoRA weights & Export GGUF for Ollama
    print("=== Saving LoRA Model ===")
    model.save_pretrained(OUTPUT_DIR)
    tokenizer.save_pretrained(OUTPUT_DIR)

    print("=== Exporting to 4-bit GGUF for Ollama ===")
    model.save_pretrained_gguf("spot_undo_qwen_gguf", tokenizer, quantization_method="q4_k_m")
    print("✓ Done! GGUF ready for Ollama import: ./spot_undo_qwen_gguf")

if __name__ == "__main__":
    main()
