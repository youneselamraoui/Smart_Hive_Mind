const mongoose = require("mongoose");
const { getBucket, upload } = require("../config/gridfs");
const JeuDeDonnees = require("../models/JeuDeDonnees");
const ModeleIA = require("../models/ModeleIA");
const Atelier = require("../models/Atelier");

const AI_AGENTIC_URL = process.env.AI_AGENTIC_URL || "http://ai-agentic:8000";
const ATELIER_TIMEOUT_MS = 30000;

const ATELIER_DEFINITIONS = {
    "ia-neuro-symbolique": {
        nom: "Atelier IA neuro-symbolique",
        etapesDefinition: [
            { label: "Sélection des données", url: "http://ai-conversational:8000/conversational/assist-writing", method: "POST", payload: {} },
            { label: "Génération synthétique", url: "http://ai-conversational:8000/conversational/generate", method: "POST", payload: {} },
            { label: "Entraînement du modèle", url: "http://ai-decisionnel:8000/decisionnel/score-publication", method: "POST", payload: {} },
            { label: "Publication du modèle", url: `http://backend:3000/api/smart-tools/models`, method: "POST", payload: {} },
        ],
    },
};

async function fetchWithTimeout(url, options = {}, timeoutMs = ATELIER_TIMEOUT_MS) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
        return await fetch(url, { ...options, signal: controller.signal });
    } finally {
        clearTimeout(timer);
    }
}

exports.uploadMiddleware = upload("fichier");

exports.uploadDataset = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "Aucun fichier fourni." });
        }

        const { nom, domaine, annotations, licence, qualite } = req.body;

        const dataset = await JeuDeDonnees.create({
            nom: nom || req.file.originalname,
            domaine: domaine || "",
            fichierUrl: req.file.id.toString(),
            annotations: annotations || "",
            licence: licence || "",
            qualite: qualite ? Number(qualite) : 0,
            uploadePar: req.membre.id,
        });

        res.status(201).json({
            message: "Fichier uploade et jeu de donnees cree.",
            dataset: {
                id: dataset._id,
                nom: dataset.nom,
                fichierId: req.file.id,
                taille: req.file.size,
            },
        });
    } catch (err) {
        if (err.name === "ValidationError") {
            return res.status(400).json({ error: err.message });
        }
        res.status(500).json({ error: "Erreur interne du serveur." });
    }
};

exports.downloadDataset = async (req, res) => {
    try {
        const dataset = await JeuDeDonnees.findById(req.params.id);
        if (!dataset) {
            return res.status(404).json({ error: "Jeu de donnees introuvable." });
        }

        const bucket = getBucket();
        const fileId = new mongoose.Types.ObjectId(dataset.fichierUrl);
        const files = await bucket.find({ _id: fileId }).toArray();

        if (!files || files.length === 0) {
            return res.status(404).json({ error: "Fichier introuvable dans GridFS." });
        }

        const file = files[0];
        res.set("Content-Type", file.metadata?.mimetype || "application/octet-stream");
        res.set("Content-Disposition", `attachment; filename="${file.metadata?.originalName || file.filename}"`);
        res.set("Content-Length", file.length.toString());

        const stream = bucket.openDownloadStream(fileId);
        stream.pipe(res);
        stream.on("error", () => {
            res.status(500).json({ error: "Erreur lors du telechargement." });
        });
    } catch (err) {
        res.status(500).json({ error: "Erreur interne du serveur." });
    }
};

exports.listModels = async (req, res) => {
    try {
        const { tache, auteurId } = req.query;
        const filter = {};
        if (tache) filter.tache = tache;
        if (auteurId) filter.auteurId = auteurId;

        const models = await ModeleIA.find(filter)
            .populate("auteurId", "nom prenom")
            .populate("jeuDeDonneesId", "nom domaine")
            .sort({ createdAt: -1 });

        res.json(models);
    } catch (err) {
        res.status(500).json({ error: "Erreur interne du serveur." });
    }
};

exports.publishModel = async (req, res) => {
    try {
        const { nom, tache, performance, version, explicabiliteUrl, jeuDeDonneesId } = req.body;

        if (!req.file) {
            return res.status(400).json({ error: "Fichier du modele requis." });
        }

        const modelEntry = await ModeleIA.create({
            nom: nom || req.file.originalname,
            tache: tache || "",
            performance: performance || {},
            version: version || "1.0.0",
            fichierUrl: req.file.id.toString(),
            explicabiliteUrl: explicabiliteUrl || "",
            auteurId: req.membre.id,
            jeuDeDonneesId: jeuDeDonneesId || undefined,
        });

        res.status(201).json({
            message: "Modele publie dans la Model Bank.",
            model: {
                id: modelEntry._id,
                nom: modelEntry.nom,
                version: modelEntry.version,
                fichierId: req.file.id,
            },
        });
    } catch (err) {
        if (err.name === "ValidationError") {
            return res.status(400).json({ error: err.message });
        }
        res.status(500).json({ error: "Erreur interne du serveur." });
    }
};

exports.createAtelier = async (req, res) => {
    try {
        const { nom, type } = req.body;
        const def = ATELIER_DEFINITIONS[type];
        if (!def) {
            return res.status(400).json({ error: `Type d'atelier inconnu : "${type}".` });
        }

        const etapes = def.etapesDefinition.map(() => ({
            outilId: null,
            statut: "en_attente",
            resultatUrl: "",
        }));

        const atelier = await Atelier.create({
            nom: nom || def.nom,
            etapes,
            createdBy: req.membre.id,
            statutGlobal: "en_cours",
        });

        // Fire-and-forget : ne pas bloquer la reponse
        fetchWithTimeout(`${AI_AGENTIC_URL}/agentic/run-workshop`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                atelierId: atelier._id.toString(),
                steps: def.etapesDefinition.map((e, i) => ({ ...e, index: i })),
            }),
        }).catch(() => {
            // ai-agentic indisponible : l'atelier reste en attente
        });

        res.status(201).json(atelier);
    } catch (err) {
        if (err.name === "ValidationError") {
            return res.status(400).json({ error: err.message });
        }
        res.status(500).json({ error: "Erreur interne du serveur." });
    }
};

exports.reportProgress = async (req, res) => {
    try {
        const { id } = req.params;
        const { etape } = req.body;
        if (!etape || etape.index === undefined) {
            return res.status(400).json({ error: "Corps invalide : { etape: { index, statut, resultatUrl } }" });
        }

        const atelier = await Atelier.findById(id);
        if (!atelier) return res.status(404).json({ error: "Atelier introuvable." });

        if (atelier.etapes[etape.index]) {
            atelier.etapes[etape.index].statut = etape.statut || "en_cours";
            if (etape.resultatUrl) atelier.etapes[etape.index].resultatUrl = etape.resultatUrl;
        }

        await atelier.save();
        res.json({ message: "Progression mise a jour." });
    } catch (err) {
        res.status(500).json({ error: "Erreur interne." });
    }
};

exports.finalizeAtelier = async (req, res) => {
    try {
        const { id } = req.params;
        const { statutGlobal } = req.body;

        const atelier = await Atelier.findById(id);
        if (!atelier) return res.status(404).json({ error: "Atelier introuvable." });

        atelier.statutGlobal = statutGlobal || "termine";
        await atelier.save();

        res.json({ message: "Atelier finalise." });
    } catch (err) {
        res.status(500).json({ error: "Erreur interne." });
    }
};
