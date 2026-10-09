export type OwwRole =
  | 'individual'
  | 'student'
  | 'employer'
  | 'employer_admin'
  | 'employer_member'
  | 'utility_admin'
  | 'utility_manager'
  | 'educator'
  | 'ambassador'
  | 'state_admin'
  | 'platform_admin'
  | 'platform_editor'
  | 'platform_ops'
  | 'platform_manager';

export interface OwwUser {
  id: number;
  username: string;
  email?: string | null;
  full_name?: string | null;
  phone?: string | null;
  roles: string[];
  jurisdiction_code?: string | null;
  is_active?: boolean;
  org_id?: number | null;
  org_name?: string | null;
  is_sample?: boolean;
  showing_sample?: boolean;
  impersonation?: ImpersonationState | null;
}

export interface ImpersonationState {
  active: boolean;
  mode?: 'preview' | 'act' | string | null;
  persona_key?: string | null;
  target_username?: string | null;
  session_id?: string | null;
  expires_at?: string | null;
  actor_username?: string | null;
  actor_user_id?: number | null;
  persona_label?: string | null;
  narrative_bullets?: string[] | null;
}

// ---- Membership / billing ----

export type MembershipStatus = 'pending' | 'active' | 'past_due' | 'canceled' | 'expired' | 'complimentary';

export interface MembershipPlan {
  id: number;
  code: string;
  name: string;
  audience: 'individual' | 'employer' | 'utility' | 'educator';
  description?: string | null;
  price_cents: number;
  interval: 'month' | 'year';
  features: string[];
  is_active: boolean;
  stripe_price_id?: string | null;
  sample_pricing: boolean;
}

export interface Membership {
  id: number;
  user_id?: number | null;
  org_id?: number | null;
  state_code: string;
  plan_code: string;
  plan_name: string;
  price_cents?: number | null;
  status: MembershipStatus;
  provider: 'stripe' | 'sample' | 'comp';
  current_period_start?: string | null;
  current_period_end?: string | null;
  days_left?: number | null;
  cancel_at_period_end: boolean;
  canceled_at?: string | null;
  member_name?: string | null;
  member_email?: string | null;
  created_at?: string | null;
}

export interface BillingEventItem {
  id: number;
  membership_id?: number | null;
  user_id?: number | null;
  event_type: string;
  provider?: string;
  amount_cents?: number | null;
  created_at?: string | null;
}

export interface MembershipSummary {
  counts: Record<string, number>;
  active_total: number;
  expiring_30: number;
  expiring_60: number;
  recently_expired_90: number;
  arr_cents: number;
  by_plan: Array<{ plan_code: string; plan_name: string; count: number }>;
  sample_pricing: boolean;
}

export interface CheckoutResult {
  mode: 'sample' | 'stripe' | 'free';
  url?: string | null;
  session_id?: string | null;
  membership?: Membership;
}

// ---- Communications ----

export interface CommunicationAudience {
  roles?: string[];
  membership_status?: 'any' | 'none' | 'active' | 'expired' | 'expiring';
  expiring_days?: number;
}

export interface Communication {
  id: number;
  subject: string;
  body: string;
  channel: 'email' | 'sms' | string;
  audience: CommunicationAudience;
  status: 'draft' | 'sent';
  recipient_count: number;
  sent_at?: string | null;
  created_at?: string | null;
  state_code?: string | null;
}

// ---- Roles / admin ----

export interface RoleCatalogEntry {
  code: string;
  label: string;
  /** OWW marketplace tiers — not WW360 district/CEU plant roles. */
  tier: 'platform' | 'state' | 'hiring' | 'community';
  locked: boolean;
  category: string;
  description: string;
}

export interface AdminDashboard {
  users_total: number;
  users_active: number;
  users_new_30: number;
  users_by_role: Array<{ role: string; count: number }>;
  organizations: number;
  engagement_events_30: number;
  memberships: MembershipSummary;
  expiring_soon: Membership[];
  recent_communications: Communication[];
  logins?: LoginStats;
  recent_logins?: LoginEventRow[];
  sample_mode: boolean;
  registrations_pending?: number;
  utility_registration_review_required?: boolean;
}

export type UtilityRegistrationStatus = 'pending_review' | 'verified' | 'not_required' | 'suspended';

export interface UtilityRegistration {
  id: number;
  org_id: number;
  user_id: number;
  state_code: string;
  utility_name: string;
  contact_name: string;
  contact_email: string;
  phone?: string | null;
  website?: string | null;
  job_title?: string | null;
  status: UtilityRegistrationStatus;
  review_required: boolean;
  reviewed_by?: number | null;
  reviewed_by_name?: string | null;
  reviewed_at?: string | null;
  review_note?: string | null;
  payment_status?: MembershipStatus | null;
  plan_code?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface PlatformSettings {
  utility_registration_review_required: boolean;
  registration_notify_email: string;
  updated_by?: number | null;
  updated_by_name?: string | null;
  updated_at?: string | null;
}

export interface RegisterUtilityResult {
  access_token: string;
  token_type?: string;
  user: OwwUser;
  checkout: CheckoutResult;
  review_required: boolean;
  registration_id?: number;
}

export interface LoginStats {
  logins_today: number;
  logins_7d: number;
  logins_30d: number;
  failed_30d: number;
  unique_users_30d: number;
  by_method: Array<{ method: string; count: number }>;
  by_day: Array<{ date: string; count: number }>;
}

export interface LoginEventRow {
  id: number;
  user_id?: number | null;
  identifier: string;
  success: boolean;
  method: string;
  ip_address?: string | null;
  user_agent?: string | null;
  state_code?: string | null;
  failure_reason?: string | null;
  created_at?: string | null;
  user_name?: string | null;
  user_email?: string | null;
  user_roles?: string[];
}

export interface LoginActivityResponse {
  stats: LoginStats;
  events: LoginEventRow[];
}

export interface OrgOption {
  id: number;
  name: string;
  state_code: string;
  region?: string | null;
}

export interface Jurisdiction {
  id: number;
  code: string;
  name: string;
  is_active: boolean;
}

export interface TaxonomyOption {
  id: string;
  label: string;
}

export interface TaxonomyCategory {
  id: string;
  label: string;
  description?: string;
  multi?: boolean;
  options: TaxonomyOption[];
  individual_prompt?: string;
  employer_prompt?: string;
}

export interface TaxonomyPayload {
  categories: TaxonomyCategory[];
  match_types?: { id: string; label: string }[];
}

export interface Job {
  id: number;
  title: string;
  organization_id?: number;
  organization_name?: string;
  location?: string;
  city?: string;
  state_code?: string;
  opportunity_type?: string;
  career_area?: string;
  description?: string;
  is_featured?: boolean;
  is_sample?: boolean;
  showing_sample?: boolean;
  status?: string;
  latitude?: number | null;
  longitude?: number | null;
  created_at?: string;
  posted_at?: string;
}

export type PublicSharePrefs = {
  open_jobs: boolean;
  hires_12mo: boolean;
  applicants_contacted: boolean;
  hiring_projection: boolean;
  workforce_size: boolean;
  show_region: boolean;
};

export type OrgPublicStats = {
  org_id: number;
  name: string;
  open_jobs?: number;
  hires_12mo?: number;
  applicants_contacted?: number;
  hiring_projection?: number;
  workforce_size?: number;
  region?: string | null;
  county?: string | null;
  city?: string | null;
  shared_keys?: string[];
};

export interface Organization {
  id: number;
  name: string;
  org_type?: string;
  city?: string;
  region?: string | null;
  state_code?: string;
  website?: string;
  description?: string;
  latitude?: number | null;
  longitude?: number | null;
  logo_url?: string | null;
  hiring_projections?: Record<string, unknown>;
  public_share_prefs?: PublicSharePrefs;
  can_edit_public_share?: boolean;
  share_labels?: Record<string, string>;
  public_stats?: OrgPublicStats | null;
}

export interface WorkforceStatsResponse {
  state_code: string;
  org_count: number;
  summary: Record<string, number>;
  keys_present: string[];
  organizations: OrgPublicStats[];
  share_labels: Record<string, string>;
}

export interface IndividualProfile {
  id?: number;
  user_id?: number;
  display_name?: string;
  answers: Record<string, unknown>;
  completion_pct?: number;
  career_stage?: string | null;
  region?: string | null;
  resume_bank_opt_in?: boolean | null;
  updated_at?: string;
}

export interface OrgProfile {
  id?: number;
  name?: string;
  answers: Record<string, unknown>;
  hiring_projections?: Record<string, unknown>;
  public_share_prefs?: PublicSharePrefs;
  can_edit_public_share?: boolean;
  share_labels?: Record<string, string>;
  updated_at?: string;
}

export interface MatchRow {
  id: number;
  match_type: string;
  score: number;
  job_id?: number;
  job_title?: string;
  organization_name?: string;
  individual_name?: string;
  individual_id?: number;
  explanation?: string;
}

export interface Application {
  id: number;
  job_id: number;
  job_title?: string;
  individual_name?: string;
  status: string;
  is_sample?: boolean;
  showing_sample?: boolean;
  created_at?: string;
}

export interface MessageThread {
  id: number;
  subject: string;
  participants?: string[];
  peer_name?: string;
  preview?: string;
  last_message_at?: string;
  unread?: number;
  is_sample?: boolean;
  showing_sample?: boolean;
}

export interface Interview {
  id: number;
  job_title?: string;
  candidate_name?: string;
  is_sample?: boolean;
  showing_sample?: boolean;
  scheduled_at: string;
  status: string;
  location?: string;
  notes?: string;
}

export interface InterestSubmission {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  organization?: string;
  pathway: string;
  county?: string;
  state_code?: string;
  message?: string;
  hear_about?: string;
  consent_contact: boolean;
}

export interface ProgramSubmission {
  organization_name: string;
  contact_name: string;
  email: string;
  phone?: string;
  program_title: string;
  program_type: string;
  description: string;
  state_code?: string;
  website?: string;
}

export interface Testimonial {
  id: number;
  quote: string;
  author_name: string;
  author_role?: string;
  organization?: string;
}

export interface Microvideo {
  id: number;
  title: string;
  youtube_id?: string;
  url?: string;
  thumbnail_url?: string;
}

export type CmsSectionType =
  | 'hero'
  | 'stats'
  | 'rich_text'
  | 'cards'
  | 'media_gallery'
  | 'cta_band'
  | 'quote';

export type CmsTemplateId =
  | 'home_landing'
  | 'pathway_landing'
  | 'story_feature'
  | 'simple_page'
  | 'blog_post';

export interface CmsStatItem {
  value: string;
  label: string;
  detail?: string;
}

export interface CmsCardItem {
  title: string;
  body: string;
  href?: string;
}

export interface CmsMediaItem {
  url: string;
  caption?: string;
  media_type?: 'image' | 'video' | 'audio' | 'document' | string;
}

export interface CmsSection {
  type: CmsSectionType | string;
  eyebrow?: string;
  headline?: string;
  subhead?: string;
  title?: string;
  description?: string;
  body?: string;
  html?: string;
  cta_label?: string;
  cta_href?: string;
  cta2_label?: string;
  cta2_href?: string;
  media_url?: string;
  media_type?: string;
  quote?: string;
  author?: string;
  role?: string;
  organization?: string;
  items?: Array<CmsStatItem | CmsCardItem | CmsMediaItem | Record<string, string>>;
}

export interface ContentPage {
  id: number;
  slug: string;
  title: string;
  body: string;
  template?: CmsTemplateId | string;
  kind?: 'page' | 'blog' | string;
  pathway?: string | null;
  summary?: string | null;
  excerpt?: string | null;
  sections?: CmsSection[];
  state_code?: string;
  published?: boolean;
  sort_order?: number;
  author_name?: string | null;
  published_at?: string | null;
  tags?: string[];
  cover_image_url?: string | null;
  updated_at?: string | null;
  created_at?: string | null;
}

export interface BlogPostCard {
  id: number;
  slug: string;
  title: string;
  excerpt?: string | null;
  author_name?: string | null;
  published_at?: string | null;
  tags: string[];
  cover_image_url?: string | null;
  state_code?: string;
}

export interface CmsTemplateMeta {
  id: string;
  label: string;
  description: string;
  when_to_use?: string;
  example_url?: string;
  suggested_slug: string;
  section_types: string[];
  kind?: 'page' | 'blog' | string;
}

export interface CmsSectionTypeMeta {
  type: string;
  label: string;
  description: string;
  fields: string[];
}

export interface MediaAsset {
  id: number;
  filename: string;
  original_name: string;
  content_type: string;
  kind: string;
  size_bytes: number;
  url: string;
  created_at?: string | null;
}

export interface FeaturedPost {
  id: number;
  title: string;
  body?: string;
  url?: string;
  is_active: boolean;
  starts_at?: string;
  ends_at?: string;
}

export interface AnalyticsSummary {
  individuals: number;
  employers: number;
  jobs: number;
  applications: number;
  matches: number;
  interest_submissions: number;
  engagement_by_day?: { date: string; count: number }[];
  funnel?: { stage: string; count: number }[];
}

export interface CertificationCatalogItem {
  id: number;
  name: string;
  issuer?: string;
  category?: string;
  state_code?: string;
}

export interface LocationItem {
  id: number;
  name: string;
  location_type?: string;
  city?: string;
  state_code?: string;
  latitude?: number | null;
  longitude?: number | null;
}

export interface Course {
  id: number;
  title: string;
  description?: string | null;
  provider?: string;
  modality?: string;
  region?: string | null;
  published?: boolean;
  start_date?: string;
  created_at?: string | null;
}

export interface EducatorEvent {
  id: number;
  title: string;
  description?: string | null;
  starts_at: string;
  location?: string;
  region?: string | null;
  capacity?: number;
  published?: boolean;
}
