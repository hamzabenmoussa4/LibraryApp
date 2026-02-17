const mongoose = require("mongoose");

const copySchema = new mongoose.Schema(
  {
    bookId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Book",
      required: true,
    },

    inventoryCode: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },

    status: {
      type: String,
      enum: ["AVAILABLE", "BORROWED"],
      default: "AVAILABLE", // ✅ important
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Copy", copySchema);
