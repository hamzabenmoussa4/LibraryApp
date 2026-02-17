import { NavLink, useNavigate } from "react-router-dom";
import { BookOpen, LayoutDashboard, Users, ClipboardList, AlertTriangle, LogOut } from "lucide-react";

/**
 * Navbar avec thème bleu clair/foncé et blanc
 */
export default function Navbar() {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const linkClass = ({ isActive }) =>
    `inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition border ${
      isActive
        ? "bg-blue-600 text-white border-blue-600 shadow-sm"
        : "bg-white text-slate-700 border-blue-100 hover:bg-blue-50 hover:border-blue-200"
    }`;

  return (
    <header className="sticky top-0 z-40 bg-gradient-to-r from-blue-50 via-white to-blue-50 backdrop-blur border-b border-blue-100 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 py-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          {/* Brand */}
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-2">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-800 text-white flex items-center justify-center shadow">
                <BookOpen className="w-4 h-4" />
              </div>
              <div className="leading-tight">
                <div className="font-semibold text-blue-900">Library Admin</div>
                <div className="text-xs text-blue-600">Gestion bibliothèque</div>
              </div>
            </div>

            {/* logout (mobile) */}
            <button
              onClick={logout}
              className="md:hidden inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-blue-200 bg-white hover:bg-blue-50 text-blue-700 text-sm transition shadow-sm"
              title="Déconnexion"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>

          {/* Nav */}
          <nav className="flex flex-wrap items-center gap-2">
            <NavLink to="/" className={linkClass} end>
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </NavLink>

            <NavLink to="/books" className={linkClass}>
              <BookOpen className="w-4 h-4" />
              Livres
            </NavLink>

            <NavLink to="/members" className={linkClass}>
              <Users className="w-4 h-4" />
              Membres
            </NavLink>

            <NavLink to="/loans" className={linkClass}>
              <ClipboardList className="w-4 h-4" />
              Prêts
            </NavLink>

            <NavLink to="/late" className={linkClass}>
              <AlertTriangle className="w-4 h-4" />
              Retards
            </NavLink>
          </nav>

          {/* logout (desktop) */}
          <button
            onClick={logout}
            className="hidden md:inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-blue-200 bg-white hover:bg-blue-50 text-blue-700 text-sm transition shadow-sm hover:shadow"
            title="Déconnexion"
          >
            <LogOut className="w-4 h-4" />
            Déconnexion
          </button>
        </div>
      </div>
    </header>
  );
}