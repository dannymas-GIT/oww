/**
 * OWW Document Studio–aligned template catalog (durable memory for communications).
 *
 * Mirrors WW360 `studioTemplates.ts`: audiences, categories, preview lines, and
 * purpose-built starters. Blog entries also carry CMS section stacks.
 *
 * When designing new email / blog / social / SEO surfaces, add here first —
 * see `.cursor/rules/oww-document-studio-comms.mdc`.
 */
import type { CmsSection } from '@/types';
import { BLOG_LAYOUT_TEMPLATES, type BlogLayoutTemplate } from '@/config/blogLayoutTemplates';
import { COMMUNICATION_TEMPLATES, type CommunicationTemplate } from '@/config/communicationTemplates';

export type OwwStudioAudience = 'program' | 'editor' | 'ops';

export type OwwStudioCategory =
  | 'blog'
  | 'page'
  | 'email'
  | 'sms'
  | 'social'
  | 'seo'
  | 'outreach'
  | 'brief';

export interface OwwStudioTemplate {
  id: string;
  name: string;
  description: string;
  category: OwwStudioCategory;
  audiences: OwwStudioAudience[];
  /** One-line gallery preview (Studio pattern). */
  preview: string;
  /** TipTap / email HTML or markdown-ish HTML body. */
  bodyHtml: string;
  /** Plain text for SMS / social. */
  bodyText?: string;
  subject?: string;
  tags?: string[];
  seoKeywords?: string[];
  sendMethod?: 'email' | 'sms' | 'blog_publish' | 'social_share' | 'manual';
  /** Full CMS section stack when this is a blog layout. */
  sections?: CmsSection[];
  excerpt?: string;
  /** WW360 Document Studio template id this was ported from, if any. */
  sourceStudioId?: string;
}

export const OWW_STUDIO_CATEGORIES: Record<OwwStudioCategory, string> = {
  blog: 'Blog',
  page: 'Landing pages',
  email: 'Email',
  sms: 'SMS',
  social: 'Social',
  seo: 'SEO briefs',
  outreach: 'Outreach',
  brief: 'Briefs & grants',
};

export const OWW_CATEGORY_ORDER: OwwStudioCategory[] = [
  'blog',
  'page',
  'social',
  'email',
  'outreach',
  'sms',
  'seo',
  'brief',
];

function fromBlogLayout(layout: BlogLayoutTemplate): OwwStudioTemplate {
  const body =
    layout.sections.find(s => s.type === 'rich_text')?.html ||
    `<p>${layout.excerpt}</p>`;
  return {
    id: layout.id,
    name: layout.label,
    description: layout.description,
    category: 'blog',
    audiences: ['program', 'editor'],
    preview: layout.purpose,
    bodyHtml: body,
    subject: layout.title,
    tags: layout.tags,
    sendMethod: 'blog_publish',
    sections: layout.sections,
    excerpt: layout.excerpt,
  };
}

function fromComm(t: CommunicationTemplate): OwwStudioTemplate {
  const category: OwwStudioCategory =
    t.kind === 'blog'
      ? 'blog'
      : t.kind === 'email'
        ? 'email'
        : t.kind === 'sms'
          ? 'sms'
          : t.kind === 'social'
            ? 'social'
            : t.kind === 'seo'
              ? 'seo'
              : 'brief';
  return {
    id: t.id,
    name: t.label,
    description: t.description,
    category,
    audiences: ['program', 'ops', 'editor'],
    preview: t.description,
    bodyHtml: t.bodyHtml,
    bodyText: t.bodyText,
    subject: t.subject,
    tags: t.tags,
    seoKeywords: t.seoKeywords,
    sendMethod: t.sendMethod,
  };
}

/**
 * Scenario starters for Document Studio (New document + sample seed).
 * Cover blogs, landing pages, social, email, outreach, SMS, SEO, and briefs.
 */
const STUDIO_PORTED: OwwStudioTemplate[] = [
  // ── Blog ───────────────────────────────────────────────────────────────
  {
    id: 'studio-success-story',
    name: 'Success story',
    description: 'Short human story for blog, newsletter, or funder update.',
    category: 'blog',
    audiences: ['program', 'editor'],
    preview: 'Person → challenge → program → outcome → quote',
    sendMethod: 'blog_publish',
    sourceStudioId: 'success-story',
    subject: 'Success story: {{person_name}}',
    excerpt: 'A short human story from the water workforce pipeline.',
    tags: ['stories', 'workforce', 'sample'],
    bodyHtml: `<h2>The person</h2>
<p>Who they are, where they work or hope to work, and what brought them to water.</p>
<h2>The challenge</h2>
<p>What stood between them and a certification or job.</p>
<h2>What the program did</h2>
<p>Course, mentor, scholarship, exam prep — the specific help that mattered.</p>
<h2>The outcome</h2>
<p>Certification earned, job placed, system stabilized.</p>
<blockquote><p>A one- or two-sentence quote in their own words.</p></blockquote>
<p><em>Upload a portrait or field photo with the image button.</em></p>`,
  },
  {
    id: 'studio-grant-news',
    name: 'Grant / funding announcement',
    description: 'Announce an award, RFP, or funding opportunity on the public blog.',
    category: 'blog',
    audiences: ['program', 'editor'],
    preview: 'What funded → who benefits → how to engage',
    sendMethod: 'blog_publish',
    subject: 'Funding update: {{grant_name}}',
    excerpt: 'How new funding strengthens New York’s water workforce pipeline.',
    tags: ['grants', 'funding', 'sample'],
    bodyHtml: `<h2>The opportunity</h2>
<p>Name the grant or award, the amount (if public), and the period of performance.</p>
<h2>Who it serves</h2>
<ul>
<li>Utilities / regions</li>
<li>Learners and certification pathways</li>
<li>Partner educators</li>
</ul>
<h2>What happens next</h2>
<p>Recruitment, cohorts, or application steps readers can take.</p>
<p><strong>Contact:</strong> {{contact_name}} · {{contact_email}}</p>`,
  },
  {
    id: 'studio-funder-update',
    name: 'Funder / board update',
    description: 'Results-forward narrative for funders, boards, or annual reports.',
    category: 'blog',
    audiences: ['program', 'ops'],
    preview: 'Promise → progress → proof → ask',
    sendMethod: 'blog_publish',
    subject: 'Progress update: One Water Workforce',
    tags: ['funders', 'reporting', 'sample'],
    bodyHtml: `<h2>What we set out to do</h2>
<p>One paragraph on the original commitment.</p>
<h2>Progress this period</h2>
<ul>
<li>Pipeline / placements</li>
<li>Training seats filled</li>
<li>Utilities engaged</li>
</ul>
<h2>Proof points</h2>
<p>One story, one metric, one partner quote.</p>
<blockquote><p>Partner or learner quote.</p></blockquote>
<h2>What we need next</h2>
<p>Clear ask — funding, introductions, or policy support.</p>`,
  },
  {
    id: 'studio-ambassador-spotlight',
    name: 'Ambassador spotlight',
    description: 'Feature a career ambassador who brings people into the water sector.',
    category: 'blog',
    audiences: ['program', 'editor'],
    preview: 'Who → why water → how they help others',
    sendMethod: 'blog_publish',
    subject: 'Ambassador spotlight: {{person_name}}',
    tags: ['ambassadors', 'stories', 'sample'],
    bodyHtml: `<h2>Meet {{person_name}}</h2>
<p>Role, utility or region, and how they found water careers.</p>
<h2>Why they speak up</h2>
<p>The message they share with students and career changers.</p>
<h2>How to connect</h2>
<p>Events, classroom visits, or interest-form next steps.</p>`,
  },

  // ── Landing pages ──────────────────────────────────────────────────────
  {
    id: 'studio-page-pathway',
    name: 'Pathway landing body',
    description: 'Body copy for Career / Hire / Educate / Ambassador doorway pages.',
    category: 'page',
    audiences: ['program', 'editor'],
    preview: 'Promise → who it’s for → steps → CTA',
    sendMethod: 'blog_publish',
    subject: 'Pathway: {{pathway_name}}',
    tags: ['landing', 'pathway', 'sample'],
    bodyHtml: `<h2>Why this pathway</h2>
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
<p>Point to the interest form, jobs board, or WW360 enrollment.</p>`,
  },
  {
    id: 'studio-page-about',
    name: 'About / FAQ page',
    description: 'Short about NYSAWWA One Water Workforce with common questions.',
    category: 'page',
    audiences: ['program', 'editor'],
    preview: 'Mission → who we serve → FAQ',
    sendMethod: 'blog_publish',
    subject: 'About One Water Workforce',
    tags: ['landing', 'about', 'sample'],
    bodyHtml: `<h2>Our mission</h2>
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
<p><strong>How does Water Workforce 360 fit?</strong> WW360 is the continuity and training platform utilities use after they join.</p>
<p><strong>Who runs the program?</strong> NYSAWWA and partners across the state.</p>`,
  },
  {
    id: 'studio-page-simple-announce',
    name: 'Simple announcement page',
    description: 'Lightweight public page for a campaign, deadline, or one-off notice.',
    category: 'page',
    audiences: ['editor'],
    preview: 'Headline → details → next step',
    sendMethod: 'blog_publish',
    subject: 'Announcement',
    tags: ['landing', 'announce', 'sample'],
    bodyHtml: `<h2>What’s happening</h2>
<p>Lead with the news in two short paragraphs.</p>
<h2>Details</h2>
<ul>
<li><strong>When:</strong></li>
<li><strong>Where / how:</strong></li>
<li><strong>Who should act:</strong></li>
</ul>
<p><a href="{{cta_url}}">Take the next step</a></p>`,
  },

  // ── Social ─────────────────────────────────────────────────────────────
  {
    id: 'studio-social-blog-announce',
    name: 'Social — new blog post',
    description: 'LinkedIn-ready announcement pointing to a blog URL.',
    category: 'social',
    audiences: ['program', 'editor'],
    preview: 'Hook → excerpt → link → hashtags',
    sendMethod: 'social_share',
    subject: 'Social: blog announce',
    tags: ['linkedin', 'blog', 'sample'],
    bodyHtml: `<p>New on the One Water Workforce blog: {{title}}</p>
<p>{{excerpt}}</p>
<p>{{url}}</p>
<p>#WaterWorkforce #NYSAWWA #OneWater</p>`,
    bodyText: `New on the One Water Workforce blog: {{title}}

{{excerpt}}

{{url}}

#WaterWorkforce #NYSAWWA #OneWater`,
  },
  {
    id: 'studio-social-hiring',
    name: 'Social — hiring push',
    description: 'Promote open operator and support roles to LinkedIn and partners.',
    category: 'social',
    audiences: ['program', 'editor'],
    preview: 'Need → roles → where to apply',
    sendMethod: 'social_share',
    subject: 'Social: hiring',
    tags: ['hiring', 'linkedin', 'sample'],
    bodyHtml: `<p>New York utilities are hiring operators and support roles.</p>
<p>If you care about public health and steady careers, explore openings on One Water Workforce.</p>
<p>{{url}}</p>
<p>#WaterJobs #Wastewater #NYSAWWA</p>`,
    bodyText: `New York utilities are hiring operators and support roles.

If you care about public health and steady careers, explore openings on One Water Workforce.

{{url}}

#WaterJobs #Wastewater #NYSAWWA`,
  },
  {
    id: 'studio-social-event',
    name: 'Social — event / training promo',
    description: 'Drive RSVPs to a career fair, open house, or certification session.',
    category: 'social',
    audiences: ['program', 'editor'],
    preview: 'What → when → who → RSVP',
    sendMethod: 'social_share',
    subject: 'Social: event',
    tags: ['events', 'training', 'sample'],
    bodyHtml: `<p>Join us: {{event_name}}</p>
<p><strong>When:</strong> {{event_date}}<br/><strong>Where:</strong> {{event_location}}</p>
<p>Built for students, career changers, and early-career operators.</p>
<p>RSVP / details: {{url}}</p>
<p>#WaterWorkforce #NYSAWWA</p>`,
    bodyText: `Join us: {{event_name}}

When: {{event_date}}
Where: {{event_location}}

Built for students, career changers, and early-career operators.

RSVP / details: {{url}}

#WaterWorkforce #NYSAWWA`,
  },
  {
    id: 'studio-social-pathway',
    name: 'Social — pathway CTA',
    description: 'Short call-to-action for Career, Hire, Educate, or Ambassador pathways.',
    category: 'social',
    audiences: ['program', 'editor'],
    preview: 'Audience → benefit → link',
    sendMethod: 'social_share',
    subject: 'Social: pathway',
    tags: ['pathways', 'sample'],
    bodyHtml: `<p>Curious about water careers — or hiring for them?</p>
<p>Start on the One Water Workforce pathway that fits you.</p>
<p>{{url}}</p>
<p>#OneWater #WaterCareers</p>`,
    bodyText: `Curious about water careers — or hiring for them?

Start on the One Water Workforce pathway that fits you.

{{url}}

#OneWater #WaterCareers`,
  },

  // ── Email ──────────────────────────────────────────────────────────────
  {
    id: 'studio-newsletter',
    name: 'Partner newsletter',
    description: 'Monthly update for utilities, instructors, and partners.',
    category: 'email',
    audiences: ['program', 'ops'],
    preview: 'Lead story → training calendar → spotlight → dates',
    sendMethod: 'email',
    sourceStudioId: 'newsletter',
    subject: 'One Water Workforce — this month',
    tags: ['newsletter', 'partners', 'sample'],
    bodyHtml: `<h2>This month</h2>
<p>Lead story in two short paragraphs.</p>
<h2>Training calendar</h2>
<ul>
<li><strong>Date</strong> — Course — Region</li>
</ul>
<h2>Utility spotlight</h2>
<p>A partner utility doing something worth copying.</p>
<h2>Career pipeline</h2>
<p>New members, upcoming career events, exam dates.</p>
<h2>Dates to know</h2>
<ul>
<li></li>
</ul>`,
  },
  {
    id: 'studio-email-exam-reminder',
    name: 'Exam / CE reminder',
    description: 'Nudge operators or learners about an upcoming exam or CE deadline.',
    category: 'email',
    audiences: ['program', 'ops'],
    preview: 'Deadline → prep → link',
    sendMethod: 'email',
    subject: 'Reminder: certification / CE deadline',
    tags: ['training', 'ce', 'sample'],
    bodyHtml: `<p>Hi {{contact_name}},</p>
<p>This is a friendly reminder that <strong>{{exam_or_ce}}</strong> is coming up on <strong>{{deadline}}</strong>.</p>
<ul>
<li>Review prep materials</li>
<li>Confirm registration</li>
<li>Reach out if you need a study cohort</li>
</ul>
<p><a href="{{cta_url}}">Open your next step</a></p>
<p>— One Water Workforce</p>`,
  },
  {
    id: 'studio-email-interest-followup',
    name: 'Interest form follow-up',
    description: 'Thank someone who submitted the public interest form and guide next steps.',
    category: 'email',
    audiences: ['program', 'ops'],
    preview: 'Thanks → pathway → one ask',
    sendMethod: 'email',
    subject: 'Thanks for your interest in One Water Workforce',
    tags: ['interest', 'pipeline', 'sample'],
    bodyHtml: `<p>Hi {{contact_name}},</p>
<p>Thanks for telling us you’re interested in water careers / partnerships.</p>
<p>Based on what you shared, start here:</p>
<ul>
<li><a href="{{pathway_url}}">Your recommended pathway</a></li>
<li>Jobs board and training links on One Water Workforce</li>
</ul>
<p>Reply with any questions — we’re glad you’re exploring this field.</p>
<p>— One Water Workforce</p>`,
  },
  {
    id: 'studio-email-educator',
    name: 'Educator / program invite',
    description: 'Invite a school, BOCES, or training provider to partner.',
    category: 'email',
    audiences: ['program'],
    preview: 'Why partner → what we offer → soft ask',
    sendMethod: 'email',
    subject: 'Partner with One Water Workforce',
    tags: ['educators', 'partners', 'sample'],
    bodyHtml: `<p>Dear {{contact_name}},</p>
<p>One Water Workforce helps educators connect students to certified water and wastewater careers across New York.</p>
<h2>What we can offer</h2>
<ul>
<li>Classroom visits and ambassadors</li>
<li>Clear certification pathway materials</li>
<li>Links to employers hiring in your region</li>
</ul>
<p>Would you be open to a short call next week?</p>
<p>With appreciation,<br/>One Water Workforce</p>`,
  },

  // ── Outreach ───────────────────────────────────────────────────────────
  {
    id: 'studio-utility-invitation',
    name: 'Utility invitation letter',
    description: 'Invite a utility to enroll in Water Workforce 360.',
    category: 'outreach',
    audiences: ['program'],
    preview: 'Why → what they get → what we ask → how to join',
    sendMethod: 'email',
    sourceStudioId: 'utility-invitation',
    subject: 'Invitation: Water Workforce 360 for {{utility_name}}',
    tags: ['outreach', 'ww360', 'sample'],
    bodyHtml: `<p>Dear {{contact_name}},</p>
<h2>Why we're writing</h2>
<p>One paragraph on the statewide operator shortage and what it means for a system like yours.</p>
<h2>What Water Workforce 360 gives you</h2>
<ul>
<li>A view of certified candidates coming out of training in your region</li>
<li>Succession and retirement risk tools for your critical roles</li>
<li>Direct access to Learning Stream cohorts and CE renewals</li>
</ul>
<h2>What we ask</h2>
<p>A short enrollment form: current positions, expected retirements, training needs. Utility records stay utility-owned.</p>
<h2>How to join</h2>
<p>Reply to this email or sign in at One Water Workforce to continue.</p>
<p>With appreciation,<br/>One Water Workforce</p>`,
  },
  {
    id: 'studio-school-outreach',
    name: 'School / counselor outreach',
    description: 'Letter to counselors and career centers about water careers.',
    category: 'outreach',
    audiences: ['program'],
    preview: 'Careers pitch → materials → visit ask',
    sendMethod: 'email',
    subject: 'Water careers for your students',
    tags: ['schools', 'outreach', 'sample'],
    bodyHtml: `<p>Dear {{contact_name}},</p>
<p>Water and wastewater careers offer strong wages, public-service impact, and clear certification pathways — often overlooked in career counseling.</p>
<p>We can provide:</p>
<ul>
<li>One-page career pathway handouts</li>
<li>Ambassador speakers for classrooms</li>
<li>Links to local employer openings</li>
</ul>
<p>May we schedule a short visit or virtual session this semester?</p>
<p>— One Water Workforce / NYSAWWA</p>`,
  },
  {
    id: 'studio-municipal-brief',
    name: 'Municipal / board briefing',
    description: 'One-page briefing for a town board, authority, or elected official.',
    category: 'outreach',
    audiences: ['program', 'ops'],
    preview: 'Problem → local impact → ask',
    sendMethod: 'manual',
    sourceStudioId: 'regional-brief',
    subject: 'Workforce briefing for {{utility_name}}',
    tags: ['board', 'municipal', 'sample'],
    bodyHtml: `<h2>The challenge</h2>
<p>Operator retirements and hard-to-fill grades threaten reliable water service.</p>
<h2>Local picture</h2>
<ul>
<li>Systems / population served</li>
<li>Known vacancies or succession risk</li>
<li>Training assets nearby</li>
</ul>
<h2>What One Water Workforce offers</h2>
<p>Pipeline visibility, training partners, and employer tools via Water Workforce 360.</p>
<h2>Ask</h2>
<p>Endorse enrollment, introduce us to the operator-in-charge, or host a career event.</p>`,
  },
  {
    id: 'studio-partner-commitment',
    name: 'Partner commitment letter',
    description: 'Letter of commitment for grants or coalition applications.',
    category: 'outreach',
    audiences: ['program'],
    preview: 'Role → commitment → signature block',
    sendMethod: 'manual',
    sourceStudioId: 'epa-iwiwd-2026-partner-letter',
    subject: 'Letter of commitment — {{partner_name}}',
    tags: ['grants', 'partners', 'sample'],
    bodyHtml: `<p><strong>Date:</strong></p>
<p><strong>To:</strong> {{applicant}}<br/>
<strong>From:</strong> {{partner_name}}<br/>
<strong>Re:</strong> Commitment to support the proposed workforce project</p>
<p>Dear colleagues,</p>
<p>{{partner_name}} commits to partner with {{applicant}} on the proposed water workforce development project in {{state_code}}.</p>
<h2>Our role</h2>
<ul>
<li>Host training / apprenticeship seats</li>
<li>Nominate operators or candidates</li>
<li>Provide instructors or facilities</li>
</ul>
<h2>Specific commitment</h2>
<p>Describe seats, hours, in-kind value, and timeline.</p>
<p>Sincerely,</p>
<p><strong>Name / Title / Organization / Contact</strong></p>`,
  },

  // ── SMS ────────────────────────────────────────────────────────────────
  {
    id: 'studio-sms-event',
    name: 'SMS — event reminder',
    description: 'Short text reminder for an upcoming event or session.',
    category: 'sms',
    audiences: ['program', 'ops'],
    preview: 'When + where + link',
    sendMethod: 'sms',
    subject: 'SMS event reminder',
    tags: ['sms', 'events', 'sample'],
    bodyHtml: `<p>OWW reminder: {{event_name}} on {{event_date}}. Details: {{url}}</p>`,
    bodyText: 'OWW reminder: {{event_name}} on {{event_date}}. Details: {{url}}',
  },
  {
    id: 'studio-sms-interest',
    name: 'SMS — interest follow-up',
    description: 'Plain-text nudge after someone submits interest.',
    category: 'sms',
    audiences: ['program', 'ops'],
    preview: 'Thanks + one link',
    sendMethod: 'sms',
    subject: 'SMS interest follow-up',
    tags: ['sms', 'pipeline', 'sample'],
    bodyHtml: `<p>Thanks for your interest in water careers. Start here: {{url}} — One Water Workforce</p>`,
    bodyText: 'Thanks for your interest in water careers. Start here: {{url}} — One Water Workforce',
  },

  // ── SEO ────────────────────────────────────────────────────────────────
  {
    id: 'studio-seo-blog',
    name: 'SEO — blog post brief',
    description: 'Keyword and meta checklist before publishing a blog post.',
    category: 'seo',
    audiences: ['editor', 'ops'],
    preview: 'Keyword → title → meta → internal links',
    sendMethod: 'manual',
    subject: 'SEO brief: blog',
    tags: ['seo', 'blog', 'sample'],
    seoKeywords: ['water workforce', 'wastewater careers', 'New York operators'],
    bodyHtml: `<h2>SEO brief — blog</h2>
<p><strong>Primary keyword:</strong></p>
<p><strong>Secondary keywords:</strong></p>
<p><strong>Search intent:</strong> informational / local / career</p>
<p><strong>Title tag (≤60):</strong></p>
<p><strong>Meta description (≤155):</strong></p>
<p><strong>H1 / H2 plan:</strong></p>
<p><strong>Internal links:</strong> pathways, jobs, related posts</p>
<p><strong>CTA:</strong></p>`,
  },
  {
    id: 'studio-seo-pathway',
    name: 'SEO — pathway page brief',
    description: 'SEO plan for Career / Hire / Educate / Ambassador landings.',
    category: 'seo',
    audiences: ['editor', 'ops'],
    preview: 'Intent → keywords → CTA',
    sendMethod: 'manual',
    subject: 'SEO brief: pathway',
    tags: ['seo', 'pathway', 'sample'],
    bodyHtml: `<h2>SEO brief — pathway page</h2>
<p><strong>Pathway:</strong> Career / Hire / Educate / Ambassador</p>
<p><strong>Primary keyword:</strong></p>
<p><strong>Local modifiers:</strong> New York, region names</p>
<p><strong>Title / meta:</strong></p>
<p><strong>On-page proof:</strong> outcomes, partners, next step</p>
<p><strong>CTA URL:</strong></p>`,
  },

  // ── Briefs & grants ────────────────────────────────────────────────────
  {
    id: 'studio-job-profile',
    name: 'Role profile / job posting',
    description: 'Describe an operator role for the career pipeline.',
    category: 'brief',
    audiences: ['program', 'editor'],
    preview: 'Role → certification → day-to-day → path',
    sendMethod: 'blog_publish',
    sourceStudioId: 'job-profile',
    subject: 'Role profile: operator',
    tags: ['jobs', 'careers', 'sample'],
    bodyHtml: `<h2>Role</h2>
<p><strong>Title:</strong> {{role_title}}<br/>
<strong>Utility / region:</strong> {{utility_name}}<br/>
<strong>Grade required:</strong><br/>
<strong>Pay range:</strong></p>
<h2>What you'll do</h2>
<p>Plain-language description of the daily work and why it matters to public health.</p>
<h2>What you need</h2>
<ul>
<li>Certification or eligibility to sit the exam</li>
<li>Licenses, physical requirements, schedule</li>
</ul>
<h2>Career path</h2>
<p>How this role grows — next certifications, leadership, or specialty tracks.</p>`,
  },
  {
    id: 'studio-regional-brief',
    name: 'Regional workforce brief',
    description: 'One-page supply, demand, and risk picture for a New York region.',
    category: 'brief',
    audiences: ['program', 'ops'],
    preview: 'Headline → numbers → gaps → asks',
    sendMethod: 'manual',
    sourceStudioId: 'regional-brief',
    subject: 'Regional workforce brief',
    tags: ['brief', 'regions', 'sample'],
    bodyHtml: `<h2>Headline</h2>
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
<li><strong>Timing:</strong></li>
</ul>
<h2>Recommended actions</h2>
<ol>
<li>Training</li>
<li>Outreach</li>
<li>Partners to brief</li>
</ol>
<blockquote><p><strong>Ask:</strong> the single decision or resource this brief needs.</p></blockquote>`,
  },
  {
    id: 'studio-quarterly-update',
    name: 'Statewide quarterly update',
    description: 'Executive update across pipeline, training, employers, and compliance backdrop.',
    category: 'brief',
    audiences: ['program', 'ops'],
    preview: 'Pipeline → training → employers → next quarter',
    sendMethod: 'manual',
    sourceStudioId: 'statewide-quarterly',
    subject: 'Statewide quarterly update',
    tags: ['brief', 'quarterly', 'sample'],
    bodyHtml: `<h2>Summary</h2>
<ul>
<li></li>
<li></li>
<li></li>
</ul>
<h2>Candidate pipeline</h2>
<p>Movement between awareness, enrollment, certification, and placement.</p>
<h2>Training</h2>
<p>Registrations, attendance, CE hours, fill rate, waitlists.</p>
<h2>Employer demand</h2>
<p>Vacancies, retirements, and succession risk by region and grade.</p>
<h2>Next quarter</h2>
<ul>
<li><strong>Priority</strong> — Owner — Due</li>
</ul>`,
  },
  {
    id: 'studio-meeting-notes',
    name: 'Meeting notes',
    description: 'Attendees, agenda, decisions, and action items.',
    category: 'brief',
    audiences: ['program', 'ops', 'editor'],
    preview: 'Attendees + decisions + actions',
    sendMethod: 'manual',
    sourceStudioId: 'meeting-notes',
    subject: 'Meeting notes',
    tags: ['notes', 'sample'],
    bodyHtml: `<h2>Meeting notes</h2>
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
</ul>`,
  },
  {
    id: 'studio-press-release',
    name: 'Press release',
    description: 'Standard release for media about a program milestone or event.',
    category: 'brief',
    audiences: ['program', 'editor'],
    preview: 'Dateline → lead → quote → boilerplate',
    sendMethod: 'manual',
    subject: 'FOR IMMEDIATE RELEASE',
    tags: ['media', 'press', 'sample'],
    bodyHtml: `<p><strong>FOR IMMEDIATE RELEASE</strong></p>
<p><strong>{{city}}, {{state_code}} — {{date}}</strong> — Lead paragraph with who / what / when / where / why.</p>
<p>Supporting paragraph with context and impact.</p>
<blockquote><p>“Quote from spokesperson.”</p>
<p>— {{spokesperson_name}}, {{spokesperson_title}}</p></blockquote>
<p>Additional details and where to learn more: {{url}}</p>
<hr/>
<p><em>About One Water Workforce:</em> NYSAWWA’s initiative connecting learners, educators, and utilities across New York.</p>
<p><strong>Media contact:</strong> {{contact_name}} · {{contact_email}} · {{contact_phone}}</p>`,
  },
  {
    id: 'studio-grant-narrative',
    name: 'Grant project narrative (short)',
    description: 'Compact need → approach → outcomes outline for workforce grant drafts.',
    category: 'brief',
    audiences: ['program'],
    preview: 'Need → activities → results → capability',
    sendMethod: 'manual',
    sourceStudioId: 'epa-iwiwd-2026-narrative',
    subject: 'Project narrative draft',
    tags: ['grants', 'narrative', 'sample'],
    bodyHtml: `<h2>1. Need</h2>
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
<p>OWW / WW360 track record, partners, and data systems.</p>
<h2>5. Budget snapshot</h2>
<p>Align to SF-424A categories in a companion brief.</p>`,
  },
  {
    id: 'studio-cohort-plan',
    name: 'Cohort / training plan',
    description: 'Plan a certification cohort or bootcamp end to end.',
    category: 'brief',
    audiences: ['program', 'ops'],
    preview: 'Audience → schedule → checklist → outcomes',
    sendMethod: 'manual',
    sourceStudioId: 'cohort-plan',
    subject: 'Cohort plan',
    tags: ['training', 'cohort', 'sample'],
    bodyHtml: `<h2>Cohort overview</h2>
<p><strong>Program:</strong><br/><strong>Grade / certification:</strong><br/><strong>Region:</strong><br/><strong>Target start:</strong><br/><strong>Seats:</strong></p>
<h2>Who this serves</h2>
<p>New entrants, operators upgrading a grade, small-system staff — and how they’ll be recruited.</p>
<h2>Schedule</h2>
<ul>
<li>Week 1 — Topic — Format — Instructor</li>
<li>Week 2 — …</li>
</ul>
<h2>Readiness checklist</h2>
<ul>
<li>[ ] Course section created</li>
<li>[ ] Instructors confirmed</li>
<li>[ ] Venue / virtual room booked</li>
<li>[ ] Exam date coordinated</li>
<li>[ ] Employer partners notified</li>
</ul>
<h2>Outcomes we’ll report</h2>
<p>Completion rate, exam pass rate, placements within 90 days, CE hours issued.</p>`,
  },

  // ── Layout-grade (columns / KPI / visual) ───────────────────────────────
  {
    id: 'layout-blog-feature',
    name: 'Blog feature (2-col story)',
    description: 'Professional blog body with floated image cue, two-column story/quote, and CTA.',
    category: 'blog',
    audiences: ['program', 'editor'],
    preview: 'Lead → 2-col story/quote → CTA',
    sendMethod: 'blog_publish',
    subject: 'Feature: {{title}}',
    tags: ['layout', 'blog', 'columns', 'sample'],
    bodyHtml: `<h2>{{title}}</h2>
<p><em>Add a cover photo (toolbar → image) and float it left at ~40% width.</em></p>
<p>Opening paragraph that hooks the reader — why this story matters for New York’s water workforce.</p>
<div class="studio-columns studio-columns-2" data-cols="2">
<div class="studio-column">
<h3>The story</h3>
<p>Two or three paragraphs of narrative. Use <strong>Insert data</strong> for live metrics like {{metric_open_jobs}} open roles.</p>
</div>
<div class="studio-column">
<blockquote><p>“Pull quote that captures the human stakes.”</p><p>— {{person_name}}</p></blockquote>
<p><strong>Quick facts</strong></p>
<ul>
<li>Region: {{state_code}}</li>
<li>Pathway: Career / Hire / Educate</li>
</ul>
</div>
</div>
<hr/>
<p><a href="{{cta_url}}"><strong>Take the next step →</strong></a></p>`,
  },
  {
    id: 'layout-stats-story',
    name: 'Stats story (KPI strip)',
    description: 'KPI row from live data, narrative, and source table — ideal for funder or board posts.',
    category: 'blog',
    audiences: ['program', 'ops'],
    preview: 'KPI strip → narrative → table',
    sendMethod: 'blog_publish',
    subject: 'By the numbers: {{state_code}} workforce',
    tags: ['layout', 'stats', 'sample'],
    bodyHtml: `<h2>By the numbers</h2>
<div class="studio-kpi-row">
<div class="studio-kpi"><strong>{{metric_open_jobs}}</strong><span>Jobs</span></div>
<div class="studio-kpi"><strong>{{metric_individuals}}</strong><span>Candidates</span></div>
<div class="studio-kpi"><strong>{{metric_employers}}</strong><span>Employers</span></div>
</div>
<p>Use <strong>Insert chart</strong> for an engagement or funnel snapshot under this paragraph.</p>
<h2>What it means</h2>
<p>Interpret the numbers for readers — where gaps are, what training is filling, and the ask.</p>
<blockquote><p><strong>Ask:</strong> the single decision or resource this update needs.</p></blockquote>`,
  },
  {
    id: 'layout-event-training',
    name: 'Event / training (2-col agenda)',
    description: 'Two-column agenda and logistics with RSVP CTA.',
    category: 'blog',
    audiences: ['program', 'editor'],
    preview: 'Agenda | logistics → RSVP',
    sendMethod: 'blog_publish',
    subject: 'Event: {{event_name}}',
    tags: ['layout', 'events', 'sample'],
    bodyHtml: `<h2>{{event_name}}</h2>
<div class="studio-columns studio-columns-2" data-cols="2">
<div class="studio-column">
<h3>Agenda</h3>
<ul>
<li><strong>9:00</strong> — Welcome</li>
<li><strong>9:30</strong> — Pathway overview</li>
<li><strong>10:30</strong> — Employer panel</li>
<li><strong>11:30</strong> — Next steps</li>
</ul>
</div>
<div class="studio-column">
<h3>Logistics</h3>
<p><strong>When:</strong> {{event_date}}<br/><strong>Where:</strong> {{event_location}}<br/><strong>Who:</strong> Students, career changers, early-career operators</p>
<p>Add a flyer image or screen grab of the registration page.</p>
</div>
</div>
<p><a href="{{url}}"><strong>RSVP / details →</strong></a></p>`,
  },
  {
    id: 'layout-hiring-social',
    name: 'Hiring pack (social + facts)',
    description: 'LinkedIn-ready post beside a two-column role facts block.',
    category: 'social',
    audiences: ['program', 'editor'],
    preview: 'Social copy | role facts',
    sendMethod: 'social_share',
    subject: 'Hiring pack',
    tags: ['layout', 'hiring', 'sample'],
    bodyHtml: `<div class="studio-columns studio-columns-2" data-cols="2">
<div class="studio-column">
<h3>Social post</h3>
<p>New York utilities are hiring — {{metric_open_jobs}} roles in the catalog.</p>
<p>If you care about public health and steady careers, explore openings on One Water Workforce.</p>
<p>{{url}}</p>
<p>#WaterJobs #NYSAWWA #OneWater</p>
</div>
<div class="studio-column">
<h3>Role facts</h3>
<p><strong>Title:</strong> {{role_title}}<br/><strong>Utility:</strong> {{utility_name}}<br/><strong>Grade:</strong><br/><strong>Region:</strong> {{state_code}}</p>
<p>Insert the open-jobs table from <strong>Insert data</strong> when you want a list.</p>
</div>
</div>`,
  },
  {
    id: 'layout-pathway-landing',
    name: 'Pathway landing (3 columns)',
    description: 'Three benefit columns, numbered steps, and FAQ for doorway pages.',
    category: 'page',
    audiences: ['program', 'editor'],
    preview: '3 benefits → steps → FAQ',
    sendMethod: 'blog_publish',
    subject: 'Pathway: {{pathway_name}}',
    tags: ['layout', 'pathway', 'sample'],
    bodyHtml: `<h2>{{pathway_name}} pathway</h2>
<p>One sentence on the outcome for the reader in {{state_code}}.</p>
<div class="studio-columns studio-columns-3" data-cols="3">
<div class="studio-column"><h3>Clarity</h3><p>Know which certifications and steps get you hired.</p></div>
<div class="studio-column"><h3>Support</h3><p>Training partners, ambassadors, and mentors in your region.</p></div>
<div class="studio-column"><h3>Jobs</h3><p>See live openings — currently {{metric_open_jobs}} in the catalog.</p></div>
</div>
<h2>How it works</h2>
<ol>
<li>Create or update your profile</li>
<li>Explore training and certifications</li>
<li>Apply to matched roles</li>
</ol>
<h2>FAQ</h2>
<p><strong>Is it free to explore?</strong> Public pathways and the jobs board are open.</p>
<p><a href="{{pathway_url}}"><strong>Start here →</strong></a></p>`,
  },
  {
    id: 'layout-newsletter-pro',
    name: 'Newsletter (calendar table)',
    description: 'Lead story, training calendar table, and partner spotlight — WW360-style.',
    category: 'email',
    audiences: ['program', 'ops'],
    preview: 'Lead → calendar table → spotlight',
    sendMethod: 'email',
    subject: 'One Water Workforce — this month',
    tags: ['layout', 'newsletter', 'sample'],
    bodyHtml: `<h2>This month</h2>
<p>Lead story in two short paragraphs. Drop {{metric_interest}} interest submissions or other KPIs from Insert data.</p>
<h2>Training calendar</h2>
<table>
<thead><tr><th>Date</th><th>Course</th><th>Region</th></tr></thead>
<tbody>
<tr><td></td><td></td><td></td></tr>
<tr><td></td><td></td><td></td></tr>
</tbody>
</table>
<h2>Utility spotlight</h2>
<div class="studio-columns studio-columns-2" data-cols="2">
<div class="studio-column"><p>What the partner is doing well.</p></div>
<div class="studio-column"><blockquote><p>Partner quote.</p></blockquote></div>
</div>
<h2>Dates to know</h2>
<ul><li></li></ul>`,
  },
];

const fromLayouts = BLOG_LAYOUT_TEMPLATES.map(fromBlogLayout);
const fromComms = COMMUNICATION_TEMPLATES.filter(t => t.kind !== 'blog').map(fromComm);

/** Deduped catalog: Studio-ported + purpose blog layouts + remaining comms templates. */
export const OWW_STUDIO_TEMPLATES: OwwStudioTemplate[] = [
  ...fromLayouts,
  ...STUDIO_PORTED,
  ...fromComms,
];

export function templatesForCategory(category: OwwStudioCategory | 'all'): OwwStudioTemplate[] {
  if (category === 'all') return OWW_STUDIO_TEMPLATES;
  return OWW_STUDIO_TEMPLATES.filter(t => t.category === category);
}

export function templatesForAudience(audience: OwwStudioAudience): OwwStudioTemplate[] {
  return OWW_STUDIO_TEMPLATES.filter(t => t.audiences.includes(audience));
}

export function findOwwStudioTemplate(id: string): OwwStudioTemplate | undefined {
  return OWW_STUDIO_TEMPLATES.find(t => t.id === id);
}

export function blogStudioTemplates(): OwwStudioTemplate[] {
  return OWW_STUDIO_TEMPLATES.filter(t => t.category === 'blog' && (t.sections?.length || 0) > 0);
}
