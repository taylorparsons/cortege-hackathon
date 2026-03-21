from pathlib import Path

from PIL import Image
from pptx import Presentation
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_AUTO_SHAPE_TYPE
from pptx.enum.text import MSO_ANCHOR, PP_ALIGN
from pptx.util import Inches, Pt


ROOT = Path(__file__).resolve().parents[1]
DECK_HTML = ROOT / "deck.html"
OUTPUT = ROOT / "deck.pptx"

BG = "111009"
AMBER = "E8A838"
TEAL = "4ECDC4"
LIGHT = "F0EAD8"
CREAM = "F7F0DC"
MUTED = "8C8272"
MUTED_DARK = "6A5F50"
SLATE = "7B9EC9"
RED = "E85D5D"
CARD_FILL = "1B1911"
CARD_LINE = "3A3428"

HEADING_FONT = "Cormorant Garamond"
BODY_FONT = "Outfit"

SCREENSHOTS = {
    "Household Editor + Twilio Routing": ROOT
    / "cypress/screenshots/household-crud.cy.js/Household CRUD -- saves Twilio routing numbers and primary member from the household editor.png",
    "Fraud Case Creation": ROOT
    / "cypress/screenshots/fraud-case-demo.cy.js/Fraud Case Demo -- creates a household fraud case from a recent Twilio call and one evidence item.png",
    "Companion Status Dashboard": ROOT
    / "cypress/screenshots/companion-cards.cy.js/Companion Cards -- shows companion cards for the selected household members.png",
}

EXPECTED_HTML_SNIPPETS = [
    "AI Security Companions for Every Household",
    "The Problem",
    "The Solution",
    "How It Learns",
    "Live Product",
    "Platform, Not Just an App",
    "This Isn't a Demo",
    "The Business",
    "174 passing tests",
    "github.com/taylorparsons/cortege-hackathon",
]


def rgb(value):
    return RGBColor.from_string(value)


def set_background(slide, color=BG):
    fill = slide.background.fill
    fill.solid()
    fill.fore_color.rgb = rgb(color)


def set_shape_style(shape, fill_color, line_color=None, line_width=1):
    shape.fill.solid()
    shape.fill.fore_color.rgb = rgb(fill_color)
    shape.line.color.rgb = rgb(line_color or fill_color)
    shape.line.width = Pt(line_width)


def add_textbox(
    slide,
    left,
    top,
    width,
    height,
    text="",
    *,
    font_name=BODY_FONT,
    font_size=20,
    color=LIGHT,
    bold=False,
    italic=False,
    align=PP_ALIGN.LEFT,
    vertical=MSO_ANCHOR.TOP,
    margins=(0.08, 0.05, 0.08, 0.05),
):
    shape = slide.shapes.add_textbox(left, top, width, height)
    text_frame = shape.text_frame
    text_frame.clear()
    text_frame.word_wrap = True
    text_frame.vertical_anchor = vertical
    text_frame.margin_left = Inches(margins[0])
    text_frame.margin_top = Inches(margins[1])
    text_frame.margin_right = Inches(margins[2])
    text_frame.margin_bottom = Inches(margins[3])
    paragraph = text_frame.paragraphs[0]
    paragraph.alignment = align
    run = paragraph.add_run()
    run.text = text
    font = run.font
    font.name = font_name
    font.size = Pt(font_size)
    font.color.rgb = rgb(color)
    font.bold = bold
    font.italic = italic
    return shape


def add_paragraph(shape, text, *, font_name=BODY_FONT, font_size=18, color=LIGHT, bold=False, italic=False, align=PP_ALIGN.LEFT):
    text_frame = shape.text_frame
    paragraph = text_frame.add_paragraph()
    paragraph.alignment = align
    run = paragraph.add_run()
    run.text = text
    font = run.font
    font.name = font_name
    font.size = Pt(font_size)
    font.color.rgb = rgb(color)
    font.bold = bold
    font.italic = italic
    return paragraph


def add_link_text(slide, left, top, width, height, text, url, *, font_size=13, color=MUTED):
    shape = slide.shapes.add_textbox(left, top, width, height)
    tf = shape.text_frame
    tf.clear()
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.alignment = PP_ALIGN.CENTER
    run = p.add_run()
    run.text = text
    run.hyperlink.address = url
    font = run.font
    font.name = BODY_FONT
    font.size = Pt(font_size)
    font.color.rgb = rgb(color)
    return shape


def add_divider(slide, left, top, width=0.6):
    shape = slide.shapes.add_shape(
        MSO_AUTO_SHAPE_TYPE.RECTANGLE,
        Inches(left),
        Inches(top),
        Inches(width),
        Inches(0.03),
    )
    set_shape_style(shape, AMBER, AMBER, 0)
    return shape


def add_card(slide, left, top, width, height, *, fill_color=CARD_FILL, line_color=CARD_LINE, radius_shape=MSO_AUTO_SHAPE_TYPE.ROUNDED_RECTANGLE):
    shape = slide.shapes.add_shape(radius_shape, Inches(left), Inches(top), Inches(width), Inches(height))
    set_shape_style(shape, fill_color, line_color)
    return shape


def add_center_text(slide, left, top, width, height, text, *, font_name=BODY_FONT, font_size=18, color=LIGHT, bold=False):
    return add_textbox(
        slide,
        Inches(left),
        Inches(top),
        Inches(width),
        Inches(height),
        text,
        font_name=font_name,
        font_size=font_size,
        color=color,
        bold=bold,
        align=PP_ALIGN.CENTER,
        vertical=MSO_ANCHOR.MIDDLE,
    )


def add_fit_picture(slide, image_path, left, top, width, height):
    with Image.open(image_path) as image:
        img_w, img_h = image.size

    box_w = width
    box_h = height
    img_ratio = img_w / img_h
    box_ratio = box_w / box_h

    if img_ratio > box_ratio:
        render_w = box_w
        render_h = box_w / img_ratio
        render_left = left
        render_top = top + (box_h - render_h) / 2
    else:
        render_h = box_h
        render_w = box_h * img_ratio
        render_top = top
        render_left = left + (box_w - render_w) / 2

    return slide.shapes.add_picture(
        str(image_path),
        Inches(render_left),
        Inches(render_top),
        width=Inches(render_w),
        height=Inches(render_h),
    )


def ensure_source_matches():
    html = DECK_HTML.read_text(encoding="utf-8")
    missing = [snippet for snippet in EXPECTED_HTML_SNIPPETS if snippet not in html]
    if missing:
        raise RuntimeError(f"deck.html no longer matches expected source deck; missing snippets: {missing}")


def build_presentation():
    ensure_source_matches()

    prs = Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    blank = prs.slide_layouts[6]

    build_slide_1(prs.slides.add_slide(blank))
    build_slide_2(prs.slides.add_slide(blank))
    build_slide_3(prs.slides.add_slide(blank))
    build_slide_4(prs.slides.add_slide(blank))
    build_slide_5(prs.slides.add_slide(blank))
    build_slide_6(prs.slides.add_slide(blank))
    build_slide_7(prs.slides.add_slide(blank))
    build_slide_8(prs.slides.add_slide(blank))

    prs.save(str(OUTPUT))


def build_slide_1(slide):
    set_background(slide)
    add_center_text(slide, 3.15, 1.1, 7.0, 1.0, "CORTEGE", font_name=HEADING_FONT, font_size=62, color=LIGHT)
    add_center_text(slide, 5.74, 1.1, 0.45, 1.0, "E", font_name=HEADING_FONT, font_size=62, color=AMBER, bold=True)
    add_center_text(
        slide,
        2.6,
        2.0,
        8.2,
        0.45,
        "AI Security Companions for Every Household",
        font_name=BODY_FONT,
        font_size=19,
        color=MUTED,
    )
    add_divider(slide, 6.36, 2.55, 0.6)
    add_center_text(
        slide,
        1.4,
        3.0,
        10.6,
        0.45,
        "Taylor Parsons  ·  Rich Rosenthal  ·  Jennifer McKinney  ·  March 2026 AI Agents Hackathon",
        font_name=BODY_FONT,
        font_size=14,
        color=MUTED,
    )
    add_link_text(
        slide,
        Inches(3.3),
        Inches(4.3),
        Inches(6.8),
        Inches(0.35),
        "github.com/taylorparsons/cortege-hackathon",
        "https://github.com/taylorparsons/cortege-hackathon",
    )


def build_slide_2(slide):
    set_background(slide)
    add_textbox(slide, Inches(0.8), Inches(0.55), Inches(4.2), Inches(0.5), "The Problem", font_name=HEADING_FONT, font_size=28, color=LIGHT)
    add_center_text(slide, 4.3, 1.15, 4.8, 0.8, "$64B", font_name=HEADING_FONT, font_size=48, color=AMBER, bold=True)
    add_center_text(slide, 4.1, 1.88, 5.2, 0.45, "lost to scams in the US in 2025", font_name=BODY_FONT, font_size=14, color=MUTED)
    add_divider(slide, 6.36, 2.35, 0.6)

    quote_box = add_card(slide, 1.55, 2.7, 10.2, 1.35, fill_color="1A140C", line_color=AMBER)
    quote_box.line.width = Pt(2)
    add_center_text(
        slide,
        1.9,
        3.0,
        9.5,
        0.75,
        '"Grandma, it\'s me — I\'m in trouble and I need money right now."',
        font_name=HEADING_FONT,
        font_size=24,
        color=LIGHT,
    )

    stats = slide.shapes.add_textbox(Inches(2.05), Inches(4.35), Inches(9.2), Inches(0.8))
    tf = stats.text_frame
    tf.clear()
    p = tf.paragraphs[0]
    p.alignment = PP_ALIGN.CENTER
    for text, color in [
        ("77%", AMBER),
        (" of Americans encounter scams daily. ", MUTED),
        ("7 in 10", AMBER),
        (" were scammed last year.", MUTED),
    ]:
        run = p.add_run()
        run.text = text
        run.font.name = BODY_FONT
        run.font.size = Pt(16)
        run.font.color.rgb = rgb(color)
        run.font.bold = color == AMBER

    p2 = tf.add_paragraph()
    p2.alignment = PP_ALIGN.CENTER
    for text, color in [
        ("Only ", MUTED),
        ("44%", RED),
        (" recover any money. One call. Life savings gone.", MUTED),
    ]:
        run = p2.add_run()
        run.text = text
        run.font.name = BODY_FONT
        run.font.size = Pt(16)
        run.font.color.rgb = rgb(color)
        run.font.bold = color == RED

    add_center_text(slide, 2.05, 5.4, 9.2, 0.35, "Fraud filters catch known patterns. They don't know your family.", font_name=BODY_FONT, font_size=13, color=MUTED_DARK)
    add_center_text(slide, 2.6, 5.83, 8.2, 0.3, "Source: State of Scams USA 2025 — GASA / Iris Powered by Generali", font_name=BODY_FONT, font_size=10, color=MUTED_DARK)


def build_slide_3(slide):
    set_background(slide)
    add_textbox(slide, Inches(0.8), Inches(0.55), Inches(4.5), Inches(0.5), "The Solution", font_name=HEADING_FONT, font_size=28, color=LIGHT)
    lead = slide.shapes.add_textbox(Inches(2.2), Inches(1.2), Inches(9.0), Inches(0.8))
    tf = lead.text_frame
    tf.clear()
    p1 = tf.paragraphs[0]
    p1.alignment = PP_ALIGN.CENTER
    for text, color in [
        ("Every household member gets a ", LIGHT),
        ("dedicated AI companion", AMBER),
    ]:
        run = p1.add_run()
        run.text = text
        run.font.name = BODY_FONT
        run.font.size = Pt(18)
        run.font.color.rgb = rgb(color)
        run.font.bold = color == AMBER
    p2 = tf.add_paragraph()
    p2.alignment = PP_ALIGN.CENTER
    run = p2.add_run()
    run.text = "that learns their patterns and silently protects them."
    run.font.name = BODY_FONT
    run.font.size = Pt(18)
    run.font.color.rgb = rgb(LIGHT)

    cards = [
        ("🛡️", "ANCHOR", AMBER, "Senior Protection\nPatience-first, scam interception,\ntrusted contact verification"),
        ("⚔️", "SENTINEL", TEAL, "Adult Protection\nPrimary coordinator, household\norchestration, threat relay"),
        ("🔭", "SCOUT", SLATE, "Teen Protection\nAge-appropriate, social\nengineering defense"),
    ]
    x_positions = [0.95, 4.55, 8.15]
    for x, (icon, name, color, role) in zip(x_positions, cards):
        add_card(slide, x, 2.2, 3.0, 2.45)
        add_center_text(slide, x + 0.2, 2.38, 2.6, 0.35, icon, font_name=BODY_FONT, font_size=22, color=LIGHT)
        add_center_text(slide, x + 0.2, 2.77, 2.6, 0.35, name, font_name=HEADING_FONT, font_size=24, color=color, bold=True)
        add_center_text(slide, x + 0.22, 3.18, 2.56, 1.1, role, font_name=BODY_FONT, font_size=12, color=MUTED)

    add_center_text(slide, 2.1, 5.15, 9.2, 0.4, "Not a chatbot. Not a filter. A companion that knows you.", font_name=BODY_FONT, font_size=13, color=MUTED_DARK)


def build_slide_4(slide):
    set_background(slide)
    add_textbox(slide, Inches(0.8), Inches(0.5), Inches(4.5), Inches(0.5), "How It Learns", font_name=HEADING_FONT, font_size=28, color=LIGHT)
    add_center_text(slide, 2.7, 1.0, 8.0, 0.35, "Each companion deepens its understanding over time", font_name=BODY_FONT, font_size=14, color=MUTED)

    stages = [
        ("Baseline", CARD_FILL, LIGHT),
        ("Pattern Recognition", CARD_FILL, LIGHT),
        ("Predictive", "3A2C12", AMBER),
        ("Cortege Mode", CARD_FILL, LIGHT),
    ]
    stage_x = [1.05, 3.25, 6.05, 8.45]
    stage_w = [1.8, 2.45, 1.75, 2.0]
    for i, (x, w) in enumerate(zip(stage_x, stage_w)):
        label, fill_color, text_color = stages[i]
        shape = add_card(slide, x, 1.55, w, 0.55, fill_color=fill_color, line_color="5A4A30")
        shape.line.width = Pt(1.2)
        add_center_text(slide, x + 0.03, 1.59, w - 0.06, 0.43, label, font_name=BODY_FONT, font_size=11, color=text_color, bold=(label == "Predictive"))
        if i < len(stage_x) - 1:
            add_center_text(slide, x + w + 0.03, 1.6, 0.35, 0.4, "›", font_name=BODY_FONT, font_size=20, color=MUTED_DARK)

    add_divider(slide, 6.36, 2.45, 0.6)
    add_center_text(slide, 2.35, 2.8, 8.7, 0.4, "Day 1 — it listens.", font_name=BODY_FONT, font_size=18, color=MUTED)
    add_center_text(slide, 2.1, 3.22, 9.1, 0.4, "Week 1 — it recognizes who usually calls.", font_name=BODY_FONT, font_size=18, color=MUTED)
    add_center_text(slide, 1.85, 3.64, 9.6, 0.4, "Week 2 — it blocks the scam before Grandma picks up.", font_name=BODY_FONT, font_size=18, color=AMBER)

    levels = [
        ("L0\nLog", "14312A", LIGHT),
        ("L1\nLow", "16352F", LIGHT),
        ("L2\nMonitor", "2D2411", LIGHT),
        ("L3\nNotify", "4A3715", LIGHT),
        ("L4\nBlock + Alert", "4D1F1F", RED),
    ]
    x = 1.35
    width = 2.15
    for label, fill_color, text_color in levels:
        shape = slide.shapes.add_shape(MSO_AUTO_SHAPE_TYPE.RECTANGLE, Inches(x), Inches(4.55), Inches(width), Inches(0.62))
        set_shape_style(shape, fill_color, CARD_LINE)
        add_center_text(slide, x, 4.56, width, 0.58, label, font_name=BODY_FONT, font_size=11, color=text_color, bold=True)
        x += width

    add_center_text(slide, 1.9, 5.35, 9.6, 0.3, "5-tier escalation: from silent logging to hard-blocking the call and alerting the family", font_name=BODY_FONT, font_size=10, color=MUTED_DARK)


def build_slide_5(slide):
    set_background(slide)
    add_textbox(slide, Inches(0.8), Inches(0.48), Inches(4.5), Inches(0.5), "Live Product", font_name=HEADING_FONT, font_size=28, color=LIGHT)

    x_positions = [0.6, 4.45, 8.3]
    for x, (label, image_path) in zip(x_positions, SCREENSHOTS.items()):
        frame = add_card(slide, x, 1.2, 3.45, 3.75, fill_color="181712", line_color=CARD_LINE)
        frame.line.width = Pt(1.2)
        add_fit_picture(slide, image_path, x + 0.1, 1.3, 3.25, 2.95)
        add_center_text(slide, x + 0.1, 4.32, 3.25, 0.35, label, font_name=BODY_FONT, font_size=11, color=MUTED)

    links = slide.shapes.add_textbox(Inches(1.0), Inches(5.42), Inches(11.3), Inches(0.45))
    tf = links.text_frame
    tf.clear()
    p = tf.paragraphs[0]
    p.alignment = PP_ALIGN.CENTER

    pieces = [
        ("Demo videos: ", None, MUTED_DARK),
        ("Household CRUD", "https://github.com/taylorparsons/cortege-hackathon/blob/main/cypress/videos/household-crud.cy.js.mp4", MUTED),
        (" · ", None, MUTED_DARK),
        ("Fraud Case", "https://github.com/taylorparsons/cortege-hackathon/blob/main/cypress/videos/fraud-case-demo.cy.js.mp4", MUTED),
        (" · ", None, MUTED_DARK),
        ("Live Feed", "https://github.com/taylorparsons/cortege-hackathon/blob/main/cypress/videos/live-feed.cy.js.mp4", MUTED),
    ]
    for text, url, color in pieces:
        run = p.add_run()
        run.text = text
        if url:
            run.hyperlink.address = url
        run.font.name = BODY_FONT
        run.font.size = Pt(11)
        run.font.color.rgb = rgb(color)


def build_slide_6(slide):
    set_background(slide)
    add_textbox(slide, Inches(0.8), Inches(0.45), Inches(6.2), Inches(0.5), "Platform, Not Just an App", font_name=HEADING_FONT, font_size=28, color=LIGHT)
    note = slide.shapes.add_textbox(Inches(1.4), Inches(0.95), Inches(10.4), Inches(0.4))
    tf = note.text_frame
    tf.clear()
    p = tf.paragraphs[0]
    p.alignment = PP_ALIGN.CENTER
    for text, color in [("Agent templates are ", MUTED), ("Markdown + YAML", AMBER), (". Create a new agent type in minutes.", MUTED)]:
        run = p.add_run()
        run.text = text
        run.font.name = BODY_FONT
        run.font.size = Pt(14)
        run.font.color.rgb = rgb(color)
        run.font.bold = color == AMBER

    top_boxes = [
        (1.25, 1.58, 2.3, 0.55, "Twilio Webhook", TEAL),
        (5.0, 1.58, 1.6, 0.55, "Manual API", CARD_FILL),
        (7.1, 1.58, 2.15, 0.55, "Scenario Simulator", CARD_FILL),
    ]
    for x, y, w, h, label, fill in top_boxes:
        shape = add_card(slide, x, y, w, h, fill_color=("16352F" if fill == TEAL else CARD_FILL), line_color=(TEAL if fill == TEAL else CARD_LINE))
        if fill == TEAL:
            shape.line.width = Pt(1.5)
        add_center_text(slide, x + 0.03, y + 0.02, w - 0.06, h - 0.04, label, font_name=BODY_FONT, font_size=12, color=LIGHT, bold=True)

    add_center_text(slide, 6.37, 2.22, 0.55, 0.35, "▼", font_name=BODY_FONT, font_size=18, color=MUTED_DARK)
    main_shape = add_card(slide, 2.35, 2.62, 8.65, 0.72, fill_color="2B2111", line_color=AMBER)
    main_shape.line.width = Pt(1.6)
    add_center_text(slide, 2.45, 2.72, 8.45, 0.48, "Event Bus  →  Orchestrator  →  Agent Instances", font_name=BODY_FONT, font_size=14, color=LIGHT, bold=True)

    add_center_text(slide, 6.37, 3.45, 0.55, 0.35, "▼", font_name=BODY_FONT, font_size=18, color=MUTED_DARK)
    lower = [
        (1.1, 3.82, 3.3, 0.9, "Claude API\nHaiku 4.5 + caching"),
        (4.95, 3.82, 2.45, 0.9, "Memory Store\nper-instance depth"),
        (7.9, 3.82, 3.05, 0.9, "Escalation Engine\nL0–L4 routing"),
    ]
    for x, y, w, h, text in lower:
        add_card(slide, x, y, w, h)
        add_center_text(slide, x + 0.05, y + 0.08, w - 0.1, h - 0.15, text, font_name=BODY_FONT, font_size=12, color=LIGHT)

    add_center_text(slide, 6.37, 4.95, 0.55, 0.35, "▼", font_name=BODY_FONT, font_size=18, color=MUTED_DARK)
    storage = add_card(slide, 1.05, 5.28, 11.25, 0.62, fill_color=CARD_FILL, line_color=CARD_LINE)
    storage.line.width = Pt(1.2)
    add_center_text(
        slide,
        1.15,
        5.36,
        11.05,
        0.42,
        "SQLite  ·  Append-only event log  ·  SHA-256 hash chain  ·  PII encryption at rest",
        font_name=BODY_FONT,
        font_size=12,
        color=LIGHT,
    )

    add_center_text(slide, 1.4, 6.12, 10.6, 0.35, "Multi-household orchestration  ·  WebSocket real-time push  ·  Hot-reload agent templates", font_name=BODY_FONT, font_size=11, color=MUTED_DARK)


def build_slide_7(slide):
    set_background(slide)
    add_textbox(slide, Inches(0.8), Inches(0.5), Inches(8.4), Inches(0.55), "This Isn't a Demo — It's Infrastructure", font_name=HEADING_FONT, font_size=28, color=LIGHT)
    badges = [
        "🔒  PII encryption at rest",
        "🔗  Append-only SHA-256 hash chain",
        "🚨  L0–L4 escalation tiers",
        "✅  174 passing tests",
        "💰  64% cost reduction via prompt caching",
        "📞  Twilio voice webhook integration",
        "🏠  Multi-household data isolation",
        "📝  Tamper-evident audit log",
    ]
    positions = [
        (0.8, 1.45), (3.55, 1.45), (6.3, 1.45), (9.05, 1.45),
        (0.8, 2.2), (3.55, 2.2), (6.3, 2.2), (9.05, 2.2),
    ]
    for (x, y), text in zip(positions, badges):
        add_card(slide, x, y, 2.55, 0.52, fill_color=CARD_FILL, line_color=CARD_LINE)
        add_center_text(slide, x + 0.05, y + 0.05, 2.45, 0.38, text, font_name=BODY_FONT, font_size=10.5, color=LIGHT)

    add_divider(slide, 6.36, 3.15, 0.6)
    add_center_text(slide, 2.25, 3.55, 8.8, 0.42, "Solo developer  ·  One week  ·  Full-stack agent orchestration system", font_name=BODY_FONT, font_size=14, color=MUTED)


def build_slide_8(slide):
    set_background(slide)
    add_textbox(slide, Inches(0.8), Inches(0.45), Inches(4.5), Inches(0.5), "The Business", font_name=HEADING_FONT, font_size=28, color=LIGHT)

    stats = [
        (1.0, "130M", LIGHT, "US households"),
        (4.7, "$64B", TEAL, "annual scam losses"),
        (8.35, "3→N", SLATE, "agent types scale"),
    ]
    for x, value, color, label in stats:
        add_center_text(slide, x, 1.12, 2.8, 0.7, value, font_name=HEADING_FONT, font_size=40, color=color, bold=True)
        add_center_text(slide, x, 1.8, 2.8, 0.35, label, font_name=BODY_FONT, font_size=13, color=MUTED)

    add_divider(slide, 6.36, 2.35, 0.6)
    add_textbox(slide, Inches(3.3), Inches(2.7), Inches(6.9), Inches(0.35), "Start: Elder care + family safety", font_name=BODY_FONT, font_size=16, color=AMBER)
    add_textbox(slide, Inches(3.3), Inches(3.14), Inches(6.9), Inches(0.35), "Expand: Any per-person behavioral agent", font_name=BODY_FONT, font_size=16, color=TEAL)
    add_center_text(slide, 3.15, 3.55, 7.2, 0.3, "Health monitoring  ·  Financial guardianship  ·  Education", font_name=BODY_FONT, font_size=11, color=MUTED)
    add_textbox(slide, Inches(3.3), Inches(3.98), Inches(6.9), Inches(0.35), "Moat: Behavioral depth compounds over time", font_name=BODY_FONT, font_size=16, color=SLATE)
    add_center_text(slide, 3.45, 4.38, 6.6, 0.3, "The longer a companion runs, the harder it is to replace", font_name=BODY_FONT, font_size=11, color=MUTED_DARK)

    line = slide.shapes.add_shape(MSO_AUTO_SHAPE_TYPE.RECTANGLE, Inches(2.1), Inches(5.15), Inches(9.1), Inches(0.02))
    set_shape_style(line, CARD_LINE, CARD_LINE, 0)

    footer = slide.shapes.add_textbox(Inches(1.2), Inches(5.45), Inches(10.9), Inches(0.42))
    tf = footer.text_frame
    tf.clear()
    p = tf.paragraphs[0]
    p.alignment = PP_ALIGN.CENTER
    pieces = [
        ("github.com/taylorparsons/cortege-hackathon", "https://github.com/taylorparsons/cortege-hackathon", MUTED),
        ("  ·  Taylor Parsons  ·  Rich Rosenthal  ·  Jennifer McKinney", None, LIGHT),
    ]
    for text, url, color in pieces:
        run = p.add_run()
        run.text = text
        if url:
            run.hyperlink.address = url
        run.font.name = BODY_FONT
        run.font.size = Pt(12)
        run.font.color.rgb = rgb(color)


if __name__ == "__main__":
    build_presentation()
