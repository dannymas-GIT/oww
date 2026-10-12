/**
 * Document Studio placeholder fill — same contract as WW360
 * `frontend/src/lib/studioTemplateFill.ts`.
 *
 * Replace `{{key}}` when context is known; leave unknown tokens visible.
 */

const PLACEHOLDER_RE = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g;

export type StudioFillVars = Record<string, string | number | null | undefined>;

/** Replace `{{key}}` tokens. Unknown keys stay so authors can see gaps. */
export function applyStudioPlaceholders(text: string, vars: StudioFillVars): string {
  if (!text || !Object.keys(vars).length) return text;
  return text.replace(PLACEHOLDER_RE, (full, key: string) => {
    if (!Object.prototype.hasOwnProperty.call(vars, key)) return full;
    const value = vars[key];
    if (value == null || value === '') return '';
    return String(value);
  });
}

/** Simple HTML escape when injecting filled values into TipTap HTML templates. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function applyStudioPlaceholdersHtml(html: string, vars: StudioFillVars): string {
  if (!html || !Object.keys(vars).length) return html;
  return html.replace(PLACEHOLDER_RE, (full, key: string) => {
    if (!Object.prototype.hasOwnProperty.call(vars, key)) return full;
    const value = vars[key];
    if (value == null || value === '') return '';
    return escapeHtml(String(value));
  });
}
