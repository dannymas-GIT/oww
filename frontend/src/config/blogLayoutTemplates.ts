/**
 * Purpose-built blog layouts — full section stacks (hero, TipTap body, gallery, CTA).
 * Applied from the CMS blog editor “Start from template” control.
 */
import type { CmsSection } from '@/types';

export interface BlogLayoutTemplate {
  id: string;
  label: string;
  description: string;
  purpose: string;
  /** Suggested post title */
  title: string;
  /** Blog index excerpt */
  excerpt: string;
  tags: string[];
  /** Suggested author placeholder */
  authorHint?: string;
  sections: CmsSection[];
}

function hero(partial: Partial<CmsSection> & { headline: string }): CmsSection {
  return {
    type: 'hero',
    eyebrow: '',
    subhead: '',
    cta_label: '',
    cta_href: '',
    cta2_label: '',
    cta2_href: '',
    media_url: '',
    media_type: 'image',
    ...partial,
  };
}

function rich(html: string, title = ''): CmsSection {
  return { type: 'rich_text', title, html };
}

function gallery(title: string, description: string): CmsSection {
  return {
    type: 'media_gallery',
    title,
    description,
    items: [{ url: '', caption: '', media_type: 'image' }],
  };
}

function quote(text: string, author = '', role = '', organization = ''): CmsSection {
  return { type: 'quote', quote: text, author, role, organization };
}

function cta(title: string, body: string, label: string, href: string): CmsSection {
  return { type: 'cta_band', title, body, cta_label: label, cta_href: href };
}

export const BLOG_LAYOUT_TEMPLATES: BlogLayoutTemplate[] = [
  {
    id: 'blog-layout-workforce-tip',
    label: 'Workforce tip',
    description: 'Hero cover + tip body + CTA. Best for practical hiring / retention advice.',
    purpose: 'Short actionable guidance for utilities and partners.',
    title: 'Workforce tip: building your operator pipeline',
    excerpt: 'Practical steps to attract and retain water and wastewater operators.',
    tags: ['workforce', 'hiring', 'tips'],
    authorHint: 'Jenny Ingrao-Aman',
    sections: [
      hero({
        eyebrow: 'Workforce tip',
        headline: 'Building your operator pipeline',
        subhead: 'Clear pathways from interest to certification.',
        media_type: 'image',
      }),
      rich(
        `<p>Attracting and retaining operators starts with a clear pathway from interest to certification.</p>
<h2>What works</h2>
<ul>
<li>Partner with local educators and apprenticeship programs</li>
<li>Publish roles early with realistic shift and cert expectations</li>
<li>Celebrate career stories from your utility</li>
</ul>
<p>Use the TipTap toolbar to insert photos or a short video from the field, then share to LinkedIn or WW360 when you publish.</p>`,
        'The tip'
      ),
      cta(
        'Ready to hire?',
        'Post a role or explore matched candidates on One Water Workforce.',
        'Explore careers',
        '/{state}/careers'
      ),
    ],
  },
  {
    id: 'blog-layout-event-recap',
    label: 'Event recap',
    description: 'Hero + story + photo/video gallery + quote + CTA. For trainings, conferences, open houses.',
    purpose: 'Document an event with media and next steps.',
    title: 'Event recap: connecting New York water careers',
    excerpt: 'Highlights, photos, and next steps from our latest workforce event.',
    tags: ['events', 'nysawwa'],
    sections: [
      hero({
        eyebrow: 'Event recap',
        headline: 'Connecting New York water careers',
        subhead: 'Thank you to everyone who joined us.',
        media_type: 'image',
      }),
      rich(
        `<p>Thank you to everyone who joined us.</p>
<h2>Highlights</h2>
<ul>
<li>Sessions and speakers</li>
<li>Candidate and employer connections</li>
<li>Resources shared on site</li>
</ul>
<p>Insert a highlight photo or clip inline below, and add more in the gallery section.</p>`,
        'What happened'
      ),
      gallery('Photos & video', 'Upload event photos or a short recap video.'),
      quote('This event helped us see a clear path into the water sector.', 'Attendee'),
      cta(
        'Stay connected',
        'Browse more updates or express interest in a pathway.',
        'All posts',
        '/{state}/blog'
      ),
    ],
  },
  {
    id: 'blog-layout-partner-spotlight',
    label: 'Partner / utility spotlight',
    description: 'Hero portrait + narrative + media + CTA. For utility or educator features.',
    purpose: 'Humanize a partner, utility, or educator with story and media.',
    title: 'Partner spotlight: a utility investing in its people',
    excerpt: 'How one New York utility is building the next generation of operators.',
    tags: ['partners', 'utilities', 'spotlight'],
    sections: [
      hero({
        eyebrow: 'Partner spotlight',
        headline: 'Investing in people',
        subhead: 'A closer look at workforce continuity in practice.',
        media_type: 'image',
      }),
      rich(
        `<p>Introduce the utility or partner and why their approach matters for New York’s water workforce.</p>
<h2>What they’re doing</h2>
<ul>
<li>Training and mentorship</li>
<li>Pathways from student to certified operator</li>
<li>How OWW / WW360 fits their plan</li>
</ul>
<p>Add a headshot or facility photo with the image button, or a short interview clip with the video button.</p>`,
        'The story'
      ),
      gallery('More from this partner', 'Facility shots, team photos, or training video.'),
      cta(
        'Explore pathways',
        'Students and career changers can start on the public pathways.',
        'Career pathway',
        '/{state}/careers'
      ),
    ],
  },
  {
    id: 'blog-layout-hiring-update',
    label: 'Hiring update',
    description: 'Hero + openings narrative + jobs CTA. For seasonal or multi-role hiring pushes.',
    purpose: 'Drive traffic to open roles and employer tools.',
    title: 'Now hiring: operators and support roles across New York',
    excerpt: 'Utilities are hiring — see open roles and how to apply through OWW.',
    tags: ['hiring', 'jobs', 'operators'],
    sections: [
      hero({
        eyebrow: 'Hiring update',
        headline: 'Operators and support roles needed',
        subhead: 'New York utilities are building their benches.',
        media_type: 'image',
      }),
      rich(
        `<p>Share what’s open, which regions, and what certifications help candidates stand out.</p>
<h2>How to apply</h2>
<ol>
<li>Create or update your OWW profile</li>
<li>Browse the jobs board</li>
<li>Complete membership steps if you are an employer posting roles</li>
</ol>
<p>Optional: embed a photo of the plant or crew, or a short “day in the life” video.</p>`,
        'Openings'
      ),
      cta('Browse jobs', 'See current openings on the OWW jobs board.', 'Jobs board', '/{state}/jobs'),
    ],
  },
  {
    id: 'blog-layout-training-announce',
    label: 'Training / certification announce',
    description: 'Hero + details + optional media + register CTA. For courses and CEU opportunities.',
    purpose: 'Promote upcoming training or certification opportunities.',
    title: 'Training opportunity: certification pathway session',
    excerpt: 'Dates, who should attend, and how to register for the next session.',
    tags: ['training', 'certification', 'education'],
    sections: [
      hero({
        eyebrow: 'Training',
        headline: 'Certification pathway session',
        subhead: 'Who should attend, when, and how to register.',
        media_type: 'image',
      }),
      rich(
        `<p><strong>Who:</strong> Students, career changers, and early-career operators</p>
<p><strong>When:</strong> Add date and time</p>
<p><strong>Where:</strong> Add location or virtual link</p>
<h2>What you’ll learn</h2>
<ul>
<li>Certification requirements overview</li>
<li>Local training partners</li>
<li>Next steps into OWW pathways</li>
</ul>`,
        'Session details'
      ),
      gallery('Session media', 'Flyer image, speaker photo, or promo video.'),
      cta(
        'Express interest',
        'Tell us you want to attend or need more information.',
        'Interest form',
        '/{state}/interest'
      ),
    ],
  },
  {
    id: 'blog-layout-news-brief',
    label: 'News brief',
    description: 'Compact hero + short TipTap body + CTA. For quick announcements.',
    purpose: 'Ship a short dated update without a large media layout.',
    title: 'Quick update from One Water Workforce',
    excerpt: 'A short announcement for members and partners.',
    tags: ['news', 'update'],
    sections: [
      hero({
        eyebrow: 'News',
        headline: 'Quick update',
        subhead: 'What members need to know this week.',
        media_type: 'image',
      }),
      rich(
        `<p>Lead with the news in one or two paragraphs. Add a supporting image if it helps clarity.</p>
<p>Link out to the full resource or form when readers need to act.</p>`,
        ''
      ),
      cta('More on the blog', 'Browse related posts and pathway pages.', 'All posts', '/{state}/blog'),
    ],
  },
  {
    id: 'blog-layout-photo-essay',
    label: 'Photo / video essay',
    description: 'Hero + gallery-first + caption narrative + CTA. Media-forward storytelling.',
    purpose: 'Lead with visuals; captions and short copy support the story.',
    title: 'From the field: a day with New York operators',
    excerpt: 'Photos and video from plants and training sites across the state.',
    tags: ['field', 'media', 'operators'],
    sections: [
      hero({
        eyebrow: 'From the field',
        headline: 'A day with New York operators',
        subhead: 'Upload a strong cover image or short video.',
        media_type: 'image',
      }),
      gallery(
        'Gallery',
        'Add several images or clips. Captions appear under each item on the public page.'
      ),
      rich(
        `<p>Use this space for captions, context, and thanks to the crews who welcomed us.</p>
<p>You can also drop additional images or video inline with the TipTap toolbar.</p>`,
        'Captions & context'
      ),
      cta(
        'Explore careers',
        'Inspired to join the water workforce?',
        'Career pathway',
        '/{state}/careers'
      ),
    ],
  },
  {
    id: 'blog-layout-video-feature',
    label: 'Video feature',
    description: 'Hero set up for video + body + supporting gallery. For interviews and demos.',
    purpose: 'Center a hosted video with supporting copy and stills.',
    title: 'Video: careers in water and wastewater',
    excerpt: 'Watch stories from operators, educators, and employers.',
    tags: ['video', 'careers', 'stories'],
    sections: [
      hero({
        eyebrow: 'Video feature',
        headline: 'Careers in water and wastewater',
        subhead: 'Upload your cover video on the hero block (or paste a media library URL).',
        media_type: 'video',
      }),
      rich(
        `<p>Introduce the video and who appears in it. Use the TipTap <strong>video</strong> button to place an additional clip in the body if needed.</p>
<h2>Key takeaways</h2>
<ul>
<li>Why this work matters</li>
<li>How to get started</li>
<li>Where to learn more on OWW</li>
</ul>`,
        'About this video'
      ),
      gallery('Stills & extras', 'Thumbnails, B-roll stills, or related documents.'),
      cta(
        'Start a pathway',
        'Students and job seekers can explore public pathways next.',
        'Get started',
        '/{state}/careers'
      ),
    ],
  },
];

export function blogLayoutById(id: string): BlogLayoutTemplate | undefined {
  return BLOG_LAYOUT_TEMPLATES.find(t => t.id === id);
}

/** Deep-ish copy so editors can mutate without touching the catalog. */
export function cloneBlogLayout(id: string): BlogLayoutTemplate | undefined {
  const t = blogLayoutById(id);
  if (!t) return undefined;
  return JSON.parse(JSON.stringify(t)) as BlogLayoutTemplate;
}
