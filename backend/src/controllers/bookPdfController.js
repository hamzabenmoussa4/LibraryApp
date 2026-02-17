const PDFDocument = require("pdfkit");
const Book = require("../models/Book");
const Copy = require("../models/Copy");

/** Format date simple */
function formatDate(d) {
  if (!d) return "-";
  return new Date(d).toLocaleDateString();
}

/** Helper: titre */
function title(doc, t) {
  doc.fontSize(18).text(t, { align: "center" });
  doc.moveDown();
}

/** Helper: ligne Label: Value */
function line(doc, label, value) {
  doc.fontSize(11).text(`${label}: ${value}`);
}

/**
 * GET /api/books/:id/pdf
 * PDF des détails d'un livre (sans forcément lister les exemplaires)
 */
exports.exportBookDetailsPdf = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ message: "Livre introuvable" });

    // Stock (pour afficher dans le PDF)
    const copies = await Copy.find({ bookId: book._id });
    const total = copies.length;
    const available = copies.filter((c) => c.status === "AVAILABLE").length;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="book_${book._id}.pdf"`
    );

    const doc = new PDFDocument({ margin: 40 });
    doc.pipe(res);

    title(doc, "Détails du livre");

    line(doc, "Titre", book.title);
    line(doc, "Auteur", book.author);
    line(doc, "Catégorie", book.category || "-");
    line(doc, "Image URL", book.imageUrl || "-");
    doc.moveDown();

    line(doc, "Stock total", String(total));
    line(doc, "Stock disponible", String(available));

    doc.moveDown();
    doc.fontSize(10).text(`Généré le: ${formatDate(new Date())}`);

    doc.end();
  } catch (error) {
    console.error("exportBookDetailsPdf error:", error.message);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

/**
 * GET /api/books/:id/copies/pdf
 * PDF de tous les exemplaires d'un livre
 */
exports.exportBookCopiesPdf = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ message: "Livre introuvable" });

    const copies = await Copy.find({ bookId: book._id }).sort({ createdAt: -1 });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="book_${book._id}_copies.pdf"`
    );

    const doc = new PDFDocument({ margin: 40 });
    doc.pipe(res);

    title(doc, "Exemplaires du livre");

    line(doc, "Titre", book.title);
    line(doc, "Auteur", book.author);
    line(doc, "Catégorie", book.category || "-");
    doc.moveDown();

    if (copies.length === 0) {
      doc.fontSize(12).text("Aucun exemplaire.");
      doc.end();
      return;
    }

    copies.forEach((c, idx) => {
      doc.fontSize(12).text(`Exemplaire #${idx + 1}`, { underline: true });
      line(doc, "Code inventaire", c.inventoryCode);
      line(doc, "Statut", c.status);
      line(doc, "Etat", c.condition);
      doc.moveDown();
    });

    doc.end();
  } catch (error) {
    console.error("exportBookCopiesPdf error:", error.message);
    res.status(500).json({ message: "Erreur serveur" });
  }
};
