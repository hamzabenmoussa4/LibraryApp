const express = require("express");
const cors = require("cors");
require("dotenv").config();


const authRoutes = require("./routes/authRoutes");
const bookRoutes = require("./routes/bookRoutes");
const memberRoutes = require("./routes/memberRoutes");
const copyRoutes = require("./routes/copyRoutes");
const loanRoutes = require("./routes/loanRoutes");
const lateRoutes = require("./routes/lateRoutes");
const statsRoutes = require("./routes/statsRoutes");

const app = express();

app.use(cors());
app.use(express.json());

// Routes API
app.use("/api/auth", authRoutes);
app.use("/api/books", bookRoutes);
app.use("/api/members", memberRoutes);
app.use("/api/copies", copyRoutes);
app.use("/api/loans", loanRoutes);
app.use("/api/late", lateRoutes);
app.use("/api/stats", statsRoutes);

app.get("/", (req, res) => res.send("API Library OK ✅"));

module.exports = app;
