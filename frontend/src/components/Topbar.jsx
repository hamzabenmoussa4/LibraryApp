import { Link, useLocation, useNavigate } from "react-router-dom";
import { BookOpen, LayoutDashboard, Users, Handshake, Clock, LogOut } from "lucide-react";

export default function Topbar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const isActive = (path) =>
    pathname === path ? "bg-white/10 text-white" : "text-white/80 hover:bg-white/10 hover:text-white";

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-50 bg-slate-950 text-white border-b border-white/10">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between gap-3">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 font-semibold">
          <BookOpen className="w-5 h-5" />
          <span>Library Admin</span>
        </Link>

        {/* Menu */}
        <nav className="hidden md:flex items-center gap-2">
          <Link className={`px-3 py-2 rounded-xl text-sm ${isActive("/")}`} to="/">
            <span className="inline-flex items-center gap-2">
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </span>
          </Link>

          <Link className={`px-3 py-2 rounded-xl text-sm ${isActive("/books")}`} to="/books">
            <span className="inline-flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Livres
            </span>
          </Link>

          <Link className={`px-3 py-2 rounded-xl text-sm ${isActive("/members")}`} to="/members">
            <span className="inline-flex items-center gap-2">
              <Users className="w-4 h-4" />
              Membres
            </span>
          </Link>

          <Link className={`px-3 py-2 rounded-xl text-sm ${isActive("/loans")}`} to="/loans">
            <span className="inline-flex items-center gap-2">
              <Handshake className="w-4 h-4" />
              Prêts
            </span>
          </Link>

          <Link className={`px-3 py-2 rounded-xl text-sm ${isActive("/late")}`} to="/late">
            <span className="inline-flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Retards
            </span>
          </Link>
        </nav>

        {/* Logout */}
        <button
          onClick={logout}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 transition text-sm"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </header>
  );
}
