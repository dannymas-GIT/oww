#!/usr/bin/env python3
"""Generate OWW RFP coverage PDF (NY response standard practice).

Usage:
  /tmp/oww-rfp-pdf-venv/bin/python scripts/generate_rfp_coverage_pdf.py
"""

from __future__ import annotations

from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import (
    Image,
    KeepTogether,
    ListFlowable,
    ListItem,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

# Paths: script lives in saas-repos/oww/scripts/
REPO = Path(__file__).resolve().parents[1]
OUT = REPO / "docs" / "oww-rfp-coverage.pdf"
OUT_HTML = REPO / "docs" / "oww-rfp-coverage.html"
OUT_HTML_PUBLIC = REPO / "frontend" / "public" / "oww-rfp-coverage.html"
# Prefer in-repo evidence (OWW workspace); fall back to Cursor canvases folder.
_CANVAS_EVIDENCE = Path.home() / ".cursor/projects/opt-projects-saas-repos-ww360/canvases/oww-rfp-evidence"
EVIDENCE = REPO / "docs" / "oww-rfp-evidence"
if not EVIDENCE.is_dir() or not any(EVIDENCE.glob("*.png")):
    EVIDENCE = _CANVAS_EVIDENCE
PUBLIC_EVIDENCE = REPO / "frontend" / "public" / "oww-rfp-evidence"

NAVY = colors.HexColor("#002050")
CYAN = colors.HexColor("#005df8")
LIGHT = colors.HexColor("#f4f7fb")
BORDER = colors.HexColor("#d0d7e2")
GREEN = colors.HexColor("#1b7f4a")
AMBER = colors.HexColor("#a15c00")
GRAY = colors.HexColor("#5a6577")

EVIDENCE_ITEMS = [
    ("01-home.png", "RFP 4.3", "Provided", "Public landing + pathways", "Homepage CTA + Career / Hire / Educate / Ambassador navigation"),
    ("02-career-pathway.png", "RFP 4.3 Career", "Partial", "Career pathway depth", "Job board, checklist, training awareness, next steps"),
    ("03-hire-pathway.png", "RFP 4.3 Employer", "Provided", "Hire pathway", "Employer portal entry + hiring tools"),
    ("04-educate-pathway.png", "RFP 4.3 Educator", "Partial", "Educate pathway", "Lesson plans, courses, outreach for educators"),
    ("05-ambassador-pathway.png", "RFP 4.3 Ambassador", "Partial", "Ambassador pathway", "Outreach toolkits, workforce stats, legislative tools"),
    ("06-jobs-board.png", "RFP 4.3 / Phase I", "Provided", "Public job board", "Statewide job board with filter/sort"),
    ("07-interest-form.png", "RFP 4.2", "Provided", "Pathways Interest & Access", "Structured interest form feeding the pipeline"),
    ("08-pricing.png", "RFP 4.3 / Phase I", "Provided", "Membership / paywall", "Membership information + payment to post jobs"),
    ("09-login.png", "Phase I quote", "Provided", "Local account sign-in", "Auth for candidates, employers, admins"),
    ("10-mobile-home.png", "RFP Tech", "Partial", "Mobile responsive", "Mobile-friendly experience + accessible type"),
    ("11-admin-dashboard.png", "Phase I quote", "Provided", "Platform admin dashboard", "Admin backend — memberships, expiring/expired, outreach"),
    ("12-admin-memberships.png", "Phase I quote", "Provided", "Memberships inventory", "Existing / expiring / expired membership visibility"),
    ("13-admin-communications.png", "Phase I quote", "Provided", "Communications portal", "Member outreach by role and membership state"),
    ("14-admin-users.png", "Phase I / AquaSafe", "Provided", "Users & access", "Role hierarchy: platform, utility admin/manager, student, etc."),
    ("15-admin-roles.png", "Phase I / security", "Provided", "Roles & permissions", "Protected national/state roles; utility fine-tune only"),
    ("16-admin-analytics.png", "RFP 4.1", "Provided", "Pipeline analytics", "Dashboards interest→employment by region / stage"),
    ("17-view-as-role.png", "SaaS standard", "Provided", "View as role", "Admin preview of product as each persona"),
    ("18-employer-workspace.png", "RFP 4.3 / Phase I", "Provided", "Employer hiring workspace", "Employer dashboard, jobs, candidates, membership status"),
    ("19-employer-jobs.png", "Phase I quote", "Provided", "Job posting (gated)", "Employer post/edit jobs; payment gate when required"),
    ("20-candidate-dashboard.png", "Matching / Phase I", "Provided", "Candidate / matching", "Individual profile + matching questionnaire"),
]

MATRIX = [
    ("RFP 4.3", "Homepage CTA + pathway navigation (Career / Hire / Educate / Ambassador)", "Provided", "Landing + Pathways flyout + four deepened pathway pages"),
    ("RFP 4.3", "Microvideo + testimonials on homepage", "Partial", "Testimonials live; authentic OWW microvideo still needed"),
    ("RFP 4.3", "Real photography brand alignment", "Partial", "Official logo + navy/cyan palette; licensed photo library pending"),
    ("RFP 4.2", "Pathways Interest & Access form", "Provided", "/:state/interest with structured fields → engagement pipeline"),
    ("RFP 4.1", "Pipeline interest→engagement→training→interview→employment", "Provided", "engagement_events + admin analytics + CSV"),
    ("RFP 4.1", "Dashboards by region / career stage / outcomes", "Provided", "Admin analytics filters + export"),
    ("RFP 4.3 Career", "Job board, training map, checklist, CEU, resume tools", "Partial", "Jobs + checklist; CEU/map lightweight"),
    ("RFP 4.3 Employer", "Job posting, resume bank, employer dashboard", "Provided", "Hiring workspace + paywall + candidate search"),
    ("RFP 4.3 Educator", "Lesson plans, courses, outreach toolkits", "Partial", "Pathway + educator CRUD; CMS resources stub"),
    ("RFP 4.3 Ambassador", "Outreach toolkits, stats, legislative tools", "Partial", "Stats/talking points; legislative toolkit light"),
    ("RFP 5.1", "Workforce program submission + admin approval", "Provided", "Public submit + admin programs queue"),
    ("RFP 5.2", "Multi-state / national map / state microsites", "Partial", "state_code + /:state + national map; NY staged"),
    ("RFP Tech", "Mobile responsive + WCAG approach", "Partial", "Responsive + type/touch floors; formal audit pending"),
    ("RFP Tech", "CRM / email integration readiness", "Partial", "Webhook + SMTP/Twilio hooks; live CRM not connected"),
    ("Phase I", "Local accounts + OTP for community", "Provided", "Password primary (email/username); OTP secondary"),
    ("Phase I", "Candidate dashboard + matching questionnaire", "Provided", "17 categories + 4 match types"),
    ("Phase I", "Employer jobs + match feed + applicants", "Provided", "Jobs manage, candidates, applications, messaging"),
    ("Phase I", "Membership / payment to post jobs", "Provided", "Sample Stripe; 402 membership_required on hiring APIs"),
    ("Phase I", "Roles: platform, utility admin/manager, student…", "Provided", "WW360-aligned catalog; locked national/state"),
    ("Phase I", "Platform admin: memberships, expiring, communications", "Provided", "/admin + memberships + communications portal"),
    ("Phase I", "Admin CMS / programs / analytics / certs / locations", "Provided", "Full Administration nav group"),
    ("Matching", "17 shared categories + 4 match types", "Provided", "YAML taxonomy + scorer"),
    ("Phase II", "Regional pages, favorites, messaging, interviews", "Provided", "Routes + APIs + pathway deep-links"),
    ("Phase II", "Educator courses/events + featured social", "Partial", "CRUD + featured queue; social adapters stubbed"),
    ("SaaS std", "View as role (preview / act-as)", "Provided", "Persona switcher + read-only preview + audit"),
    ("SaaS std", "Page-aware in-app tours", "Provided", "tourForPath + data-tour highlights per route"),
    ("Public OWW", "Training Center (B&L) messaging", "Provided", "Landing + educate/career cite Gold Standard"),
    ("Public OWW", "Official logo + From GED to PhD lockup", "Provided", "Nav/footer/landing/login; #002050 / #005df8"),
    ("Public OWW", "Partner contact Jenny Ingrao-Aman", "Provided", "Landing + ambassador"),
    ("Later", "WW360 SSO federation", "Later", "Role vocabulary + sso_* columns reserved"),
]


def styles():
    base = getSampleStyleSheet()
    return {
        "cover_title": ParagraphStyle(
            "cover_title",
            parent=base["Heading1"],
            fontSize=22,
            leading=26,
            textColor=NAVY,
            spaceAfter=8,
            alignment=TA_CENTER,
            fontName="Helvetica-Bold",
        ),
        "cover_sub": ParagraphStyle(
            "cover_sub",
            parent=base["Normal"],
            fontSize=11,
            leading=15,
            textColor=GRAY,
            alignment=TA_CENTER,
            spaceAfter=6,
        ),
        "h1": ParagraphStyle(
            "h1",
            parent=base["Heading1"],
            fontSize=16,
            leading=20,
            textColor=NAVY,
            spaceBefore=4,
            spaceAfter=10,
            fontName="Helvetica-Bold",
        ),
        "h2": ParagraphStyle(
            "h2",
            parent=base["Heading2"],
            fontSize=13,
            leading=16,
            textColor=NAVY,
            spaceBefore=8,
            spaceAfter=6,
            fontName="Helvetica-Bold",
        ),
        "body": ParagraphStyle(
            "body",
            parent=base["Normal"],
            fontSize=10,
            leading=14,
            textColor=colors.black,
            spaceAfter=6,
            alignment=TA_LEFT,
        ),
        "caption": ParagraphStyle(
            "caption",
            parent=base["Normal"],
            fontSize=9,
            leading=12,
            textColor=GRAY,
            spaceAfter=4,
        ),
        "meta": ParagraphStyle(
            "meta",
            parent=base["Normal"],
            fontSize=8,
            leading=10,
            textColor=GRAY,
            spaceAfter=2,
        ),
        "cell": ParagraphStyle(
            "cell",
            parent=base["Normal"],
            fontSize=7.5,
            leading=9.5,
            textColor=colors.black,
        ),
        "cell_head": ParagraphStyle(
            "cell_head",
            parent=base["Normal"],
            fontSize=8,
            leading=10,
            textColor=colors.white,
            fontName="Helvetica-Bold",
        ),
        "status_p": ParagraphStyle(
            "status_p",
            parent=base["Normal"],
            fontSize=8,
            leading=10,
            fontName="Helvetica-Bold",
            alignment=TA_CENTER,
        ),
    }


def status_color(status: str):
    if status == "Provided":
        return GREEN
    if status == "Partial":
        return AMBER
    if status == "Gap":
        return colors.HexColor("#b42318")
    return CYAN


def status_hex(status: str) -> str:
    if status == "Provided":
        return "#1b7f4a"
    if status == "Partial":
        return "#a15c00"
    if status == "Gap":
        return "#b42318"
    return "#005df8"


def footer(canvas, doc):
    canvas.saveState()
    canvas.setStrokeColor(BORDER)
    canvas.setLineWidth(0.5)
    canvas.line(0.7 * inch, 0.55 * inch, letter[0] - 0.7 * inch, 0.55 * inch)
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(GRAY)
    canvas.drawString(
        0.7 * inch,
        0.35 * inch,
        "One Water Workforce — RFP coverage evidence · Confidential for NYSAWWA review",
    )
    canvas.drawRightString(letter[0] - 0.7 * inch, 0.35 * inch, f"Page {doc.page}")
    canvas.restoreState()


def evidence_block(s, filename, source, status, title, request):
    path = EVIDENCE / filename
    bits = [
        Paragraph(f"<b>{title}</b> — {request}", s["body"]),
        Paragraph(f"Source: {source} · Status: <font color='{status_hex(status)}'><b>{status}</b></font> · Evidence: {filename}", s["meta"]),
    ]
    if path.exists():
        # Fit image to page width (~7.1"); cap height so blocks stay readable
        max_w = 7.1 * inch
        max_h = 4.2 * inch
        img = Image(str(path))
        iw, ih = img.imageWidth, img.imageHeight
        scale = min(max_w / iw, max_h / ih)
        img.drawWidth = iw * scale
        img.drawHeight = ih * scale
        bits.append(Spacer(1, 4))
        bits.append(img)
        bits.append(Paragraph(f"Staging: https://oww.aquasafe-solutions.us · {filename}", s["meta"]))
    else:
        bits.append(Paragraph(f"<i>Missing image: {filename}</i>", s["caption"]))
    bits.append(Spacer(1, 10))
    return KeepTogether(bits)


def build():
    s = styles()
    OUT.parent.mkdir(parents=True, exist_ok=True)
    doc = SimpleDocTemplate(
        str(OUT),
        pagesize=letter,
        leftMargin=0.7 * inch,
        rightMargin=0.7 * inch,
        topMargin=0.65 * inch,
        bottomMargin=0.75 * inch,
        title="OWW RFP Coverage & Site Synopsis",
        author="AquaSafe / Scriptable Solutions",
    )
    story = []

    # Cover
    story.append(Spacer(1, 1.2 * inch))
    story.append(Paragraph("One Water Workforce", s["cover_title"]))
    story.append(Paragraph("RFP Coverage Report & Site Synopsis", s["cover_title"]))
    story.append(Spacer(1, 0.25 * inch))
    story.append(
        Paragraph(
            "Request vs provided coverage for the NYSAWWA One Water Workforce engagement, "
            "with live staging evidence. This PDF is the response deliverable; the interactive "
            "canvas is the working draft used while assembling evidence.",
            s["cover_sub"],
        )
    )
    story.append(Spacer(1, 0.2 * inch))
    story.append(Paragraph("Staging: https://oww.aquasafe-solutions.us (IP-whitelisted)", s["cover_sub"]))
    story.append(Paragraph("Updated: 2026-09-30 · Brand: navy #002050 · accent #005df8", s["cover_sub"]))
    story.append(Paragraph("Sources: NYSAWWA RFP · Phase I/II quotes · matching framework · public OWW materials", s["cover_sub"]))
    story.append(Spacer(1, 0.45 * inch))

    provided = sum(1 for r in MATRIX if r[2] == "Provided")
    partial = sum(1 for r in MATRIX if r[2] == "Partial")
    later = sum(1 for r in MATRIX if r[2] == "Later")
    gap = sum(1 for r in MATRIX if r[2] == "Gap")
    summary = Table(
        [[
            Paragraph(f"<b>{provided}</b><br/>Provided", s["cover_sub"]),
            Paragraph(f"<b>{partial}</b><br/>Partial", s["cover_sub"]),
            Paragraph(f"<b>{gap}</b><br/>Gap", s["cover_sub"]),
            Paragraph(f"<b>{later}</b><br/>Later", s["cover_sub"]),
            Paragraph(f"<b>{len(MATRIX)}</b><br/>Tracked", s["cover_sub"]),
        ]],
        colWidths=[1.3 * inch] * 5,
    )
    summary.setStyle(
        TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), LIGHT),
            ("BOX", (0, 0), (-1, -1), 0.75, CYAN),
            ("INNERGRID", (0, 0), (-1, -1), 0.4, BORDER),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("TOPPADDING", (0, 0), (-1, -1), 10),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
        ])
    )
    story.append(summary)
    story.append(PageBreak())

    # Synopsis
    story.append(Paragraph("1. Site synopsis", s["h1"]))
    story.append(
        Paragraph(
            "One Water Workforce is a NYSAWWA-branded multi-pathway workforce platform: public microsite "
            "for New York, authenticated hiring and candidate workspaces, membership paywall (sample Stripe), "
            "and a platform administration suite. Brand lockup uses the official droplet logo, tagline "
            "“From GED to PhD: A Job for Everyone,” navy #002050 and accent #005df8. Primary audiences: "
            "job seekers/students, employers/utilities, educators, ambassadors, state partners, and platform operators.",
            s["body"],
        )
    )
    story.append(Paragraph("What visitors get", s["h2"]))
    story.append(
        ListFlowable(
            [
                ListItem(Paragraph("State home (/ny) with pathways flyout, jobs, companies, interest, programs", s["body"]), leftIndent=12),
                ListItem(Paragraph("Four deepened pathways (Career / Hire / Educate / Ambassador)", s["body"]), leftIndent=12),
                ListItem(Paragraph("Public job board and company directory", s["body"]), leftIndent=12),
                ListItem(Paragraph("Membership pricing + sample checkout to unlock hiring tools", s["body"]), leftIndent=12),
                ListItem(Paragraph("Local password sign-in (OTP optional for community)", s["body"]), leftIndent=12),
                ListItem(Paragraph("Page-aware tours that highlight the current route", s["body"]), leftIndent=12),
            ],
            bulletType="bullet",
            start="•",
        )
    )
    story.append(Paragraph("What operators get", s["h2"]))
    story.append(
        ListFlowable(
            [
                ListItem(Paragraph("Platform dashboard: memberships, expiring/expired, sample ARR, accounts by role", s["body"]), leftIndent=12),
                ListItem(Paragraph("Memberships table + communications portal (role + membership audience)", s["body"]), leftIndent=12),
                ListItem(Paragraph("Users & access with WW360-aligned role tiers (national/state locked)", s["body"]), leftIndent=12),
                ListItem(Paragraph("View as role preview/act-as for support walkthroughs", s["body"]), leftIndent=12),
                ListItem(Paragraph("Analytics, CMS, programs, featured posts, certifications, locations, national map", s["body"]), leftIndent=12),
                ListItem(Paragraph("Employer/utility hiring workspace (jobs, candidates, team, billing)", s["body"]), leftIndent=12),
            ],
            bulletType="bullet",
            start="•",
        )
    )
    story.append(PageBreak())

    # Evidence
    story.append(Paragraph("2. Evidence gallery", s["h1"]))
    story.append(
        Paragraph(
            "Screenshots from staging, each mapped to an RFP / Phase I requirement cluster. "
            "Captured 2026-09-30 from https://oww.aquasafe-solutions.us.",
            s["body"],
        )
    )
    for filename, source, status, title, request in EVIDENCE_ITEMS:
        story.append(evidence_block(s, filename, source, status, title, request))
        # Soft page breaks: every evidence item is KeepTogether; let flow paginate naturally

    story.append(PageBreak())

    # Matrix
    story.append(Paragraph("3. Full request vs provided", s["h1"]))
    story.append(
        Paragraph(
            "Status vocabulary: <b>Provided</b> · <b>Partial</b> · <b>Gap</b> · <b>Later</b>. "
            "Provided means AuthZ/API-backed capability on staging — not a UI-only stub.",
            s["body"],
        )
    )
    header = [
        Paragraph("Source", s["cell_head"]),
        Paragraph("Request", s["cell_head"]),
        Paragraph("Status", s["cell_head"]),
        Paragraph("What we provided", s["cell_head"]),
    ]
    rows = [header]
    for source, request, status, provided_txt in MATRIX:
        rows.append([
            Paragraph(source, s["cell"]),
            Paragraph(request, s["cell"]),
            Paragraph(f'<font color="{status_hex(status)}"><b>{status}</b></font>', s["status_p"]),
            Paragraph(provided_txt, s["cell"]),
        ])
    table = Table(rows, colWidths=[0.95 * inch, 2.55 * inch, 0.75 * inch, 2.85 * inch], repeatRows=1)
    table.setStyle(
        TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), NAVY),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("BACKGROUND", (0, 1), (-1, -1), colors.white),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, LIGHT]),
            ("BOX", (0, 0), (-1, -1), 0.6, BORDER),
            ("INNERGRID", (0, 0), (-1, -1), 0.4, BORDER),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("LEFTPADDING", (0, 0), (-1, -1), 4),
            ("RIGHTPADDING", (0, 0), (-1, -1), 4),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ])
    )
    story.append(table)
    story.append(PageBreak())

    # Gaps + playbook
    story.append(Paragraph("4. Gaps to prioritize", s["h1"]))
    story.append(
        ListFlowable(
            [
                ListItem(Paragraph("Licensed photography / authentic OWW microvideo", s["body"]), leftIndent=12),
                ListItem(Paragraph("Live CRM + production email/SMS", s["body"]), leftIndent=12),
                ListItem(Paragraph("CEU tracking depth + training map UX", s["body"]), leftIndent=12),
                ListItem(Paragraph("Formal WCAG audit", s["body"]), leftIndent=12),
                ListItem(Paragraph("Additional state microsites beyond NY", s["body"]), leftIndent=12),
                ListItem(Paragraph("WW360 SSO federation (Later)", s["body"]), leftIndent=12),
            ],
            bulletType="bullet",
            start="•",
        )
    )
    story.append(Paragraph("5. Playbook — next NY RFP", s["h1"]))
    story.append(
        Paragraph(
            "This PDF is the standardized shippable artifact for NY RFP / RFQ responses. "
            "Working process while assembling:",
            s["body"],
        )
    )
    story.append(
        ListFlowable(
            [
                ListItem(Paragraph("Pull RFP + Phase quotes + appendices into one requirement inventory.", s["body"]), leftIndent=12),
                ListItem(Paragraph("Draft coverage in the interactive canvas; status: Provided / Partial / Gap / Later.", s["body"]), leftIndent=12),
                ListItem(Paragraph("Stage a branded build behind IP whitelist; seed demo personas for RFP audiences.", s["body"]), leftIndent=12),
                ListItem(Paragraph("Capture evidence screenshots per requirement cluster into *-rfp-evidence/.", s["body"]), leftIndent=12),
                ListItem(Paragraph("Write the one-page site synopsis (visitor vs operator) before the matrix.", s["body"]), leftIndent=12),
                ListItem(Paragraph("Regenerate this PDF and attach it to the response package.", s["body"]), leftIndent=12),
                ListItem(Paragraph("Ship product changes via git/PR into develop (no dirty-tree rsync as primary path).", s["body"]), leftIndent=12),
            ],
            bulletType="1",
        )
    )
    story.append(Spacer(1, 0.3 * inch))
    story.append(
        Paragraph(
            "Artifact locations — PDF: saas-repos/oww/docs/oww-rfp-coverage.pdf · "
            "Canvas draft: canvases/oww-rfp-coverage.canvas.tsx · "
            "Evidence PNGs: canvases/oww-rfp-evidence/ · "
            "Notes: saas-repos/oww/docs/rfp-coverage.md · "
            "Practice rule: rfp-response-evidence.mdc",
            s["caption"],
        )
    )

    doc.build(story, onFirstPage=footer, onLaterPages=footer)
    print(f"Wrote {OUT} ({OUT.stat().st_size} bytes)")


def _esc(text: str) -> str:
    return (
        text.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
    )


def build_html() -> None:
    """HTML twin for in-Cursor viewing (SSH remotes cannot render PDF natively)."""
    provided = sum(1 for r in MATRIX if r[2] == "Provided")
    partial = sum(1 for r in MATRIX if r[2] == "Partial")
    later = sum(1 for r in MATRIX if r[2] == "Later")
    gap = sum(1 for r in MATRIX if r[2] == "Gap")

    evidence_html = []
    for filename, source, status, title, request in EVIDENCE_ITEMS:
        rel = f"oww-rfp-evidence/{filename}"
        evidence_html.append(
            f"""
<section class="evidence">
  <h3>{_esc(title)}</h3>
  <p class="req">{_esc(request)}</p>
  <p class="meta"><span class="pill">{_esc(source)}</span>
    <span class="status status-{_esc(status.lower())}">{_esc(status)}</span>
    · {_esc(filename)}</p>
  <figure>
    <img src="{_esc(rel)}" alt="{_esc(title)}" loading="lazy" />
    <figcaption>Staging: https://oww.aquasafe-solutions.us · {_esc(filename)}</figcaption>
  </figure>
</section>"""
        )

    rows_html = []
    for source, request, status, provided_txt in MATRIX:
        rows_html.append(
            "<tr>"
            f"<td>{_esc(source)}</td>"
            f"<td>{_esc(request)}</td>"
            f'<td><span class="status status-{_esc(status.lower())}">{_esc(status)}</span></td>'
            f"<td>{_esc(provided_txt)}</td>"
            "</tr>"
        )

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>OWW RFP Coverage &amp; Site Synopsis</title>
<style>
  :root {{
    --navy: #002050;
    --cyan: #005df8;
    --light: #f4f7fb;
    --border: #d0d7e2;
    --gray: #5a6577;
    --green: #1b7f4a;
    --amber: #a15c00;
    --red: #b42318;
  }}
  * {{ box-sizing: border-box; }}
  body {{
    margin: 0;
    font-family: "Segoe UI", system-ui, sans-serif;
    font-size: 1.125rem;
    line-height: 1.55;
    color: #122;
    background: #fff;
  }}
  header {{
    background: var(--navy);
    color: #fff;
    padding: 2rem 1.5rem 1.75rem;
  }}
  header h1 {{ margin: 0 0 0.5rem; font-size: 1.75rem; }}
  header p {{ margin: 0.35rem 0; color: #c9d7ef; font-size: 1rem; }}
  main {{ max-width: 52rem; margin: 0 auto; padding: 1.5rem; }}
  h2 {{ color: var(--navy); margin-top: 2rem; border-bottom: 2px solid var(--cyan); padding-bottom: 0.35rem; }}
  h3 {{ color: var(--navy); margin-bottom: 0.35rem; }}
  .stats {{
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 0.75rem;
    margin: 1.25rem 0;
  }}
  .stat {{
    background: var(--light);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 0.85rem;
    text-align: center;
  }}
  .stat strong {{ display: block; font-size: 1.5rem; color: var(--navy); }}
  .stat span {{ font-size: 0.875rem; color: var(--gray); }}
  .callout {{
    background: #eef4ff;
    border-left: 4px solid var(--cyan);
    padding: 0.9rem 1rem;
    margin: 1rem 0;
    font-size: 1rem;
  }}
  .grid2 {{ display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }}
  @media (max-width: 800px) {{
    .stats {{ grid-template-columns: repeat(2, 1fr); }}
    .grid2 {{ grid-template-columns: 1fr; }}
  }}
  .card {{
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 1rem;
    background: var(--light);
  }}
  .card h3 {{ margin-top: 0; }}
  ul {{ padding-left: 1.2rem; }}
  .evidence {{
    margin: 1.5rem 0 2rem;
    padding-bottom: 1.25rem;
    border-bottom: 1px solid var(--border);
  }}
  .req {{ font-weight: 600; margin: 0.25rem 0; }}
  .meta {{ font-size: 0.875rem; color: var(--gray); }}
  .pill {{
    display: inline-block;
    background: #e8eef8;
    color: var(--navy);
    padding: 0.15rem 0.5rem;
    border-radius: 4px;
    font-size: 0.875rem;
    margin-right: 0.35rem;
  }}
  .status {{
    display: inline-block;
    font-weight: 700;
    font-size: 0.875rem;
    padding: 0.1rem 0.45rem;
    border-radius: 4px;
  }}
  .status-provided {{ color: var(--green); background: #e8f6ee; }}
  .status-partial {{ color: var(--amber); background: #fff4e0; }}
  .status-gap {{ color: var(--red); background: #fdecea; }}
  .status-later {{ color: var(--cyan); background: #eef4ff; }}
  figure {{ margin: 0.75rem 0 0; }}
  figure img {{
    width: 100%;
    height: auto;
    border: 1px solid var(--border);
    border-radius: 6px;
    background: #fff;
  }}
  figcaption {{ font-size: 0.875rem; color: var(--gray); margin-top: 0.35rem; }}
  table {{
    width: 100%;
    border-collapse: collapse;
    font-size: 0.95rem;
  }}
  th, td {{
    border: 1px solid var(--border);
    padding: 0.45rem 0.5rem;
    vertical-align: top;
    text-align: left;
  }}
  th {{ background: var(--navy); color: #fff; }}
  tr:nth-child(even) td {{ background: var(--light); }}
  footer {{
    margin-top: 2.5rem;
    padding: 1rem 0 2rem;
    font-size: 0.875rem;
    color: var(--gray);
    border-top: 1px solid var(--border);
  }}
</style>
</head>
<body>
<header>
  <h1>One Water Workforce — RFP Coverage Report</h1>
  <p>Request vs provided with live staging evidence · Updated 2026-09-30</p>
  <p>Staging: https://oww.aquasafe-solutions.us · Brand: navy #002050 · accent #005df8</p>
</header>
<main>
  <div class="callout">
    <strong>Internal review package:</strong> request vs provided coverage for One Water Workforce,
    with live staging screenshots. Staging app:
    <a href="https://oww.aquasafe-solutions.us">https://oww.aquasafe-solutions.us</a>
    (IP-whitelisted). PDF twin: <code>docs/oww-rfp-coverage.pdf</code>.
  </div>

  <div class="stats">
    <div class="stat"><strong>{provided}</strong><span>Provided</span></div>
    <div class="stat"><strong>{partial}</strong><span>Partial</span></div>
    <div class="stat"><strong>{gap}</strong><span>Gap</span></div>
    <div class="stat"><strong>{later}</strong><span>Later</span></div>
    <div class="stat"><strong>{len(MATRIX)}</strong><span>Tracked</span></div>
  </div>

  <h2>1. Site synopsis</h2>
  <p>One Water Workforce is a NYSAWWA-branded multi-pathway workforce platform: public microsite for New York,
  authenticated hiring and candidate workspaces, membership paywall (sample Stripe), and a platform administration
  suite. Brand lockup uses the official droplet logo, tagline “From GED to PhD: A Job for Everyone,” navy #002050
  and accent #005df8. Primary audiences: job seekers/students, employers/utilities, educators, ambassadors,
  state partners, and platform operators.</p>
  <div class="grid2">
    <div class="card">
      <h3>What visitors get</h3>
      <ul>
        <li>State home (/ny) with pathways, jobs, companies, interest, programs</li>
        <li>Four deepened pathways (Career / Hire / Educate / Ambassador)</li>
        <li>Public job board and company directory</li>
        <li>Membership pricing + sample checkout</li>
        <li>Local password sign-in (OTP optional)</li>
        <li>Page-aware in-app tours</li>
      </ul>
    </div>
    <div class="card">
      <h3>What operators get</h3>
      <ul>
        <li>Platform dashboard: memberships, ARR, accounts by role</li>
        <li>Memberships + communications portal</li>
        <li>Users &amp; access (WW360-aligned tiers)</li>
        <li>View as role (preview / act-as)</li>
        <li>Analytics, CMS, programs, locations, national map</li>
        <li>Employer hiring workspace (jobs, candidates, billing)</li>
      </ul>
    </div>
  </div>

  <h2>2. Evidence gallery</h2>
  <p>Screenshots from staging, each mapped to an RFP / Phase I requirement cluster.</p>
  {"".join(evidence_html)}

  <h2>3. Full request vs provided</h2>
  <table>
    <thead>
      <tr><th>Source</th><th>Request</th><th>Status</th><th>What we provided</th></tr>
    </thead>
    <tbody>
      {"".join(rows_html)}
    </tbody>
  </table>

  <h2>4. Gaps to prioritize</h2>
  <ul>
    <li>Licensed photography / authentic OWW microvideo</li>
    <li>Live CRM + production email/SMS</li>
    <li>CEU tracking depth + training map UX</li>
    <li>Formal WCAG audit</li>
    <li>Additional state microsites beyond NY</li>
    <li>WW360 SSO federation (Later)</li>
  </ul>

  <h2>5. Playbook — next NY RFP</h2>
  <ol>
    <li>Inventory RFP + Phase quotes + appendices.</li>
    <li>Draft coverage (Provided / Partial / Gap / Later).</li>
    <li>Stage branded build; seed demo personas.</li>
    <li>Capture screenshots into <code>*-rfp-evidence/</code>.</li>
    <li>Write visitor vs operator synopsis.</li>
    <li>Regenerate HTML + PDF; attach PDF to the response package.</li>
    <li>Ship via git/PR into develop.</li>
  </ol>

  <footer>
    PDF deliverable: docs/oww-rfp-coverage.pdf · Generator: scripts/generate_rfp_coverage_pdf.py ·
    Evidence: docs/oww-rfp-evidence/ · Practice: rfp-response-evidence.mdc
  </footer>
</main>
</body>
</html>
"""
    OUT_HTML.write_text(html, encoding="utf-8")
    print(f"Wrote {OUT_HTML} ({OUT_HTML.stat().st_size} bytes)")
    # Mirror into Vite public/ so staging nginx serves the shareable URL.
    OUT_HTML_PUBLIC.parent.mkdir(parents=True, exist_ok=True)
    OUT_HTML_PUBLIC.write_text(html, encoding="utf-8")
    PUBLIC_EVIDENCE.mkdir(parents=True, exist_ok=True)
    for png in EVIDENCE.glob("*.png"):
        target = PUBLIC_EVIDENCE / png.name
        if not target.exists() or target.stat().st_mtime < png.stat().st_mtime:
            target.write_bytes(png.read_bytes())
    print(f"Wrote {OUT_HTML_PUBLIC} (+ evidence → {PUBLIC_EVIDENCE})")


if __name__ == "__main__":
    build()
    build_html()
