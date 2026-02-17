// // src/server.js
// require("dotenv").config(); // charge le fichier .env

// const app = require("./app");
// const connectDB = require("./config/db");

// // 1) on connecte la base de données
// connectDB();
// console.log("✅ DB Name (server):", mongoose.connection.name);
// console.log("✅ DB Host (server):", mongoose.connection.host);

// const PORT = process.env.PORT || 5000;

// // 2) on lance le serveur seulement après (la connexion DB est lancée)
// app.listen(PORT, () => {
//   console.log(`Server running on http://localhost:${PORT}`);
// });
/**
 * Point d'entrée du serveur
 * - Connexion MongoDB
 * - Lancement Express
 */

require("dotenv").config();
const mongoose = require("mongoose");
const app = require("./app");

const PORT = process.env.PORT || 5000;

// Connexion à MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected:", mongoose.connection.host);
    console.log("✅ DB Name:", mongoose.connection.name);

    // Lancer le serveur Express
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  });

// Gestion des erreurs globales (optionnel mais propre)
process.on("unhandledRejection", (err) => {
  console.error("❌ Unhandled Rejection:", err.message);
  process.exit(1);
});
