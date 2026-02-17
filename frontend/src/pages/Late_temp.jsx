import { useEffect, useMemo, useState } from "react";
import api from "../api/axios";
import {
  AlertTriangle,
  Mail,
  RefreshCw,
  CheckSquare,
  Square,
  Trash2,
  FileDown,
  X,
} from "lucide-react";

/**
 * Retards FINAL
 * - Liste retards + envoyer/renvoyer mail
 * - Bandeau amende/jour
 * - Historique emails en bas
 * - Sélection toggle unique
 * - Supprimer historique (sélection ou tout)
 * - Export PDF historique (sélection ou tout)
 * - Modal pour voir le message complet
 */
export default function Late() {
  const [error, setError] = useState("");

  const [lateLoans, setLateLoans] = useState([]);
  const [logs, setLogs] = useState([]);

  const [loading, setLoading] = useState(true);

  // Toast
  const [toast, setToast] = useState({ show: false, text: "", type: "ok" });
  const showToast = (text, type = "ok") => {
    setToast({ show: true, text, type });
    setTimeout(() => setToast({ show: false, text: "", type: "ok" }), 2600);
  };

  // sélection logs (clé = loanId:logId)
  const [selected, setSelected] = useState({});

  // Modal message complet
  const [openMsg, setOpenMsg] = useState(false);
  const [msgRow, setMsgRow] = useState(null);

  const feePerDay = 5;

  const loadAll = async () => {
    setError("");
    setLoading(true);

    try {
      const [l, h] = await Promise.all([
        api.get("/late/loans"),
        api.get("/late/email-logs"),
      ]);

      setLateLoans(l.data);
      setLogs(h.data);
      setSelected({});
    } catch (err) {
      setError(err?.response?.data?.message || "Erreur chargement retards");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line
  }, []);

  const formatDate = (d) => (d ? new Date(d).toLocaleDateString() : "-");
  const formatDateTime = (d) => (d ? new Date(d).toLocaleString() : "-");

  const calcLateDays = (dueDate) => {
    if (!dueDate) return 0;
    const now = new Date();
    const due = new Date(dueDate);
    if (due >= now) return 0;
    return Math.max(0, Math.ceil((now - due) / (1000 * 60 * 60 * 24)));
  };

  /**
   * Envoyer / Renvoyer
   * -> backend : POST /api/late/contact/:loanId
   */
  const sendEmail = async (loanId) => {
    setError("");
    try {
      const res = await api.post(`/late/contact/${loanId}`);
      showToast(res.data?.message || "Email envoyé ✅");
      await loadAll();
    } catch (err) {
      setError(err?.response?.data?.message || "Erreur envoi email");
    }
  };

  // =====================
  // Sélection historique
  // =====================

  const selectedKeys = useMemo(
    () => Object.keys(selected).filter((k) => selected[k]),
    [selected]
  );

  const allSelected = useMemo(() => {
    if (logs.length === 0) return false;
    return logs.every((r) => selected[`${r.loanId}:${r.logId}`]);
  }, [logs, selected]);

  const toggleSelectAll = () => {
    if (logs.length === 0) return;

    if (allSelected) {
      setSelected({});
      return;
    }

    const next = {};
    for (const r of logs) next[`${r.loanId}:${r.logId}`] = true;
    setSelected(next);
  };

  const toggleOne = (loanId, logId) => {
    const key = `${loanId}:${logId}`;
    setSelected((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // =====================
  // Supprimer historique
  // =====================

  const deleteHistory = async () => {
    setError("");
    if (logs.length === 0) return;

    const keysToDelete =
      selectedKeys.length > 0
        ? selectedKeys
        : logs.map((r) => `${r.loanId}:${r.logId}`);

    const ok = window.confirm(
      selectedKeys.length > 0
        ? `Supprimer ${selectedKeys.length} historique(s) sélectionné(s) ?`
        : `Aucun sélectionné : supprimer TOUS les historiques (${logs.length}) ?`
    );
    if (!ok) return;

    const items = keysToDelete.map((k) => {
      const [loanId, logId] = k.split(":");
      return { loanId, logId };
    });

    try {
      await api.post("/late/email-logs/bulk-delete", { items });
      showToast("Historique supprimé ✅");
      await loadAll();
    } catch (err) {
      setError(err?.response?.data?.message || "Erreur suppression historique");
    }
  };

  // =====================
  // Export PDF historique
  // =====================

  const downloadPdfBlob = (blobData, filename) => {
    const blob = new Blob([blobData], { type: "application/pdf" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const exportHistoryPdf = async () => {
    setError("");

    // sélection => items, sinon export tout
    const items =
      selectedKeys.length > 0
        ? selectedKeys.map((k) => {
            const [loanId, logId] = k.split(":");
            return { loanId, logId };
          })
        : [];

    try {
      const res = await api.post(
        "/late/email-logs/pdf",
        { items },
        { responseType: "blob" }
      );

      const name =
        selectedKeys.length > 0
          ? `email_logs_selected.pdf`
          : `email_logs_all.pdf`;

      downloadPdfBlob(res.data, name);
    } catch (err) {
      setError(err?.response?.data?.message || "Erreur export PDF historique");
    }
  };

  // =====================
  // Modal message complet
  // =====================

  const openMessage = (row) => {
    setMsgRow(row);
    setOpenMsg(true);
  };

  const closeMessage = () => {
    setOpenMsg(false);
    setMsgRow(null);
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

      {/* Modal message complet */}
      {openMsg && msgRow && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-4">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <div>
                <div className="text-sm text-slate-500">Message envoyé</div>
                <div className="font-semibold text-slate-900">
                  {msgRow.subject || "Sans sujet"}
                </div>
              </div>
              <button
                onClick={closeMessage}
                className="p-2 rounded-xl hover:bg-slate-100"
                title="Fermer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-5 py-4 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                  <div className="text-xs text-slate-500">À</div>
                  <div className="font-medium text-slate-900">{msgRow.to}</div>
                </div>

                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                  <div className="text-xs text-slate-500">Date</div>
                  <div className="font-medium text-slate-900">
                    {formatDateTime(msgRow.sentAt)}
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                  <div className="text-xs text-slate-500">Membre</div>
                  <div className="font-medium text-slate-900">
                    {msgRow.memberName}
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                  <div className="text-xs text-slate-500">Livre</div>
                  <div className="font-medium text-slate-900">
                    {msgRow.bookTitle} ({msgRow.inventoryCode})
                  </div>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-4">
                <div className="text-xs text-slate-500 mb-2">Contenu</div>
                <div className="text-sm text-slate-900 whitespace-pre-wrap">
                  {msgRow.message}
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <div className="text-slate-600">
                  Retard: <b>{msgRow.lateDays}</b> jour(s) — Amende:{" "}
                  <b>{msgRow.lateFee}</b> dh ({msgRow.feePerDay} dh/j)
                </div>
                <button
                  onClick={closeMessage}
                  className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Retards</h1>
          <p className="text-sm text-slate-500 mt-1">
            Envoi d’emails automatiques + historique (PDF, suppression, preview).
          </p>
        </div>

        <button
          onClick={loadAll}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50"
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

      {/* Bandeau amende */}
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-700 mt-0.5" />
        <div>
          <div className="font-semibold text-amber-900">Règle d’amende</div>
          <div className="text-sm text-amber-800">
            L’amende par jour est <b>{feePerDay} dh</b>.
          </div>
        </div>
      </div>

      {/* Table prêts en retard */}
      <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm overflow-x-auto">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">Prêts en retard</h2>
          <span className="text-xs text-slate-500">
            Total: <b>{lateLoans.length}</b>
          </span>
        </div>

        <table className="w-full text-sm mt-3">
          <thead>
            <tr className="text-left text-slate-500 border-b">
              <th className="py-2">Membre</th>
              <th className="py-2">Livre</th>
              <th className="py-2">Exemplaire</th>
              <th className="py-2">Retour prévu</th>
              <th className="py-2">Jours</th>
              <th className="py-2">Amende</th>
              <th className="py-2">Action</th>
            </tr>
          </thead>

          <tbody>
            {lateLoans.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-6 text-slate-500">
                  Aucun retard 🎉
                </td>
              </tr>
            ) : (
              lateLoans.map((l) => {
                const member = l.memberId;
                const copy = l.copyId;
                const book = copy?.bookId;

                const days = calcLateDays(l.dueDate);
                const fee = days * feePerDay;

                // ✅ si déjà envoyé au moins 1 email => bouton "Renvoyer"
                const alreadySent =
                  Array.isArray(l.lateEmailLogs) && l.lateEmailLogs.length > 0;

                return (
                  <tr key={l._id} className="border-b last:border-b-0">
                    <td className="py-3">
                      {member ? `${member.firstName} ${member.lastName}` : "-"}
                      <div className="text-xs text-slate-500">
                        {member?.email || "— pas d’email —"}
                      </div>
                    </td>

                    <td className="py-3">{book?.title || "-"}</td>
                    <td className="py-3">{copy?.inventoryCode || "-"}</td>

                    <td className="py-3">
                      <span className="px-2 py-1 text-xs rounded-lg bg-red-50 text-red-700 border border-red-200">
                        {formatDate(l.dueDate)}
                      </span>
                    </td>

                    <td className="py-3 font-semibold text-slate-900">{days}</td>

                    <td className="py-3 font-semibold text-slate-900">
                      {fee} dh
                    </td>

                    <td className="py-3">
                      <button
                        onClick={() => sendEmail(l._id)}
                        className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl transition ${
                          alreadySent
                            ? "bg-amber-600 text-white hover:bg-amber-700"
                            : "bg-slate-950 text-white hover:bg-slate-900"
                        }`}
                        title={
                          alreadySent
                            ? "Renvoyer l’email"
                            : "Envoyer un email automatique"
                        }
                      >
                        <Mail className="w-4 h-4" />
                        {alreadySent ? "Renvoyer mail" : "Envoyer mail"}
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Historique */}
      <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm overflow-x-auto">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div>
            <h2 className="font-semibold text-slate-900">
              Historique des emails envoyés
            </h2>
            <p className="text-sm text-slate-500">
              Clique sur un message pour voir tout le contenu.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* toggle select all */}
            <button
              onClick={toggleSelectAll}
              disabled={logs.length === 0}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-60"
            >
              {allSelected ? (
                <CheckSquare className="w-4 h-4" />
              ) : (
                <Square className="w-4 h-4" />
              )}
              {allSelected ? "Désélectionner tout" : "Sélectionner tout"}
            </button>

            {/* PDF */}
            <button
              onClick={exportHistoryPdf}
              disabled={logs.length === 0}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-950 text-white hover:bg-slate-900 disabled:opacity-60"
              title={selectedKeys.length > 0 ? "Exporter sélection" : "Exporter tout"}
            >
              <FileDown className="w-4 h-4" />
              Exporter PDF
            </button>

            {/* delete */}
            <button
              onClick={deleteHistory}
              disabled={logs.length === 0}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 disabled:opacity-60"
              title={selectedKeys.length > 0 ? "Supprimer sélection" : "Supprimer tout"}
            >
              <Trash2 className="w-4 h-4" />
              Supprimer
            </button>

            <span className="text-xs text-slate-500 px-2">
              Sélectionnés: <b>{selectedKeys.length}</b>
            </span>
          </div>
        </div>

        <table className="w-full text-sm mt-4">
          <thead>
            <tr className="text-left text-slate-500 border-b">
              <th className="py-2 w-10"></th>
              <th className="py-2">Date</th>
              <th className="py-2">À</th>
              <th className="py-2">Membre</th>
              <th className="py-2">Livre</th>
              <th className="py-2">Exemplaire</th>
              <th className="py-2">Message</th>
              <th className="py-2">Retard</th>
              <th className="py-2">Amende</th>
            </tr>
          </thead>

          <tbody>
            {logs.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-6 text-slate-500">
                  Aucun email envoyé pour le moment.
                </td>
              </tr>
            ) : (
              logs.map((r) => {
                const key = `${r.loanId}:${r.logId}`;
                const checked = !!selected[key];

                return (
                  <tr key={key} className="border-b last:border-b-0">
                    <td className="py-3">
                      <button
                        onClick={() => toggleOne(r.loanId, r.logId)}
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

                    <td className="py-3">{formatDateTime(r.sentAt)}</td>
                    <td className="py-3">{r.to}</td>
                    <td className="py-3">{r.memberName}</td>
                    <td className="py-3">{r.bookTitle}</td>
                    <td className="py-3">{r.inventoryCode}</td>

                    {/* ✅ message cliquable -> modal */}
                    <td className="py-3">
                      <button
                        onClick={() => openMessage(r)}
                        className="text-left text-slate-700 hover:underline"
                        title="Voir message complet"
                      >
                        <span className="line-clamp-2">{r.message}</span>
                      </button>
                    </td>

                    <td className="py-3">
                      <span className="px-2 py-1 text-xs rounded-lg bg-amber-50 text-amber-700 border border-amber-200">
                        {r.lateDays} j
                      </span>
                    </td>

                    <td className="py-3 font-semibold text-slate-900">
                      {r.lateFee} dh
                      <div className="text-xs text-slate-500">
                        ({r.feePerDay} dh/j)
                      </div>
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
