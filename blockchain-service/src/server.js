const express = require("express");
const proofRoutes = require("./routes/proof");

const app = express();

app.use(express.json());
app.use("/", proofRoutes);

module.exports = app;
