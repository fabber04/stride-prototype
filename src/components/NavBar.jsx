import { Icon } from '../icons.jsx';

// Top bar for detail screens: back, centred title, more.
export default function NavBar({ title, back }) {
  return (
    <header className="navbar">
      <a className="back-btn" href={back}>
        <Icon name="back" size={18} />
        Back
      </a>
      <h1 className="navbar-title">{title}</h1>
      <span className="back-spacer" aria-hidden="true" />
    </header>
  );
}
