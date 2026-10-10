/**
 * Derive public microsite copy from a jurisdiction config.
 * NY pack keeps the original narrative; NJ/CT use partner-neutral tokens.
 */

import type { JurisdictionConfig } from '@/types';
import {
  owwImpactStats,
  owwMission,
  owwTrainingCenter,
  pathwayContent,
  type PathwayContent,
  type PathwaySlug,
} from '@/content/owwPublicContent';

export interface LocalizedMission {
  name: string;
  shortName: string;
  leadOrg: string;
  tagline: string;
  supportLine: string;
  summary: string;
  whyItMatters: string;
  contact: {
    partnerEmail: string;
    partnerLabel: string;
    publicSite: string;
    partnerUrl: string;
  };
}

export interface LocalizedTraining {
  title: string;
  partner: string;
  summary: string;
  locations: string[];
  offerings: string[];
  externalLinks: { label: string; href: string }[];
}

function tokens(j: JurisdictionConfig | null | undefined) {
  const name = j?.name || 'New York';
  const demonym = j?.demonym || 'New Yorkers';
  const partnerShort = j?.partner?.short || 'NYSAWWA';
  const partnerLead = j?.partner?.lead_org || owwMission.leadOrg;
  const partnerContact = j?.partner?.contact_label || partnerShort;
  const code = (j?.code || j?.state_code || 'ny').toLowerCase();
  const contracted = Boolean(j?.partner?.contracted);
  return { name, demonym, partnerShort, partnerLead, partnerContact, code, contracted };
}

function swapNyCopy(text: string, t: ReturnType<typeof tokens>): string {
  return text
    .replace(/New York Section American Water Works Association \(NYSAWWA\)/g, t.partnerLead)
    .replace(/New Yorkers/g, t.demonym)
    .replace(/New York’s/g, `${t.name}’s`)
    .replace(/New York'/g, `${t.name}'`)
    .replace(/across New York/gi, `across ${t.name}`)
    .replace(/for New York/gi, `for ${t.name}`)
    .replace(/in New York/gi, `in ${t.name}`)
    .replace(/New York/g, t.name)
    .replace(/NYSAWWA/g, t.partnerShort)
    .replace(/NYSDOH/g, t.code === 'ny' ? 'NYSDOH' : t.code === 'nj' ? 'NJDEP' : 'CT DPH')
    .replace(/NYWEA/g, t.code === 'ny' ? 'NYWEA' : t.code === 'nj' ? 'NJWEA' : 'CTWEA')
    .replace(/jenny@nysawwa\.org/g, t.code === 'ny' ? 'jenny@nysawwa.org' : 'info@onewaterworkforce.org')
    .replace(/the NY job board/gi, `the ${t.name} job board`);
}

export function localizeMission(j: JurisdictionConfig | null | undefined): LocalizedMission {
  const t = tokens(j);
  const support =
    j?.copy_tokens?.support_line ||
    j?.tokens?.support_line ||
    (t.code === 'ny'
      ? owwMission.supportLine
      : `Build a strong, prepared water and wastewater workforce for ${t.name} — in partnership with ${t.partnerContact}.`);
  const why =
    t.code === 'ny'
      ? owwMission.whyItMatters
      : `${j?.copy_tokens?.people_served || j?.tokens?.people_served || `${t.demonym}`} rely on safe water produced by ${
          j?.copy_tokens?.operators_count || j?.tokens?.operators_count || 'certified operators'
        }. The workforce is aging out—utilities need practical pathways for new operators, career changers, and the next generation of supervisors and utility leaders.`;
  const createdPhrase = t.contracted ? `created by ${t.partnerShort}` : `in partnership with ${t.partnerShort}`;
  const summary =
    t.code === 'ny'
      ? owwMission.summary
      : `One Water Workforce, ${createdPhrase}, is the statewide one-stop hub for water and wastewater career awareness, recruitment, training, and hiring. It connects individuals, utilities, educators, industry partners, and community ambassadors so ${t.name} can protect public health, the environment, and infrastructure resilience.`;

  return {
    name: owwMission.name,
    shortName: owwMission.shortName,
    leadOrg: t.partnerLead,
    tagline: j?.tagline || owwMission.tagline,
    supportLine: support,
    summary,
    whyItMatters: why,
    contact: {
      partnerEmail: t.code === 'ny' ? owwMission.contact.partnerEmail : 'info@onewaterworkforce.org',
      partnerLabel: t.contracted
        ? owwMission.contact.partnerLabel
        : `Partner inquiries · ${t.partnerShort}`,
      publicSite: owwMission.contact.publicSite,
      partnerUrl: j?.partner?.url || owwMission.contact.nysawwa,
    },
  };
}

export function localizeImpactStats(j: JurisdictionConfig | null | undefined) {
  const t = tokens(j);
  if (t.code === 'ny') return [...owwImpactStats];
  const training = j?.partner?.training;
  return [
    {
      label: `${t.demonym} served`,
      value: t.code === 'nj' ? '9M+' : '3.6M+',
      detail: 'Rely on drinking water and wastewater systems every day.',
    },
    {
      label: 'Certified operators',
      value: t.code === 'nj' ? 'Thousands' : 'Hundreds',
      detail: 'Statewide licensed water and wastewater professionals.',
    },
    {
      label: training ? 'Training hubs' : 'Regions',
      value: training?.locations?.length ? String(training.locations.length) : String(j?.regions?.length || '—'),
      detail: training
        ? `Courses delivered from ${(training.locations || []).join(', ')}.`
        : `${j?.regions?.length || 0} ${j?.geo_unit_label === 'Town' ? 'planning' : 'workforce'} regions.`,
    },
    {
      label: 'Career doorways',
      value: '4',
      detail: 'Career, Hire, Educate, and Ambassador pathways on this platform.',
    },
  ];
}

export function localizeTrainingCenter(j: JurisdictionConfig | null | undefined): LocalizedTraining | null {
  const t = tokens(j);
  const training = j?.partner?.training;
  if (!training) {
    if (t.code === 'ny') {
      return { ...owwTrainingCenter, externalLinks: [...owwTrainingCenter.externalLinks] };
    }
    // Partner-neutral training blurb from regulators
    const regs = j?.regulators || [];
    const links = regs.flatMap(r => (r.links || []).map(l => ({ label: l.label, href: l.url })));
    return {
      title: 'Operator certification & training',
      partner: t.partnerShort,
      summary:
        regs.map(r => r.cert_notes).filter(Boolean).join(' ') ||
        `Explore approved operator training and certification pathways for ${t.name}.`,
      locations: [],
      offerings: [
        'Entry-level / pre-certification operator training',
        'Continuing education for license renewal',
        'Drinking water and wastewater tracks',
      ],
      externalLinks: links.length
        ? links
        : [{ label: `${t.partnerShort} website`, href: j?.partner?.url || '#' }],
    };
  }
  return {
    title: training.name || 'Training Center',
    partner: training.short_name || training.name,
    summary: training.description || '',
    locations: training.locations || [],
    offerings: [...owwTrainingCenter.offerings],
    externalLinks: training.url
      ? [{ label: training.name, href: training.url }]
      : [...owwTrainingCenter.externalLinks],
  };
}

export function localizePathwayContent(
  slug: PathwaySlug,
  j: JurisdictionConfig | null | undefined
): PathwayContent {
  const base = pathwayContent[slug];
  const t = tokens(j);
  if (t.code === 'ny') return base;

  const mapText = (s: string) => swapNyCopy(s, t);
  return {
    ...base,
    description: mapText(base.description),
    intro: mapText(base.intro),
    whoFor: base.whoFor.map(mapText),
    youCan: base.youCan.map(mapText),
    resources: base.resources.map(r => ({ title: mapText(r.title), body: mapText(r.body) })),
    checklist: base.checklist.map(mapText),
    nextSteps: base.nextSteps.map(n => ({
      ...n,
      description: mapText(n.description),
    })),
  };
}
