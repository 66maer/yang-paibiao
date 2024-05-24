import { getLocalToken } from "@/utils";
import { Navigate } from "react-router-dom";

export function AuthRoute({ children }) {
  const token = getLocalToken();
  if (token) {
    return <>{children}</>;
  }
  return <Navigate to="/login" replace />;
}
