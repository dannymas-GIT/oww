/** Effective jurisdiction config from GET /jurisdictions/{state}. */

export interface JurisdictionPartner {
  lead_org: string;
  short: string;
  contact_label: string;
  url?: string | null;
  contracted?: boolean;
  training?: {
    name: string;
    short_name?: string;
    description?: string;
    locations?: string[];
    url?: string | null;
  } | null;
}

export interface JurisdictionRegulator {
  id: string;
  name: string;
  short_name: string;
  domains: string[];
  cert_notes?: string;
  links?: { label: string; url: string }[];
}

export interface JurisdictionRegion {
  id: string;
  name: string;
  kind: string;
  color?: string | null;
  counties?: string[];
  towns?: string[];
}

export interface JurisdictionMap {
  bounds?: number[][];
  center?: number[];
  zoom?: number;
  overlay_url?: string | null;
  regions_meta_url?: string | null;
}

export interface JurisdictionConfig {
  id?: number | null;
  code: string;
  state_code?: string;
  name: string;
  demonym: string;
  geo_unit_label: string;
  tagline?: string;
  is_active?: boolean;
  partner: JurisdictionPartner;
  regulators: JurisdictionRegulator[];
  certification_ladders?: unknown[];
  regions: JurisdictionRegion[];
  affiliations?: { id: string; name: string; url?: string | null }[];
  reciprocity_note?: string;
  copy_tokens?: Record<string, string>;
  tokens?: Record<string, string>;
  map?: JurisdictionMap;
  branding?: Record<string, unknown>;
  default_features?: Record<string, boolean>;
  pack_version?: string;
}

export interface JurisdictionListItem {
  id: number;
  code: string;
  name: string;
  is_active: boolean;
  partner_name?: string | null;
  tagline?: string | null;
  demonym?: string | null;
  geo_unit_label?: string | null;
  regions?: JurisdictionRegion[];
  branding?: Record<string, unknown>;
}
