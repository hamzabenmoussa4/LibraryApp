const PDFDocument = require("pdfkit");
const Loan = require("../models/Loan");

/**
 * Helper: écrit un titre simple dans le PDF
 */
function writeTitle(doc, text) {
  doc.fontSize(18).text(text, { align: "center" });
  doc.moveDown();
}

/**
 * Helper: écrit une ligne "Label: Value"
 */
function writeLine(doc, label, value) {
  doc.fontSize(11).text(`${label}: ${value}`);
}

/**
 * Formate une date en string
 */
function formatDate(d) {
  if (!d) return "-";
  return new Date(d).toLocaleDateString();
}

/**
 * GET /api/loans/:id/pdf
 * PDF d'un prêt
 */
exports.exportOneLoanPdf = async (req, res) => {
  try {
    const loan = await Loan.findById(req.params.id)
      .populate("memberId")
      .populate({ path: "copyId", populate: { path: "bookId" } });

    if (!loan) return res.status(404).json({ message: "Prêt introuvable" });

    // Prépare la réponse en PDF
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="loan_${loan._id}.pdf"`
    );

    const doc = new PDFDocument({ margin: 40 });
    doc.pipe(res);

    writeTitle(doc, "Reçu de prêt - Bibliothèque");

    const member = loan.memberId;
    const copy = loan.copyId;
    const book = copy?.bookId;

    writeLine(doc, "ID prêt", loan._id);
    writeLine(doc, "Membre", member ? `${member.firstName} ${member.lastName}` : "-");
    writeLine(doc, "Livre", book?.title || "-");
    writeLine(doc, "Code exemplaire", copy?.inventoryCode || "-");
    writeLine(doc, "Date emprunt", formatDate(loan.borrowedAt));
    writeLine(doc, "Retour prévu", formatDate(loan.dueDate));
    writeLine(doc, "Statut", loan.status);
    writeLine(doc, "Retour réel", formatDate(loan.returnedAt));

    doc.moveDown();
    doc.fontSize(10).text("Merci de respecter la date de retour prévue.");

    doc.end();
  } catch (error) {
    console.error("exportOneLoanPdf error:", error.message);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

/**
 * GET /api/loans/pdf?status=active|returned|late
 * PDF de tous les prêts (filtrés)
 */
exports.exportLoansPdf = async (req, res) => {
  try {
    const status = (req.query.status || "active").toLowerCase();
    const now = new Date();

    let filter = {};
    if (status === "active") filter = { status: "ACTIVE" };
    else if (status === "returned") filter = { status: "RETURNED" };
    else if (status === "late") filter = { status: "ACTIVE", dueDate: { $lt: now } };
    else return res.status(400).json({ message: "status invalide" });

    const loans = await Loan.find(filter)
      .populate("memberId")
      .populate({ path: "copyId", populate: { path: "bookId" } })
      .sort({ createdAt: -1 });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="loans_${status}.pdf"`
    );

    const doc = new PDFDocument({ margin: 40 });
    doc.pipe(res);

    writeTitle(doc, `Liste des prêts (${status})`);

    if (loans.length === 0) {
      doc.fontSize(12).text("Aucun prêt.");
      doc.end();
      return;
    }

    loans.forEach((loan, index) => {
      const member = loan.memberId;
      const copy = loan.copyId;
      const book = copy?.bookId;

      doc.fontSize(12).text(`Prêt #${index + 1}`, { underline: true });
      writeLine(doc, "Membre", member ? `${member.firstName} ${member.lastName}` : "-");
      writeLine(doc, "Livre", book?.title || "-");
      writeLine(doc, "Exemplaire", copy?.inventoryCode || "-");
      writeLine(doc, "Emprunt", formatDate(loan.borrowedAt));
      writeLine(doc, "Retour prévu", formatDate(loan.dueDate));
      writeLine(doc, "Statut", loan.status);
      doc.moveDown();
      doc.moveDown();
    });

    doc.end();
  } catch (error) {
    console.error("exportLoansPdf error:", error.message);
    res.status(500).json({ message: "Erreur serveur" });
  }
};
