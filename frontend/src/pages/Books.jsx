// import { useEffect, useMemo, useState } from "react";
// import { Link } from "react-router-dom";
// import api from "../api/axios";
// import {
//   Plus,
//   Search,
//   Filter,
//   Pencil,
//   Trash2,
//   BookOpen,
//   ArrowUpDown,
//   X,
// } from "lucide-react";

// /**
//  * Books v4 (final)
//  * - Cards pro + stock/rupture
//  * - Recherche + filtre catégorie + filtre stock
//  * - Tri (nouveaux / titre / stock)
//  * - Modal Add/Edit
//  * - Toast simple
//  */
// export default function Books() {
//   const [error, setError] = useState("");

//   // data
//   const [books, setBooks] = useState([]);
//   const [categories, setCategories] = useState([]);

//   // query/filter/sort
//   const [q, setQ] = useState("");
//   const [category, setCategory] = useState("");
//   const [stockFilter, setStockFilter] = useState("all"); // all | available | out
//   const [sortBy, setSortBy] = useState("new"); // new | title | stock

//   // modal
//   const [open, setOpen] = useState(false);
//   const [mode, setMode] = useState("create"); // create | edit
//   const [editingId, setEditingId] = useState(null);

//   // form
//   const [title, setTitle] = useState("");
//   const [author, setAuthor] = useState("");
//   const [formCategory, setFormCategory] = useState("");
//   const [imageUrl, setImageUrl] = useState("");

//   // toast
//   const [toast, setToast] = useState({ show: false, text: "", type: "ok" });

//   const showToast = (text, type = "ok") => {
//     setToast({ show: true, text, type });
//     setTimeout(() => setToast({ show: false, text: "", type: "ok" }), 2500);
//   };

//   const cover = (url) =>
//     url && url.trim() !== ""
//       ? url
//       : "https://via.placeholder.com/900x450?text=No+Cover";

//   const loadCategories = async () => {
//     try {
//       const res = await api.get("/books/categories");
//       setCategories(res.data);
//     } catch {
//       // not blocking
//     }
//   };

//   const loadBooks = async () => {
//     setError("");
//     try {
//       const res = await api.get(
//         `/books?q=${encodeURIComponent(q)}&category=${encodeURIComponent(category)}`
//       );
//       setBooks(res.data);
//     } catch (err) {
//       setError(err?.response?.data?.message || "Erreur chargement livres");
//     }
//   };

//   useEffect(() => {
//     loadCategories();
//     loadBooks();
//     // eslint-disable-next-line
//   }, []);

//   // debounce reload
//   useEffect(() => {
//     const t = setTimeout(() => loadBooks(), 250);
//     return () => clearTimeout(t);
//     // eslint-disable-next-line
//   }, [q, category]);

//   const resetForm = () => {
//     setTitle("");
//     setAuthor("");
//     setFormCategory("");
//     setImageUrl("");
//     setEditingId(null);
//   };

//   const openCreate = () => {
//     setMode("create");
//     resetForm();
//     setOpen(true);
//   };

//   const openEdit = (b) => {
//     setMode("edit");
//     setEditingId(b._id);
//     setTitle(b.title || "");
//     setAuthor(b.author || "");
//     setFormCategory(b.category || "");
//     setImageUrl(b.imageUrl || "");
//     setOpen(true);
//   };

//   const closeModal = () => setOpen(false);

//   const submit = async (e) => {
//     e.preventDefault();
//     setError("");

//     if (!title.trim() || !author.trim()) {
//       setError("Titre et auteur requis");
//       return;
//     }

//     const payload = {
//       title: title.trim(),
//       author: author.trim(),
//       category: formCategory.trim(),
//       imageUrl: imageUrl.trim(),
//     };

//     try {
//       if (mode === "create") {
//         await api.post("/books", payload);
//         showToast("Livre créé ✅");
//       } else {
//         await api.put(`/books/${editingId}`, payload);
//         showToast("Livre modifié ✅");
//       }

//       closeModal();
//       await loadCategories();
//       await loadBooks();
//     } catch (err) {
//       setError(err?.response?.data?.message || "Erreur sauvegarde livre");
//     }
//   };

//   const removeBook = async (id) => {
//     setError("");

//     // confirm simple mais clean via modal native
//     const ok = window.confirm(
//       "Supprimer ce livre ? (les exemplaires seront supprimés aussi)"
//     );
//     if (!ok) return;

//     try {
//       await api.delete(`/books/${id}`);
//       showToast("Livre supprimé ✅");
//       await loadCategories();
//       await loadBooks();
//     } catch (err) {
//       setError(err?.response?.data?.message || "Erreur suppression");
//     }
//   };

//   // stats
//   const stats = useMemo(() => {
//     let totalTitles = books.length;
//     let rupture = 0;
//     let availableTitles = 0;

//     for (const b of books) {
//       const total = b.totalCopies || 0;
//       const avail = b.availableCopies || 0;
//       if (total > 0 && avail === 0) rupture++;
//       if (avail > 0) availableTitles++;
//     }
//     return { totalTitles, availableTitles, rupture };
//   }, [books]);

//   // Apply stock filter + sort in frontend
//   const filtered = useMemo(() => {
//     let arr = [...books];

//     if (stockFilter === "available") {
//       arr = arr.filter((b) => (b.availableCopies || 0) > 0);
//     } else if (stockFilter === "out") {
//       arr = arr.filter((b) => (b.totalCopies || 0) > 0 && (b.availableCopies || 0) === 0);
//     }

//     if (sortBy === "title") {
//       arr.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
//     } else if (sortBy === "stock") {
//       arr.sort((a, b) => (b.availableCopies || 0) - (a.availableCopies || 0));
//     } else {
//       // new: backend already sorted by createdAt desc, keep order
//     }

//     return arr;
//   }, [books, stockFilter, sortBy]);

//   const CategoryBadge = ({ value }) => {
//     if (!value) return null;
//     return (
//       <span className="inline-flex items-center px-2 py-1 text-xs rounded-lg bg-slate-100 text-slate-700">
//         {value}
//       </span>
//     );
//   };

//   const StockBadge = ({ total, available }) => {
//     if (!total || total === 0) {
//       return (
//         <span className="inline-flex items-center px-2 py-1 text-xs rounded-lg bg-slate-100 text-slate-600">
//           Aucun exemplaire
//         </span>
//       );
//     }
//     if (!available || available === 0) {
//       return (
//         <span className="inline-flex items-center px-2 py-1 text-xs rounded-lg bg-red-50 text-red-700 border border-red-200">
//           Rupture
//         </span>
//       );
//     }
//     return (
//       <span className="inline-flex items-center px-2 py-1 text-xs rounded-lg bg-green-50 text-green-700 border border-green-200">
//         Disponible ({available})
//       </span>
//     );
//   };

//   return (
//     <div className="space-y-6">
//       {/* Toast */}
//       {toast.show && (
//         <div className="fixed top-4 right-4 z-50">
//           <div
//             className={`px-4 py-2 rounded-xl shadow-lg border text-sm ${
//               toast.type === "ok"
//                 ? "bg-green-50 border-green-200 text-green-800"
//                 : "bg-red-50 border-red-200 text-red-800"
//             }`}
//           >
//             {toast.text}
//           </div>
//         </div>
//       )}

//       {/* Header */}
//       <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
//         <div>
//           <h1 className="text-2xl font-semibold text-slate-900">Livres</h1>
//           <p className="text-sm text-slate-500 mt-1">
//             Gestion moderne : cards, stock, recherche, filtres, tri.
//           </p>
//         </div>

//         <button
//           onClick={openCreate}
//           className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-950 text-white hover:bg-slate-900 transition"
//         >
//           <Plus className="w-4 h-4" />
//           Ajouter
//         </button>
//       </div>

//       {error && (
//         <div className="rounded-xl bg-red-50 border border-red-200 text-red-700 px-3 py-2 text-sm">
//           {error}
//         </div>
//       )}

//       {/* Filters + Stats */}
//       <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 space-y-3">
//         <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
//           {/* Search */}
//           <div className="flex items-center gap-2 border rounded-xl px-3 py-2 focus-within:ring-2 focus-within:ring-slate-900/10">
//             <Search className="w-4 h-4 text-slate-400" />
//             <input
//               className="w-full outline-none text-slate-900"
//               placeholder="Rechercher (titre, auteur, catégorie...)"
//               value={q}
//               onChange={(e) => setQ(e.target.value)}
//             />
//             {q && (
//               <button
//                 type="button"
//                 onClick={() => setQ("")}
//                 className="p-1 rounded-lg hover:bg-slate-100"
//                 title="Effacer"
//               >
//                 <X className="w-4 h-4 text-slate-500" />
//               </button>
//             )}
//           </div>

//           {/* Category */}
//           <div className="flex items-center gap-2 border rounded-xl px-3 py-2">
//             <Filter className="w-4 h-4 text-slate-400" />
//             <select
//               className="w-full outline-none bg-transparent text-slate-900"
//               value={category}
//               onChange={(e) => setCategory(e.target.value)}
//             >
//               <option value="">Toutes catégories</option>
//               {categories.map((c) => (
//                 <option key={c} value={c}>
//                   {c}
//                 </option>
//               ))}
//             </select>
//           </div>

//           {/* Stock filter */}
//           <div className="flex items-center gap-2 border rounded-xl px-3 py-2">
//             <Filter className="w-4 h-4 text-slate-400" />
//             <select
//               className="w-full outline-none bg-transparent text-slate-900"
//               value={stockFilter}
//               onChange={(e) => setStockFilter(e.target.value)}
//             >
//               <option value="all">Tous stocks</option>
//               <option value="available">Disponibles</option>
//               <option value="out">Rupture</option>
//             </select>
//           </div>

//           {/* Sort */}
//           <div className="flex items-center gap-2 border rounded-xl px-3 py-2">
//             <ArrowUpDown className="w-4 h-4 text-slate-400" />
//             <select
//               className="w-full outline-none bg-transparent text-slate-900"
//               value={sortBy}
//               onChange={(e) => setSortBy(e.target.value)}
//             >
//               <option value="new">Nouveaux</option>
//               <option value="title">Titre (A → Z)</option>
//               <option value="stock">Stock (disponibles)</option>
//             </select>
//           </div>
//         </div>

//         <div className="flex flex-wrap gap-2">
//           <span className="inline-flex items-center px-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-700">
//             Titres: <b className="ml-1">{stats.totalTitles}</b>
//           </span>
//           <span className="inline-flex items-center px-3 py-1.5 text-xs rounded-xl bg-green-50 border border-green-200 text-green-700">
//             Disponibles: <b className="ml-1">{stats.availableTitles}</b>
//           </span>
//           <span className="inline-flex items-center px-3 py-1.5 text-xs rounded-xl bg-red-50 border border-red-200 text-red-700">
//             Rupture: <b className="ml-1">{stats.rupture}</b>
//           </span>
//           <span className="inline-flex items-center px-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-700">
//             Affichés: <b className="ml-1">{filtered.length}</b>
//           </span>
//         </div>
//       </div>

//       {/* Cards */}
//       {filtered.length === 0 ? (
//         <div className="bg-white rounded-2xl p-8 border border-slate-100 text-center">
//           <BookOpen className="w-8 h-8 mx-auto text-slate-400" />
//           <p className="mt-2 text-slate-700 font-medium">Aucun livre</p>
//           <p className="text-sm text-slate-500">
//             Change la recherche/filtre, ou ajoute un livre.
//           </p>
//         </div>
//       ) : (
//         <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
//           {filtered.map((b) => (
//             <div
//               key={b._id}
//               className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-md transition"
//             >
//               <div className="h-44 bg-slate-100">
//                 <img
//                   src={cover(b.imageUrl)}
//                   alt={b.title}
//                   className="w-full h-full object-cover"
//                   onError={(e) => {
//                     e.currentTarget.src = cover("");
//                   }}
//                 />
//               </div>

//               <div className="p-4 space-y-3">
//                 <div className="flex items-start justify-between gap-2">
//                   <div className="min-w-0">
//                     <h3 className="font-semibold text-slate-900 line-clamp-1">
//                       {b.title}
//                     </h3>
//                     <p className="text-sm text-slate-500 line-clamp-1">
//                       {b.author}
//                     </p>
//                   </div>

//                   <div className="flex flex-col items-end gap-2">
//                     <CategoryBadge value={b.category} />
//                     <StockBadge total={b.totalCopies} available={b.availableCopies} />
//                   </div>
//                 </div>

//                 {(b.totalCopies || 0) > 0 && (b.availableCopies || 0) === 0 && (
//                   <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
//                     En rupture : tous les exemplaires sont prêtés.
//                   </div>
//                 )}

//                 <div className="flex items-center justify-between pt-1">
//                   <Link
//                     to={`/books/${b._id}`}
//                     className="text-sm font-medium text-slate-900 hover:underline"
//                   >
//                     Détails
//                   </Link>

//                   <div className="flex items-center gap-2">
//                     <button
//                       onClick={() => openEdit(b)}
//                       className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 transition"
//                       title="Modifier"
//                     >
//                       <Pencil className="w-4 h-4" />
//                     </button>

//                     <button
//                       onClick={() => removeBook(b._id)}
//                       className="p-2 rounded-xl border border-slate-200 hover:bg-red-50 hover:border-red-200 transition"
//                       title="Supprimer"
//                     >
//                       <Trash2 className="w-4 h-4 text-red-600" />
//                     </button>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           ))}
//         </div>
//       )}

//       {/* Modal Add/Edit */}
//       {open && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
//           <div className="absolute inset-0 bg-black/40" onClick={closeModal} />

//           <div className="relative w-full max-w-lg bg-white rounded-2xl p-5 shadow-xl border border-slate-100">
//             <div className="flex items-start justify-between gap-4">
//               <div>
//                 <h2 className="text-lg font-semibold text-slate-900">
//                   {mode === "create" ? "Ajouter un livre" : "Modifier le livre"}
//                 </h2>
//                 <p className="text-sm text-slate-500">
//                   Titre, auteur, catégorie, image.
//                 </p>
//               </div>

//               <button
//                 onClick={closeModal}
//                 className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50"
//               >
//                 Fermer
//               </button>
//             </div>

//             <form onSubmit={submit} className="mt-4 space-y-3">
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
//                 <label className="block">
//                   <span className="text-sm text-slate-700">Titre *</span>
//                   <input
//                     className="mt-1 w-full border rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-slate-900/10"
//                     value={title}
//                     onChange={(e) => setTitle(e.target.value)}
//                     required
//                   />
//                 </label>

//                 <label className="block">
//                   <span className="text-sm text-slate-700">Auteur *</span>
//                   <input
//                     className="mt-1 w-full border rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-slate-900/10"
//                     value={author}
//                     onChange={(e) => setAuthor(e.target.value)}
//                     required
//                   />
//                 </label>
//               </div>

//               <label className="block">
//                 <span className="text-sm text-slate-700">Catégorie</span>
//                 <input
//                   className="mt-1 w-full border rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-slate-900/10"
//                   value={formCategory}
//                   onChange={(e) => setFormCategory(e.target.value)}
//                   placeholder="Roman, Informatique, Histoire..."
//                 />
//               </label>

//               <label className="block">
//                 <span className="text-sm text-slate-700">Image URL</span>
//                 <input
//                   className="mt-1 w-full border rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-slate-900/10"
//                   value={imageUrl}
//                   onChange={(e) => setImageUrl(e.target.value)}
//                   placeholder="https://... (URL directe .jpg/.png)"
//                 />
//               </label>

//               <div className="rounded-2xl border border-slate-200 overflow-hidden">
//                 <div className="bg-slate-50 px-3 py-2 text-xs text-slate-600">
//                   Aperçu image
//                 </div>
//                 <div className="h-44 bg-slate-100">
//                   <img
//                     src={cover(imageUrl)}
//                     alt="preview"
//                     className="w-full h-full object-cover"
//                     onError={(e) => {
//                       e.currentTarget.src = cover("");
//                     }}
//                   />
//                 </div>
//               </div>

//               <div className="flex items-center justify-end gap-2 pt-2">
//                 <button
//                   type="button"
//                   onClick={closeModal}
//                   className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50"
//                 >
//                   Annuler
//                 </button>

//                 <button
//                   type="submit"
//                   className="px-4 py-2 rounded-xl bg-slate-950 text-white hover:bg-slate-900 transition"
//                 >
//                   {mode === "create" ? "Créer" : "Enregistrer"}
//                 </button>
//               </div>
//             </form>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import {
  Plus,
  Search,
  Filter,
  Pencil,
  Trash2,
  BookOpen,
  ArrowUpDown,
  X,
} from "lucide-react";

/**
 * Books v4 (final)
 * - Cards pro + stock/rupture
 * - Recherche + filtre catégorie + filtre stock
 * - Tri (nouveaux / titre / stock)
 * - Modal Add/Edit
 * - Toast simple
 *
 * IMPORTANT:
 * - Catégories générées depuis books (pas besoin d'endpoint /books/categories)
 * - Recherche inclut titre + auteur + catégorie
 */
export default function Books() {
  const [error, setError] = useState("");

  // data
  const [books, setBooks] = useState([]);

  // query/filter/sort
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("ALL"); // ALL | "Roman" | ...
  const [stockFilter, setStockFilter] = useState("all"); // all | available | out | none
  const [sortBy, setSortBy] = useState("new"); // new | title | stock

  // modal
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState("create"); // create | edit
  const [editingId, setEditingId] = useState(null);

  // form
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [formCategory, setFormCategory] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  // toast
  const [toast, setToast] = useState({ show: false, text: "", type: "ok" });

  const showToast = (text, type = "ok") => {
    setToast({ show: true, text, type });
    setTimeout(() => setToast({ show: false, text: "", type: "ok" }), 2500);
  };

  const cover = (url) =>
    url && url.trim() !== ""
      ? url
      : "https://via.placeholder.com/900x450?text=No+Cover";

  /**
   * Charger tous les livres
   * - On ne filtre pas côté backend (plus fiable)
   * - On filtre côté frontend (recherche/catégorie/stock/tri)
   */
  const loadBooks = async () => {
    setError("");
    try {
      const res = await api.get("/books");
      setBooks(res.data);
    } catch (err) {
      setError(err?.response?.data?.message || "Erreur chargement livres");
    }
  };

  useEffect(() => {
    loadBooks();
    // eslint-disable-next-line
  }, []);

  // Debounce reload (optionnel) : ici on ne reload pas sur q/category
  // car tout se fait en frontend.

  const resetForm = () => {
    setTitle("");
    setAuthor("");
    setFormCategory("");
    setImageUrl("");
    setEditingId(null);
  };

  const openCreate = () => {
    setMode("create");
    resetForm();
    setOpen(true);
  };

  const openEdit = (b) => {
    setMode("edit");
    setEditingId(b._id);
    setTitle(b.title || "");
    setAuthor(b.author || "");
    setFormCategory(b.category || "");
    setImageUrl(b.imageUrl || "");
    setOpen(true);
  };

  const closeModal = () => setOpen(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    if (!title.trim() || !author.trim()) {
      setError("Titre et auteur requis");
      return;
    }

    const payload = {
      title: title.trim(),
      author: author.trim(),
      category: formCategory.trim(),
      imageUrl: imageUrl.trim(),
    };

    try {
      if (mode === "create") {
        await api.post("/books", payload);
        showToast("Livre créé ✅");
      } else {
        await api.put(`/books/${editingId}`, payload);
        showToast("Livre modifié ✅");
      }

      closeModal();
      await loadBooks();
    } catch (err) {
      setError(err?.response?.data?.message || "Erreur sauvegarde livre");
    }
  };

  const removeBook = async (id) => {
    setError("");

    const ok = window.confirm(
      "Supprimer ce livre ? (les exemplaires seront supprimés aussi)"
    );
    if (!ok) return;

    try {
      await api.delete(`/books/${id}`);
      showToast("Livre supprimé ✅");
      await loadBooks();
    } catch (err) {
      setError(err?.response?.data?.message || "Erreur suppression");
    }
  };

  /**
   * Catégories uniques (depuis books)
   * => Corrige ton problème "je peux pas chercher par catégorie"
   */
  const categories = useMemo(() => {
    const set = new Set();
    for (const b of books) {
      const c = (b.category || "").trim();
      if (c) set.add(c);
    }
    return ["ALL", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [books]);

  // stats
  const stats = useMemo(() => {
    let totalTitles = books.length;
    let rupture = 0;
    let availableTitles = 0;
    let noCopies = 0;

    for (const b of books) {
      const total = b.totalCopies || 0;
      const avail = b.availableCopies || 0;

      if (total === 0) noCopies++;
      if (total > 0 && avail === 0) rupture++;
      if (avail > 0) availableTitles++;
    }

    return { totalTitles, availableTitles, rupture, noCopies };
  }, [books]);

  /**
   * Filtrage + tri final
   * - recherche (titre/auteur/catégorie)
   * - filtre catégorie (dropdown)
   * - filtre stock
   * - tri
   */
  const filtered = useMemo(() => {
    let arr = [...books];

    // Recherche textuelle
    const query = q.trim().toLowerCase();
    if (query) {
      arr = arr.filter((b) => {
        const t = (b.title || "").toLowerCase();
        const a = (b.author || "").toLowerCase();
        const c = (b.category || "").toLowerCase();
        return t.includes(query) || a.includes(query) || c.includes(query);
      });
    }

    // Catégorie
    if (category !== "ALL") {
      arr = arr.filter((b) => (b.category || "").trim() === category);
    }

    // Stock filter
    if (stockFilter === "available") {
      arr = arr.filter((b) => (b.availableCopies || 0) > 0);
    } else if (stockFilter === "out") {
      arr = arr.filter(
        (b) => (b.totalCopies || 0) > 0 && (b.availableCopies || 0) === 0
      );
    } else if (stockFilter === "none") {
      arr = arr.filter((b) => (b.totalCopies || 0) === 0);
    }

    // Sort
    if (sortBy === "title") {
      arr.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
    } else if (sortBy === "stock") {
      arr.sort((a, b) => (b.availableCopies || 0) - (a.availableCopies || 0));
    } else {
      // new: garder l'ordre backend (createdAt desc si ton backend le fait)
      // sinon tu peux trier localement si tu as createdAt:
      // arr.sort((a,b)=> new Date(b.createdAt)-new Date(a.createdAt));
    }

    return arr;
  }, [books, q, category, stockFilter, sortBy]);

  const CategoryBadge = ({ value }) => {
    if (!value || !value.trim()) return null;
    return (
      <span className="inline-flex items-center px-2 py-1 text-xs rounded-lg bg-slate-100 text-slate-700">
        {value}
      </span>
    );
  };

  const StockBadge = ({ total, available }) => {
    if (!total || total === 0) {
      return (
        <span className="inline-flex items-center px-2 py-1 text-xs rounded-lg bg-slate-100 text-slate-600">
          Aucun exemplaire
        </span>
      );
    }
    if (!available || available === 0) {
      return (
        <span className="inline-flex items-center px-2 py-1 text-xs rounded-lg bg-red-50 text-red-700 border border-red-200">
          Rupture
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-1 text-xs rounded-lg bg-green-50 text-green-700 border border-green-200">
        Disponible ({available})
      </span>
    );
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
          <h1 className="text-2xl font-semibold text-slate-900">Livres</h1>
          <p className="text-sm text-slate-500 mt-1">
            Gestion moderne : cards, stock, recherche, filtres, tri.
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

      {/* Filters + Stats */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 space-y-3">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="flex items-center gap-2 border rounded-xl px-3 py-2 focus-within:ring-2 focus-within:ring-slate-900/10">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              className="w-full outline-none text-slate-900"
              placeholder="Rechercher (titre, auteur, catégorie...)"
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

          {/* Category */}
          <div className="flex items-center gap-2 border rounded-xl px-3 py-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              className="w-full outline-none bg-transparent text-slate-900"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c === "ALL" ? "Toutes catégories" : c}
                </option>
              ))}
            </select>
          </div>

          {/* Stock filter */}
          <div className="flex items-center gap-2 border rounded-xl px-3 py-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              className="w-full outline-none bg-transparent text-slate-900"
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value)}
            >
              <option value="all">Tous stocks</option>
              <option value="available">Disponibles</option>
              <option value="out">Rupture</option>
              <option value="none">Sans exemplaires</option>
            </select>
          </div>

          {/* Sort */}
          <div className="flex items-center gap-2 border rounded-xl px-3 py-2">
            <ArrowUpDown className="w-4 h-4 text-slate-400" />
            <select
              className="w-full outline-none bg-transparent text-slate-900"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="new">Nouveaux</option>
              <option value="title">Titre (A → Z)</option>
              <option value="stock">Stock (disponibles)</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center px-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-700">
            Titres: <b className="ml-1">{stats.totalTitles}</b>
          </span>
          <span className="inline-flex items-center px-3 py-1.5 text-xs rounded-xl bg-green-50 border border-green-200 text-green-700">
            Disponibles: <b className="ml-1">{stats.availableTitles}</b>
          </span>
          <span className="inline-flex items-center px-3 py-1.5 text-xs rounded-xl bg-red-50 border border-red-200 text-red-700">
            Rupture: <b className="ml-1">{stats.rupture}</b>
          </span>
          <span className="inline-flex items-center px-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-700">
            Sans exemplaires: <b className="ml-1">{stats.noCopies}</b>
          </span>
          <span className="inline-flex items-center px-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-700">
            Affichés: <b className="ml-1">{filtered.length}</b>
          </span>
        </div>
      </div>

      {/* Cards */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 border border-slate-100 text-center">
          <BookOpen className="w-8 h-8 mx-auto text-slate-400" />
          <p className="mt-2 text-slate-700 font-medium">Aucun livre</p>
          <p className="text-sm text-slate-500">
            Change la recherche/filtre, ou ajoute un livre.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((b) => (
            <div
              key={b._id}
              className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-md transition"
            >
              <div className="h-44 bg-slate-100">
                <img
                  src={cover(b.imageUrl)}
                  alt={b.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = cover("");
                  }}
                />
              </div>

              <div className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-slate-900 line-clamp-1">
                      {b.title}
                    </h3>
                    <p className="text-sm text-slate-500 line-clamp-1">
                      {b.author}
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <CategoryBadge value={b.category} />
                    <StockBadge
                      total={b.totalCopies}
                      available={b.availableCopies}
                    />
                  </div>
                </div>

                {(b.totalCopies || 0) > 0 && (b.availableCopies || 0) === 0 && (
                  <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                    En rupture : tous les exemplaires sont prêtés.
                  </div>
                )}

                <div className="flex items-center justify-between pt-1">
                  <Link
                    to={`/books/${b._id}`}
                    className="text-sm font-medium text-slate-900 hover:underline"
                  >
                    Détails
                  </Link>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEdit(b)}
                      className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 transition"
                      title="Modifier"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => removeBook(b._id)}
                      className="p-2 rounded-xl border border-slate-200 hover:bg-red-50 hover:border-red-200 transition"
                      title="Supprimer"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Add/Edit */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40" onClick={closeModal} />

          <div className="relative w-full max-w-lg bg-white rounded-2xl p-5 shadow-xl border border-slate-100">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  {mode === "create" ? "Ajouter un livre" : "Modifier le livre"}
                </h2>
                <p className="text-sm text-slate-500">
                  Titre, auteur, catégorie, image.
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
                  <span className="text-sm text-slate-700">Titre *</span>
                  <input
                    className="mt-1 w-full border rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-slate-900/10"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </label>

                <label className="block">
                  <span className="text-sm text-slate-700">Auteur *</span>
                  <input
                    className="mt-1 w-full border rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-slate-900/10"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    required
                  />
                </label>
              </div>

              <label className="block">
                <span className="text-sm text-slate-700">Catégorie</span>
                <input
                  className="mt-1 w-full border rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-slate-900/10"
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  placeholder="Roman, Informatique, Histoire..."
                />
              </label>

              <label className="block">
                <span className="text-sm text-slate-700">Image URL</span>
                <input
                  className="mt-1 w-full border rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-slate-900/10"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://... (URL directe .jpg/.png)"
                />
              </label>

              <div className="rounded-2xl border border-slate-200 overflow-hidden">
                <div className="bg-slate-50 px-3 py-2 text-xs text-slate-600">
                  Aperçu image
                </div>
                <div className="h-44 bg-slate-100">
                  <img
                    src={cover(imageUrl)}
                    alt="preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = cover("");
                    }}
                  />
                </div>
              </div>

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
