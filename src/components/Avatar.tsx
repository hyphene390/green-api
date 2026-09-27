const COLORS = ['#e17076', '#7bc862', '#65aadd', '#a695e7', '#ee7aae', '#6ec9cb', '#faa774'];

function colorFor(title: string) {
  let hash = 0;
  for (const ch of title) hash = (hash * 31 + ch.charCodeAt(0)) | 0;
  return COLORS[Math.abs(hash) % COLORS.length];
}

function initials(title: string) {
  const words = title.replace(/^[@+]/, '').trim().split(/\s+/);
  const letters = words.length > 1 ? words[0][0] + words[1][0] : words[0].slice(0, 2);
  return letters.toUpperCase() || '?';
}

export default function Avatar({ title }: { title: string }) {
  return (
    <span className="avatar" style={{ background: colorFor(title) }} aria-hidden>
      {initials(title)}
    </span>
  );
}
