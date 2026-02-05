export function Card({ children, className = "" }) {
  return <div className={`card ${className}`}>{children}</div>;
}

export function H1({ children }) {
  return <h1 className="h1">{children}</h1>;
}

export function P({ children }) {
  return <p className="p">{children}</p>;
}

export function Divider() {
  return <div className="divider" />;
}

export function Button({ children, variant = "primary", ...props }) {
  const cls =
    variant === "primary" ? "btnPrimary" :
    variant === "ghost" ? "btnGhost" :
    "btnSoft";

  return (
    <button className={cls} {...props}>
      {children}
    </button>
  );
}

export function Input({ label, error, ...props }) {
  return (
    <div className="field">
      <div className="labelRow">
        <label className="label">{label}</label>
        {error ? <div className="error">{error}</div> : null}
      </div>
      <input className="input" {...props} />
    </div>
  );
}
