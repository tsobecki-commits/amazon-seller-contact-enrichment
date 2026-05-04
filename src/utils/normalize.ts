export function clean(value: unknown): string {
  return String(value ?? '').trim();
}

export function normalizeComparable(value: unknown): string {
  return clean(value)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\b(gmbh|ug|ag|kg|ohg|ltd|limited|inc|sarl|sp z o o|spolka z oo)\b/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function isEmail(value: unknown): boolean {
  return /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(clean(value));
}
