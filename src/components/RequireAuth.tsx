import { Navigate, useLocation } from "react-router-dom";
import { type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export function RequireAuth({ children, role }: { children: ReactNode; role?: "donor" | "ngo" }) {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (role && profile?.role !== role) {
    return <Navigate to={profile?.role === "ngo" ? "/ngo-dashboard" : "/donor-dashboard"} replace />;
  }

  return <>{children}</>;
}
