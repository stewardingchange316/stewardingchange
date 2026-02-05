export function Card({ children, className = "", onClick, role }) {
  return (
    <div
      className={`card ${onClick ? "clickable" : ""} ${className}`}
      onClick={onClick}
      role={role}
      tabIndex={onClick ? 0 : undefined}
    >
      {children}
    </div>
  );
}
