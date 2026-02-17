import { useEffect, useMemo, useState } from "react";
import api from "../api/axios";
import { Plus, Search, Pencil, Trash2, Users, X } from "lucide-react";

/**
 * Members FINAL
 * - Cards pro
 * - Recherche
 * - Modal Ajouter/Modifier
 * - Stats en haut
 */
export default function Members() {
  const [error, setError] = useState("");

  const [members, setMembers] = useState([]);

  // search
  const [q, setQ] = useState("");

  // modal
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState("create"); // create | edit
  const [editingId, setEditingId] = useState(null);

  // form
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  // toast
  const [toast, setToast] = useState({ show: false, text: "", type: "ok" });
  const showToast = (text, type = "ok") => {
    setToast({ show: true, text, type });
    setTimeout(() => setToast({ show: false, text: "", type: "ok" }), 2500);
  };

  const resetForm = () => {
    setFirstName("");
    setLastName("");
    setEmail("");
    setPhone("");
    setEditingId(null);
  };

  const openCreate = () => {
    setMode("create");
    resetForm();
    setOpen(true);
  };

  const openEdit = (m) => {
    setMode("edit");
    setEditingId(m._id);
    setFirstName(m.firstName || "");
    setLastName(m.lastName || "");
    setEmail(m.email || "");
    setPhone(m.phone || "");
    setOpen(true);
  };

  const closeModal = () => setOpen(false);

  const loadMembers = async () => {
    setError("");
    try {
      const res = await api.get(`/members?q=${encodeURIComponent(q)}`);
      setMembers(res.data);
    } catch (err) {
      setError(err?.response?.data?.message || "Erreur chargement membres");
    }
  };

  useEffect(() => {
    loadMembers();
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    const t = setTimeout(() => loadMembers(), 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line
  }, [q]);

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    if (!firstName.trim() || !lastName.trim()) {
      setError("Prénom et nom requis");
      return;
    }

    const payload = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      phone: phone.trim(),
    };

    try {
      if (mode === "create") {
        await api.post("/members", payload);
        showToast("Membre créé ✅");
      } else {
        await api.put(`/members/${editingId}`, payload);
        showToast("Membre modifié ✅");
      }

      closeModal();
      await loadMembers();
    } catch (err) {
      setError(err?.response?.data?.message || "Erreur sauvegarde membre");
    }
  };

  const removeMember = async (id) => {
    setError("");
    const ok = window.confirm("Supprimer ce membre ?");
    if (!ok) return;

    try {
      await api.delete(`/members/${id}`);
      showToast("Membre supprimé ✅");
      await loadMembers();
    } catch (err) {
      setError(err?.response?.data?.message || "Erreur suppression");
    }
  };

  const stats = useMemo(() => {
    const total = members.length;
    const withEmail = members.filter((m) => (m.email || "").trim()).length;
    const withPhone = members.filter((m) => (m.phone || "").trim()).length;
    return { total, withEmail, withPhone };
  }, [members]);

  const initials = (m) => {
    const a = (m.firstName || "").trim().charAt(0).toUpperCase();
    const b = (m.lastName || "").trim().charAt(0).toUpperCase();
    return `${a}${b}` || "M";
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
          <h1 className="text-2xl font-semibold text-slate-900">Membres</h1>
          <p className="text-sm text-slate-500 mt-1">
            Gestion des adhérents : ajout, modification, suppression.
          </p>
        </div>

        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-950 text-white hover:bg-slate-900 transition"
        >
          <Plus className="w-4 h-4" />
          Ajouter
        </button>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 text-red-700 px-3 py-2 text-sm">
          {error}
        </div>
      )}

      {/* Search + Stats */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 flex items-center gap-2 border rounded-xl px-3 py-2 focus-within:ring-2 focus-within:ring-slate-900/10">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              className="w-full outline-none text-slate-900"
              placeholder="Rechercher (nom, prénom, email, téléphone...)"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            {q && (
              <button
                type="button"
                onClick={() => setQ("")}
                className="p-1 rounded-lg hover:bg-slate-100"
                title="Effacer"
              >
                <X className="w-4 h-4 text-slate-500" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center px-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-700">
              Total: <b className="ml-1">{stats.total}</b>
            </span>
            <span className="inline-flex items-center px-3 py-1.5 text-xs rounded-xl bg-green-50 border border-green-200 text-green-700">
              Avec email: <b className="ml-1">{stats.withEmail}</b>
            </span>
            <span className="inline-flex items-center px-3 py-1.5 text-xs rounded-xl bg-blue-50 border border-blue-200 text-blue-700">
              Avec téléphone: <b className="ml-1">{stats.withPhone}</b>
            </span>
          </div>
        </div>
      </div>

      {/* Cards */}
      {members.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 border border-slate-100 text-center">
          <Users className="w-8 h-8 mx-auto text-slate-400" />
          <p className="mt-2 text-slate-700 font-medium">Aucun membre</p>
          <p className="text-sm text-slate-500">Ajoute un membre pour commencer.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {members.map((m) => (
            <div
              key={m._id}
              className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm hover:shadow-md transition"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-950 text-white flex items-center justify-center font-semibold">
                    {initials(m)}
                  </div>

                  <div className="min-w-0">
                    <div className="font-semibold text-slate-900 line-clamp-1">
                      {m.firstName} {m.lastName}
                    </div>
                    <div className="text-sm text-slate-500 line-clamp-1">
                      {m.email?.trim() ? m.email : "— Pas d’email —"}
                    </div>
                    <div className="text-sm text-slate-500 line-clamp-1">
                      {m.phone?.trim() ? m.phone : "— Pas de téléphone —"}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEdit(m)}
                    className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 transition"
                    title="Modifier"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => removeMember(m._id)}
                    className="p-2 rounded-xl border border-slate-200 hover:bg-red-50 hover:border-red-200 transition"
                    title="Supprimer"
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40" onClick={closeModal} />
          <div className="relative w-full max-w-lg bg-white rounded-2xl p-5 shadow-xl border border-slate-100">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  {mode === "create" ? "Ajouter un membre" : "Modifier le membre"}
                </h2>
                <p className="text-sm text-slate-500">
                  Prénom, nom, email, téléphone.
                </p>
              </div>

              <button
                onClick={closeModal}
                className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50"
              >
                Fermer
              </button>
            </div>

            <form onSubmit={submit} className="mt-4 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-sm text-slate-700">Prénom *</span>
                  <input
                    className="mt-1 w-full border rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-slate-900/10"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                  />
                </label>

                <label className="block">
                  <span className="text-sm text-slate-700">Nom *</span>
                  <input
                    className="mt-1 w-full border rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-slate-900/10"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                  />
                </label>
              </div>

              <label className="block">
                <span className="text-sm text-slate-700">Email</span>
                <input
                  type="email"
                  className="mt-1 w-full border rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-slate-900/10"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ex: membre@gmail.com"
                />
              </label>

              <label className="block">
                <span className="text-sm text-slate-700">Téléphone</span>
                <input
                  className="mt-1 w-full border rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-slate-900/10"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="ex: 06xxxxxxxx"
                />
              </label>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50"
                >
                  Annuler
                </button>

                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-slate-950 text-white hover:bg-slate-900 transition"
                >
                  {mode === "create" ? "Créer" : "Enregistrer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
