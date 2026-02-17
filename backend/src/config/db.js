// src/config/db.js
const mongoose = require("mongoose");

/**
 * Connexion à MongoDB via Mongoose.
 * - On lit l'URI depuis le fichier .env
 * - On affiche un message clair en cas de succès/erreur
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);

    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("MongoDB connection error:", error.message);
    // Stoppe le serveur si la DB ne répond pas (important)
    process.exit(1);
  }
};

module.exports = connectDB;
