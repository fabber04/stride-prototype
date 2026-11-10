export default function NotFound({ home }) {
  return (
    <main className="page">
      <header className="title-block">
        <h1 className="h1">Nothing here</h1>
        <p className="body-muted">This page has moved, or it is for a different kind of account.</p>
      </header>
      <a className="btn btn-primary" href={`#/${home}`}>
        Go home
      </a>
    </main>
  );
}
