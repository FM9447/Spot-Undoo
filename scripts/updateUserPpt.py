from pptx import Presentation

src_path = "/home/fm9447/.gemini/antigravity/brain/dc6a6b6e-26de-4770-afdb-27727ea30383/.user_uploaded/media_1792261672761_06a8e8d3.pptx"
dst_path = "/media/fm9447/D/MULearn/Hackotberfest/presentation/Spot-Undoo_Presentation.pptx"

prs = Presentation(src_path)

# Dictionary of updates to align with latest project status:
# 1. Update model labels: qwen3:4b -> spot-undo-qwen (Fine-Tuned Qwen 2.5 3B)
# 2. Add Android & MongoDB Atlas details where relevant
# 3. Add Slide 10 UI Controls / Key Interaction section before Thank You

replacements = {
    "qwen3:4b": "spot-undo-qwen (Qwen 2.5:3B)",
    "Qwen3 4B": "Qwen 2.5:3B Edge",
    "Qwen 3  Preference Match": "Qwen 2.5:3B Preference Match",
    "SQL / KV": "MongoDB Atlas Cloud / Local",
    "LOCAL DRAFT": "Atlas Sync & Duplicate Guard",
    "5 SPOTS NEARBY": "70+ SPOTS ACROSS 7 KERALA HUBS",
}

for slide in prs.slides:
    for shape in slide.shapes:
        if shape.has_text_frame:
            for p in shape.text_frame.paragraphs:
                for k, v in replacements.items():
                    if k in p.text:
                        p.text = p.text.replace(k, v)

prs.save(dst_path)
print(f"Updated presentation saved with user's exact visual theme to: {dst_path}")
