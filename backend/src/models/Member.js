const mongoose = require("mongoose");

const memberSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, default: "", trim: true, lowercase: true },
    phone: { type: String, default: "", trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Member", memberSchema);
