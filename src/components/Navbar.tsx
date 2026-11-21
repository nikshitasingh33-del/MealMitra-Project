import { Link, useLocation, useNavigate } from "react-router-dom";
import { HeartHandshake, LogOut, Menu, X, LayoutDashboard } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";

export default function Navbar() {
  const { user, profile, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    await signOut();
    setOpen(false);
    navigate("/");
  };

  const navLink = (to: string, label: string) => {
    const active = location.pathname === to;
    return (
      <Link
        to={to}
        onClick={() => setOpen(false)}
        className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
          active ? "text-emerald-700 bg-emerald-50" : "text-slate-600 hover:text-emerald-700 hover:bg-slate-50"
        }`}
      >
        {label}
      </Link>
    );
  };

  const dashboardLink =
    profile?.role === "ngo" ? "/ngo-dashboard" : profile?.role === "donor" ? "/donor-dashboard" : null;

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center shadow-sm group-hover:scale-105 transition">
            <HeartHandshake className="w-5 h-5 text-white" />
          </div>
          <span className="font-display font-bold text-lg text-slate-900">
            Meal<span className="text-emerald-600">Mitra</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {navLink("/", "Home")}
          {navLink("/impact", "Impact")}
          {navLink("/about", "About")}
          {navLink("/how-it-works", "How It Works")}
        </nav>

        <div className="hidden md:flex items-center gap-2">
          {user ? (
            <>
              {dashboardLink && (
                <Link to={dashboardLink} className="btn-ghost">
                  <LayoutDashboard className="w-4 h-4" /> Dashboard
                </Link>
              )}
              <span className="text-sm text-slate-500 px-2 max-w-[120px] truncate">
                {profile?.full_name || user.email}
              </span>
              <button onClick={handleSignOut} className="btn-ghost text-red-600 hover:bg-red-50">
                <LogOut className="w-4 h-4" /> Sign out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-ghost">Sign in</Link>
              <Link to="/register" className="btn-primary">Get started</Link>
            </>
          )}
        </div>

        <button className="md:hidden p-2 rounded-lg hover:bg-slate-100" onClick={() => setOpen((o) => !o)}>
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 py-3 flex flex-col gap-1 animate-slide-up">
          {navLink("/", "Home")}
          {navLink("/impact", "Impact")}
          {navLink("/about", "About")}
          {navLink("/how-it-works", "How It Works")}
          {user ? (
            <>
              {dashboardLink && navLink(dashboardLink, "Dashboard")}
              <button onClick={handleSignOut} className="btn-ghost text-red-600 justify-start">
                <LogOut className="w-4 h-4" /> Sign out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" onClick={() => setOpen(false)} className="btn-ghost justify-start">Sign in</Link>
              <Link to="/register" onClick={() => setOpen(false)} className="btn-primary w-full">Get started</Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}
