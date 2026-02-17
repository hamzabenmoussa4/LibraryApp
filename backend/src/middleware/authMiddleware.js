const jwt = require("jsonwebtoken");
const User = require("../models/User");

/**
 * Middleware: protège une route
 * - attend un header: Authorization: Bearer <token>
 * - vérifie le token et charge l'utilisateur
 */
exports.protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Non autorisé (token manquant)" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(401).json({ message: "Non autorisé (user introuvable)" });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Non autorisé (token invalide)" });
  }
};
