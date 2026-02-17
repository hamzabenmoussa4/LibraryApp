const express = require("express");
const { protect } = require("../middleware/authMiddleware");

const {
  getLateLoans,
  contactLateByEmail,
  getEmailLogs,
  bulkDeleteEmailLogs,
  exportEmailLogsPdf,
} = require("../controllers/lateContactController");

const router = express.Router();

/**
 * Retards
 */
router.get("/loans", protect, getLateLoans);
router.post("/contact/:loanId", protect, contactLateByEmail);

/**
 * Historique emails
 */
router.get("/email-logs", protect, getEmailLogs);
router.post("/email-logs/bulk-delete", protect, bulkDeleteEmailLogs);

/**
 * PDF historique (sélection ou tout)
 */
router.post("/email-logs/pdf", protect, exportEmailLogsPdf);

module.exports = router;
