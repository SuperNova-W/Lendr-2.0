// College-email gate. Accepts US .edu addresses plus a configurable allowlist of
// international academic suffixes/domains. Extend via the EDU_EMAIL_SUFFIXES env
// var (comma-separated), e.g. "ac.uk,edu.au,ac.nz,uni.edu.example".
//
// EMAIL_ALLOWLIST (comma-separated full addresses) additionally lets specific
// individual accounts in (dev/family), without opening up their whole domain.
//
// EMAIL_GATE_OPEN — TEMPORARY kill-switch. When truthy ("true"/"1"/"yes"/"on"),
// the gate is disabled and ANY email may sign in. Set to '' / "false" (or remove
// it from serverless.yml + backend/.env) to re-enable the students-only gate.

// Whether the college-email gate is currently turned off (open to everyone).
function isGateOpen(): boolean {
  const v = (process.env.EMAIL_GATE_OPEN ?? '').trim().toLowerCase();
  return v === 'true' || v === '1' || v === 'yes' || v === 'on';
}

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

  // TEMPORARY: marketplace open to everyone — let any email through.
  if (isGateOpen()) return true;

  const normalized = email.trim().toLowerCase();

  // Exact-address allowlist (dev + family accounts). Comma-separated full emails
  // in EMAIL_ALLOWLIST — matched whole, so it grants access to these specific
  // addresses only, never an entire domain like gmail.com.
  const allowlist = (process.env.EMAIL_ALLOWLIST ?? '')
    .split(',')
    .map(s => s.trim().toLowerCase())
    .filter(Boolean);
  if (allowlist.includes(normalized)) return true;

  const domain = normalized.split('@')[1];
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
