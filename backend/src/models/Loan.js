const mongoose = require("mongoose");

const lateEmailLogSchema = new mongoose.Schema(
  {
    to: { type: String, default: "" },
    subject: { type: String, default: "" },
    message: { type: String, default: "" },

    feePerDay: { type: Number, default: 5 },
    lateDays: { type: Number, default: 0 },
    lateFee: { type: Number, default: 0 },

    sentAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

// (Optionnel) si tu utilises returnLogs dans Loans
const returnLogSchema = new mongoose.Schema(
  {
    returnedAt: { type: Date, default: Date.now },
    processedBy: { type: String, default: "" },
    feePerDay: { type: Number, default: 5 },
    lateDays: { type: Number, default: 0 },
    lateFee: { type: Number, default: 0 },
  },
  { _id: true }
);

const loanSchema = new mongoose.Schema(
  {
    memberId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Member",
      required: true,
    },

    copyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Copy",
      required: true,
    },

    borrowedAt: { type: Date, default: Date.now },
    dueDate: { type: Date, required: true },
    returnedAt: { type: Date, default: null },

    status: {
      type: String,
      enum: ["ACTIVE", "RETURNED"],
      default: "ACTIVE",
    },

    // ✅ Historique des emails envoyés (retards)
    lateEmailLogs: {
      type: [lateEmailLogSchema],
      default: [],
    },

    // ✅ (optionnel) Historique des rendus
    returnLogs: {
      type: [returnLogSchema],
      default: [],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Loan", loanSchema);
