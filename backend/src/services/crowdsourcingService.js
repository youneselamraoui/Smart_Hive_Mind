const TacheCrowdsourcing = require("../models/TacheCrowdsourcing");

/**
 * Decouper une tache en nbLots lots egaux.
 * Remplace le tableau lots existant par nbLots nouvelles entrees.
 */
async function splitTask(tacheId, nbLots) {
    if (!Number.isInteger(nbLots) || nbLots < 1) {
        throw new Error("nbLots doit etre un entier >= 1.");
    }

    const tache = await TacheCrowdsourcing.findById(tacheId);
    if (!tache) {
        throw new Error("Tache introuvable.");
    }

    const lots = Array.from({ length: nbLots }, (_, i) => ({
        description: `${tache.titre} - Lot ${i + 1}/${nbLots}`,
        statut: "ouverte",
        assigneA: null,
        remunerationCalculee: 0,
    }));

    tache.lots = lots;
    await tache.save();
    return tache;
}

/**
 * Calculer la remuneration de chaque contributeur d'une tache de crowdsourcing.
 *
 * Conditions :
 *  - Tous les lots doivent etre "terminee".
 *  - Remuneration proportionnelle au nombre de lots realises par membre.
 *  - Equite : minimum 10 % de la remuneration totale reservee aux membres
 *    ayant realise moins de 3 missions (toutes taches confondues).
 */
async function calculateRemuneration(tacheId) {
    const tache = await TacheCrowdsourcing.findById(tacheId);
    if (!tache) {
        throw new Error("Tache introuvable.");
    }

    if (!tache.lots || tache.lots.length === 0) {
        throw new Error("Aucun lot dans cette tache.");
    }

    const allTerminee = tache.lots.every((l) => l.statut === "terminee");
    if (!allTerminee) {
        throw new Error("Tous les lots doivent etre marques terminee avant le calcul.");
    }

    const { remunerationTotale } = tache;
    if (remunerationTotale <= 0) {
        throw new Error("remunerationTotale doit etre > 0.");
    }

    // Compter les lots termines par membre
    const lotsParMembre = new Map();
    for (const lot of tache.lots) {
        if (lot.assigneA) {
            const key = lot.assigneA.toString();
            lotsParMembre.set(key, (lotsParMembre.get(key) || 0) + 1);
        }
    }

    if (lotsParMembre.size === 0) {
        throw new Error("Aucun lot assigne.");
    }

    const totalLots = tache.lots.length;

    // Determiner les newcomers (< 3 missions realisees toutes taches confondues)
    const missionsParMembre = await compterMissionsRealisees();

    const membresIds = [...lotsParMembre.keys()];
    const newcomers = new Set(
        membresIds.filter((id) => (missionsParMembre.get(id) || 0) < 3)
    );
    const veterans = new Set(
        membresIds.filter((id) => !newcomers.has(id))
    );

    // Calcul de base : pro-rata strict
    const remunerationBase = new Map();
    for (const [id, nb] of lotsParMembre) {
        remunerationBase.set(id, (nb / totalLots) * remunerationTotale);
    }

    // Total revenant aux newcomers en pro-rata strict
    let partNewcomers = 0;
    for (const id of newcomers) {
        partNewcomers += remunerationBase.get(id) || 0;
    }

    const seuilEquite = 0.1 * remunerationTotale; // 10 %
    const remunerationFinale = new Map();

    if (partNewcomers < seuilEquite) {
        // Redistribution : les newcomers montent a 10 %, les veterans cedent
        // proportionnellement a leur part
        const partVeterans = remunerationTotale - partNewcomers;
        const deficit = seuilEquite - partNewcomers;

        for (const id of membresIds) {
            const base = remunerationBase.get(id) || 0;
            if (newcomers.has(id)) {
                // Chaque newcomer recoit sa part + supplement proportionnel
                const supplement = (base / partNewcomers) * deficit;
                remunerationFinale.set(id, base + supplement);
            } else {
                // Veteran cede proportionnellement a sa part
                const retrait = (base / partVeterans) * deficit;
                remunerationFinale.set(id, base - retrait);
            }
        }
    } else {
        // Pas besoin de redistribution
        for (const [id, val] of remunerationBase) {
            remunerationFinale.set(id, val);
        }
    }

    // Arrondir et stocker dans chaque lot
    for (const lot of tache.lots) {
        if (lot.assigneA) {
            const id = lot.assigneA.toString();
            const montantArrondi = Math.round((remunerationFinale.get(id) || 0) * 100) / 100;
            lot.remunerationCalculee = montantArrondi;
        }
    }

    tache.markModified("lots");
    await tache.save();

    return {
        tacheId: tache._id,
        remunerationTotale,
        repartition: Object.fromEntries(remunerationFinale),
        lots: tache.lots,
    };
}

/**
 * Compter le nombre de missions (lots termines) par membre sur toutes les taches.
 */
async function compterMissionsRealisees() {
    const toutesLesTaches = await TacheCrowdsourcing.find({
        "lots.statut": "terminee",
    });

    const compteur = new Map();
    for (const tache of toutesLesTaches) {
        for (const lot of tache.lots) {
            if (lot.statut === "terminee" && lot.assigneA) {
                const key = lot.assigneA.toString();
                compteur.set(key, (compteur.get(key) || 0) + 1);
            }
        }
    }
    return compteur;
}

module.exports = { splitTask, calculateRemuneration };
