const express = require("express");
const { protect } = require("../middleware/authMiddleware");

const {
  getBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook,
  createCopyForBook,
  getCopiesByBook,
  deleteCopy,
} = require("../controllers/bookController");

const router = express.Router();

/**
 * BOOKS (titres)
 */
router.get("/", protect, getBooks);
router.get("/:id", protect, getBookById);
router.post("/", protect, createBook);
router.put("/:id", protect, updateBook);
router.delete("/:id", protect, deleteBook);

/**
 * COPIES (exemplaires liés à un livre)
 */
router.get("/:bookId/copies", protect, getCopiesByBook);
router.post("/:bookId/copies", protect, createCopyForBook);
router.delete("/copies/:copyId", protect, deleteCopy);

module.exports = router;
