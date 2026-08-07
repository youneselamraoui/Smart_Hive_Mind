const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Membre = require("../models/Membre");

const TOKEN_EXPIRY = "7d";
const COOKIE_OPTIONS = {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 jours en ms
};

async function inscription(req, res) {
    const { email, motDePasse, nom, prenom, role } = req.body;

    const existant = await Membre.findOne({ email });
    if (existant) {
        return res.status(409).json({ error: "Cet email est déjà utilisé." });
    }

    const sel = await bcrypt.genSalt(12);
    const hash = await bcrypt.hash(motDePasse, sel);

    const membre = await Membre.create({ email, motDePasse: hash, nom, prenom, role: role || "etudiant" });

    res.status(201).json({ message: "Compte créé.", id: membre.id });
}

async function connexion(req, res) {
    const { email, motDePasse } = req.body;

    const membre = await Membre.findOne({ email });
    if (!membre) {
        return res.status(401).json({ error: "Email ou mot de passe incorrect." });
    }

    const valide = await bcrypt.compare(motDePasse, membre.motDePasse);
    if (!valide) {
        return res.status(401).json({ error: "Email ou mot de passe incorrect." });
    }

    const token = jwt.sign(
        { id: membre.id, role: membre.role, email: membre.email },
        process.env.JWT_SECRET,
        { expiresIn: TOKEN_EXPIRY }
    );

    res.cookie("token", token, COOKIE_OPTIONS);

    res.json({
        id: membre.id,
        nom: membre.nom,
        prenom: membre.prenom,
        email: membre.email,
        role: membre.role,
    });
}

async function me(req, res) {
    const membre = await Membre.findById(req.membre.id).select("-motDePasse");
    if (!membre) {
        return res.status(404).json({ error: "Compte introuvable." });
    }
    res.json(membre);
}

function deconnexion(_req, res) {
    res.clearCookie("token", { path: "/", httpOnly: true, sameSite: "strict" });
    res.json({ message: "Déconnecté." });
}

async function updateProfil(req, res) {
    try {
        const { nom, prenom, email, motDePasse } = req.body;
        const updates = {};
        if (nom) updates.nom = nom;
        if (prenom) updates.prenom = prenom;
        if (email) updates.email = email;
        if (motDePasse) {
            updates.motDePasse = await bcrypt.hash(motDePasse, 10);
        }
        const membre = await Membre.findByIdAndUpdate(req.membre.id, updates, { new: true }).select("-motDePasse");
        if (!membre) return res.status(404).json({ error: "Membre introuvable." });
        res.json({ message: "Profil mis à jour.", membre });
    } catch (err) {
        if (err.code === 11000) return res.status(409).json({ error: "Cet email est déjà utilisé." });
        res.status(500).json({ error: "Erreur interne." });
    }
}

async function demanderResetMotDePasse(req, res) {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ error: "Email requis." });
        const Membre = require("../models/Membre");
        const membre = await Membre.findOne({ email });
        if (!membre) return res.json({ message: "Si cet email existe, un code de vérification a été envoyé." });
        const crypto = require("crypto");
        const code = crypto.randomInt(100000, 999999).toString();
        membre.resetCode = code;
        membre.resetCodeExpires = new Date(Date.now() + 15 * 60 * 1000);
        await membre.save();
        console.log(`[RESET] Code for ${email}: ${code}`);
        res.json({ message: "Si cet email existe, un code de vérification a été envoyé." });
    } catch (err) {
        res.status(500).json({ error: "Erreur interne." });
    }
}

async function verifierCodeReset(req, res) {
    try {
        const { email, code } = req.body;
        if (!email || !code) return res.status(400).json({ error: "Email et code requis." });
        const Membre = require("../models/Membre");
        const membre = await Membre.findOne({ email, resetCode: code, resetCodeExpires: { $gt: new Date() } });
        if (!membre) return res.status(400).json({ error: "Code invalide ou expiré." });
        res.json({ message: "Code valide.", valide: true });
    } catch (err) {
        res.status(500).json({ error: "Erreur interne." });
    }
}

async function reinitialiserMotDePasse(req, res) {
    try {
        const { email, code, motDePasse } = req.body;
        if (!email || !code || !motDePasse) return res.status(400).json({ error: "Tous les champs sont requis." });
        if (motDePasse.length < 6) return res.status(400).json({ error: "Le mot de passe doit contenir au moins 6 caractères." });
        const Membre = require("../models/Membre");
        const membre = await Membre.findOne({ email, resetCode: code, resetCodeExpires: { $gt: new Date() } });
        if (!membre) return res.status(400).json({ error: "Code invalide ou expiré." });
        const bcrypt = require("bcryptjs");
        membre.motDePasse = await bcrypt.hash(motDePasse, 10);
        membre.resetCode = undefined;
        membre.resetCodeExpires = undefined;
        await membre.save();
        res.json({ message: "Mot de passe réinitialisé avec succès." });
    } catch (err) {
        res.status(500).json({ error: "Erreur interne." });
    }
}

async function getProfilCertifie(req, res) {
    try {
        const ProfilCertifie = require("../models/ProfilCertifie");
        let profil = await ProfilCertifie.findOne({ membreId: req.params.id })
            .populate("competencesValidees.missionId")
            .populate("competencesValidees.validePar", "nom prenom email")
            .populate("formationsSuivies.formationId")
            .populate("historiqueMissions.missionId")
            .populate("oeuvresProuvees.publicationId", "titre");

        if (!profil) {
            profil = {
                membreId: req.params.id,
                competencesValidees: [],
                formationsSuivies: [],
                historiqueMissions: [],
                oeuvresProuvees: [],
                reputationScore: 0,
            };
        }

        res.json(profil);
    } catch (err) {
        res.status(500).json({ error: "Erreur interne du serveur." });
    }
}

module.exports = { inscription, connexion, me, deconnexion, updateProfil, demanderResetMotDePasse, verifierCodeReset, reinitialiserMotDePasse, getProfilCertifie };
