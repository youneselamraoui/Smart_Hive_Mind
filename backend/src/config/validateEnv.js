/**
 * Validation des variables d'environnement au demarrage.
 * Stoppe le processus avec un message clair si une variable critique
 * est manquante, pour eviter un deploiement silencieusement casse.
 */

const REQUIRED = [
    { key: "MONGO_URI", label: "MongoDB URI (Atlas ou instance dediee)" },
    { key: "JWT_SECRET", label: "JWT secret (generer avec crypto.randomBytes)" },
    { key: "SEPOLIA_RPC_URL", label: "Sepolia RPC URL (Infura / Alchemy)" },
    { key: "PRIVATE_KEY", label: "Cle privee du wallet serveur" },
    { key: "INTERNAL_SERVICE_KEY", label: "Cle API interne pour callbacks entre microservices (backend <-> ai-agentic)" },
];

function validateEnv() {
    const missing = [];

    for (const { key, label } of REQUIRED) {
        const val = process.env[key];
        if (!val || val.trim() === "") {
            missing.push(`  - ${key} (${label})`);
        }
    }

    if (missing.length > 0) {
        console.error("");
        console.error("=".repeat(60));
        console.error("  ERREUR : Variables d'environnement manquantes");
        console.error("=".repeat(60));
        console.error("");
        console.error("  Les variables suivantes sont requises en production :");
        console.error("");
        for (const line of missing) {
            console.error(line);
        }
        console.error("");
        console.error("  Consultez le fichier .env.production.example pour les");
        console.error("  instructions et la liste complete des variables.");
        console.error("=".repeat(60));
        console.error("");
        process.exit(1);
    }

    console.log("[validateEnv] Toutes les variables critiques sont presentes.");
}

module.exports = validateEnv;
