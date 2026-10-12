/**
 * Templates for Communications Studio — email, blog, social, SEO notes.
 * Applied into TipTap / form fields; send method guides the channel UI.
 */

export type CommTemplateKind = 'email' | 'sms' | 'blog' | 'social' | 'seo';
export type CommSendMethod = 'email' | 'sms' | 'blog_publish' | 'social_share' | 'manual';

export interface CommunicationTemplate {
  id: string;
  kind: CommTemplateKind;
  sendMethod: CommSendMethod;
  label: string;
  description: string;
  subject?: string;
  /** HTML body for TipTap / CMS rich_text */
  bodyHtml: string;
  /** Plain text for SMS / social message fallback */
  bodyText?: string;
  tags?: string[];
  seoKeywords?: string[];
}

export const COMMUNICATION_TEMPLATES: CommunicationTemplate[] = [
  {
    id: 'email-welcome-utility',
    kind: 'email',
    sendMethod: 'email',
    label: 'Welcome — new utility',
    description: 'Onboard a newly registered utility admin.',
    subject: 'Welcome to One Water Workforce',
    bodyHtml: `<p>Hi {{contact_name}},</p>
<p>Welcome to <strong>One Water Workforce</strong>. Your utility account for {{utility_name}} is ready.</p>
<ul>
<li>Complete membership to unlock hiring tools</li>
<li>Open Water Workforce 360 for workforce continuity</li>
<li>Post jobs and review matched candidates</li>
</ul>
<p>Questions? Reply to this email — we're glad you're here.</p>
<p>— NYSAWWA / One Water Workforce</p>`,
  },
  {
    id: 'email-renewal-reminder',
    kind: 'email',
    sendMethod: 'email',
    label: 'Membership renewal reminder',
    description: 'Nudge utilities whose membership is expiring.',
    subject: 'Your One Water Workforce membership renews soon',
    bodyHtml: `<p>Hi {{contact_name}},</p>
<p>Your membership for <strong>{{utility_name}}</strong> renews in the next few weeks.</p>
<p>Renew now so hiring tools and Water Workforce 360 stay uninterrupted.</p>
<p><a href="{{renew_url}}">Renew membership</a></p>
<p>— One Water Workforce</p>`,
  },
  {
    id: 'email-newsletter',
    kind: 'email',
    sendMethod: 'email',
    label: 'Workforce newsletter',
    description: 'Monthly update for employers and partners.',
    subject: 'One Water Workforce update',
    bodyHtml: `<h2>This month in the workforce</h2>
<p>Highlights for New York water and wastewater employers:</p>
<ul>
<li>Training and certification opportunities</li>
<li>Open roles and candidate pipeline tips</li>
<li>Partner program news</li>
</ul>
<p>Read more on the <a href="{{blog_url}}">OWW blog</a>.</p>`,
  },
  {
    id: 'sms-renewal',
    kind: 'sms',
    sendMethod: 'sms',
    label: 'SMS renewal nudge',
    description: 'Short text for expiring memberships.',
    subject: 'Membership renewal',
    bodyHtml: `<p>OWW: Your membership renews soon. Sign in to renew and keep hiring tools active.</p>`,
    bodyText: 'OWW: Your membership renews soon. Sign in to renew and keep hiring tools active.',
  },
  {
    id: 'blog-workforce-tip',
    kind: 'blog',
    sendMethod: 'blog_publish',
    label: 'Blog — workforce tip',
    description: 'Dated blog post with tip structure for the public site.',
    subject: 'Workforce tip: building your operator pipeline',
    bodyHtml: `<p>Attracting and retaining operators starts with a clear pathway from interest to certification.</p>
<h2>What works</h2>
<ul>
<li>Partner with local educators and apprenticeship programs</li>
<li>Publish roles early with realistic shift and cert expectations</li>
<li>Celebrate career stories from your utility</li>
</ul>
<p>Share this with your leadership team and follow up on the OWW hire pathway.</p>`,
    tags: ['workforce', 'hiring', 'tips'],
  },
  {
    id: 'blog-event-recap',
    kind: 'blog',
    sendMethod: 'blog_publish',
    label: 'Blog — event recap',
    description: 'Recap a training day, conference, or partner event.',
    subject: 'Event recap: connecting New York water careers',
    bodyHtml: `<p>Thank you to everyone who joined us.</p>
<h2>Highlights</h2>
<ul>
<li>Sessions and speakers</li>
<li>Candidate and employer connections</li>
<li>Next steps and resources</li>
</ul>
<p>Stay tuned for upcoming dates on the OWW calendar.</p>`,
    tags: ['events', 'nysawwa'],
  },
  {
    id: 'social-blog-announce',
    kind: 'social',
    sendMethod: 'social_share',
    label: 'Social — new blog post',
    description: 'LinkedIn-ready announcement pointing to a blog URL.',
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
    id: 'seo-landing-brief',
    kind: 'seo',
    sendMethod: 'manual',
    label: 'SEO — landing page brief',
    description: 'Checklist for SEO keywords and meta for a landing or blog.',
    subject: 'SEO brief',
    bodyHtml: `<h2>SEO brief</h2>
<p><strong>Primary keyword:</strong> </p>
<p><strong>Secondary keywords:</strong> </p>
<p><strong>Search intent:</strong> informational / transactional / local</p>
<p><strong>Title tag (≤60 chars):</strong> </p>
<p><strong>Meta description (≤155 chars):</strong> </p>
<p><strong>H1 / H2 plan:</strong> </p>
<p><strong>Internal links:</strong> </p>
<p><strong>CTA:</strong> </p>`,
    seoKeywords: ['water workforce', 'wastewater careers', 'New York operators'],
  },
];

export function templatesForKind(kind: CommTemplateKind | 'all'): CommunicationTemplate[] {
  if (kind === 'all') return COMMUNICATION_TEMPLATES;
  return COMMUNICATION_TEMPLATES.filter(t => t.kind === kind);
}

export function findTemplate(id: string): CommunicationTemplate | undefined {
  return COMMUNICATION_TEMPLATES.find(t => t.id === id);
}

/** Strip tags for SMS / plain preview */
export function htmlToPlain(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();
}
