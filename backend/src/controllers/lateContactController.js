const Loan = require("../models/Loan");
const { sendMail } = require("../utils/mailer");
const PDFDocument = require("pdfkit");

const FEE_PER_DAY = Number(process.env.LATE_FEE_PER_DAY || 5);

// ------------------ Helpers ------------------

function calcLateDays(dueDate) {
  const now = new Date();
  const due = new Date(dueDate);

  if (!dueDate || due >= now) return 0;

  const diffMs = now - due;
  const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  return Math.max(0, days);
}

const formatDateTime = (d) => (d ? new Date(d).toLocaleString() : "-");

// ------------------ API ------------------

/**
 * GET /api/late/loans
 * ACTIVE + dueDate < now
 */
exports.getLateLoans = async (req, res) => {
  try {
    const loans = await Loan.find({
      status: "ACTIVE",
      dueDate: { $lt: new Date() },
    })
      .populate("memberId")
      .populate({ path: "copyId", populate: { path: "bookId" } })
      .sort({ dueDate: 1 });

    res.json(loans);
  } catch (error) {
    console.error("getLateLoans error:", error.message);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

/**
 * POST /api/late/contact/:loanId
 * Envoie un email + push historique
 */
exports.contactLateByEmail = async (req, res) => {
  try {
    const { loanId } = req.params;

    const loan = await Loan.findById(loanId)
      .populate("memberId")
      .populate({ path: "copyId", populate: { path: "bookId" } });

    if (!loan) return res.status(404).json({ message: "Prêt introuvable" });

    const lateDays = calcLateDays(loan.dueDate);
    if (loan.status !== "ACTIVE" || lateDays === 0) {
      return res.status(400).json({ message: "Ce prêt n’est pas en retard" });
    }

    const member = loan.memberId;
    const copy = loan.copyId;
    const book = copy?.bookId;

    const to = (member?.email || "").trim();
    if (!to) return res.status(400).json({ message: "Ce membre n’a pas d’email" });

    const memberName = member ? `${member.firstName} ${member.lastName}` : "Membre";
    const bookTitle = book?.title || "Livre";
    const inventory = copy?.inventoryCode || "-";

    const lateFee = lateDays * FEE_PER_DAY;

    const subject = `Retard de retour - ${bookTitle}`;

    const html = `
      <div style="font-family:Arial,sans-serif; line-height:1.5; color:#111;">
        <h2 style="margin:0 0 10px;">Rappel : livre en retard</h2>

        <p>Bonjour <b>${memberName}</b>,</p>

        <p>Le livre suivant est en retard et doit être rendu dès que possible :</p>

        <ul>
          <li><b>Livre :</b> ${bookTitle}</li>
          <li><b>Exemplaire :</b> ${inventory}</li>
          <li><b>Date limite :</b> ${new Date(loan.dueDate).toLocaleDateString()}</li>
          <li><b>Jours de retard :</b> ${lateDays}</li>
        </ul>

        <p style="background:#fff7ed; border:1px solid #fed7aa; padding:10px; border-radius:10px;">
          ⚠️ <b>Amende :</b> ${FEE_PER_DAY} dh / jour<br/>
          <b>Montant actuel :</b> ${lateFee} dh
        </p>

        <p>Merci de rendre le livre au plus vite pour éviter l’augmentation de l’amende.</p>

        <p style="color:#555; font-size:12px;">Bibliothèque - Message automatique</p>
      </div>
    `;

    // ✅ envoi mail
    await sendMail(to, subject, html);

    // ✅ sauvegarde historique
    loan.lateEmailLogs = Array.isArray(loan.lateEmailLogs) ? loan.lateEmailLogs : [];

    loan.lateEmailLogs.push({
      to,
      subject,
      message: `Rappel: ${bookTitle} (${inventory}) - ${lateDays} jours - amende ${lateFee} dh`,
      feePerDay: FEE_PER_DAY,
      lateDays,
      lateFee,
      sentAt: new Date(),
    });

    await loan.save();

    res.json({
      message: `Email envoyé à ${to} ✅`,
      to,
      lateDays,
      lateFee,
      feePerDay: FEE_PER_DAY,
    });
  } catch (error) {
    console.error("contactLateByEmail error:", error.message);
    res.status(500).json({ message: "Erreur serveur email", debug: error.message });
  }
};

/**
 * GET /api/late/email-logs
 * Historique global flatten
 */
exports.getEmailLogs = async (req, res) => {
  try {
    const loans = await Loan.find({
      lateEmailLogs: { $exists: true, $ne: [] },
    })
      .populate("memberId")
      .populate({ path: "copyId", populate: { path: "bookId" } });

    const rows = [];

    for (const loan of loans) {
      const member = loan.memberId;
      const copy = loan.copyId;
      const book = copy?.bookId;
      const logs = Array.isArray(loan.lateEmailLogs) ? loan.lateEmailLogs : [];

      for (const log of logs) {
        rows.push({
          loanId: String(loan._id),
          logId: String(log._id),
          sentAt: log.sentAt,
          to: log.to,
          subject: log.subject,
          message: log.message,
          feePerDay: log.feePerDay,
          lateDays: log.lateDays,
          lateFee: log.lateFee,
          memberName: member ? `${member.firstName} ${member.lastName}` : "-",
          bookTitle: book?.title || "-",
          inventoryCode: copy?.inventoryCode || "-",
        });
      }
    }

    rows.sort((a, b) => new Date(b.sentAt) - new Date(a.sentAt));
    res.json(rows);
  } catch (error) {
    console.error("getEmailLogs error:", error.message);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

/**
 * POST /api/late/email-logs/bulk-delete
 * Body: { items: [{loanId, logId}] }
 */
exports.bulkDeleteEmailLogs = async (req, res) => {
  try {
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "items requis" });
    }

    const map = new Map();
    for (const it of items) {
      if (!it.loanId || !it.logId) continue;
      if (!map.has(it.loanId)) map.set(it.loanId, []);
      map.get(it.loanId).push(it.logId);
    }

    for (const [loanId, logIds] of map.entries()) {
      await Loan.updateOne(
        { _id: loanId },
        { $pull: { lateEmailLogs: { _id: { $in: logIds } } } }
      );
    }

    res.json({ message: "Historique supprimé ✅" });
  } catch (error) {
    console.error("bulkDeleteEmailLogs error:", error.message);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// ------------------ PDF Export ------------------

function writeEmailLogsPdf(res, title, rows) {
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${title}.pdf"`);

  const doc = new PDFDocument({ margin: 40, size: "A4" });
  doc.pipe(res);

  doc.fontSize(18).text(title, { align: "center" });
  doc.moveDown(0.5);
  doc.fontSize(10).fillColor("#555").text(`Généré le : ${new Date().toLocaleString()}`, {
    align: "center",
  });
  doc.moveDown(1);

  doc.fillColor("#000").fontSize(12).text(`Total: ${rows.length}`);
  doc.moveDown(0.7);

  for (const r of rows) {
    doc.fontSize(11).fillColor("#000").text(`• Date: ${formatDateTime(r.sentAt)}`);
    doc.text(`  À: ${r.to || "-"}`);
    doc.text(`  Membre: ${r.memberName || "-"}`);
    doc.text(`  Livre: ${r.bookTitle || "-"} | Exemplaire: ${r.inventoryCode || "-"}`);
    doc.text(
      `  Retard: ${r.lateDays ?? 0} jour(s) | Amende: ${r.lateFee ?? 0} dh (${r.feePerDay ?? FEE_PER_DAY} dh/j)`
    );

    doc.moveDown(0.3);
    doc.fillColor("#111").text("  Message:", { underline: true });
    doc.fillColor("#000").text(`  ${r.message || "-"}`);

    doc.moveDown(0.9);
    if (doc.y > 740) doc.addPage();
  }

  doc.end();
}

/**
 * POST /api/late/email-logs/pdf
 * Body: { items?: [{loanId, logId}] }
 * - si items fourni => sélection
 * - sinon => tout
 */
exports.exportEmailLogsPdf = async (req, res) => {
  try {
    const { items } = req.body || {};

    const loans = await Loan.find({
      lateEmailLogs: { $exists: true, $ne: [] },
    })
      .populate("memberId")
      .populate({ path: "copyId", populate: { path: "bookId" } });

    const allRows = [];
    for (const loan of loans) {
      const member = loan.memberId;
      const copy = loan.copyId;
      const book = copy?.bookId;

      const logs = Array.isArray(loan.lateEmailLogs) ? loan.lateEmailLogs : [];
      for (const log of logs) {
        allRows.push({
          loanId: String(loan._id),
          logId: String(log._id),
          sentAt: log.sentAt,
          to: log.to,
          subject: log.subject,
          message: log.message,
          feePerDay: log.feePerDay,
          lateDays: log.lateDays,
          lateFee: log.lateFee,
          memberName: member ? `${member.firstName} ${member.lastName}` : "-",
          bookTitle: book?.title || "-",
          inventoryCode: copy?.inventoryCode || "-",
        });
      }
    }

    allRows.sort((a, b) => new Date(b.sentAt) - new Date(a.sentAt));

    let rows = allRows;
    if (Array.isArray(items) && items.length > 0) {
      const set = new Set(items.map((it) => `${it.loanId}:${it.logId}`));
      rows = allRows.filter((r) => set.has(`${r.loanId}:${r.logId}`));
    }

    writeEmailLogsPdf(res, "email_logs", rows);
  } catch (error) {
    console.error("exportEmailLogsPdf error:", error.message);
    res.status(500).json({ message: "Erreur export PDF historique emails" });
  }
};
