// An inline error from the backend, read out by screen readers.
export default function FieldError({ children }) {
  if (!children) return null;
  return (
    <p className="small field-error" role="alert">
      {children}
    </p>
  );
}
