const express = require("express");
const { protect } = require("../middleware/authMiddleware");

const {
  getLoans,
  createLoan,
  returnLoan,
  deleteLoan,
  deleteLoansBulk,
  exportLoansPdf,
  exportSelectedLoansPdf,
  exportOneLoanPdf,
} = require("../controllers/loanController");

const router = express.Router();

router.get("/", protect, getLoans);
router.post("/", protect, createLoan);

router.patch("/:id/return", protect, returnLoan);

router.delete("/bulk", protect, deleteLoansBulk);

// ✅ PDF (mettre avant /:id)
router.get("/pdf", protect, exportLoansPdf);
router.post("/pdf/selected", protect, exportSelectedLoansPdf);
router.get("/:id/pdf", protect, exportOneLoanPdf);

router.delete("/:id", protect, deleteLoan);

module.exports = router;
