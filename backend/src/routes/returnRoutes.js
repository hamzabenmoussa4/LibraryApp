const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const {
  deleteOneReturnLog,
  bulkDeleteReturnLogs,
} = require("../controllers/returnHistoryController");

const router = express.Router();

// Supprimer une ligne d'historique rendu
router.delete("/history/:loanId/log/:logId", protect, deleteOneReturnLog);

// Supprimer plusieurs lignes
router.post("/history/bulk-delete", protect, bulkDeleteReturnLogs);

module.exports = router;
