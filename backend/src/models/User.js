const mongoose = require("mongoose");

/**
 * Modèle User (bibliothécaire)
 * - email: unique
 * - password: hashé (on ne stocke jamais le mot de passe en clair)
 */
const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
