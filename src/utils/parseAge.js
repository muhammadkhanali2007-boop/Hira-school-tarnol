/**
 * Parse flexible age input (English / Urdu).
 * @param {string} raw
 * @returns {string | null} normalized age as string (may include decimals) or null
 */
export function parseAge(raw) {
  if (!raw || typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const lower = trimmed.toLowerCase();

  const solo = lower.match(/^(\d+(?:\.\d+)?)\s*$/);
  if (solo) return solo[1];

  const yearsEn = lower.match(/^(\d+(?:\.\d+)?)\s*(?:years?|yrs?)\s*$/i);
  if (yearsEn) return yearsEn[1];

  const urduYears = trimmed.match(
    /(\d+(?:\.\d+)?)\s*سال(?:\s*(?:و|،|,)?\s*(\d+)\s*ماہ)?/
  );
  if (urduYears) {
    const base = parseFloat(urduYears[1], 10);
    const months = urduYears[2] != null ? parseInt(urduYears[2], 10) : 0;
    if (Number.isNaN(base)) return null;
    const total = base + (Number.isNaN(months) ? 0 : months) / 12;
    return String(Math.round(total * 100) / 100);
  }

  const monthsOnly = trimmed.match(/^(\d+)\s*ماہ\s*$/);
  if (monthsOnly) {
    const m = parseInt(monthsOnly[1], 10);
    if (!Number.isNaN(m)) return String(Math.round((m / 12) * 100) / 100);
  }

  const anyNum = trimmed.match(/(\d+(?:\.\d+)?)/);
  return anyNum ? anyNum[1] : null;
}
