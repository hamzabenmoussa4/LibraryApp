const Loan = require("../models/Loan");

/**
 * DELETE /api/returns/history/:loanId/log/:logId
 * Supprime une ligne returnLogs
 */
exports.deleteOneReturnLog = async (req, res) => {
  try {
    const { loanId, logId } = req.params;

    const loan = await Loan.findById(loanId);
    if (!loan) return res.status(404).json({ message: "Prêt introuvable" });

    const before = loan.returnLogs?.length || 0;

    loan.returnLogs = (loan.returnLogs || []).filter(
      (log) => String(log._id) !== String(logId)
    );

    const after = loan.returnLogs.length;

    if (before === after) {
      return res.status(404).json({ message: "Historique introuvable" });
    }

    await loan.save();
    return res.json({ message: "Historique rendu supprimé ✅" });
  } catch (err) {
    console.error("deleteOneReturnLog error:", err.message);
    return res.status(500).json({ message: "Erreur serveur" });
  }
};

/**
 * POST /api/returns/history/bulk-delete
 * Body: { items: [{ loanId, logId }, ...] }
 * Supprime plusieurs logs de rendus
 */
exports.bulkDeleteReturnLogs = async (req, res) => {
  try {
    const items = req.body.items || [];

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "items requis" });
    }

    const grouped = {};
    for (const it of items) {
      if (!it.loanId || !it.logId) continue;
      grouped[it.loanId] = grouped[it.loanId] || new Set();
      grouped[it.loanId].add(String(it.logId));
    }

    const loanIds = Object.keys(grouped);
    let deletedCount = 0;

    for (const loanId of loanIds) {
      const loan = await Loan.findById(loanId);
      if (!loan) continue;

      const toDelete = grouped[loanId];
      const before = loan.returnLogs?.length || 0;

      loan.returnLogs = (loan.returnLogs || []).filter(
        (log) => !toDelete.has(String(log._id))
      );

      const after = loan.returnLogs.length;
      deletedCount += before - after;

      await loan.save();
    }

    return res.json({ message: `Supprimé: ${deletedCount} historique(s) ✅` });
  } catch (err) {
    console.error("bulkDeleteReturnLogs error:", err.message);
    return res.status(500).json({ message: "Erreur serveur" });
  }
};
