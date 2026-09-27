export function normalizePhone(input: string): string | null {
  let digits = input.replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('8')) digits = `7${digits.slice(1)}`;

  if (digits.length < 11 || digits.length > 15 || digits.startsWith('0')) return null;
  return digits;
}

export function normalizeUsername(input: string): string | null {
  const name = input.trim().replace(/^@/, '');
  return /^[a-zA-Z][a-zA-Z0-9_]{4,31}$/.test(name) ? `@${name}` : null;
}

export function formatPhone(digits: string): string {
  if (digits.length === 11 && digits.startsWith('7')) {
    return `+7 ${digits.slice(1, 4)} ${digits.slice(4, 7)}-${digits.slice(7, 9)}-${digits.slice(9)}`;
  }
  return `+${digits}`;
}
