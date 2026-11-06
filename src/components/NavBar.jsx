import { Icon } from '../icons.jsx';

// Top bar for detail screens: back, centred title, more.
export default function NavBar({ title, back }) {
  return (
    <header className="navbar">
      <a className="icon-btn" href={back} aria-label="Back">
        <Icon name="back" />
      </a>
      <h1 className="navbar-title">{title}</h1>
      <span className="icon-btn" aria-hidden="true">
        <Icon name="more" strokeWidth={3} />
      </span>
    </header>
  );
}
