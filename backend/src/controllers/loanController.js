const PDFDocument = require("pdfkit");
const Loan = require("../models/Loan");
const Copy = require("../models/Copy");

const loanPopulate = [
  { path: "memberId" },
  { path: "copyId", populate: { path: "bookId" } },
];

// =======================
// Helpers PDF
// =======================

const formatDate = (d) => {
  if (!d) return "-";
  return new Date(d).toLocaleDateString();
};

const buildLoansFilter = (status) => {
  const s = (status || "active").toLowerCase();
  const filter = {};

  if (s === "active") filter.status = "ACTIVE";
  else if (s === "returned") filter.status = "RETURNED";
  else if (s === "late") {
    filter.status = "ACTIVE";
    filter.dueDate = { $lt: new Date() };
  } else {
    filter.status = "ACTIVE";
  }

  return filter;
};

const writeLoansPdf = (res, title, loans) => {
  // Headers pour téléchargement PDF
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${title}.pdf"`);

  const doc = new PDFDocument({ margin: 40, size: "A4" });
  doc.pipe(res);

  // Titre
  doc.fontSize(18).text(title, { align: "center" });
  doc.moveDown(0.5);
  doc.fontSize(10).fillColor("#555").text(`Généré le : ${new Date().toLocaleString()}`, {
    align: "center",
  });
  doc.moveDown(1);

  // Résumé
  doc.fillColor("#000").fontSize(12).text(`Total: ${loans.length}`);
  doc.moveDown(1);

  // Table “simple” (texte)
  doc.fontSize(11).fillColor("#000");

  for (const l of loans) {
    const member = l.memberId;
    const copy = l.copyId;
    const book = copy?.bookId;

    const memberName = member ? `${member.firstName} ${member.lastName}` : "-";
    const bookTitle = book?.title || "-";
    const inv = copy?.inventoryCode || "-";

    const isLate = l.status === "ACTIVE" && l.dueDate && new Date(l.dueDate) < new Date();

    doc
      .fontSize(11)
      .fillColor("#000")
      .text(`• Membre: ${memberName}`);

    doc.fontSize(11).text(`  Livre: ${bookTitle}`);
    doc.fontSize(11).text(`  Exemplaire: ${inv}`);

    doc
      .fontSize(11)
      .text(`  Emprunt: ${formatDate(l.borrowedAt)} | Retour prévu: ${formatDate(l.dueDate)} | Retour réel: ${formatDate(l.returnedAt)}`);

    doc
      .fontSize(11)
      .fillColor(isLate ? "red" : "#000")
      .text(`  Statut: ${isLate ? "EN RETARD" : l.status}`);

    doc.moveDown(0.8);
    doc.fillColor("#000");

    // Saut de page si nécessaire
    if (doc.y > 740) doc.addPage();
  }

  doc.end();
};

// =======================
// CRUD LOANS
// =======================

exports.getLoans = async (req, res) => {
  try {
    const filter = buildLoansFilter(req.query.status);

    const loans = await Loan.find(filter)
      .populate(loanPopulate)
      .sort({ borrowedAt: -1 });

    res.json(loans);
  } catch (error) {
    console.error("getLoans error:", error.message);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

exports.createLoan = async (req, res) => {
  try {
    const { memberId, copyId, dueDate } = req.body;

    if (!memberId || !copyId || !dueDate) {
      return res.status(400).json({ message: "Champs requis manquants" });
    }

    const copy = await Copy.findById(copyId);
    if (!copy) return res.status(404).json({ message: "Exemplaire introuvable" });

    if (copy.status !== "AVAILABLE") {
      return res.status(400).json({ message: "Exemplaire non disponible" });
    }

    const loan = await Loan.create({
      memberId,
      copyId,
      borrowedAt: new Date(),
      dueDate: new Date(dueDate),
      status: "ACTIVE",
    });

    copy.status = "BORROWED";
    await copy.save();

    const populated = await Loan.findById(loan._id).populate(loanPopulate);
    res.status(201).json(populated);
  } catch (error) {
    console.error("createLoan error:", error.message);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

exports.returnLoan = async (req, res) => {
  try {
    const { id } = req.params;

    const loan = await Loan.findById(id);
    if (!loan) return res.status(404).json({ message: "Prêt introuvable" });

    if (loan.status !== "ACTIVE") {
      return res.status(400).json({ message: "Ce prêt est déjà rendu" });
    }

    loan.status = "RETURNED";
    loan.returnedAt = new Date();
    await loan.save();

    const copy = await Copy.findById(loan.copyId);
    if (copy) {
      copy.status = "AVAILABLE";
      await copy.save();
    }

    const populated = await Loan.findById(id).populate(loanPopulate);
    res.json(populated);
  } catch (error) {
    console.error("returnLoan error:", error.message);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

exports.deleteLoan = async (req, res) => {
  try {
    const { id } = req.params;

    const loan = await Loan.findById(id);
    if (!loan) return res.status(404).json({ message: "Prêt introuvable" });

    if (loan.status === "ACTIVE") {
      const copy = await Copy.findById(loan.copyId);
      if (copy) {
        copy.status = "AVAILABLE";
        await copy.save();
      }
    }

    await Loan.deleteOne({ _id: id });
    res.json({ message: "Prêt supprimé ✅" });
  } catch (error) {
    console.error("deleteLoan error:", error.message);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

exports.deleteLoansBulk = async (req, res) => {
  try {
    const { loanIds } = req.body;

    if (!Array.isArray(loanIds) || loanIds.length === 0) {
      return res.status(400).json({ message: "loanIds requis" });
    }

    const loans = await Loan.find({ _id: { $in: loanIds } });

    const activeCopyIds = loans
      .filter((l) => l.status === "ACTIVE")
      .map((l) => l.copyId);

    if (activeCopyIds.length > 0) {
      await Copy.updateMany(
        { _id: { $in: activeCopyIds } },
        { $set: { status: "AVAILABLE" } }
      );
    }

    await Loan.deleteMany({ _id: { $in: loanIds } });

    res.json({ message: "Prêts supprimés ✅" });
  } catch (error) {
    console.error("deleteLoansBulk error:", error.message);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// =======================
// PDF EXPORTS
// =======================

/**
 * GET /api/loans/pdf?status=active|returned|late
 */
exports.exportLoansPdf = async (req, res) => {
  try {
    const filter = buildLoansFilter(req.query.status);

    const loans = await Loan.find(filter)
      .populate(loanPopulate)
      .sort({ borrowedAt: -1 });

    const status = (req.query.status || "active").toLowerCase();
    writeLoansPdf(res, `loans_${status}`, loans);
  } catch (error) {
    console.error("exportLoansPdf error:", error.message);
    res.status(500).json({ message: "Erreur export PDF" });
  }
};

/**
 * POST /api/loans/pdf/selected
 * Body: { loanIds: [] }
 */
exports.exportSelectedLoansPdf = async (req, res) => {
  try {
    const { loanIds } = req.body;

    if (!Array.isArray(loanIds) || loanIds.length === 0) {
      return res.status(400).json({ message: "loanIds requis" });
    }

    const loans = await Loan.find({ _id: { $in: loanIds } })
      .populate(loanPopulate)
      .sort({ borrowedAt: -1 });

    writeLoansPdf(res, `loans_selected`, loans);
  } catch (error) {
    console.error("exportSelectedLoansPdf error:", error.message);
    res.status(500).json({ message: "Erreur export PDF sélection" });
  }
};

/**
 * GET /api/loans/:id/pdf
 */
exports.exportOneLoanPdf = async (req, res) => {
  try {
    const loan = await Loan.findById(req.params.id).populate(loanPopulate);
    if (!loan) return res.status(404).json({ message: "Prêt introuvable" });

    writeLoansPdf(res, `loan_${loan._id}`, [loan]);
  } catch (error) {
    console.error("exportOneLoanPdf error:", error.message);
    res.status(500).json({ message: "Erreur export PDF (prêt)" });
  }
};
