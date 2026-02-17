const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

/**
 * Génère un token JWT pour l'utilisateur connecté
 */
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};

/**
 * POST /api/auth/login
 * Body: { email, password }
 */
exports.login = async (req, res) => {
  try {
    // 1) Lire les champs envoyés depuis React / Postman
    const { email, password } = req.body;

    // 2) Vérifier présence
    if (!email || !password) {
      return res.status(400).json({ message: "Email et mot de passe requis" });
    }

    // 3) Chercher l'utilisateur par email
    const user = await User.findOne({ email: email.toLowerCase() });

    // 4) Si pas trouvé -> erreur
    if (!user) {
      return res.status(401).json({ message: "Identifiants invalides" });
    }

    // 5) Comparer le password (clair) avec le hash stocké
    console.log("EMAIL reçu:", JSON.stringify(email));
console.log("PASSWORD reçu:", JSON.stringify(password));
console.log("User trouvé:", !!user);
console.log("Hash commence par $2:", user?.password?.startsWith("$2"));

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Identifiants invalides" });
    }

    // 6) Générer un JWT
    const token = generateToken(user._id);

    // 7) Réponse: token + infos utiles
    return res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Login error:", error.message);
    return res.status(500).json({ message: "Erreur serveur" });
  }
};