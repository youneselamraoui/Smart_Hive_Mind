const Publication = require("../models/Publication");
const Membre = require("../models/Membre");
const Mission = require("../models/Mission");

const IA_CONVERSATIONAL_URL =
    process.env.IA_CONVERSATIONAL_URL || "http://ai-conversational:8000";

const TIMEOUT_MS = 30000;

async function fetchWithTimeout(url, options = {}, timeoutMs = TIMEOUT_MS) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const response = await fetch(url, { ...options, signal: controller.signal });
        return response;
    } finally {
        clearTimeout(timer);
    }
}

exports.indexPublications = async (req, res) => {
    try {
        const publications = await Publication.find({
            statut: { $in: ["accepte", "soumis"] },
        })
            .select("titre contenu type _id")
            .lean();

        if (!publications.length) {
            return res.json({ indexed: 0, message: "Aucune publication a indexer." });
        }

        const documents = publications.map((p) => ({
            id: String(p._id),
            texte: `${p.titre}\n\n${p.contenu}`,
            scope: "publications",
        }));

        const iaRes = await fetchWithTimeout(
            `${IA_CONVERSATIONAL_URL}/conversational/index-publications`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(documents),
            }
        );

        if (!iaRes.ok) {
            const errBody = await iaRes.json().catch(() => ({}));
            return res.status(502).json({
                error: "Echec de l indexation dans le service IA.",
                detail: errBody.error || errBody.detail || "Service injoignable.",
            });
        }

        const data = await iaRes.json();
        res.json({
            indexed: data.indexed || documents.length,
            message: `Indexation de ${data.indexed || documents.length} publications terminee.`,
        });
    } catch (err) {
        if (err.name === "AbortError") {
            return res.status(504).json({
                error: "TimeOut : le service IA conversationnel n a pas repondu.",
            });
        }
        res.status(500).json({ error: "Erreur interne du serveur." });
    }
};

const OBJECTID_RE = /^[0-9a-fA-F]{24}$/;

async function resolveSources(sources) {
    if (!sources || !sources.length) return sources;
    const ids = sources.filter(s => OBJECTID_RE.test(s));
    const others = sources.filter(s => !OBJECTID_RE.test(s));
    if (!ids.length) return sources;
    const [publications, membres, missions] = await Promise.all([
        Publication.find({ _id: { $in: ids } }).select("titre").lean(),
        Membre.find({ _id: { $in: ids } }).select("nom prenom").lean(),
        Mission.find({ _id: { $in: ids } }).select("titre").lean(),
    ]);
    const map = new Map();
    for (const p of publications) map.set(String(p._id), p.titre);
    for (const m of membres) map.set(String(m._id), `${m.prenom} ${m.nom}`);
    for (const m of missions) map.set(String(m._id), m.titre || `Mission ${String(m._id).slice(-6)}`);
    const resolved = ids.map(id => map.get(id) || id);
    return [...resolved, ...others];
}

exports.askConversational = async (req, res) => {
    try {
        const { question, scope, publicationId } = req.body;

        if (!question || !question.trim()) {
            return res.status(400).json({ error: "La question est requise." });
        }

        const iaRes = await fetchWithTimeout(
            `${IA_CONVERSATIONAL_URL}/conversational/ask`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ question, scope: scope || "publications" }),
            }
        );

        if (!iaRes.ok) {
            const errBody = await iaRes.json().catch(() => ({}));
            return res.status(502).json({
                error: "Echec de l appel au service IA conversationnel.",
                detail: errBody.detail || "Service injoignable.",
            });
        }

        const data = await iaRes.json();

        if (data.sources) {
            data.sources = await resolveSources(data.sources);
        }

        if (scope === "publications" && publicationId) {
            await Publication.findByIdAndUpdate(publicationId, {
                $push: {
                    assistanceDetails: {
                        segment: `Q: ${question}\nR: ${data.reponse}`,
                        source: "ia",
                    },
                },
            });
        }

        res.json(data);
    } catch (err) {
        if (err.name === "AbortError") {
            return res.status(504).json({
                error: "TimeOut : le service IA conversationnel n a pas repondu dans les 30s.",
            });
        }
        res.status(500).json({ error: "Erreur interne du serveur." });
    }
};

exports.generateContent = async (req, res) => {
    try {
        const { prompt, type, tone } = req.body;
        if (!prompt || !prompt.trim()) {
            return res.status(400).json({ error: "Le prompt est requis." });
        }
        const iaRes = await fetchWithTimeout(
            `${IA_CONVERSATIONAL_URL}/conversational/ask`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    question: `Genere un ${type || 'article'} de ton ${tone || 'professionnel'} : ${prompt}`,
                    scope: "publications",
                }),
            }
        );
        if (!iaRes.ok) {
            return res.status(502).json({ error: "Echec de l appel au service IA." });
        }
        const data = await iaRes.json();
        res.json({ contenu: data.reponse || data.content || data.texte || JSON.stringify(data) });
    } catch (err) {
        if (err.name === "AbortError") {
            return res.status(504).json({ error: "TimeOut du service IA." });
        }
        res.status(500).json({ error: "Erreur interne." });
    }
};

exports.analyzeText = async (req, res) => {
    try {
        const { texte, analyse } = req.body;
        if (!texte || !texte.trim()) {
            return res.status(400).json({ error: "Le texte est requis." });
        }
        const iaRes = await fetchWithTimeout(
            `${IA_CONVERSATIONAL_URL}/conversational/ask`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    question: `Analyse le texte suivant (type d'analyse: ${analyse || 'global'}) et fournis un retour detaille:\n\n${texte}`,
                    scope: "publications",
                }),
            }
        );
        if (!iaRes.ok) {
            return res.status(502).json({ error: "Echec de l appel au service IA." });
        }
        const data = await iaRes.json();
        res.json({ resultat: data.reponse || data.content || data.analyse || JSON.stringify(data) });
    } catch (err) {
        if (err.name === "AbortError") {
            return res.status(504).json({ error: "TimeOut du service IA." });
        }
        res.status(500).json({ error: "Erreur interne." });
    }
};

exports.assistWriting = async (req, res) => {
    try {
        const { brouillon, type, publicationId } = req.body;

        if (!brouillon || !brouillon.trim()) {
            return res.status(400).json({ error: "Le brouillon est requis." });
        }

        const iaRes = await fetchWithTimeout(
            `${IA_CONVERSATIONAL_URL}/conversational/assist-writing`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ brouillon, type: type || "publication" }),
            }
        );

        if (!iaRes.ok) {
            const errBody = await iaRes.json().catch(() => ({}));
            return res.status(502).json({
                error: "Echec de l appel au service IA conversationnel.",
                detail: errBody.detail || "Service injoignable.",
            });
        }

        const data = await iaRes.json();

        if (type === "publication" && publicationId && data.segments) {
            const updates = data.segments.map((seg) => ({
                segment: seg.text,
                source: seg.source,
            }));
            await Publication.findByIdAndUpdate(publicationId, {
                $push: { assistanceDetails: { $each: updates } },
            });
        }

        res.json(data);
    } catch (err) {
        if (err.name === "AbortError") {
            return res.status(504).json({
                error: "TimeOut : le service IA conversationnel n a pas repondu dans les 30s.",
            });
        }
        res.status(500).json({ error: "Erreur interne du serveur." });
    }
};
