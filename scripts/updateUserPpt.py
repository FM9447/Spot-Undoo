from pptx import Presentation

src_path = "/home/fm9447/.gemini/antigravity/brain/dc6a6b6e-26de-4770-afdb-27727ea30383/.user_uploaded/media_1792261672761_06a8e8d3.pptx"
dst_path = "/media/fm9447/D/MULearn/Hackotberfest/presentation/Spot-Undoo_Presentation.pptx"

prs = Presentation(src_path)

comprehensive_replacements = {
    # Models & Runtime
    "POWERED BY LOCAL QWEN3 4B": "POWERED BY LOCAL QWEN 2.5:3B",
    "qwen3:4b": "spot-undo-qwen (Qwen 2.5:3B)",
    "Qwen3 4B": "Qwen 2.5:3B Edge",
    "Qwen 3  Preference Match": "Qwen 2.5:3B Preference Match",
    
    # Dataset & Hubs
    "Live Shoranur Demo Dataset": "Live Kerala Multi-Hub Dataset",
    "5 SPOTS NEARBY": "70+ SPOTS ACROSS 7 KERALA HUBS",
    
    # Database & Persistence Architecture
    "SQL / KV": "MongoDB Atlas Cloud / Local",
    "LOCAL DRAFT": "Atlas Sync & Duplicate Guard",
    "Offline-First Local Store": "Hybrid Local + Atlas Persistence",
    
    # Features & Guarantees
    "ITINERARY MAP": "NEO-BRUTALIST ADVENTURE TRAIL",
    "Adventure Trail & Step-by-Step Route": "Adventure Trail with Safe Return & Dot Anchor",
    "Add Spot: Community Vision Contribution": "Add Spot: Community Contributions & Dup Guard",
    "Deterministic Hard Filter": "Deterministic Hard Filter (Pool Expanded to 20)",
    
    # Roadmap Updates
    "Shared Global Community Feed": "Native Android APK & PWA Offline Package",
    "Cross-Device Profile & Saved Sync": "Geospatial Duplicate Protection (±0.00001°)",
    "Interactive Itinerary Step Editing": "Dual-Strategy High-Accuracy Auto-GPS",
}

for slide in prs.slides:
    for shape in slide.shapes:
        if shape.has_text_frame:
            for p in shape.text_frame.paragraphs:
                for old_val, new_val in comprehensive_replacements.items():
                    if old_val in p.text:
                        p.text = p.text.replace(old_val, new_val)

prs.save(dst_path)
print(f"Presentation thoroughly updated and saved to: {dst_path}")
