import os
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN
from pptx.enum.shapes import MSO_SHAPE

def create_presentation():
    prs = Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    blank_layout = prs.slide_layouts[6]

    # Brand Colors
    C_BLUE = RGBColor(11, 59, 244)      # #0B3BF4
    C_AMBER = RGBColor(245, 158, 11)    # #F59E0B
    C_GREEN = RGBColor(16, 185, 129)    # #10B981
    C_DARK = RGBColor(15, 16, 22)       # #0F1016
    C_LIGHT = RGBColor(244, 246, 249)   # #F4F6F9
    C_WHITE = RGBColor(255, 255, 255)
    C_BLACK = RGBColor(0, 0, 0)
    C_GRAY = RGBColor(100, 116, 139)

    logo_path = "/media/fm9447/D/MULearn/Hackotberfest/public/logo.png"

    def add_header(slide, tag_text, title_text, slide_num):
        # Background
        bg = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(7.5))
        bg.fill.solid()
        bg.fill.fore_color.rgb = C_LIGHT
        bg.line.fill.background()

        # Top Bar
        bar = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(0.5), Inches(11.733), Inches(1.1))
        bar.fill.solid()
        bar.fill.fore_color.rgb = C_WHITE
        bar.line.color.rgb = C_BLACK
        bar.line.width = Pt(2.5)

        tf = bar.text_frame
        tf.word_wrap = True
        tf.margin_left = Inches(0.3)
        tf.margin_top = Inches(0.12)
        
        p_tag = tf.paragraphs[0]
        p_tag.text = tag_text.upper()
        p_tag.font.size = Pt(11)
        p_tag.font.bold = True
        p_tag.font.color.rgb = C_BLUE

        p_title = tf.add_paragraph()
        p_title.text = title_text
        p_title.font.size = Pt(22)
        p_title.font.bold = True
        p_title.font.color.rgb = C_BLACK

        # Slide Number Pill
        pill = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(11.2), Inches(0.7), Inches(1.1), Inches(0.5))
        pill.fill.solid()
        pill.fill.fore_color.rgb = C_WHITE
        pill.line.color.rgb = C_BLACK
        pill.line.width = Pt(2)
        ptf = pill.text_frame
        ptf.margin_top = Inches(0.08)
        pp = ptf.paragraphs[0]
        pp.text = f"{slide_num:02d} / 09"
        pp.alignment = PP_ALIGN.CENTER
        pp.font.size = Pt(12)
        pp.font.bold = True
        pp.font.color.rgb = C_BLACK

    def add_card(slide, left, top, width, height, title, items, badge="", badge_color=C_BLUE):
        card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(left), Inches(top), Inches(width), Inches(height))
        card.fill.solid()
        card.fill.fore_color.rgb = C_WHITE
        card.line.color.rgb = C_BLACK
        card.line.width = Pt(2.5)

        tf = card.text_frame
        tf.word_wrap = True
        tf.margin_left = Inches(0.3)
        tf.margin_right = Inches(0.3)
        tf.margin_top = Inches(0.25)

        if badge:
            p_badge = tf.paragraphs[0]
            p_badge.text = badge.upper()
            p_badge.font.size = Pt(10)
            p_badge.font.bold = True
            p_badge.font.color.rgb = badge_color
            p_title = tf.add_paragraph()
        else:
            p_title = tf.paragraphs[0]

        p_title.text = title
        p_title.font.size = Pt(17)
        p_title.font.bold = True
        p_title.font.color.rgb = C_BLACK
        p_title.space_after = Pt(12)

        for item in items:
            p = tf.add_paragraph()
            p.text = f"•  {item}"
            p.font.size = Pt(12)
            p.font.color.rgb = C_DARK
            p.space_after = Pt(8)

    # ─────────────────────────────────────────────────────────────
    # SLIDE 1: TITLE SLIDE
    # ─────────────────────────────────────────────────────────────
    s1 = prs.slides.add_slide(blank_layout)
    bg1 = s1.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(7.5))
    bg1.fill.solid()
    bg1.fill.fore_color.rgb = C_BLUE
    bg1.line.fill.background()

    if os.path.exists(logo_path):
        s1.shapes.add_picture(logo_path, Inches(4.66), Inches(1.2), width=Inches(4.0))

    title_box = s1.shapes.add_textbox(Inches(1.5), Inches(3.2), Inches(10.33), Inches(3.8))
    tf1 = title_box.text_frame
    tf1.word_wrap = True

    p0 = tf1.paragraphs[0]
    p0.text = "⚡ HACKATHON BUILD • HACKTOBERFEST 2026"
    p0.alignment = PP_ALIGN.CENTER
    p0.font.size = Pt(13)
    p0.font.bold = True
    p0.font.color.rgb = C_AMBER
    p0.space_after = Pt(8)

    p1 = tf1.add_paragraph()
    p1.text = "SPOT-UNDOO"
    p1.alignment = PP_ALIGN.CENTER
    p1.font.size = Pt(48)
    p1.font.bold = True
    p1.font.color.rgb = C_WHITE
    p1.space_after = Pt(10)

    p2 = tf1.add_paragraph()
    p2.text = "Local-First AI Kerala Travel & Hidden-Spots Discovery Engine"
    p2.alignment = PP_ALIGN.CENTER
    p2.font.size = Pt(20)
    p2.font.color.rgb = RGBColor(220, 230, 255)
    p2.space_after = Pt(20)

    p3 = tf1.add_paragraph()
    p3.text = "🧠 Local Qwen 2.5 3B Inference   •   🍃 MongoDB Atlas Cloud   •   📱 Native Android & PWA"
    p3.alignment = PP_ALIGN.CENTER
    p3.font.size = Pt(13)
    p3.font.bold = True
    p3.font.color.rgb = C_WHITE

    # ─────────────────────────────────────────────────────────────
    # SLIDE 2: THE CHALLENGE
    # ─────────────────────────────────────────────────────────────
    s2 = prs.slides.add_slide(blank_layout)
    add_header(s2, "Focus: Transit & Layover Travelers", "THE CHALLENGE: Travel Friction vs. Hyper-Local Discovery", 2)
    add_card(s2, 0.8, 1.9, 5.6, 5.0, "The Layover Dilemma", [
        "Tourist Trap Bias: Google Maps funnels travelers into crowded commercial spots, skipping authentic alleys.",
        "Strict Time & Train Anxiety: Missing a flight or train due to unpredictable transit delays is catastrophic.",
        "Overpriced Station Traps: Travelers spend hours trapped inside railway stations with zero local insight.",
        "Privacy & Data Tracking: Most commercial travel apps sell GPS history and location patterns to ad networks."
    ], badge="The Problem", badge_color=RGBColor(225, 29, 72))

    add_card(s2, 6.9, 1.9, 5.6, 5.0, "The Spot-Undoo Solution", [
        "Micro-Itinerary AI: Computes routes based strictly on available minutes and budget limits.",
        "Safe Return Guarantee: Blue trail terminates with an amber pin back at the station before boarding time.",
        "Hyper-Local Curation: 70+ verified local spots across 7 Kerala railway hubs (tea stalls, banyans, cafes).",
        "100% On-Device Privacy: Travel intent is reasoned entirely on-device with zero server prompts tracked."
    ], badge="The Solution", badge_color=C_GREEN)

    # ─────────────────────────────────────────────────────────────
    # SLIDE 3: SYSTEM ARCHITECTURE
    # ─────────────────────────────────────────────────────────────
    s3 = prs.slides.add_slide(blank_layout)
    add_header(s3, "Full-Stack Local-First System", "SYSTEM ARCHITECTURE: Edge AI + Cloud Sync", 3)
    add_card(s3, 0.8, 1.9, 3.6, 5.0, "Frontend Layer", [
        "React 18 + Vite with Neo-Brutalist design language.",
        "Capacitor 6 Android bridge for native APK and ADB deployment.",
        "Dual-Strategy GPS: High accuracy + cached fallback.",
        "Leaflet OSM + Custom SVG Adventure Trail Canvas."
    ], badge="Client App", badge_color=C_BLUE)

    add_card(s3, 4.86, 1.9, 3.6, 5.0, "On-Device AI Engine", [
        "Ollama Local Runtime running fine-tuned Qwen 2.5 3B.",
        "2.39s average response time on consumer hardware.",
        "Strict JSON schema enforcement for itinerary generation.",
        "Zero API keys, zero token fees, zero rate limits."
    ], badge="Edge LLM", badge_color=C_AMBER)

    add_card(s3, 8.93, 1.9, 3.6, 5.0, "Backend & Persistence", [
        "Node.js & Express 5 REST API on port 4000.",
        "MongoDB Atlas cloud cluster (spots, reviews, plans).",
        "Geospatial duplicate spot guard (±0.00001 tolerance).",
        "Client-side JWT authentication mock guard."
    ], badge="Cloud / DB", badge_color=C_GREEN)

    # ─────────────────────────────────────────────────────────────
    # SLIDE 4: THE ADVENTURE TRAIL & VISUAL ENGINE
    # ─────────────────────────────────────────────────────────────
    s4 = prs.slides.add_slide(blank_layout)
    add_header(s4, "Interactive Discovery Interface", "THE VISUAL DISCOVERY ENGINE: Canvas & OSM", 4)
    add_card(s4, 0.8, 1.9, 5.6, 5.0, "Neo-Brutalist Adventure Canvas", [
        "Winding S-Curve Vector Trail: Visual journey through Kerala greenery and riverbeds.",
        "Alternating Dynamic Cards: Large 64px photo preview, entry fees, and rating badges.",
        "Single-Tap Filters: Instant filtering across Hidden Spots, Food, Gaming, and Nightlife.",
        "Safe Return Visual Anchor: Blue trail terminates directly behind the station return pill."
    ], badge="Canvas Mode", badge_color=C_BLUE)

    add_card(s4, 6.9, 1.9, 5.6, 5.0, "Multi-View Flexibility", [
        "Live OpenStreetMap: Full interactive Leaflet map with custom Kerala pin markers.",
        "Fast Grid View: High-density card listing for quick browsing on weak connections.",
        "Hub Auto-Snapping: Instantly switches coordinates between Shoranur, Kochi, Calicut, etc.",
        "Offline Resilient: All seed spots cached locally for zero-latency browsing."
    ], badge="Mapping & Grid", badge_color=C_AMBER)

    # ─────────────────────────────────────────────────────────────
    # SLIDE 5: ON-DEVICE AI PLANNER
    # ─────────────────────────────────────────────────────────────
    s5 = prs.slides.add_slide(blank_layout)
    add_header(s5, "Constraint-Satisfaction Inference", "SMART AI PLANNER: Qwen 2.5 3B Reasoning", 5)
    add_card(s5, 0.8, 1.9, 5.6, 5.0, "Precision Route Calculations", [
        "Strict Time Budgeting: Total transit + spend time <= available layover minutes.",
        "Rupee-Level Expense Guarantee: Entry tickets + auto fares <= max user budget.",
        "3 Alternative Plan Archetypes: Best Match, Ultra Budget Saver, and Hidden Scenic Trail.",
        "Context-Aware Prompting: Ingests custom user vibes (e.g. 'rainy day chai near backwaters')."
    ], badge="Planner Engine", badge_color=C_BLUE)

    add_card(s5, 6.9, 1.9, 5.6, 5.0, "Why Edge Inference Wins", [
        "Zero Latency Bottlenecks: No roundtrips to US cloud data centers.",
        "Offline-Capable: Generates full mathematical backup plans if Ollama is paused.",
        "Predictable Execution: Local model fine-tuned on Kerala places dataset.",
        "Sustainable AI: Low energy footprint per query on local CPUs/GPUs."
    ], badge="AI Benchmarks", badge_color=C_GREEN)

    # ─────────────────────────────────────────────────────────────
    # SLIDE 6: COMMUNITY SPOTS & DUPLICATE GUARD
    # ─────────────────────────────────────────────────────────────
    s6 = prs.slides.add_slide(blank_layout)
    add_header(s6, "Crowdsourced Hyper-Local Knowledge", "COMMUNITY SPOTS: Uploads & Quality Control", 6)
    add_card(s6, 0.8, 1.9, 5.6, 5.0, "Community Spot Contributions", [
        "Quick Spot Uploads: Name, category, photos, spend time, and local tips.",
        "Instant Local Visibility: New spots automatically enter the discovery stream.",
        "Interactive Community Reviews: Star ratings and verified traveler notes.",
        "Direct Google Maps Handoff: One-tap navigation links for every spot."
    ], badge="Crowdsourcing", badge_color=C_BLUE)

    add_card(s6, 6.9, 1.9, 5.6, 5.0, "Smart Quality Controls", [
        "Duplicate Spot Guard: Backend rejects submissions with matching coordinates (±0.00001).",
        "Deterministic Candidate Expansion: Increased planner pool to 20 spots to ensure new gems appear.",
        "MongoDB Atlas Sync: Real-time cloud persistence alongside local offline fallback.",
        "Category Validation: Automatic tagging for seamless filter integration."
    ], badge="Data Integrity", badge_color=C_AMBER)

    # ─────────────────────────────────────────────────────────────
    # SLIDE 7: PERFORMANCE & BENCHMARKS
    # ─────────────────────────────────────────────────────────────
    s7 = prs.slides.add_slide(blank_layout)
    add_header(s7, "Speed, Efficiency & Privacy", "PERFORMANCE METRICS & BENCHMARKS", 7)
    add_card(s7, 0.8, 1.9, 5.6, 5.0, "Performance Highlights", [
        "⚡ 2.39s Average Inference Time on local Qwen 2.5 3B (Ollama).",
        "⚡ 5.2 MB Native Android APK footprint — ultra lightweight.",
        "⚡ 5.5s Production Build via Vite + Rollup chunk optimization.",
        "⚡ 0 ms Network Delay for local mathematical route fallback."
    ], badge="Speed", badge_color=C_GREEN)

    add_card(s7, 6.9, 1.9, 5.6, 5.0, "Security & Sustainability", [
        "🔒 100% Private: Location queries never leave traveler's personal hardware.",
        "🔒 Zero Third-Party Tracker SDKs or commercial analytics scripts.",
        "🌱 Low Carbon Footprint: Quantized Q4_K_M model runs on budget laptops.",
        "💰 Zero Operational Cost: No OpenAI or Gemini token billing overhead."
    ], badge="Privacy & Cost", badge_color=C_BLUE)

    # ─────────────────────────────────────────────────────────────
    # SLIDE 8: UI CONTROLS & INTERACTION WALKTHROUGH
    # ─────────────────────────────────────────────────────────────
    s8 = prs.slides.add_slide(blank_layout)
    add_header(s8, "Complete Button & Action Guide", "INTERACTIVE UI CONTROLS WALKTHROUGH", 8)
    add_card(s8, 0.8, 1.9, 3.6, 5.0, "Header & Settings", [
        "Profile Avatar Tap: Opens settings sheet for Model, URL, and Cache.",
        "Auto-GPS Pulse Dot: Live indicator for location lock status.",
        "Re-acquire GPS: Forces dual-mode scan with nearest-city snap.",
        "Brand Logo: Quick visual anchor across every screen."
    ], badge="Top Navigation", badge_color=C_BLUE)

    add_card(s8, 4.86, 1.9, 3.6, 5.0, "Filters & Canvas", [
        "View Switcher: Canvas (illustrated), Live OSM, or Grid.",
        "Category Chips: All Spots, Hidden Gems, Food, Gaming, Night.",
        "City Dropdown: Instant jump to Kochi, Calicut, Shoranur, etc.",
        "Spot Cards: Tap card to fly camera or view carousel photos."
    ], badge="Explore Screen", badge_color=C_AMBER)

    add_card(s8, 8.93, 1.9, 3.6, 5.0, "Planner & Dock", [
        "Mode Pills: Layover, Quick Free Time, or Full Day Trip.",
        "Budget & Time Sliders: Interactive constraints.",
        "Generate 3 Plans: Runs local Qwen reasoning model.",
        "Floating Dock: 1-click switch: Explore, Planner, Add Spot, Debug."
    ], badge="Planner & Bottom Bar", badge_color=C_GREEN)

    # ─────────────────────────────────────────────────────────────
    # SLIDE 9: ROADMAP & FUTURE VISION
    # ─────────────────────────────────────────────────────────────
    s9 = prs.slides.add_slide(blank_layout)
    add_header(s9, "Execution Plan & Scaled Growth", "ROADMAP & FUTURE PRIORITIES", 9)
    add_card(s9, 0.8, 1.9, 5.6, 5.0, "Phase 1: Completed Hackathon Build", [
        "✓ 7 Kerala Hubs & 70 verified spots with high-res photography.",
        "✓ On-device Qwen 2.5 3B local AI reasoning via Ollama.",
        "✓ MongoDB Atlas cloud cluster for spots, reviews, and plans.",
        "✓ Dual canvas with Neo-brutalist trail and Leaflet OpenStreetMap.",
        "✓ Native Android APK package tested live on mobile."
    ], badge="Completed", badge_color=C_GREEN)

    add_card(s9, 6.9, 1.9, 5.6, 5.0, "Phase 2: Scaled Expansion", [
        "➔ Offline Vector Search: Local Qdrant embeddings for natural language spot search.",
        "➔ Malayalam Voice Guide: On-device Piper TTS + Whisper voice interaction.",
        "➔ Live Train Delay Integration: Webhooks adjusting layover buffers automatically.",
        "➔ Auto-Driver Kiosk Portal: Monetized curated guide cards with UPI QR codes."
    ], badge="Future Roadmap", badge_color=C_BLUE)

    out_file = "/media/fm9447/D/MULearn/Hackotberfest/presentation/Spot-Undoo_Presentation.pptx"
    prs.save(out_file)
    print(f"Presentation successfully saved to {out_file}")

if __name__ == "__main__":
    create_presentation()
