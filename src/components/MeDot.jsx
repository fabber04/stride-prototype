// A teen's coloured initial.
export default function MeDot({ person, large = false }) {
  if (!person) return null;
  const label = person.nickname || person.name || '?';
  return (
    <span className={large ? 'me-dot me-dot-lg' : 'me-dot'} style={{ background: person.color || 'var(--ink)' }} aria-hidden="true">
      {label[0].toUpperCase()}
    </span>
  );
}
