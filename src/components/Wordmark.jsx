// The Stride wordmark: three rising strides and the name in the display serif.
export default function Wordmark({ size = 'md' }) {
  return (
    <span className={`wordmark wordmark-${size}`} aria-label="Stride">
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <rect width="32" height="32" rx="9" fill="currentColor" />
        <path d="M9 22l4-8M15 22l4-12M21 22l3-6" stroke="var(--ground)" strokeWidth="2.6" strokeLinecap="round" />
      </svg>
      <span aria-hidden="true">Stride</span>
    </span>
  );
}
