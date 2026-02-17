const Book = require("../models/Book");
const Copy = require("../models/Copy");
const Loan = require("../models/Loan");

/**
 * GET /api/stats/dashboard
 * Statistiques globales
 */
exports.getDashboardStats = async (req, res) => {
  try {
    const totalBooks = await Book.countDocuments();
    const totalCopies = await Copy.countDocuments();

    const availableCopies = await Copy.countDocuments({ status: "AVAILABLE" });

    const activeLoans = await Loan.countDocuments({ status: "ACTIVE" });

    const lateLoans = await Loan.countDocuments({
      status: "ACTIVE",
      dueDate: { $lt: new Date() },
    });

    res.json({
      totalBooks,
      totalCopies,
      availableCopies,
      activeLoans,
      lateLoans,
    });
  } catch (error) {
    console.error("getDashboardStats error:", error.message);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

/**
 * GET /api/stats/books-by-category
 * Donut chart
 * Exemple:
 * [{ category: "Roman", count: 5 }, ...]
 */
exports.getBooksByCategory = async (req, res) => {
  try {
    const data = await Book.aggregate([
      {
        $group: {
          _id: { $ifNull: ["$category", ""] },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          category: {
            $cond: [{ $eq: ["$_id", ""] }, "Sans catégorie", "$_id"],
          },
          count: 1,
        },
      },
      { $sort: { count: -1 } },
    ]);

    res.json(data);
  } catch (error) {
    console.error("getBooksByCategory error:", error.message);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

/**
 * GET /api/stats/recent-loans?limit=5
 * Liste des derniers prêts (rendus ou actifs)
 */
exports.getRecentLoans = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit || "5", 10), 20);

    const loans = await Loan.find({})
      .populate("memberId")
      .populate({
        path: "copyId",
        populate: { path: "bookId" },
      })
      .sort({ borrowedAt: -1 })
      .limit(limit);

    res.json(loans);
  } catch (error) {
    console.error("getRecentLoans error:", error.message);
    res.status(500).json({ message: "Erreur serveur" });
  }
};
