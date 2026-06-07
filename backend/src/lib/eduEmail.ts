// College-email gate. Accepts US .edu addresses plus a configurable allowlist of
// international academic suffixes/domains. Extend via the EDU_EMAIL_SUFFIXES env
// var (comma-separated), e.g. "ac.uk,edu.au,ac.nz,uni.edu.example".

const DEFAULT_SUFFIXES = [
  '.edu',       // US
  '.ac.uk',     // UK
  '.edu.au',    // Australia
  '.ac.nz',     // New Zealand
  '.edu.sg',    // Singapore
  '.ac.in',     // India
  '.edu.in',    // India
  '.ca',        // (intentionally NOT included by default — see note)
];

export function isCollegeEmail(email: string | undefined | null): boolean {
  if (!email) return false;
  const domain = email.trim().toLowerCase().split('@')[1];
  if (!domain) return false;

  const extra = (process.env.EDU_EMAIL_SUFFIXES ?? '')
    .split(',')
    .map(s => s.trim().toLowerCase())
    .filter(Boolean)
    .map(s => (s.startsWith('.') ? s : `.${s}`));
  // .ca alone is too broad (all Canadian addresses), so it's excluded from defaults.
  const base = DEFAULT_SUFFIXES.filter(s => s !== '.ca');
  const suffixes = Array.from(new Set([...base, ...extra]));
  return suffixes.some(suffix => domain === suffix.slice(1) || domain.endsWith(suffix));
}
