const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const { getAvailableCopies } = require("../controllers/copyController");

const router = express.Router();

router.get("/available", protect, getAvailableCopies);

module.exports = router;
