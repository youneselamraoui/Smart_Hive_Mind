const Notification = require("../models/Notification");

exports.lister = async (req, res) => {
    try {
        const filter = { destinataire: req.membre.id };
        if (req.query.nonlu === "true") filter.lu = false;
        const items = await Notification.find(filter).sort({ createdAt: -1 }).limit(parseInt(req.query.limite) || 50);
        res.json(items);
    } catch (err) {
        res.status(500).json({ error: "Erreur interne." });
    }
};

exports.nonLus = async (req, res) => {
    try {
        const count = await Notification.countDocuments({ destinataire: req.membre.id, lu: false });
        res.json({ count });
    } catch (err) {
        res.status(500).json({ error: "Erreur interne." });
    }
};

exports.marquerLu = async (req, res) => {
    try {
        await Notification.findByIdAndUpdate(req.params.id, { lu: true });
        res.json({ message: "Notification marquée comme lue." });
    } catch (err) {
        res.status(500).json({ error: "Erreur interne." });
    }
};

exports.marquerToutLu = async (req, res) => {
    try {
        await Notification.updateMany({ destinataire: req.membre.id, lu: false }, { lu: true });
        res.json({ message: "Toutes les notifications marquées comme lues." });
    } catch (err) {
        res.status(500).json({ error: "Erreur interne." });
    }
};
