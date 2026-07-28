require("dotenv").config();
const dns = require("dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);
const mongoose = require("mongoose");
const { faker } = require("@faker-js/faker");
const bcrypt = require("bcryptjs");

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/SHM";
const TEST_PASSWORD = "Test1234!";

async function main() {
    await mongoose.connect(MONGO_URI);
    const db = mongoose.connection.db;

    // ── Nettoyage ──
    const collections = await db.listCollections().toArray();
    for (const c of collections) {
        if (!c.name.startsWith("system.")) await db.collection(c.name).deleteMany({});
    }
    console.log("Toutes les collections vidées.\n");

    // ── Modules ──
    const Membre = require("../src/models/Membre");
    const Outil = require("../src/models/Outil");
    const Forum = require("../src/models/Forum");
    const Thematique = require("../src/models/Thematique");
    const Sujet = require("../src/models/Sujet");
    const Discussion = require("../src/models/Discussion");
    const Idee = require("../src/models/Idee");
    const Projet = require("../src/models/Projet");
    const BusinessPlan = require("../src/models/BusinessPlan");
    const CampagneCrowdfunding = require("../src/models/CampagneCrowdfunding");
    const Evenement = require("../src/models/Evenement");
    const Publication = require("../src/models/Publication");
    const Formation = require("../src/models/Formation");
    const Offre = require("../src/models/Offre");
    const JeuDeDonnees = require("../src/models/JeuDeDonnees");
    const ModeleIA = require("../src/models/ModeleIA");
    const TacheCrowdsourcing = require("../src/models/TacheCrowdsourcing");
    const Groupement = require("../src/models/Groupement");
    const BourseRecherche = require("../src/models/BourseRecherche");
    const Temoignage = require("../src/models/Temoignage");
    const Bounty = require("../src/models/Bounty");
    const Mentorat = require("../src/models/Mentorat");
    const Candidature = require("../src/models/Candidature");
    const Mission = require("../src/models/Mission");
    const Prestation = require("../src/models/Prestation");
    const ValidationCompetence = require("../src/models/ValidationCompetence");
    const Atelier = require("../src/models/Atelier");
    const Sondage = require("../src/models/Sondage");

    // ── Helpers ──
    const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
    const pickN = (arr, n) => {
        const shuffled = [...arr].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, Math.min(n, shuffled.length));
    };
    const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
    const bool = () => Math.random() > 0.5;

    // ── 1. Membres ──
    const ROLES = ["etudiant", "encadrant", "admin"];
    const members = [];
    const hashedPassword = await bcrypt.hash(TEST_PASSWORD, 10);
    for (let i = 0; i < 30; i++) {
        members.push({
            email: i === 0 ? "test@shm.ma" : faker.internet.email().toLowerCase(),
            motDePasse: hashedPassword,
            nom: faker.person.lastName(),
            prenom: faker.person.firstName(),
            role: i < 2 ? "admin" : pick(ROLES),
            reputationScore: rand(0, 100),
        });
    }
    const createdMembers = await Membre.insertMany(members);
    console.log(`Membres : ${createdMembers.length}`);

    // ── 2. Outils ──
    const outils = [];
    for (let i = 0; i < 5; i++) {
        outils.push({
            nom: faker.company.name() + " Tool",
            categorie: pick(["ai", "devsecops", "it"]),
            fonction: faker.lorem.sentence(3),
            coutUsage: parseFloat((Math.random() * 100).toFixed(2)),
        });
    }
    const createdOutils = await Outil.insertMany(outils);
    console.log(`Outils : ${createdOutils.length}`);

    // ── 3. Forums ──
    const forums = [];
    for (let i = 0; i < 4; i++) {
        forums.push({
            nom: faker.company.name() + " Forum",
            description: faker.lorem.sentence(),
        });
    }
    const createdForums = await Forum.insertMany(forums);
    console.log(`Forums : ${createdForums.length}`);

    // ── 4. Thematiques ──
    const thematiques = [];
    for (const forum of createdForums) {
        for (let i = 0; i < 2; i++) {
            thematiques.push({
                nom: faker.lorem.words(2),
                forumId: forum._id,
            });
        }
    }
    const createdThematiques = await Thematique.insertMany(thematiques);
    console.log(`Thematiques : ${createdThematiques.length}`);

    // ── 5. Sujets ──
    const sujets = [];
    for (const thematique of createdThematiques) {
        for (let i = 0; i < 2; i++) {
            sujets.push({
                titre: faker.lorem.sentence(4),
                thematiqueId: thematique._id,
                auteurId: pick(createdMembers)._id,
            });
        }
    }
    const createdSujets = await Sujet.insertMany(sujets);
    console.log(`Sujets : ${createdSujets.length}`);

    // ── 6. Discussions ──
    const discussions = [];
    for (const sujet of createdSujets) {
        const numDisc = rand(1, 3);
        for (let i = 0; i < numDisc; i++) {
            discussions.push({
                sujetId: sujet._id,
                auteurId: pick(createdMembers)._id,
                contenu: faker.lorem.paragraph(),
            });
        }
    }
    const createdDiscussions = await Discussion.insertMany(discussions);
    console.log(`Discussions : ${createdDiscussions.length}`);

    // ── 7. Idees ──
    const idees = [];
    for (let i = 0; i < 15; i++) {
        idees.push({
            titre: faker.lorem.sentence(3),
            description: faker.lorem.paragraph(),
            auteurId: pick(createdMembers)._id,
            votes: pickN(createdMembers, rand(0, 8)).map((m) => m._id),
            commentaires: Array.from({ length: rand(0, 3) }, () => ({
                auteurId: pick(createdMembers)._id,
                texte: faker.lorem.sentence(),
                date: faker.date.past(),
            })),
            statut: pick(["proposee", "en_projet"]),
        });
    }
    const createdIdees = await Idee.insertMany(idees);
    console.log(`Idees : ${createdIdees.length}`);

    // ── 8. Projets ──
    const projets = [];
    for (let i = 0; i < 8; i++) {
        projets.push({
            ideeId: pick(createdIdees)._id,
            objectifs: Array.from({ length: rand(1, 4) }, () => faker.lorem.sentence()),
            equipe: pickN(createdMembers, rand(2, 5)).map((m) => m._id),
            feuilleDeRoute: faker.lorem.paragraph(),
            statut: pick(["planification", "en_cours", "termine", "abandonne"]),
        });
    }
    const createdProjets = await Projet.insertMany(projets);
    console.log(`Projets : ${createdProjets.length}`);

    // ── 9. BusinessPlans ──
    const businessPlans = [];
    for (let i = 0; i < 6; i++) {
        businessPlans.push({
            projetId: pick(createdProjets)._id,
            modeleEconomique: faker.lorem.paragraph(),
            budget: parseFloat((Math.random() * 100000).toFixed(2)),
            previsions: faker.lorem.paragraph(),
            version: "1.0.0",
            assistanceDetails: Array.from({ length: rand(1, 3) }, () => ({
                segment: faker.lorem.word(),
                source: pick(["utilisateur", "ia"]),
            })),
        });
    }
    const createdBusinessPlans = await BusinessPlan.insertMany(businessPlans);
    console.log(`BusinessPlans : ${createdBusinessPlans.length}`);

    // ── 10. Campagnes Crowdfunding ──
    const campagnes = [];
    for (let i = 0; i < 5; i++) {
        const objectif = rand(1000, 50000);
        campagnes.push({
            projetId: pick(createdProjets)._id,
            objectifFinancier: objectif,
            contreparties: Array.from({ length: rand(1, 3) }, () => faker.lorem.sentence()),
            dureeJours: rand(15, 90),
            fondsCollectes: rand(0, objectif),
            contributions: Array.from({ length: rand(0, 5) }, () => ({
                financeurId: pick(createdMembers)._id,
                montant: rand(10, 500),
                date: faker.date.past(),
            })),
        });
    }
    const createdCampagnes = await CampagneCrowdfunding.insertMany(campagnes);
    console.log(`Campagnes : ${createdCampagnes.length}`);

    // ── 11. Evenements ──
    const evenements = [];
    const EVENT_TYPES = ["hackathon", "congres", "salon", "concours"];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
        const start = faker.date.between({ from: now, to: new Date(now.getTime() + 180 * 86400000) });
        const end = new Date(start.getTime() + rand(1, 5) * 86400000);
        evenements.push({
            type: pick(EVENT_TYPES),
            titre: faker.company.catchPhrase(),
            dates: { debut: start, fin: end },
            programme: Array.from({ length: rand(2, 5) }, () => faker.lorem.sentence()),
            organisateurId: pick(createdMembers)._id,
            inscrits: pickN(createdMembers, rand(0, 10)).map((m) => m._id),
            capaciteMax: rand(20, 500),
            espacePrive: bool(),
        });
    }
    const createdEvenements = await Evenement.insertMany(evenements);
    console.log(`Evenements : ${createdEvenements.length}`);

    // ── 12. Publications ──
    const publications = [];
    const PUB_TYPES = ["these", "pfe", "pfa", "libre"];
    const PUB_STATUTS = ["brouillon", "soumis", "en_evaluation", "accepte", "rejete"];
    for (let i = 0; i < 15; i++) {
        publications.push({
            titre: faker.lorem.sentence(5),
            contenu: faker.lorem.paragraphs(3),
            type: pick(PUB_TYPES),
            auteur: pick(createdMembers)._id,
            statut: pick(PUB_STATUTS),
            hashContenu: faker.string.hexadecimal({ length: 64 }),
            preuve: {
                hash: faker.string.hexadecimal({ length: 64 }),
                statut: pick(["en_attente", "ancre", "echec"]),
            },
            evaluations: Array.from({ length: rand(0, 3) }, () => ({
                noteOriginalite: rand(1, 10),
                noteRigueur: rand(1, 10),
                notePertinence: rand(1, 10),
                scoreGlobal: parseFloat(Math.random().toFixed(2)),
                commentaire: faker.lorem.sentence(),
                niveau: pick(["ia", "humain"]),
                dateEvaluation: faker.date.past(),
            })),
            assistanceDetails: Array.from({ length: rand(0, 2) }, () => ({
                segment: faker.lorem.word(),
                source: pick(["utilisateur", "ia"]),
            })),
            dateSoumission: bool() ? faker.date.past() : undefined,
        });
    }
    const createdPublications = await Publication.insertMany(publications);
    console.log(`Publications : ${createdPublications.length}`);

    // ── 13. Formations ──
    const formations = [];
    const FORMATS = ["video", "texte", "hybride"];
    for (let i = 0; i < 12; i++) {
        const noteCount = rand(0, 5);
        formations.push({
            titre: faker.lorem.sentence(4),
            format: pick(FORMATS),
            contenuUrl: faker.internet.url(),
            auteurId: pick(createdMembers)._id,
            notes: Array.from({ length: noteCount }, () => ({
                membreId: pick(createdMembers)._id,
                note: rand(1, 5),
            })),
            certificationCommunautaire: parseFloat((Math.random() * 5).toFixed(1)),
        });
    }
    const createdFormations = await Formation.insertMany(formations);
    console.log(`Formations : ${createdFormations.length}`);

    // ── 14. Offres ──
    const offres = [];
    for (let i = 0; i < 12; i++) {
        offres.push({
            type: pick(["emploi", "stage"]),
            titre: faker.company.buzzPhrase(),
            exigences: Array.from({ length: rand(2, 5) }, () => faker.lorem.sentence()),
            organisationId: pick(createdMembers)._id,
            statut: pick(["ouverte", "fermee", "pourvue"]),
        });
    }
    const createdOffres = await Offre.insertMany(offres);
    console.log(`Offres : ${createdOffres.length}`);

    // ── 15. Jeux de Donnees ──
    const datasets = [];
    for (let i = 0; i < 8; i++) {
        datasets.push({
            nom: faker.lorem.words(3),
            domaine: faker.lorem.word(),
            fichierUrl: faker.internet.url(),
            annotations: faker.lorem.sentence(),
            licence: pick(["MIT", "GPL", "CC-BY", "Apache-2.0"]),
            qualite: parseFloat(Math.random().toFixed(2)),
            uploadePar: pick(createdMembers)._id,
        });
    }
    const createdDatasets = await JeuDeDonnees.insertMany(datasets);
    console.log(`Jeux de donnees : ${createdDatasets.length}`);

    // ── 16. Modeles IA ──
    const modeles = [];
    for (let i = 0; i < 8; i++) {
        modeles.push({
            nom: faker.lorem.words(2) + " Model",
            tache: pick(["classification", "regression", "nlp", "vision"]),
            performance: { accuracy: parseFloat((0.7 + Math.random() * 0.25).toFixed(3)) },
            version: `${rand(1, 3)}.${rand(0, 9)}.${rand(0, 9)}`,
            explicabiliteUrl: faker.internet.url(),
            auteurId: pick(createdMembers)._id,
            jeuDeDonneesId: pick(createdDatasets)._id,
        });
    }
    const createdModeles = await ModeleIA.insertMany(modeles);
    console.log(`Modeles IA : ${createdModeles.length}`);

    // ── 17. Taches Crowdsourcing ──
    const taches = [];
    for (let i = 0; i < 8; i++) {
        const lotCount = rand(1, 4);
        taches.push({
            titre: faker.lorem.sentence(3),
            lots: Array.from({ length: lotCount }, () => ({
                description: faker.lorem.sentence(),
                assigneA: bool() ? pick(createdMembers)._id : undefined,
                statut: pick(["ouverte", "assigne", "en_cours", "terminee"]),
                remunerationCalculee: rand(0, 100),
            })),
            remunerationTotale: rand(0, 500),
        });
    }
    const createdTaches = await TacheCrowdsourcing.insertMany(taches);
    console.log(`Taches crowdsourcing : ${createdTaches.length}`);

    // ── 18. Groupements ──
    const groupements = [];
    for (let i = 0; i < 5; i++) {
        groupements.push({
            nom: faker.company.name() + " Group",
            theme: faker.lorem.word(),
            description: faker.lorem.paragraph(),
            membres: pickN(createdMembers, rand(2, 6)).map((m) => m._id),
            reglesAdhesion: faker.lorem.sentence(),
        });
    }
    const createdGroupements = await Groupement.insertMany(groupements);
    console.log(`Groupements : ${createdGroupements.length}`);

    // ── 19. Bourses ──
    const bourses = [];
    for (let i = 0; i < 8; i++) {
        bourses.push({
            financeurId: pick(createdMembers)._id,
            montant: rand(500, 10000),
            criteres: Array.from({ length: rand(1, 4) }, () => faker.lorem.sentence()),
            doctorantId: bool() ? pick(createdMembers)._id : null,
            statut: pick(["ouverte", "attribuee", "cloturee"]),
        });
    }
    const createdBourses = await BourseRecherche.insertMany(bourses);
    console.log(`Bourses : ${createdBourses.length}`);

    // ── 20. Temoignages ──
    const temoignages = [];
    for (let i = 0; i < 8; i++) {
        temoignages.push({
            auteurId: pick(createdMembers)._id,
            titre: faker.lorem.sentence(3),
            contenu: faker.lorem.paragraph(),
            tags: Array.from({ length: rand(1, 4) }, () => faker.lorem.word()),
        });
    }
    const createdTemoignages = await Temoignage.insertMany(temoignages);
    console.log(`Temoignages : ${createdTemoignages.length}`);

    // ── 21. Bounties ──
    const bounties = [];
    for (let i = 0; i < 8; i++) {
        bounties.push({
            titre: faker.lorem.sentence(3),
            description: faker.lorem.paragraph(),
            recompense: rand(50, 2000),
            delai: faker.date.future(),
            publiePar: pick(createdMembers)._id,
            soumissions: Array.from({ length: rand(0, 3) }, () => ({
                membreId: pick(createdMembers)._id,
                contenuUrl: faker.internet.url(),
                dateSubmission: faker.date.past(),
            })),
            gagnantId: bool() ? pick(createdMembers)._id : undefined,
        });
    }
    const createdBounties = await Bounty.insertMany(bounties);
    console.log(`Bounties : ${createdBounties.length}`);

    // ── 22. Mentorats ──
    const mentorats = [];
    for (let i = 0; i < 8; i++) {
        const mentor = pick(createdMembers);
        let apprenant = pick(createdMembers);
        while (apprenant._id.equals(mentor._id)) apprenant = pick(createdMembers);
        mentorats.push({
            mentorId: mentor._id,
            apprenantId: apprenant._id,
            suivi: Array.from({ length: rand(0, 4) }, () => ({
                date: faker.date.past(),
                note: faker.lorem.sentence(),
            })),
            remunerationParHeure: rand(0, 50),
            statut: pick(["actif", "termine"]),
        });
    }
    const createdMentorats = await Mentorat.insertMany(mentorats);
    console.log(`Mentorats : ${createdMentorats.length}`);

    // ── 23. Candidatures ──
    const candidatures = [];
    for (const offre of createdOffres) {
        if (bool()) continue;
        const nbCand = rand(1, 3);
        for (let i = 0; i < nbCand; i++) {
            candidatures.push({
                offreId: offre._id,
                membreId: pick(createdMembers)._id,
                lettreMotivation: faker.lorem.paragraph(),
                statut: pick(["en_attente", "acceptee", "refusee"]),
            });
        }
    }
    const createdCandidatures = await Candidature.insertMany(candidatures);
    console.log(`Candidatures : ${createdCandidatures.length}`);

    // ── 24. Missions ──
    const missions = [];
    for (let i = 0; i < 8; i++) {
        missions.push({
            offreId: pick(createdOffres)._id,
            membreId: pick(createdMembers)._id,
            periode: {
                debut: faker.date.past(),
                fin: bool() ? faker.date.future() : undefined,
            },
            livrables: Array.from({ length: rand(1, 3) }, () => faker.lorem.sentence()),
            evaluationClient: bool() ? rand(1, 5) : undefined,
            statut: pick(["en_cours", "terminee", "litige"]),
        });
    }
    const createdMissions = await Mission.insertMany(missions);
    console.log(`Missions : ${createdMissions.length}`);

    // ── 25. Prestations ──
    const prestations = [];
    for (let i = 0; i < 8; i++) {
        const prestataire = pick(createdMembers);
        let client = pick(createdMembers);
        while (client._id.equals(prestataire._id)) client = pick(createdMembers);
        prestations.push({
            description: faker.lorem.paragraph(),
            tarif: rand(50, 2000),
            prestataireId: prestataire._id,
            clientId: client._id,
            statut: pick(["proposee", "negociee", "en_cours", "terminee"]),
        });
    }
    const createdPrestations = await Prestation.insertMany(prestations);
    console.log(`Prestations : ${createdPrestations.length}`);

    // ── 26. Validations Competence ──
    const validations = [];
    for (let i = 0; i < 8; i++) {
        const valideur = pick(createdMembers);
        let membre = pick(createdMembers);
        while (membre._id.equals(valideur._id)) membre = pick(createdMembers);
        validations.push({
            membreId: membre._id,
            missionId: pick(createdMissions)._id,
            competence: pick(["JavaScript", "Python", "Solidity", "React", "Node.js", "IA", "Blockchain", "DevOps"]),
            note: rand(1, 5),
            validePar: valideur._id,
        });
    }
    const createdValidations = await ValidationCompetence.insertMany(validations);
    console.log(`Validations competence : ${createdValidations.length}`);

    // ── 27. Ateliers ──
    const ateliers = [];
    for (let i = 0; i < 5; i++) {
        ateliers.push({
            nom: faker.lorem.words(3) + " Workshop",
            etapes: Array.from({ length: rand(1, 4) }, () => ({
                outilId: pick(createdOutils)._id,
                statut: pick(["en_attente", "en_cours", "termine", "echec"]),
                resultatUrl: bool() ? faker.internet.url() : "",
            })),
            createdBy: pick(createdMembers)._id,
            statutGlobal: pick(["en_cours", "termine", "echec"]),
        });
    }
    const createdAteliers = await Atelier.insertMany(ateliers);
    console.log(`Ateliers : ${createdAteliers.length}`);

    // ── 28. Sondages ──
    const sondages = [];
    for (let i = 0; i < 5; i++) {
        const options = Array.from({ length: rand(2, 5) }, () => faker.lorem.words(2));
        const votes = {};
        for (const opt of options) {
            const voters = pickN(createdMembers, rand(0, 5));
            if (voters.length > 0) votes[opt] = voters.map((m) => m._id);
        }
        sondages.push({
            question: faker.lorem.sentence(),
            options,
            votes,
            auteurId: pick(createdMembers)._id,
            dateFin: faker.date.future(),
        });
    }
    const createdSondages = await Sondage.insertMany(sondages);
    console.log(`Sondages : ${createdSondages.length}`);

    // ── Resume ──
    console.log("\n═══════════════════════════════════");
    console.log("  SEED TERMINE AVEC SUCCES");
    console.log("═══════════════════════════════════");
    console.log(`  Compte test : test@shm.ma / ${TEST_PASSWORD}`);
    console.log(`  Membres              : ${createdMembers.length}`);
    console.log(`  Outils               : ${createdOutils.length}`);
    console.log(`  Forums               : ${createdForums.length}`);
    console.log(`  Thematiques          : ${createdThematiques.length}`);
    console.log(`  Sujets               : ${createdSujets.length}`);
    console.log(`  Discussions          : ${createdDiscussions.length}`);
    console.log(`  Idees                : ${createdIdees.length}`);
    console.log(`  Projets              : ${createdProjets.length}`);
    console.log(`  BusinessPlans        : ${createdBusinessPlans.length}`);
    console.log(`  Campagnes            : ${createdCampagnes.length}`);
    console.log(`  Evenements           : ${createdEvenements.length}`);
    console.log(`  Publications         : ${createdPublications.length}`);
    console.log(`  Formations           : ${createdFormations.length}`);
    console.log(`  Offres               : ${createdOffres.length}`);
    console.log(`  Jeux de donnees      : ${createdDatasets.length}`);
    console.log(`  Modeles IA           : ${createdModeles.length}`);
    console.log(`  Taches crowdsourcing : ${createdTaches.length}`);
    console.log(`  Groupements          : ${createdGroupements.length}`);
    console.log(`  Bourses              : ${createdBourses.length}`);
    console.log(`  Temoignages          : ${createdTemoignages.length}`);
    console.log(`  Bounties             : ${createdBounties.length}`);
    console.log(`  Mentorats            : ${createdMentorats.length}`);
    console.log(`  Candidatures         : ${createdCandidatures.length}`);
    console.log(`  Missions             : ${createdMissions.length}`);
    console.log(`  Prestations          : ${createdPrestations.length}`);
    console.log(`  Validations          : ${createdValidations.length}`);
    console.log(`  Ateliers             : ${createdAteliers.length}`);
    console.log(`  Sondages             : ${createdSondages.length}`);
    console.log("═══════════════════════════════════\n");

    await mongoose.disconnect();
}

main().catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
});
