

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { BookOpen, Eye, EyeOff, Loader2, Lock, Mail, Library, Shield } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();

  // Champs
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // UI states
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [isFocused, setIsFocused] = useState({ email: false, password: false });

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validation basique
    if (!email.trim() || !password.trim()) {
      setError("Veuillez remplir tous les champs");
      return;
    }

    // Validation email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Format d'email invalide");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/auth/login", {
        email: email.trim(),
        password: password.trim(),
      });

      const token = res.data?.token;
      if (!token) {
        setError("Réponse invalide: token manquant");
        setLoading(false);
        return;
      }

      localStorage.setItem("token", token);
      navigate("/");
    } catch (err) {
      setError(err?.response?.data?.message || "Identifiants incorrects");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 relative overflow-hidden">
      {/* Image de fond depuis public/ */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: 'url("/loginpic.jpg")',
        }}
      >
        {/* Overlay pour assombrir l'image et améliorer la lisibilité */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/70 via-blue-800/60 to-indigo-900/70"></div>
        {/* Effet de flou léger sur l'image */}
        <div className="absolute inset-0 backdrop-blur-[2px]"></div>
      </div>

      {/* Effets de fond décoratifs par-dessus l'image */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-300/20 rounded-full mix-blend-overlay filter blur-3xl opacity-40 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-300/20 rounded-full mix-blend-overlay filter blur-3xl opacity-40 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-cyan-300/20 rounded-full mix-blend-overlay filter blur-3xl opacity-40 animate-blob animation-delay-4000"></div>
      </div>

      {/* Carte principale */}
      <div className="relative w-full max-w-md transform transition-all duration-500 hover:scale-[1.01]">
        {/* En-tête flottant */}
        <div className="relative z-10 -mb-6 ml-8">
          <div className="inline-flex items-center gap-3 bg-white/95 backdrop-blur-md px-6 py-4 rounded-2xl shadow-2xl border border-white/30">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center shadow-lg transform hover:rotate-12 transition-transform">
              <Library className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-blue-900">
  Library Admin
</h1>
<p className="text-sm text-blue-800 font-medium">Gestion bibliothèque</p>
            </div>
          </div>
        </div>

        {/* Carte de formulaire */}
        <div className="relative bg-white/90 backdrop-blur-md rounded-3xl shadow-2xl border border-white/30 overflow-hidden">
          {/* Barre de couleur animée en haut */}
          <div className="h-2 bg-gradient-to-r from-blue-400 via-blue-500 to-indigo-500 animate-gradient-x"></div>

          <div className="px-8 py-10">
            {/* Titre avec thème livres */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-3 mb-4">
                <div className="relative">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-white to-blue-50 flex items-center justify-center shadow-sm">
                    <BookOpen className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-400 rounded-full"></div>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-800">Accès bibliothécaire</h2>
                  <p className="text-sm text-blue-600 mt-1">Gérez votre collection de livres</p>
                </div>
              </div>
              
              {/* Phrase d'accroche sur les livres */}
              <div className="mt-6 p-4 bg-white/80 backdrop-blur-sm rounded-xl border border-blue-100/50">
                <p className="text-sm text-slate-700 italic">
                  "Un livre ouvert est un cerveau qui parle ; fermé, un ami qui attend ; oublié, une âme qui pardonne ; détruit, un cœur qui pleure."
                </p>
              </div>
            </div>

            {/* Formulaire */}
            <form onSubmit={onSubmit} className="space-y-6">
              {/* Champ Email */}
              <div className="group">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center">
                    <Mail className="w-3 h-3 text-blue-500 group-hover:text-blue-600 transition-colors" />
                  </div>
                  <label className="text-sm font-medium text-slate-700">Email</label>
                </div>
                <div className={`relative transition-all duration-300 ${isFocused.email ? 'transform -translate-y-1' : ''}`}>
                  <input
                    type="email"
                    className="w-full px-4 py-3.5 pl-12 rounded-xl border-2 border-blue-100/80 bg-white/70 text-slate-900 placeholder-slate-500
                      focus:outline-none focus:border-blue-400 focus:bg-white focus:shadow-lg transition-all duration-300
                      hover:border-blue-300 hover:bg-white backdrop-blur-sm"
                    placeholder="bibliothecaire@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setIsFocused(prev => ({...prev, email: true}))}
                    onBlur={() => setIsFocused(prev => ({...prev, email: false}))}
                    autoComplete="email"
                  />
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                    <Mail className="w-4 h-4 text-blue-400 group-hover:text-blue-500 transition-colors" />
                  </div>
                </div>
              </div>

              {/* Champ Mot de passe */}
              <div className="group">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center">
                    <Lock className="w-3 h-3 text-blue-500 group-hover:text-blue-600 transition-colors" />
                  </div>
                  <label className="text-sm font-medium text-slate-700">Mot de passe</label>
                </div>
                <div className={`relative transition-all duration-300 ${isFocused.password ? 'transform -translate-y-1' : ''}`}>
                  <input
                    type={showPwd ? "text" : "password"}
                    className="w-full px-4 py-3.5 pl-12 pr-12 rounded-xl border-2 border-blue-100/80 bg-white/70 text-slate-900 placeholder-slate-500
                      focus:outline-none focus:border-blue-400 focus:bg-white focus:shadow-lg transition-all duration-300
                      hover:border-blue-300 hover:bg-white backdrop-blur-sm"
                    placeholder="Mot de passe bibliothécaire"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setIsFocused(prev => ({...prev, password: true}))}
                    onBlur={() => setIsFocused(prev => ({...prev, password: false}))}
                    autoComplete="current-password"
                  />
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                    <Lock className="w-4 h-4 text-blue-400 group-hover:text-blue-500 transition-colors" />
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowPwd((v) => !v)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 p-2 rounded-lg hover:bg-blue-50/50 transition-colors group/toggle backdrop-blur-sm"
                    title={showPwd ? "Masquer" : "Afficher"}
                  >
                    {showPwd ? (
                      <EyeOff className="w-4 h-4 text-blue-500 group-hover/toggle:text-blue-600 transition-colors" />
                    ) : (
                      <Eye className="w-4 h-4 text-blue-500 group-hover/toggle:text-blue-600 transition-colors" />
                    )}
                  </button>
                </div>
              </div>

              {/* Message d'erreur */}
              {error && (
                <div className="animate-fadeIn">
                  <div className="rounded-xl bg-red-50/90 backdrop-blur-sm border-l-4 border-red-400 p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                          <BookOpen className="w-4 h-4 text-red-400" />
                        </div>
                      </div>
                      <p className="text-sm text-red-700 font-medium">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Bouton de connexion */}
              <button
                type="submit"
                disabled={loading}
                className="w-full group relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl transition-transform duration-500 group-hover:scale-105 group-active:scale-95"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative flex items-center justify-center gap-3 w-full px-6 py-4 rounded-xl">
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 text-white animate-spin" />
                      <span className="text-white font-semibold">Accès en cours...</span>
                    </>
                  ) : (
                    <>
                      <div className="w-5 h-5 flex items-center justify-center transform group-hover:rotate-12 transition-transform">
                        <BookOpen className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-white font-semibold text-lg">Accéder à la bibliothèque</span>
                      <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                        <Library className="w-4 h-4 text-white/80" />
                      </div>
                    </>
                  )}
                </div>
              </button>

              {/* Note de sécurité */}
              <div className="pt-4 border-t border-blue-100/50">
                <div className="flex items-center justify-center gap-3">
                  <Shield className="w-4 h-4 text-green-500" />
                  <span className="text-xs text-slate-600 font-medium">
                    Espace bibliothécaire sécurisé
                  </span>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-sm text-white drop-shadow-lg">
            <span className="font-semibold">Library Admin</span> • Système de gestion de bibliothèque
          </p>
          <p className="text-xs text-white/80 mt-1 drop-shadow">© 2024 • Pour bibliothécaires professionnels</p>
        </div>
      </div>

      {/* Styles CSS pour les animations */}
      <style jsx>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        
        @keyframes gradient-x {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }

        .animate-blob {
          animation: blob 7s infinite;
        }

        .animate-gradient-x {
          background-size: 200% 200%;
          animation: gradient-x 3s ease infinite;
        }

        .animation-delay-2000 {
          animation-delay: 2s;
        }

        .animation-delay-4000 {
          animation-delay: 4s;
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}