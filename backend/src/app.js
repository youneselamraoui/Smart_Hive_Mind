const express = require("express");
const cookieParser = require("cookie-parser");
const authRoutes = require("./routes/authRoutes");
const publicationRoutes = require("./routes/publicationRoutes");
const aiRoutes = require("./routes/aiRoutes");
const communauteRoutes = require("./routes/communauteRoutes");
const smartToolsRoutes = require("./routes/smartToolsRoutes");
const entrepreneuriatRoutes = require("./routes/entrepreneuriatRoutes");
const placementRoutes = require("./routes/placementRoutes");
const evenementRoutes = require("./routes/evenementRoutes");
const skillsRoutes = require("./routes/skillsRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const prestationRoutes = require("./routes/prestationRoutes");
const marketplaceRoutes = require("./routes/marketplaceRoutes");
const badgeRoutes = require("./routes/badgeRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const journalRoutes = require("./routes/journalRoutes");
const structureRechercheRoutes = require("./routes/structureRechercheRoutes");
const projetRechercheFinanceRoutes = require("./routes/projetRechercheFinanceRoutes");
const preuveRoutes = require("./routes/preuveRoutes");
const atelierNeuroSymboliqueRoutes = require("./routes/atelierNeuroSymboliqueRoutes");
const outilRoutes = require("./routes/outilRoutes");
const { authLimiter, apiLimiter } = require("./middlewares/rateLimiter");
const errorHandler = require("./middlewares/errorHandler");

const app = express();

app.set("trust proxy", 1);
app.use(express.json());
app.use(cookieParser());

// Rate-limiting : strict sur les routes sensibles, global plus large sur /api/*
app.use("/api/auth/connexion", authLimiter);
app.use("/api/auth/inscription", authLimiter);
app.use("/api/auth/demander-reset", authLimiter);
app.use("/api", apiLimiter);
app.use("/api", authRoutes);
app.use("/api", publicationRoutes);
app.use("/api", aiRoutes);
app.use("/api", communauteRoutes);
app.use("/api", smartToolsRoutes);
app.use("/api", entrepreneuriatRoutes);
app.use("/api", placementRoutes);
app.use("/api", evenementRoutes);
app.use("/api", skillsRoutes);
app.use("/api", dashboardRoutes);
app.use("/api", prestationRoutes);
app.use("/api", marketplaceRoutes);
// Alias : expose aussi les routes marketplace sous /api/marketplace/* (consomme
// par certains clients), le chemin canonique reste /api/bounties, /api/offres...
app.use("/api/marketplace", marketplaceRoutes);
app.use("/api", badgeRoutes);
app.use("/api", notificationRoutes);
app.use("/api", journalRoutes);
app.use("/api", structureRechercheRoutes);
app.use("/api", projetRechercheFinanceRoutes);
app.use("/api", preuveRoutes);
app.use("/api", atelierNeuroSymboliqueRoutes);
app.use("/api", outilRoutes);

// Middleware d'erreur global : doit rester en dernier
app.use(errorHandler);

module.exports = app;
