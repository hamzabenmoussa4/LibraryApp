require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const email = "admin@library.com";
    const plainPassword = "admin123";

    // Vérifier s'il existe déjà
    const existing = await User.findOne({ email });
    if (existing) {
      console.log("Admin existe déjà :", email);
      process.exit(0);
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(plainPassword, salt);

    // Créer user
    await User.create({ email, password: hashed });

    console.log("Admin créé ✅");
    console.log("Email:", email);
    console.log("Password:", plainPassword);

    process.exit(0);
  } catch (err) {
    console.error("Seed error:", err.message);
    process.exit(1);
  }
})();
