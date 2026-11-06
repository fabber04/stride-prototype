export default function SectionHead({ title, href, linkLabel = 'See all' }) {
  return (
    <div className="section-head">
      <h2 className="section-title">{title}</h2>
      {href && (
        <a className="see-all" href={href}>
          {linkLabel}
        </a>
      )}
    </div>
  );
}
