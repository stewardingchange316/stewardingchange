import { Navigate } from "react-router-dom";
import { isAuthenticated } from "../../utils/auth";

export default function PublicOnly({ children }) {
  if (isAuthenticated()) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}
