const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const {
  getMembers,
  createMember,
  updateMember,
  deleteMember,
} = require("../controllers/memberController");

const router = express.Router();

router.get("/", protect, getMembers);
router.post("/", protect, createMember);
router.put("/:id", protect, updateMember);
router.delete("/:id", protect, deleteMember);

module.exports = router;
