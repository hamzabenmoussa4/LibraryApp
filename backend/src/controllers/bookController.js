const Book = require("../models/Book");
const Copy = require("../models/Copy");

/**
 * GET /api/books
 * Liste des livres + calcul copies/available/borrowed
 */
exports.getBooks = async (req, res) => {
  try {
    const q = (req.query.q || "").trim();

    const match = {};
    if (q) {
      match.$or = [
        { title: { $regex: q, $options: "i" } },
        { author: { $regex: q, $options: "i" } },
        { category: { $regex: q, $options: "i" } },
      ];
    }

    const data = await Book.aggregate([
      { $match: match },
      {
        $lookup: {
          from: Copy.collection.name, // ✅ IMPORTANT
          localField: "_id",
          foreignField: "bookId",
          as: "copies",
        },
      },
      {
        $addFields: {
          totalCopies: { $size: "$copies" },
          availableCopies: {
            $size: {
              $filter: {
                input: "$copies",
                as: "c",
                cond: { $eq: ["$$c.status", "AVAILABLE"] },
              },
            },
          },
          borrowedCopies: {
            $size: {
              $filter: {
                input: "$copies",
                as: "c",
                cond: { $eq: ["$$c.status", "BORROWED"] },
              },
            },
          },
        },
      },
      { $sort: { createdAt: -1 } },
      {
        $project: {
          copies: 0,
        },
      },
    ]);

    res.json(data);
  } catch (error) {
    console.error("getBooks error:", error.message);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

/**
 * GET /api/books/:id
 */
exports.getBookById = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ message: "Livre introuvable" });
    res.json(book);
  } catch (error) {
    console.error("getBookById error:", error.message);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

/**
 * POST /api/books
 * Body: { title, author, category, imageUrl }
 */
exports.createBook = async (req, res) => {
  try {
    const { title, author, category, imageUrl } = req.body;

    if (!title || !author) {
      return res.status(400).json({ message: "Titre et auteur requis" });
    }

    const book = await Book.create({
      title: title.trim(),
      author: author.trim(),
      category: (category || "").trim(),
      imageUrl: (imageUrl || "").trim(),
    });

    res.status(201).json(book);
  } catch (error) {
    console.error("createBook error:", error.message);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

/**
 * PUT /api/books/:id
 * Body: { title, author, category, imageUrl }
 */
exports.updateBook = async (req, res) => {
  try {
    const { title, author, category, imageUrl } = req.body;

    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ message: "Livre introuvable" });

    if (title !== undefined) book.title = title.trim();
    if (author !== undefined) book.author = author.trim();
    if (category !== undefined) book.category = (category || "").trim();
    if (imageUrl !== undefined) book.imageUrl = (imageUrl || "").trim();

    await book.save();
    res.json(book);
  } catch (error) {
    console.error("updateBook error:", error.message);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

/**
 * DELETE /api/books/:id
 * - Supprime livre + copies liées
 */
exports.deleteBook = async (req, res) => {
  try {
    const bookId = req.params.id;

    const book = await Book.findById(bookId);
    if (!book) return res.status(404).json({ message: "Livre introuvable" });

    await Copy.deleteMany({ bookId });
    await Book.deleteOne({ _id: bookId });

    res.json({ message: "Livre supprimé ✅" });
  } catch (error) {
    console.error("deleteBook error:", error.message);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

/**
 * GET /api/books/:bookId/copies
 */
exports.getCopiesByBook = async (req, res) => {
  try {
    const { bookId } = req.params;

    const copies = await Copy.find({ bookId }).sort({ createdAt: -1 });
    res.json(copies);
  } catch (error) {
    console.error("getCopiesByBook error:", error.message);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

/**
 * POST /api/books/:bookId/copies
 * Body: { inventoryCode }
 */
exports.createCopyForBook = async (req, res) => {
  try {
    const { bookId } = req.params;
    const { inventoryCode } = req.body;

    if (!inventoryCode || !inventoryCode.trim()) {
      return res.status(400).json({ message: "inventoryCode requis" });
    }

    const book = await Book.findById(bookId);
    if (!book) return res.status(404).json({ message: "Livre introuvable" });

    const exists = await Copy.findOne({ inventoryCode: inventoryCode.trim() });
    if (exists) return res.status(400).json({ message: "Code déjà utilisé" });

    const copy = await Copy.create({
      bookId,
      inventoryCode: inventoryCode.trim(),
      status: "AVAILABLE",
    });

    res.status(201).json(copy);
  } catch (error) {
    console.error("createCopyForBook error:", error.message);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

/**
 * DELETE /api/books/copies/:copyId
 */
exports.deleteCopy = async (req, res) => {
  try {
    const { copyId } = req.params;

    const copy = await Copy.findById(copyId);
    if (!copy) return res.status(404).json({ message: "Exemplaire introuvable" });

    await Copy.deleteOne({ _id: copyId });
    res.json({ message: "Exemplaire supprimé ✅" });
  } catch (error) {
    console.error("deleteCopy error:", error.message);
    res.status(500).json({ message: "Erreur serveur" });
  }
};
