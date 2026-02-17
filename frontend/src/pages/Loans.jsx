import { useEffect, useMemo, useState } from "react";
import api from "../api/axios";
import {
  CheckSquare,
  Square,
  FileDown,
  Trash2,
  Plus,
  Filter,
  AlertTriangle,
} from "lucide-react";

/**
 * Loans FINAL
 * - Tabs: active / returned
 * - Toggle unique: Sélectionner tout <-> Désélectionner tout
 * - Un seul bouton PDF (sélection sinon tous)
 * - Un seul bouton Supprimer (sélection sinon tous)
 * - Form nouveau prêt
 */
export default function Loans() {
  const [error, setError] = useState("");

  const [filter, setFilter] = useState("active"); // active | returned
  const [loans, setLoans] = useState([]);

  // form
  const [members, setMembers] = useState([]);
  const [availableCopies, setAvailableCopies] = useState([]);
  const [memberId, setMemberId] = useState("");
  const [copyId, setCopyId] = useState("");
  const [dueDate, setDueDate] = useState("");

  // selection
  const [selected, setSelected] = useState({}); // {loanId:true}

  // toast
  const [toast, setToast] = useState({ show: false, text: "", type: "ok" });
  const showToast = (text, type = "ok") => {
    setToast({ show: true, text, type });
    setTimeout(() => setToast({ show: false, text: "", type: "ok" }), 2500);
  };

  const loadLoans = async () => {
    setError("");
    try {
      const res = await api.get(`/loans?status=${filter}`);
      setLoans(res.data);
      setSelected({}); // reset selection quand on change d’onglet
    } catch (err) {
      setError(err?.response?.data?.message || "Erreur chargement prêts");
    }
  };

  const loadMembers = async () => {
    try {
      const res = await api.get("/members");
      setMembers(res.data);
    } catch (err) {
      setError(err?.response?.data?.message || "Erreur chargement membres");
    }
  };

  const loadAvailableCopies = async () => {
    try {
      const res = await api.get("/copies/available");
      setAvailableCopies(res.data);
    } catch (err) {
      setError(err?.response?.data?.message || "Erreur chargement exemplaires");
    }
  };

  useEffect(() => {
    loadMembers();
    loadAvailableCopies();
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    loadLoans();
    // eslint-disable-next-line
  }, [filter]);

  // helper date
  const formatDate = (d) => (d ? new Date(d).toLocaleDateString() : "-");

  // selection ids
  const selectedIds = useMemo(
    () => Object.keys(selected).filter((k) => selected[k]),
    [selected]
  );

  const allSelected = useMemo(() => {
    if (loans.length === 0) return false;
    return loans.every((l) => selected[l._id]);
  }, [loans, selected]);

  const toggleSelectAll = () => {
    if (loans.length === 0) return;

    if (allSelected) {
      setSelected({});
      return;
    }

    const next = {};
    for (const l of loans) next[l._id] = true;
    setSelected(next);
  };

  const toggleOne = (loanId) => {
    setSelected((prev) => ({ ...prev, [loanId]: !prev[loanId] }));
  };

  // PDF download helper
  const downloadPdfBlob = (blobData, filename) => {
    const blob = new Blob([blobData], { type: "application/pdf" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  /**
   * Export PDF
   * - si sélection => POST /api/loans/pdf/selected (si tu l’as)
   * - sinon => GET /api/loans/pdf?status=active|returned
   *
   * ⚠️ Comme ton backend PDF actuel peut être différent,
   * je te mets la version "simple" qui marche si tu gardes l’export liste.
   */
  const exportPdf = async () => {
    setError("");

    try {
      // Si sélection => tu dois avoir un endpoint backend (à ajouter si pas fait)
      if (selectedIds.length > 0) {
        const res = await api.post(
          "/loans/pdf/selected",
          { loanIds: selectedIds },
          { responseType: "blob" }
        );
        downloadPdfBlob(res.data, `loans_${filter}_selected.pdf`);
        return;
      }

      // Sinon export de la liste (selon filtre)
      const res = await api.get(`/loans/pdf?status=${filter}`, {
        responseType: "blob",
      });

      downloadPdfBlob(res.data, `loans_${filter}.pdf`);
    } catch (err) {
      setError(
        err?.response?.data?.message || "Erreur export PDF (backend manquant ?)"
      );
    }
  };

  /**
   * Supprimer
   * - sélection => DELETE /api/loans/bulk
   * - sinon => supprimer tous les prêts affichés (bulk)
   */
  const deleteSelected = async () => {
    setError("");

    if (loans.length === 0) return;

    const idsToDelete =
      selectedIds.length > 0 ? selectedIds : loans.map((l) => l._id);

    const ok = window.confirm(
      selectedIds.length > 0
        ? `Supprimer ${selectedIds.length} prêt(s) sélectionné(s) ?`
        : `Aucun sélectionné : supprimer TOUS (${loans.length}) ?`
    );
    if (!ok) return;

    try {
      await api.delete("/loans/bulk", { data: { loanIds: idsToDelete } });
      showToast("Suppression OK ✅");
      await loadAvailableCopies();
      await loadLoans();
    } catch (err) {
      setError(err?.response?.data?.message || "Erreur suppression prêts");
    }
  };

  /**
   * Créer prêt
   */
  const createLoan = async (e) => {
    e.preventDefault();
    setError("");

    try {
      await api.post("/loans", { memberId, copyId, dueDate });

      setMemberId("");
      setCopyId("");
      setDueDate("");

      showToast("Prêt créé ✅");
      await loadAvailableCopies();
      await loadLoans();
    } catch (err) {
      setError(err?.response?.data?.message || "Erreur création prêt");
    }
  };

  /**
   * Rendre prêt
   */
  const returnLoan = async (loanId) => {
    setError("");

    const ok = window.confirm("Marquer ce prêt comme rendu ?");
    if (!ok) return;

    try {
      await api.patch(`/loans/${loanId}/return`);
      showToast("Prêt rendu ✅");
      await loadAvailableCopies();
      await loadLoans();
    } catch (err) {
      setError(err?.response?.data?.message || "Erreur retour prêt");
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast.show && (
        <div className="fixed top-4 right-4 z-50">
          <div
            className={`px-4 py-2 rounded-xl shadow-lg border text-sm ${
              toast.type === "ok"
                ? "bg-green-50 border-green-200 text-green-800"
                : "bg-red-50 border-red-200 text-red-800"
            }`}
          >
            {toast.text}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Prêts</h1>
          <p className="text-sm text-slate-500 mt-1">
            Créer, rendre, exporter PDF, supprimer (sélection ou tout).
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 text-red-700 px-3 py-2 text-sm">
          {error}
        </div>
      )}

      {/* Tabs + actions */}
      <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          {/* Tabs */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilter("active")}
              className={`px-4 py-2 rounded-xl text-sm font-medium border transition ${
                filter === "active"
                  ? "bg-slate-950 text-white border-slate-950"
                  : "bg-white border-slate-200 hover:bg-slate-50"
              }`}
            >
              En cours
            </button>

            <button
              onClick={() => setFilter("returned")}
              className={`px-4 py-2 rounded-xl text-sm font-medium border transition ${
                filter === "returned"
                  ? "bg-slate-950 text-white border-slate-950"
                  : "bg-white border-slate-200 hover:bg-slate-50"
              }`}
            >
              Rendus
            </button>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={toggleSelectAll}
              disabled={loans.length === 0}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-60"
            >
              {allSelected ? (
                <CheckSquare className="w-4 h-4" />
              ) : (
                <Square className="w-4 h-4" />
              )}
              {allSelected ? "Désélectionner tout" : "Sélectionner tout"}
            </button>

            <button
              onClick={exportPdf}
              disabled={loans.length === 0}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-950 text-white hover:bg-slate-900 disabled:opacity-60"
              title={selectedIds.length > 0 ? "Exporter sélection" : "Exporter tous"}
            >
              <FileDown className="w-4 h-4" />
              Exporter PDF
            </button>

            <button
              onClick={deleteSelected}
              disabled={loans.length === 0}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 disabled:opacity-60"
              title={selectedIds.length > 0 ? "Supprimer sélection" : "Supprimer tous"}
            >
              <Trash2 className="w-4 h-4" />
              Supprimer
            </button>

            <span className="text-xs text-slate-500 inline-flex items-center gap-2 px-3">
              <Filter className="w-4 h-4" />
              Sélectionnés: <b>{selectedIds.length}</b>
            </span>
          </div>
        </div>
      </div>

      {/* Create loan */}
      <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
        <h2 className="font-semibold text-slate-900">Nouveau prêt</h2>

        <form onSubmit={createLoan} className="mt-3 grid grid-cols-1 lg:grid-cols-4 gap-3">
          {/* member */}
          <select
            value={memberId}
            onChange={(e) => setMemberId(e.target.value)}
            required
            className="border rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-slate-900/10"
          >
            <option value="">-- Choisir un membre --</option>
            {members.map((m) => (
              <option key={m._id} value={m._id}>
                {m.firstName} {m.lastName}
              </option>
            ))}
          </select>

          {/* copy */}
          <select
            value={copyId}
            onChange={(e) => setCopyId(e.target.value)}
            required
            className="border rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-slate-900/10"
          >
            <option value="">-- Exemplaire disponible --</option>
            {availableCopies.map((c) => (
              <option key={c._id} value={c._id}>
                {c.bookId?.title || "Livre"} | {c.inventoryCode}
              </option>
            ))}
          </select>

          {/* due date */}
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            required
            className="border rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-slate-900/10"
          />

          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-slate-950 text-white hover:bg-slate-900 transition"
          >
            <Plus className="w-4 h-4" />
            Créer
          </button>
        </form>

        <p className="text-xs text-slate-500 mt-3">
          Si aucun exemplaire n’apparaît, il n’y a aucun exemplaire en <b>AVAILABLE</b>.
        </p>
      </div>

      {/* Loans table */}
      <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500 border-b">
              <th className="py-2 w-10"></th>
              <th className="py-2">Membre</th>
              <th className="py-2">Livre</th>
              <th className="py-2">Exemplaire</th>
              <th className="py-2">Emprunt</th>
              <th className="py-2">Retour prévu</th>
              <th className="py-2">Retour réel</th>
              <th className="py-2">Statut</th>
              <th className="py-2">Action</th>
            </tr>
          </thead>

          <tbody>
            {loans.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-6 text-slate-500">
                  Aucun prêt trouvé.
                </td>
              </tr>
            ) : (
              loans.map((l) => {
                const member = l.memberId;
                const copy = l.copyId;
                const book = copy?.bookId;

                const late =
                  l.status === "ACTIVE" && l.dueDate && new Date(l.dueDate) < new Date();

                const checked = !!selected[l._id];

                return (
                  <tr key={l._id} className="border-b last:border-b-0">
                    <td className="py-3">
                      <button
                        onClick={() => toggleOne(l._id)}
                        className="p-1 rounded-lg hover:bg-slate-50"
                        title="Sélectionner"
                      >
                        {checked ? (
                          <CheckSquare className="w-5 h-5 text-slate-950" />
                        ) : (
                          <Square className="w-5 h-5 text-slate-400" />
                        )}
                      </button>
                    </td>

                    <td className="py-3">
                      {member ? `${member.firstName} ${member.lastName}` : "-"}
                    </td>
                    <td className="py-3">{book?.title || "-"}</td>
                    <td className="py-3">{copy?.inventoryCode || "-"}</td>

                    <td className="py-3">{formatDate(l.borrowedAt)}</td>
                    <td className="py-3">{formatDate(l.dueDate)}</td>
                    <td className="py-3">{formatDate(l.returnedAt)}</td>

                    <td className="py-3">
                      {late ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-lg bg-red-50 text-red-700 border border-red-200">
                          <AlertTriangle className="w-3 h-3" />
                          EN RETARD
                        </span>
                      ) : l.status === "ACTIVE" ? (
                        <span className="px-2 py-1 text-xs rounded-lg bg-amber-50 text-amber-700 border border-amber-200">
                          ACTIVE
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs rounded-lg bg-green-50 text-green-700 border border-green-200">
                          RETURNED
                        </span>
                      )}
                    </td>

                    <td className="py-3">
                      {l.status === "ACTIVE" ? (
                        <button
                          onClick={() => returnLoan(l._id)}
                          className="px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-sm"
                        >
                          Rendu
                        </button>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
