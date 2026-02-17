const PDFDocument = require("pdfkit");
const Copy = require("../models/Copy");

/** helper */
function title(doc, t) {
  doc.fontSize(18).text(t, { align: "center" });
  doc.moveDown();
}
function line(doc, label, value) {
  doc.fontSize(11).text(`${label}: ${value}`);
}

/**
 * GET /api/copies/:copyId/pdf
 * PDF d'un exemplaire (1 par 1)
 */
exports.exportOneCopyPdf = async (req, res) => {
  try {
    const copy = await Copy.findById(req.params.copyId).populate("bookId");
    if (!copy) return res.status(404).json({ message: "Exemplaire introuvable" });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="copy_${copy._id}.pdf"`
    );

    const doc = new PDFDocument({ margin: 40 });
    doc.pipe(res);

    title(doc, "Détails de l'exemplaire");

    line(doc, "Livre", copy.bookId?.title || "-");
    line(doc, "Auteur", copy.bookId?.author || "-");
    line(doc, "Code inventaire", copy.inventoryCode);
    line(doc, "Statut", copy.status);
    line(doc, "Etat", copy.condition);

    doc.end();
  } catch (error) {
    console.error("exportOneCopyPdf error:", error.message);
    res.status(500).json({ message: "Erreur serveur" });
  }
};
