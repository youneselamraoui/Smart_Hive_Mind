require("dotenv").config();
const dns = require("dns");
const validateEnv = require("./config/validateEnv");
const app = require("./app");
const mongoose = require("mongoose");

validateEnv();

// Utiliser Google DNS si le DNS local bloque Atlas (ex: box FAI / réseau scolaire)
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || "mongodb://localhost:27017/smart-hive-mind";

mongoose.connect(MONGO_URI)
    .then(() => {
        console.log("[mongoose] Connecté à MongoDB");
        app.listen(PORT, () => {
            console.log(`Backend listening on port ${PORT}`);
        });
    })
    .catch(err => {
        console.error("[mongoose] Erreur de connexion :", err.message);
        process.exit(1);
    });
