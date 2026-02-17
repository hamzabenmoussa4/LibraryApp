import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api/axios";
import {
  ArrowLeft,
  FileDown,
  Trash2,
  CheckSquare,
  Square,
  Plus,
  Search,
  Filter,
} from "lucide-react";

/**
 * BookDetails v4 (final)
 * - Toolbar: select all toggle, export PDF, delete
 * - Filtre status copies + recherche inventory
 * - Stats copies
 * - Modal confirmation (au lieu de window.confirm)
 */
export default function BookDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [error, setError] = useState("");

  const [book, setBook] = useState(null);
  const [copies, setCopies] = useState([]);

  const [inventoryCode, setInventoryCode] = useState("");

  // filters for copies
  const [copyQ, setCopyQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // all | AVAILABLE | BORROWED

  // selection
  const [selected, setSelected] = useState({}); // { copyId: true }

  // confirm modal
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [confirmAction, setConfirmAction] = useState(null);

  const openConfirm = (text, action) => {
    setConfirmText(text);
    setConfirmAction(() => action);
    setConfirmOpen(true);
  };

  const closeConfirm = () => {
    setConfirmOpen(false);
    setConfirmText("");
    setConfirmAction(null);
  };

  const cover = (url) =>
    url && url.trim() !== ""
      ? url
      : "https://via.placeholder.com/1200x520?text=No+Cover";

  const loadBook = async () => {
    setError("");
    try {
      const res = await api.get(`/books/${id}`);
      setBook(res.data);
    } catch (err) {
      setError(err?.response?.data?.message || "Erreur chargement livre");
    }
  };

  const loadCopies = async () => {
    setError("");
    try {
      const res = await api.get(`/books/${id}/copies`);
      setCopies(res.data);
    } catch (err) {
      setError(err?.response?.data?.message || "Erreur chargement exemplaires");
    }
  };

  useEffect(() => {
    loadBook();
    loadCopies();
    // eslint-disable-next-line
  }, [id]);

  // filtered copies
  const filteredCopies = useMemo(() => {
    let arr = [...copies];

    if (statusFilter !== "all") {
      arr = arr.filter((c) => c.status === statusFilter);
    }

    if (copyQ.trim()) {
      const qq = copyQ.trim().toLowerCase();
      arr = arr.filter((c) => (c.inventoryCode || "").toLowerCase().includes(qq));
    }

    return arr;
  }, [copies, statusFilter, copyQ]);

  // selected ids among ALL copies (not only filtered)
  const selectedIds = useMemo(() => {
    return Object.keys(selected).filter((k) => selected[k]);
  }, [selected]);

  // toggle select all for CURRENT filtered list (plus logique UX)
  const allSelectedInView = useMemo(() => {
    if (filteredCopies.length === 0) return false;
    const inViewIds = filteredCopies.map((c) => c._id);
    return inViewIds.every((cid) => selected[cid]);
  }, [filteredCopies, selected]);

  const toggleSelectAll = () => {
    if (filteredCopies.length === 0) return;

    // if all selected in view -> deselect view
    if (allSelectedInView) {
      setSelected((prev) => {
        const next = { ...prev };
        for (const c of filteredCopies) delete next[c._id];
        return next;
      });
      return;
    }

    // else select all in view
    setSelected((prev) => {
      const next = { ...prev };
      for (const c of filteredCopies) next[c._id] = true;
      return next;
    });
  };

  const toggleOne = (copyId) => {
    setSelected((prev) => ({ ...prev, [copyId]: !prev[copyId] }));
  };

  // pdf helper
  const downloadPdfBlob = (blobData, filename) => {
    const blob = new Blob([blobData], { type: "application/pdf" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const exportBookPdf = async () => {
    setError("");
    try {
      const res = await api.get(`/books/${id}/pdf`, { responseType: "blob" });
      downloadPdfBlob(res.data, `book_${id}.pdf`);
    } catch (err) {
      setError(err?.response?.data?.message || "Erreur export PDF livre");
    }
  };

  const exportCopiesPdf = async () => {
    setError("");
    try {
      const body = { copyIds: selectedIds }; // si vide => backend exporte tous
      const res = await api.post(`/books/${id}/copies/pdf`, body, { responseType: "blob" });
      downloadPdfBlob(res.data, `copies_${id}.pdf`);
    } catch (err) {
      setError(err?.response?.data?.message || "Erreur export PDF exemplaires");
    }
  };

  const deleteSelectedCopies = async () => {
    setError("");

    if (copies.length === 0) return;

    const idsToDelete = selectedIds.length > 0 ? selectedIds : copies.map((c) => c._id);

    openConfirm(
      selectedIds.length > 0
        ? `Supprimer ${selectedIds.length} exemplaire(s) sélectionné(s) ?`
        : `Aucun sélectionné: supprimer TOUS les exemplaires (${copies.length}) ?`,
      async () => {
        try {
          if (idsToDelete.length === 1) {
            await api.delete(`/copies/${idsToDelete[0]}`);
          } else {
            await api.delete(`/copies/bulk`, { data: { copyIds: idsToDelete } });
          }

          setSelected({});
          await loadCopies();
          await loadBook();
          closeConfirm();
        } catch (err) {
          setError(err?.response?.data?.message || "Erreur suppression exemplaires");
          closeConfirm();
        }
      }
    );
  };

  const addCopy = async (e) => {
    e.preventDefault();
    setError("");

    if (!inventoryCode.trim()) {
      setError("Code inventaire requis");
      return;
    }

    try {
      await api.post(`/books/${id}/copies`, { inventoryCode: inventoryCode.trim() });
      setInventoryCode("");
      await loadCopies();
      await loadBook();
    } catch (err) {
      setError(err?.response?.data?.message || "Erreur ajout exemplaire");
    }
  };

  const StatusBadge = ({ status }) => {
    if (status === "AVAILABLE") {
      return (
        <span className="px-2 py-1 text-xs rounded-lg bg-green-50 text-green-700 border border-green-200">
          AVAILABLE
        </span>
      );
    }
    if (status === "BORROWED") {
      return (
        <span className="px-2 py-1 text-xs rounded-lg bg-amber-50 text-amber-700 border border-amber-200">
          BORROWED
        </span>
      );
    }
    return (
      <span className="px-2 py-1 text-xs rounded-lg bg-slate-100 text-slate-700">
        {status}
      </span>
    );
  };

  const stats = useMemo(() => {
    const total = copies.length;
    const available = copies.filter((c) => c.status === "AVAILABLE").length;
    const borrowed = copies.filter((c) => c.status === "BORROWED").length;
    return { total, available, borrowed };
  }, [copies]);

  if (!book) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-slate-100">
        {error ? (
          <div className="text-red-700">{error}</div>
        ) : (
          <div className="text-slate-600">Chargement...</div>
        )}
      </div>
    );
  }

  const totalCopies = book.totalCopies || 0;
  const availableCopies = book.availableCopies || 0;
  const rupture = totalCopies > 0 && availableCopies === 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50"
            title="Retour"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div>
            <h1 className="text-2xl font-semibold text-slate-900">{book.title}</h1>
            <p className="text-sm text-slate-500">{book.author}</p>
          </div>
        </div>

        <button
          onClick={exportBookPdf}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-950 text-white hover:bg-slate-900 transition"
        >
          <FileDown className="w-4 h-4" />
          PDF Livre
        </button>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 text-red-700 px-3 py-2 text-sm">
          {error}
        </div>
      )}

      {/* Book card */}
      <div className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm">
        <div className="h-56 bg-slate-100">
          <img
            src={cover(book.imageUrl)}
            alt={book.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.src = cover("");
            }}
          />
        </div>

        <div className="p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="space-y-1">
            <div className="text-sm text-slate-500">Catégorie</div>
            <div className="font-medium text-slate-900">
              {book.category?.trim() ? book.category : "Sans catégorie"}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="px-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-700">
              Total: <b className="ml-1">{totalCopies}</b>
            </span>

            <span className="px-3 py-1.5 text-xs rounded-xl bg-green-50 border border-green-200 text-green-700">
              Disponibles: <b className="ml-1">{availableCopies}</b>
            </span>

            <span
              className={`px-3 py-1.5 text-xs rounded-xl border ${
                rupture
                  ? "bg-red-50 border-red-200 text-red-700"
                  : "bg-slate-50 border-slate-200 text-slate-700"
              }`}
            >
              {rupture ? "Rupture de stock" : "Stock OK"}
            </span>
          </div>
        </div>

        {rupture && (
          <div className="px-4 pb-4">
            <div className="rounded-xl bg-red-50 border border-red-200 text-red-700 px-3 py-2 text-sm">
              En rupture : tous les exemplaires sont prêtés.
            </div>
          </div>
        )}
      </div>

      {/* Add copy */}
      <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
        <h2 className="font-semibold text-slate-900">Ajouter un exemplaire</h2>
        <form onSubmit={addCopy} className="mt-3 flex flex-col sm:flex-row gap-2">
          <input
            value={inventoryCode}
            onChange={(e) => setInventoryCode(e.target.value)}
            className="flex-1 border rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-slate-900/10"
            placeholder="Code inventaire (ex: INV-0001)"
          />
          <button className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-slate-950 text-white hover:bg-slate-900 transition">
            <Plus className="w-4 h-4" />
            Ajouter
          </button>
        </form>
      </div>

      {/* Copies tools */}
      <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Exemplaires</h2>
            <p className="text-sm text-slate-500">
              Sélection = PDF/Supprimer (si aucun sélectionné → tous).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={toggleSelectAll}
              disabled={filteredCopies.length === 0}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-60"
            >
              {allSelectedInView ? (
                <CheckSquare className="w-4 h-4" />
              ) : (
                <Square className="w-4 h-4" />
              )}
              {allSelectedInView ? "Désélectionner tout" : "Sélectionner tout"}
            </button>

            <button
              onClick={exportCopiesPdf}
              disabled={copies.length === 0}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-950 text-white hover:bg-slate-900 transition disabled:opacity-60"
              title={selectedIds.length > 0 ? "Exporter sélection" : "Exporter tous"}
            >
              <FileDown className="w-4 h-4" />
              Exporter PDF
            </button>

            <button
              onClick={deleteSelectedCopies}
              disabled={copies.length === 0}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 disabled:opacity-60"
              title={selectedIds.length > 0 ? "Supprimer sélection" : "Supprimer tous"}
            >
              <Trash2 className="w-4 h-4" />
              Supprimer
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="flex items-center gap-2 border rounded-xl px-3 py-2">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              className="w-full outline-none"
              placeholder="Rechercher un code inventaire..."
              value={copyQ}
              onChange={(e) => setCopyQ(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 border rounded-xl px-3 py-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              className="w-full outline-none bg-transparent"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">Tous statuts</option>
              <option value="AVAILABLE">AVAILABLE</option>
              <option value="BORROWED">BORROWED</option>
            </select>
          </div>
        </div>

        {/* Stats */}
        <div className="flex flex-wrap gap-2">
          <span className="px-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-700">
            Total: <b className="ml-1">{stats.total}</b>
          </span>
          <span className="px-3 py-1.5 text-xs rounded-xl bg-green-50 border border-green-200 text-green-700">
            AVAILABLE: <b className="ml-1">{stats.available}</b>
          </span>
          <span className="px-3 py-1.5 text-xs rounded-xl bg-amber-50 border border-amber-200 text-amber-700">
            BORROWED: <b className="ml-1">{stats.borrowed}</b>
          </span>
          <span className="px-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-700">
            Sélectionnés: <b className="ml-1">{selectedIds.length}</b>
          </span>
          <span className="px-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-700">
            Affichés: <b className="ml-1">{filteredCopies.length}</b>
          </span>
        </div>
      </div>

      {/* Copies cards */}
      {filteredCopies.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 border border-slate-100 text-center text-slate-600">
          Aucun exemplaire (ou filtre trop strict).
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredCopies.map((c) => {
            const checked = !!selected[c._id];

            return (
              <div
                key={c._id}
                className={`rounded-2xl border p-4 bg-white shadow-sm hover:shadow-md transition ${
                  checked ? "border-slate-900" : "border-slate-100"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <button
                    onClick={() => toggleOne(c._id)}
                    className="flex items-center gap-2"
                    title="Sélectionner"
                  >
                    {checked ? (
                      <CheckSquare className="w-5 h-5 text-slate-900" />
                    ) : (
                      <Square className="w-5 h-5 text-slate-400" />
                    )}

                    <div className="text-left">
                      <div className="font-semibold text-slate-900">
                        {c.inventoryCode || "(Sans code)"}
                      </div>
                      <div className="text-xs text-slate-500">
                        ID: {c._id.slice(-6)}
                      </div>
                    </div>
                  </button>

                  <StatusBadge status={c.status} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirm modal */}
      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40" onClick={closeConfirm} />
          <div className="relative w-full max-w-md bg-white rounded-2xl p-5 shadow-xl border border-slate-100">
            <h3 className="text-lg font-semibold text-slate-900">Confirmation</h3>
            <p className="text-sm text-slate-600 mt-2">{confirmText}</p>

            <div className="flex items-center justify-end gap-2 mt-4">
              <button
                onClick={closeConfirm}
                className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50"
              >
                Annuler
              </button>
              <button
                onClick={() => confirmAction && confirmAction()}
                className="px-4 py-2 rounded-xl bg-red-600 text-white hover:bg-red-700"
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }) {
  if (status === "AVAILABLE") {
    return (
      <span className="px-2 py-1 text-xs rounded-lg bg-green-50 text-green-700 border border-green-200">
        AVAILABLE
      </span>
    );
  }
  if (status === "BORROWED") {
    return (
      <span className="px-2 py-1 text-xs rounded-lg bg-amber-50 text-amber-700 border border-amber-200">
        BORROWED
      </span>
    );
  }
  return (
    <span className="px-2 py-1 text-xs rounded-lg bg-slate-100 text-slate-700">
      {status}
    </span>
  );
}
