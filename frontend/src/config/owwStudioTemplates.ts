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
  blog: 'Blog layouts',
  email: 'Email',
  sms: 'SMS',
  social: 'Social',
  seo: 'SEO briefs',
  outreach: 'Outreach letters',
  brief: 'Briefs & updates',
};

export const OWW_CATEGORY_ORDER: OwwStudioCategory[] = [
  'blog',
  'email',
  'social',
  'sms',
  'seo',
  'outreach',
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

/** Ported / aligned with WW360 Document Studio outreach starters. */
const STUDIO_PORTED: OwwStudioTemplate[] = [
  {
    id: 'studio-newsletter',
    name: 'Partner newsletter',
    description: 'Monthly update for utilities, instructors and partners (from WW360 Document Studio).',
    category: 'email',
    audiences: ['program', 'ops'],
    preview: 'Lead story → training calendar → spotlight → dates',
    sendMethod: 'email',
    sourceStudioId: 'newsletter',
    subject: 'One Water Workforce — this month',
    bodyHtml: `<h2>This month</h2>
<p>Lead story in two short paragraphs.</p>
<h2>Training calendar</h2>
<ul>
<li><strong>Date</strong> — Course — Region</li>
</ul>
<h2>Utility spotlight</h2>
<p>A partner utility doing something worth copying.</p>
<h2>Career pipeline</h2>
<p>New members on One Water Workforce, upcoming career events, exam dates.</p>
<h2>Dates to know</h2>
<ul>
<li></li>
</ul>`,
    tags: ['newsletter', 'partners'],
  },
  {
    id: 'studio-utility-invitation',
    name: 'Utility invitation letter',
    description: 'Invite a utility to enroll in Water Workforce 360 (from Document Studio).',
    category: 'outreach',
    audiences: ['program'],
    preview: 'Why → what they get → what we ask → how to join',
    sendMethod: 'email',
    sourceStudioId: 'utility-invitation',
    subject: 'Invitation: Water Workforce 360 for {{utility_name}}',
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
    tags: ['outreach', 'ww360'],
  },
  {
    id: 'studio-success-story',
    name: 'Success story',
    description: 'Short human story for blog, newsletter, or funder update (from Document Studio).',
    category: 'blog',
    audiences: ['program', 'editor'],
    preview: 'Person → challenge → program → outcome → quote',
    sendMethod: 'blog_publish',
    sourceStudioId: 'success-story',
    subject: 'Success story: {{person_name}}',
    excerpt: 'A short human story from the water workforce pipeline.',
    tags: ['stories', 'workforce'],
    bodyHtml: `<h2>The person</h2>
<p>Who they are, where they work or hope to work, and what brought them to water.</p>
<h2>The challenge</h2>
<p>What stood between them and a certification or job.</p>
<h2>What the program did</h2>
<p>Course, mentor, scholarship, exam prep — the specific help that mattered.</p>
<h2>The outcome</h2>
<p>Certification earned, job placed, system stabilized.</p>
<blockquote><p>A one- or two-sentence quote in their own words.</p></blockquote>
<p><em>Photo and consent on file: yes / no — upload media with the TipTap toolbar or hero block.</em></p>`,
    sections: [
      {
        type: 'hero',
        eyebrow: 'Success story',
        headline: 'A pathway that worked',
        subhead: 'Person → challenge → program → outcome',
        cta_label: '',
        cta_href: '',
        cta2_label: '',
        cta2_href: '',
        media_url: '',
        media_type: 'image',
      },
      {
        type: 'rich_text',
        title: 'The story',
        html: `<h2>The person</h2>
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
        type: 'quote',
        quote: 'A one- or two-sentence quote in their own words.',
        author: '',
        role: '',
        organization: '',
      },
      {
        type: 'cta_band',
        title: 'Explore pathways',
        body: 'Students and career changers can start on the public pathways.',
        cta_label: 'Career pathway',
        cta_href: '/{state}/careers',
      },
    ],
  },
  {
    id: 'studio-job-profile',
    name: 'Role profile / job posting',
    description: 'Describe an operator role for the career pipeline (from Document Studio).',
    category: 'brief',
    audiences: ['program', 'editor'],
    preview: 'Role → certification → day-to-day → path',
    sendMethod: 'blog_publish',
    sourceStudioId: 'job-profile',
    subject: 'Role profile: operator',
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
    tags: ['jobs', 'careers'],
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
