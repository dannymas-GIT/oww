"""
Sample Document Studio starters seeded into program libraries.

Idempotent: each sample is keyed by template_id + tag "sample".
Keep bodies aligned with frontend `owwStudioTemplates.ts` scenario starters.
"""

from __future__ import annotations

# (template_id, folder_name, title, summary, content_html)
SAMPLE_DOCUMENTS: list[tuple[str, str, str, str, str]] = [
    (
        "studio-success-story",
        "Blog drafts",
        "Sample: Success story",
        "Person → challenge → program → outcome",
        """<h2>The person</h2>
<p>Who they are, where they work or hope to work, and what brought them to water.</p>
<h2>The challenge</h2>
<p>What stood between them and a certification or job.</p>
<h2>What the program did</h2>
<p>Course, mentor, scholarship, exam prep — the specific help that mattered.</p>
<h2>The outcome</h2>
<p>Certification earned, job placed, system stabilized.</p>
<blockquote><p>A one- or two-sentence quote in their own words.</p></blockquote>""",
    ),
    (
        "studio-grant-news",
        "Blog drafts",
        "Sample: Grant / funding announcement",
        "What funded → who benefits → how to engage",
        """<h2>The opportunity</h2>
<p>Name the grant or award, the amount (if public), and the period of performance.</p>
<h2>Who it serves</h2>
<ul>
<li>Utilities / regions</li>
<li>Learners and certification pathways</li>
<li>Partner educators</li>
</ul>
<h2>What happens next</h2>
<p>Recruitment, cohorts, or application steps readers can take.</p>""",
    ),
    (
        "studio-page-pathway",
        "Landing pages",
        "Sample: Pathway landing body",
        "Promise → audience → steps → CTA",
        """<h2>Why this pathway</h2>
<p>One or two sentences on the outcome for the reader.</p>
<h2>Who it’s for</h2>
<ul>
<li>Audience segment one</li>
<li>Audience segment two</li>
</ul>
<h2>How it works</h2>
<ol>
<li>Step one — what they do first</li>
<li>Step two — what support they get</li>
<li>Step three — how success looks</li>
</ol>
<h2>Ready to start?</h2>
<p>Point to the interest form, jobs board, or WW360 enrollment.</p>""",
    ),
    (
        "studio-page-about",
        "Landing pages",
        "Sample: About / FAQ page",
        "Mission → who we serve → FAQ",
        """<h2>Our mission</h2>
<p>One Water Workforce connects learners, educators, and utilities so New York’s water systems stay staffed and resilient.</p>
<h2>Who we serve</h2>
<ul>
<li>Students and career changers</li>
<li>Utilities hiring operators</li>
<li>Educators and training partners</li>
<li>Career ambassadors</li>
</ul>
<h2>FAQ</h2>
<p><strong>Is it free to explore?</strong> Public pathways and the jobs board are open; some employer tools require membership.</p>
<p><strong>How does Water Workforce 360 fit?</strong> WW360 is the continuity and training platform utilities use after they join.</p>""",
    ),
    (
        "studio-social-hiring",
        "Social posts",
        "Sample: Social — hiring push",
        "Need → roles → where to apply",
        """<p>New York utilities are hiring operators and support roles.</p>
<p>If you care about public health and steady careers, explore openings on One Water Workforce.</p>
<p>{{url}}</p>
<p>#WaterJobs #Wastewater #NYSAWWA</p>""",
    ),
    (
        "studio-social-event",
        "Social posts",
        "Sample: Social — event / training promo",
        "What → when → who → RSVP",
        """<p>Join us: {{event_name}}</p>
<p><strong>When:</strong> {{event_date}}<br/><strong>Where:</strong> {{event_location}}</p>
<p>Built for students, career changers, and early-career operators.</p>
<p>RSVP / details: {{url}}</p>
<p>#WaterWorkforce #NYSAWWA</p>""",
    ),
    (
        "studio-social-blog-announce",
        "Social posts",
        "Sample: Social — new blog post",
        "Hook → excerpt → link → hashtags",
        """<p>New on the One Water Workforce blog: {{title}}</p>
<p>{{excerpt}}</p>
<p>{{url}}</p>
<p>#WaterWorkforce #NYSAWWA #OneWater</p>""",
    ),
    (
        "studio-newsletter",
        "Email and outreach",
        "Sample: Partner newsletter",
        "Lead story → calendar → spotlight → dates",
        """<h2>This month</h2>
<p>Lead story in two short paragraphs.</p>
<h2>Training calendar</h2>
<ul>
<li><strong>Date</strong> — Course — Region</li>
</ul>
<h2>Utility spotlight</h2>
<p>A partner utility doing something worth copying.</p>
<h2>Dates to know</h2>
<ul>
<li></li>
</ul>""",
    ),
    (
        "studio-utility-invitation",
        "Email and outreach",
        "Sample: Utility invitation letter",
        "Why → benefits → ask → how to join",
        """<p>Dear {{contact_name}},</p>
<h2>Why we're writing</h2>
<p>One paragraph on the statewide operator shortage and what it means for a system like yours.</p>
<h2>What Water Workforce 360 gives you</h2>
<ul>
<li>Certified candidates in your region</li>
<li>Succession and retirement risk tools</li>
<li>Learning Stream cohorts and CE renewals</li>
</ul>
<h2>How to join</h2>
<p>Reply to this email or sign in at One Water Workforce to continue.</p>
<p>With appreciation,<br/>One Water Workforce</p>""",
    ),
    (
        "studio-school-outreach",
        "Email and outreach",
        "Sample: School / counselor outreach",
        "Careers pitch → materials → visit ask",
        """<p>Dear {{contact_name}},</p>
<p>Water and wastewater careers offer strong wages, public-service impact, and clear certification pathways.</p>
<p>We can provide career pathway handouts, ambassador speakers, and links to local employer openings.</p>
<p>May we schedule a short visit or virtual session this semester?</p>
<p>— One Water Workforce / NYSAWWA</p>""",
    ),
    (
        "studio-email-interest-followup",
        "Email and outreach",
        "Sample: Interest form follow-up",
        "Thanks → pathway → one ask",
        """<p>Hi {{contact_name}},</p>
<p>Thanks for telling us you’re interested in water careers / partnerships.</p>
<p>Based on what you shared, start here:</p>
<ul>
<li><a href="{{pathway_url}}">Your recommended pathway</a></li>
<li>Jobs board and training links on One Water Workforce</li>
</ul>
<p>— One Water Workforce</p>""",
    ),
    (
        "studio-seo-blog",
        "SEO and briefs",
        "Sample: SEO — blog post brief",
        "Keyword → title → meta → links",
        """<h2>SEO brief — blog</h2>
<p><strong>Primary keyword:</strong></p>
<p><strong>Secondary keywords:</strong></p>
<p><strong>Search intent:</strong> informational / local / career</p>
<p><strong>Title tag (≤60):</strong></p>
<p><strong>Meta description (≤155):</strong></p>
<p><strong>H1 / H2 plan:</strong></p>
<p><strong>Internal links:</strong> pathways, jobs, related posts</p>
<p><strong>CTA:</strong></p>""",
    ),
    (
        "studio-regional-brief",
        "SEO and briefs",
        "Sample: Regional workforce brief",
        "Headline → numbers → gaps → ask",
        """<h2>Headline</h2>
<p>One sentence on the region’s workforce position this quarter.</p>
<h2>By the numbers</h2>
<ul>
<li>Active systems</li>
<li>Expected openings (24 mo)</li>
<li>Candidates in training</li>
</ul>
<h2>Where the gaps are</h2>
<ul>
<li><strong>Grade / role:</strong></li>
<li><strong>Small systems:</strong></li>
</ul>
<blockquote><p><strong>Ask:</strong> the single decision or resource this brief needs.</p></blockquote>""",
    ),
    (
        "studio-meeting-notes",
        "General docs",
        "Sample: Meeting notes",
        "Attendees + decisions + actions",
        """<h2>Meeting notes</h2>
<p><strong>Date:</strong><br/><strong>Attendees:</strong></p>
<h3>Agenda</h3>
<ol>
<li></li>
<li></li>
</ol>
<h3>Decisions</h3>
<ul>
<li></li>
</ul>
<h3>Action items</h3>
<ul>
<li>[ ] Owner — action, due date</li>
</ul>""",
    ),
    (
        "studio-grant-narrative",
        "General docs",
        "Sample: Grant project narrative (short)",
        "Need → activities → results → capability",
        """<h2>1. Need</h2>
<p>Operator shortage, retirements, and compliance pressure in {{state_code}}.</p>
<h2>2. Approach</h2>
<ol>
<li>Recruitment &amp; pathways</li>
<li>Training delivery</li>
<li>Employer / utility engagement</li>
<li>Equity &amp; access</li>
</ol>
<h2>3. Expected results</h2>
<ul>
<li>Operators trained / placed</li>
<li>Partner utilities engaged</li>
<li>Certifications supported</li>
</ul>
<h2>4. Capability</h2>
<p>OWW / WW360 track record, partners, and data systems.</p>""",
    ),
    (
        "studio-cohort-plan",
        "General docs",
        "Sample: Cohort / training plan",
        "Audience → schedule → checklist → outcomes",
        """<h2>Cohort overview</h2>
<p><strong>Program:</strong><br/><strong>Grade / certification:</strong><br/><strong>Region:</strong><br/><strong>Target start:</strong><br/><strong>Seats:</strong></p>
<h2>Who this serves</h2>
<p>New entrants, operators upgrading a grade, small-system staff.</p>
<h2>Readiness checklist</h2>
<ul>
<li>[ ] Course section created</li>
<li>[ ] Instructors confirmed</li>
<li>[ ] Venue / virtual room booked</li>
<li>[ ] Exam date coordinated</li>
<li>[ ] Employer partners notified</li>
</ul>""",
    ),
    (
        "studio-press-release",
        "General docs",
        "Sample: Press release",
        "Dateline → lead → quote → boilerplate",
        """<p><strong>FOR IMMEDIATE RELEASE</strong></p>
<p><strong>{{city}}, {{state_code}} — {{date}}</strong> — Lead paragraph with who / what / when / where / why.</p>
<p>Supporting paragraph with context and impact.</p>
<blockquote><p>“Quote from spokesperson.”</p>
<p>— {{spokesperson_name}}, {{spokesperson_title}}</p></blockquote>
<p><em>About One Water Workforce:</em> NYSAWWA’s initiative connecting learners, educators, and utilities across New York.</p>""",
    ),
]
