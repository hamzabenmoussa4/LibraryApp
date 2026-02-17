const Copy = require("../models/Copy");

/**
 * GET /api/copies/available
 * Renvoie les exemplaires disponibles + bookId populate
 */
exports.getAvailableCopies = async (req, res) => {
  try {
    const copies = await Copy.find({ status: "AVAILABLE" })
      .populate("bookId")
      .sort({ createdAt: -1 });

    res.json(copies);
  } catch (error) {
    console.error("getAvailableCopies error:", error.message);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

