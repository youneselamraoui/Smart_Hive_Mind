const Publication = require("../models/Publication");
const Membre = require("../models/Membre");
const Sujet = require("../models/Sujet");
const Mission = require("../models/Mission");
const Evenement = require("../models/Evenement");
const Idee = require("../models/Idee");
const Offre = require("../models/Offre");
const Formation = require("../models/Formation");

exports.getSummary = async (_req, res) => {
    try {
        const [
            totalPublications,
            totalMembres,
            totalSujets,
            totalMissions,
            totalEvenements,
            totalIdees,
            totalOffres,
            totalFormations,
            statsPublications,
            statsMissions,
        ] = await Promise.all([
            Publication.countDocuments(),
            Membre.countDocuments(),
            Sujet.countDocuments(),
            Mission.countDocuments(),
            Evenement.countDocuments(),
            Idee.countDocuments(),
            Offre.countDocuments(),
            Formation.countDocuments(),
            Publication.aggregate([
                {
                    $group: {
                        _id: null,
                        parStatut: { $push: "$statut" },
                    },
                },
            ]),
            Mission.aggregate([
                {
                    $group: {
                        _id: "$statut",
                        count: { $sum: 1 },
                    },
                },
            ]),
        ]);

        const repartitionPublications = statsPublications.length
            ? statsPublications[0].parStatut.reduce(
                  (acc, s) => {
                      acc[s] = (acc[s] || 0) + 1;
                      return acc;
                  },
                  { brouillon: 0, soumis: 0, en_evaluation: 0, accepte: 0, rejete: 0 }
              )
            : {};

        const repartitionMissions = statsMissions.reduce(
            (acc, row) => {
                acc[row._id] = row.count;
                return acc;
            },
            { en_cours: 0, terminee: 0, litige: 0 }
        );

        res.json({
            totalPublications,
            totalMembres,
            totalSujets,
            totalMissions,
            totalEvenements,
            totalIdees,
            totalOffres,
            totalFormations,
            repartitionPublications,
            repartitionMissions,
        });
    } catch (err) {
        res.status(500).json({ error: "Erreur interne du serveur." });
    }
};
