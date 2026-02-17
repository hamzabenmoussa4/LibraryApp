const express = require("express");
const { protect } = require("../middleware/authMiddleware");

const {
  getDashboardStats,
  getBooksByCategory,
  getRecentLoans,
} = require("../controllers/statsController");

const router = express.Router();

router.get("/dashboard", protect, getDashboardStats);
router.get("/books-by-category", protect, getBooksByCategory);
router.get("/recent-loans", protect, getRecentLoans);

module.exports = router;
