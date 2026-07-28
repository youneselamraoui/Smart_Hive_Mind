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

const app = express();

app.use(express.json());
app.use(cookieParser());
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
app.use("/api", badgeRoutes);
app.use("/api", notificationRoutes);

module.exports = app;
