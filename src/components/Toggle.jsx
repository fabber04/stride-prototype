// A labelled on/off row. Required rows stay on and say so.
export default function Toggle({ title, detail, on, onChange, required }) {
  return (
    <div className="toggle-row">
      <span className="stack-2 grow">
        <span className="row-title">{title}</span>
        {detail && <span className="row-meta">{detail}</span>}
      </span>
      <button
        type="button"
        role="switch"
        className={on ? 'switch is-on' : 'switch'}
        aria-checked={on}
        aria-label={title}
        disabled={required}
        onClick={() => onChange(!on)}
      >
        <span className="switch-knob" />
      </button>
    </div>
  );
}
