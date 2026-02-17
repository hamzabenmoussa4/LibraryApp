const Member = require("../models/Member");

/**
 * GET /api/members?q=
 * - Liste des membres
 * - Recherche: firstName, lastName, email, phone
 */
exports.getMembers = async (req, res) => {
  try {
    const q = (req.query.q || "").trim();

    const filter = {};
    if (q) {
      filter.$or = [
        { firstName: { $regex: q, $options: "i" } },
        { lastName: { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } },
        { phone: { $regex: q, $options: "i" } },
      ];
    }

    const members = await Member.find(filter).sort({ createdAt: -1 });
    res.json(members);
  } catch (err) {
    console.error("getMembers error:", err.message);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

/**
 * POST /api/members
 * Body: { firstName, lastName, email, phone }
 */
exports.createMember = async (req, res) => {
  try {
    const { firstName, lastName, email, phone } = req.body;

    if (!firstName || !lastName) {
      return res.status(400).json({ message: "Prénom et nom requis" });
    }

    // email unique si fourni
    if (email && email.trim()) {
      const exists = await Member.findOne({ email: email.trim() });
      if (exists) return res.status(400).json({ message: "Email déjà utilisé" });
    }

    const member = await Member.create({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: (email || "").trim(),
      phone: (phone || "").trim(),
    });

    res.status(201).json(member);
  } catch (err) {
    console.error("createMember error:", err.message);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

/**
 * PUT /api/members/:id
 * Body: { firstName, lastName, email, phone }
 */
exports.updateMember = async (req, res) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, email, phone } = req.body;

    const member = await Member.findById(id);
    if (!member) return res.status(404).json({ message: "Membre introuvable" });

    if (firstName !== undefined) member.firstName = firstName.trim();
    if (lastName !== undefined) member.lastName = lastName.trim();

    if (email !== undefined) {
      const newEmail = (email || "").trim();

      if (newEmail) {
        const exists = await Member.findOne({ email: newEmail, _id: { $ne: id } });
        if (exists) return res.status(400).json({ message: "Email déjà utilisé" });
      }

      member.email = newEmail;
    }

    if (phone !== undefined) member.phone = (phone || "").trim();

    await member.save();
    res.json(member);
  } catch (err) {
    console.error("updateMember error:", err.message);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

/**
 * DELETE /api/members/:id
 */
exports.deleteMember = async (req, res) => {
  try {
    const { id } = req.params;

    const member = await Member.findById(id);
    if (!member) return res.status(404).json({ message: "Membre introuvable" });

    await Member.deleteOne({ _id: id });
    res.json({ message: "Membre supprimé ✅" });
  } catch (err) {
    console.error("deleteMember error:", err.message);
    res.status(500).json({ message: "Erreur serveur" });
  }
};
