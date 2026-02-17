require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");

async function createAdmin() {
  await mongoose.connect(process.env.MONGO_URI);

  const email = "admin2@library.com";
  const password = "admin456";

  // Supprimer l'ancien admin s'il existe
  await User.deleteMany({ email });

  const hashedPassword = await bcrypt.hash(password, 10);

  await User.create({
    email,
    password: hashedPassword,
  });

  console.log("✅ Nouvel admin créé");
  console.log("📧 Email :", email);
  console.log("🔑 Mot de passe :", password);
console.log("✅ DB Name (seed):", mongoose.connection.name);
console.log("✅ DB Host (seed):", mongoose.connection.host);

  process.exit(0);
}

createAdmin().catch((err) => {
  console.error(err);
  process.exit(1);
});
