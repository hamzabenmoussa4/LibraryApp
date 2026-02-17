import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import {
  BookOpen,
  Users,
  ClipboardList,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
} from "lucide-react";

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Tooltip,
  Legend,
  Cell,
} from "recharts";
const PIE_COLORS = [
  "#3b82f6", // blue
  "#22c55e", // green
  "#f59e0b", // amber
  "#ef4444", // red
  "#a855f7", // purple
  "#14b8a6", // teal
  "#64748b", // slate (pour "Autres")
];

/**
 * Dashboard FINAL (pro)
 * - Cards KPI
 * - Donut catégories
 * - Table des derniers prêts
 * - Actions rapides
 */
export default function Dashboard() {
  const [error, setError] = useState("");

  const [stats, setStats] = useState({
    totalBooks: 0,
    totalCopies: 0,
    availableCopies: 0,
    activeLoans: 0,
    lateLoans: 0,
  });

  const [byCategory, setByCategory] = useState([]);
  const [recentLoans, setRecentLoans] = useState([]);

  const [loading, setLoading] = useState(true);

  const loadAll = async () => {
    setError("");
    setLoading(true);

    try {
      const [s, c, r] = await Promise.all([
        api.get("/stats/dashboard"),
        api.get("/stats/books-by-category"),
        api.get("/stats/recent-loans?limit=6"),
      ]);

      setStats(s.data);
      setByCategory(c.data);
      setRecentLoans(r.data);
    } catch (err) {
      setError(err?.response?.data?.message || "Erreur chargement dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  // Donut: limiter le nombre de catégories affichées (top 6 + "Autres")
  const donutData = useMemo(() => {
    const max = 6;
    if (!Array.isArray(byCategory)) return [];

    const top = byCategory.slice(0, max);
    const rest = byCategory.slice(max);

    const restCount = rest.reduce((sum, x) => sum + (x.count || 0), 0);

    if (restCount > 0) {
      return [...top, { category: "Autres", count: restCount }];
    }
    return top;
  }, [byCategory]);

  // KPI calcul
  const borrowedCopies = Math.max(0, stats.totalCopies - stats.availableCopies);
  const availabilityRate =
    stats.totalCopies > 0
      ? Math.round((stats.availableCopies / stats.totalCopies) * 100)
      : 0;

  const formatDate = (d) => {
    if (!d) return "-";
    return new Date(d).toLocaleDateString();
  };

  const StatusPill = ({ loan }) => {
    const isLate =
      loan.status === "ACTIVE" && loan.dueDate && new Date(loan.dueDate) < new Date();

    if (isLate) {
      return (
        <span className="px-2 py-1 text-xs rounded-lg bg-red-50 text-red-700 border border-red-200">
          EN RETARD
        </span>
      );
    }

    if (loan.status === "ACTIVE") {
      return (
        <span className="px-2 py-1 text-xs rounded-lg bg-amber-50 text-amber-700 border border-amber-200">
          ACTIVE
        </span>
      );
    }

    return (
      <span className="px-2 py-1 text-xs rounded-lg bg-green-50 text-green-700 border border-green-200">
        RETURNED
      </span>
    );
  };

  const KpiCard = ({ icon: Icon, title, value, hint, tone = "default" }) => {
    const toneClass =
      tone === "danger"
        ? "bg-red-50 border-red-200"
        : tone === "ok"
        ? "bg-green-50 border-green-200"
        : "bg-white border-slate-100";

    return (
      <div className={`rounded-2xl p-4 border shadow-sm ${toneClass}`}>
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-sm text-slate-600">{title}</p>
            <p className="text-2xl font-semibold text-slate-900 mt-1">{value}</p>
            {hint && <p className="text-xs text-slate-500 mt-2">{hint}</p>}
          </div>

          <div className="p-2 rounded-xl bg-slate-950 text-white">
            <Icon className="w-4 h-4" />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">
            Vue globale : stock, prêts, retards, catégories.
          </p>
        </div>

        <button
          onClick={loadAll}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Rafraîchir
        </button>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 text-red-700 px-3 py-2 text-sm">
          {error}
        </div>
      )}

      {/* KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        <KpiCard
          icon={BookOpen}
          title="Titres (livres)"
          value={stats.totalBooks}
          hint="Nombre total de livres (titres)"
        />

        <KpiCard
          icon={ClipboardList}
          title="Exemplaires"
          value={stats.totalCopies}
          hint={`En prêt: ${borrowedCopies}`}
        />

        <KpiCard
          icon={ClipboardList}
          title="Disponibles"
          value={stats.availableCopies}
          hint={`Taux dispo: ${availabilityRate}%`}
          tone="ok"
        />

        <KpiCard
          icon={Users}
          title="Prêts actifs"
          value={stats.activeLoans}
          hint="Actifs = non rendus"
        />

        <KpiCard
          icon={AlertTriangle}
          title="En retard"
          value={stats.lateLoans}
          hint="ACTIVE + dueDate dépassée"
          tone={stats.lateLoans > 0 ? "danger" : "default"}
        />
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Donut categories */}
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm xl:col-span-1">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-slate-900">Catégories</h2>
              <p className="text-sm text-slate-500">Répartition des livres</p>
            </div>

            <Link
              to="/books"
              className="text-sm text-slate-900 hover:underline inline-flex items-center gap-1"
            >
              Voir livres <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="h-72 mt-4">
            {donutData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-500">
                Aucune donnée
              </div>
            ) : (
           <ResponsiveContainer width="100%" height="100%">
  <PieChart>
    <Pie
      data={donutData}
      dataKey="count"
      nameKey="category"
      innerRadius={60}
      outerRadius={95}
      paddingAngle={2}
      stroke="white"
      strokeWidth={2}
    >
      {donutData.map((entry, idx) => {
        // Palette de couleurs sombres et professionnelles
        const PROFESSIONAL_COLORS = [
          '#1e3a8a', // Bleu marine foncé
          '#0f766e', // Vert océan profond
          '#7c3aed', // Violet foncé
          '#be185d', // Rose bordeaux
          '#ea580c', // Orange cuivré
          '#4d7c0f', // Vert forêt
          '#6d28d9', // Violet royal
          '#059669', // Vert émeraude foncé
          '#be123c', // Rouge bordeaux
          '#7c2d12', // Marron
          '#1e40af', // Bleu saphir
          '#0d9488', // Turquoise foncé
        ];
        
        const isOthers = entry.category === "Autres";
        const color = isOthers
          ? "#475569" // Gris ardoise foncé pour "Autres"
          : PROFESSIONAL_COLORS[idx % PROFESSIONAL_COLORS.length];

        return <Cell key={`cell-${idx}`} fill={color} />;
      })}
    </Pie>

    <Tooltip
      formatter={(value, name) => [`${value}`, name]}
      contentStyle={{ 
        borderRadius: 12,
        backgroundColor: '#1f2937', // Fond sombre pour le tooltip
        border: '1px solid #374151',
        color: '#f9fafb'
      }}
    />
    <Legend 
      wrapperStyle={{ color: '#374151' }} // Texte sombre pour la légende
    />
  </PieChart>
</ResponsiveContainer>

            )}
          </div>
        </div>

        {/* Recent loans */}
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm xl:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-slate-900">Derniers prêts</h2>
              <p className="text-sm text-slate-500">
                Les dernières opérations d’emprunt
              </p>
            </div>

            <div className="flex gap-2">
              <Link
                to="/loans"
                className="px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-sm"
              >
                Prêts
              </Link>
              <Link
                to="/late"
                className="px-3 py-2 rounded-xl bg-slate-950 text-white hover:bg-slate-900 text-sm"
              >
                Retards
              </Link>
            </div>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b">
                  <th className="py-2">Membre</th>
                  <th className="py-2">Livre</th>
                  <th className="py-2">Exemplaire</th>
                  <th className="py-2">Emprunt</th>
                  <th className="py-2">Retour prévu</th>
                  <th className="py-2">Statut</th>
                </tr>
              </thead>

              <tbody>
                {recentLoans.length === 0 ? (
                  <tr>
                    <td className="py-4 text-slate-500" colSpan={6}>
                      Aucun prêt trouvé.
                    </td>
                  </tr>
                ) : (
                  recentLoans.map((l) => {
                    const member = l.memberId;
                    const copy = l.copyId;
                    const book = copy?.bookId;

                    return (
                      <tr key={l._id} className="border-b last:border-b-0">
                        <td className="py-3">
                          {member ? `${member.firstName} ${member.lastName}` : "-"}
                        </td>
                        <td className="py-3">{book?.title || "-"}</td>
                        <td className="py-3">{copy?.inventoryCode || "-"}</td>
                        <td className="py-3">{formatDate(l.borrowedAt)}</td>
                        <td className="py-3">{formatDate(l.dueDate)}</td>
                        <td className="py-3">
                          <StatusPill loan={l} />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
        <h2 className="font-semibold text-slate-900">Actions rapides</h2>
        <p className="text-sm text-slate-500 mt-1">
          Aller directement aux pages principales.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
          <Link
            to="/books"
            className="rounded-2xl border border-slate-200 p-4 hover:bg-slate-50 transition"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-900">Livres</p>
                <p className="text-sm text-slate-500">Stock, catégories, exemplaires</p>
              </div>
              <ArrowRight className="w-5 h-5 text-slate-400" />
            </div>
          </Link>

          <Link
            to="/members"
            className="rounded-2xl border border-slate-200 p-4 hover:bg-slate-50 transition"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-900">Membres</p>
                <p className="text-sm text-slate-500">Gestion des adhérents</p>
              </div>
              <ArrowRight className="w-5 h-5 text-slate-400" />
            </div>
          </Link>

          <Link
            to="/loans"
            className="rounded-2xl border border-slate-200 p-4 hover:bg-slate-50 transition"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-900">Prêts</p>
                <p className="text-sm text-slate-500">Créer / rendre / PDF</p>
              </div>
              <ArrowRight className="w-5 h-5 text-slate-400" />
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
