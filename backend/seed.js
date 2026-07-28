/* eslint-disable no-console */
// Ajoute uniquement des donnees de test : aucune collection existante n'est videe.
require("dotenv").config({ path: require("path").join(__dirname, ".env") });

const dns = require("dns");
const mongoose = require("mongoose");
const { faker } = require("@faker-js/faker");

// Utiliser Google DNS si le DNS local bloque Atlas (ex: box FAI / réseau scolaire)
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const Membre = require("./src/models/Membre");
const Publication = require("./src/models/Publication");
const Idee = require("./src/models/Idee");
const Projet = require("./src/models/Projet");
const BusinessPlan = require("./src/models/BusinessPlan");
const CampagneCrowdfunding = require("./src/models/CampagneCrowdfunding");
const Offre = require("./src/models/Offre");
const Candidature = require("./src/models/Candidature");
const Mission = require("./src/models/Mission");
const ValidationCompetence = require("./src/models/ValidationCompetence");
const Prestation = require("./src/models/Prestation");
const Bounty = require("./src/models/Bounty");
const Badge = require("./src/models/Badge");
const Mentorat = require("./src/models/Mentorat");
const BourseRecherche = require("./src/models/BourseRecherche");
const Formation = require("./src/models/Formation");
const JeuDeDonnees = require("./src/models/JeuDeDonnees");
const ModeleIA = require("./src/models/ModeleIA");
const Outil = require("./src/models/Outil");
const Atelier = require("./src/models/Atelier");
const TacheCrowdsourcing = require("./src/models/TacheCrowdsourcing");
const Forum = require("./src/models/Forum");
const Thematique = require("./src/models/Thematique");
const Sujet = require("./src/models/Sujet");
const Discussion = require("./src/models/Discussion");
const Sondage = require("./src/models/Sondage");
const Temoignage = require("./src/models/Temoignage");
const Evenement = require("./src/models/Evenement");
const Notification = require("./src/models/Notification");
const Groupement = require("./src/models/Groupement");

// Modifiez ces volumes selon vos besoins.
const COUNTS = {
  membres: 30, publications: 50, idees: 15, projets: 10, businessPlans: 10,
  campagnes: 8, offres: 12, candidatures: 24, missions: 15,
  validationsCompetence: 20, prestations: 15, bounties: 10, badges: 18,
  mentorats: 12, bourses: 8, formations: 12, jeuxDeDonnees: 10,
  modelesIA: 10, outils: 10, ateliers: 10, taches: 10, forums: 4,
  thematiques: 8, sujets: 20, discussions: 45, sondages: 10,
  temoignages: 12, evenements: 10, notifications: 30, groupements: 8,
};

// Mot de passe de tous les comptes seeds : Password123!
// Hash bcrypt (10 rounds) verifie avec bcryptjs.compareSync("Password123!", hash).
const SEEDED_PASSWORD_HASH = "$2a$10$2Glgnqy1GI1sEG35P0alPe8djKHepEvwOq10dimFh65YsE1Tp3I9q";

const choices = {
  role: ["etudiant", "encadrant", "admin", "organisation"],
  publicationType: ["these", "pfe", "pfa", "libre"],
  publicationStatut: ["brouillon", "soumis", "en_evaluation", "accepte", "rejete"],
  offreType: ["emploi", "stage"], offreStatut: ["ouverte", "fermee", "pourvue"],
  candidatureStatut: ["en_attente", "acceptee", "refusee"],
  missionStatut: ["en_cours", "terminee", "litige"],
  prestationStatut: ["proposee", "negociee", "en_cours", "terminee"],
  badge: ["innovateur", "collaborateur", "expert", "mentor", "contributeur", "leader"],
  mentoratStatut: ["actif", "termine"], bourseStatut: ["ouverte", "attribuee", "cloturee"],
  formationFormat: ["video", "texte", "hybride"], outilCategorie: ["ai", "devsecops", "it"],
  atelierStatut: ["en_attente", "en_cours", "termine", "echec"],
  evenementType: ["hackathon", "congres", "salon", "concours"],
  notification: ["evenement", "bounty", "mission", "badge", "candidature", "discussion", "sujet", "formation", "mentorat", "systeme"],
};

const one = (items) => faker.helpers.arrayElement(items);
const some = (items, min = 1, max = 3) => faker.helpers.arrayElements(items, { min, max: Math.min(max, items.length) });
const amount = (min, max) => faker.number.float({ min, max, fractionDigits: 2 });
const futureDate = (days = 180) => faker.date.soon({ days });
const pastDate = (days = 90) => faker.date.recent({ days });
const url = (path = "ressource") => `https://example.test/${path}/${faker.string.alphanumeric(12)}`;
const text = () => faker.lorem.paragraphs({ min: 1, max: 3 });
const insert = async (name, Model, documents, summary) => {
  const created = await Model.insertMany(documents);
  summary[name] = created.length;
  return created;
};

async function seed() {
  try {
    if (!process.env.MONGO_URI) throw new Error("MONGO_URI est absent de backend/.env");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connecte a MongoDB. Ajout de donnees factices sans suppression des donnees existantes.");
    const summary = {};

  const membres = await insert("Membre", Membre, Array.from({ length: COUNTS.membres }, () => {
    const prenom = faker.person.firstName();
    const nom = faker.person.lastName();
    return { email: `${prenom}.${nom}.${faker.string.uuid()}@example.test`.toLowerCase(), motDePasse: SEEDED_PASSWORD_HASH, nom, prenom, role: one(choices.role), reputationScore: faker.number.int({ min: 0, max: 100 }) };
  }), summary);

  const publications = await insert("Publication", Publication, Array.from({ length: COUNTS.publications }, () => ({
    titre: faker.lorem.sentence({ min: 4, max: 9 }).replace(/\.$/, ""), contenu: text(), type: one(choices.publicationType), auteur: one(membres)._id,
    statut: one(choices.publicationStatut), hashContenu: faker.string.hexadecimal({ length: 64, prefix: "" }),
    preuve: { hash: faker.string.hexadecimal({ length: 32, prefix: "" }), txHash: faker.string.hexadecimal({ length: 64, prefix: "0x" }), blockNumber: faker.number.int({ min: 1, max: 5000000 }), statut: one(["en_attente", "ancre", "echec"]) },
    evaluations: [{ noteOriginalite: amount(0, 10), noteRigueur: amount(0, 10), notePertinence: amount(0, 10), scoreGlobal: amount(0, 1), commentaire: faker.lorem.sentence(), niveau: one(["ia", "humain"]), dateEvaluation: pastDate() }],
    assistanceDetails: [{ segment: faker.lorem.sentence(), source: one(["utilisateur", "ia"]) }], dateSoumission: pastDate(),
  })), summary);

  const idees = await insert("Idee", Idee, Array.from({ length: COUNTS.idees }, () => ({ titre: faker.company.catchPhrase(), description: text(), auteurId: one(membres)._id, votes: some(membres, 0, 6).map(x => x._id), commentaires: some(membres, 1, 3).map(x => ({ auteurId: x._id, texte: faker.lorem.sentence(), date: pastDate() })), statut: one(["proposee", "en_projet"]) })), summary);
  const projets = await insert("Projet", Projet, Array.from({ length: COUNTS.projets }, () => ({ ideeId: one(idees)._id, objectifs: faker.helpers.multiple(() => faker.company.buzzPhrase(), { count: { min: 2, max: 4 } }), equipe: some(membres, 2, 5).map(x => x._id), feuilleDeRoute: text(), statut: one(["planification", "en_cours", "termine", "abandonne"]) })), summary);
  await insert("BusinessPlan", BusinessPlan, Array.from({ length: COUNTS.businessPlans }, () => ({ projetId: one(projets)._id, modeleEconomique: faker.company.buzzPhrase(), budget: amount(10000, 500000), previsions: text(), version: "1.0.0", assistanceDetails: [{ segment: faker.lorem.sentence(), source: one(["utilisateur", "ia"]) }] })), summary);
  await insert("CampagneCrowdfunding", CampagneCrowdfunding, Array.from({ length: COUNTS.campagnes }, () => { const contributions = some(membres, 2, 6).map(financeur => ({ financeurId: financeur._id, montant: amount(50, 5000), date: pastDate() })); return { projetId: one(projets)._id, objectifFinancier: amount(10000, 200000), contreparties: ["Acces anticipe", "Mention dans le projet"], dureeJours: faker.number.int({ min: 30, max: 90 }), fondsCollectes: contributions.reduce((total, item) => total + item.montant, 0), contributions }; }), summary);

  const offres = await insert("Offre", Offre, Array.from({ length: COUNTS.offres }, () => ({ type: one(choices.offreType), titre: faker.person.jobTitle(), exigences: faker.helpers.multiple(() => faker.person.jobArea(), { count: 3 }), organisationId: one(membres)._id, statut: one(choices.offreStatut) })), summary);
  const candidatures = await insert("Candidature", Candidature, Array.from({ length: COUNTS.candidatures }, () => ({ offreId: one(offres)._id, membreId: one(membres)._id, lettreMotivation: text(), statut: one(choices.candidatureStatut) })), summary);
  const missions = await insert("Mission", Mission, Array.from({ length: COUNTS.missions }, () => { const debut = pastDate(); return { offreId: one(offres)._id, membreId: one(membres)._id, periode: { debut, fin: futureDate(90) }, livrables: ["Rapport final", "Demonstration"], evaluationClient: amount(0, 5), statut: one(choices.missionStatut) }; }), summary);
  await insert("ValidationCompetence", ValidationCompetence, Array.from({ length: COUNTS.validationsCompetence }, () => ({ membreId: one(membres)._id, missionId: one(missions)._id, competence: faker.person.jobArea(), note: amount(0, 5), validePar: one(membres)._id })), summary);
  await insert("Prestation", Prestation, Array.from({ length: COUNTS.prestations }, () => ({ description: text(), tarif: amount(100, 3000), prestataireId: one(membres)._id, clientId: one(membres)._id, statut: one(choices.prestationStatut) })), summary);
  await insert("Bounty", Bounty, Array.from({ length: COUNTS.bounties }, () => { const soumissions = some(membres, 1, 4).map(membre => ({ membreId: membre._id, contenuUrl: url("soumissions"), dateSubmission: pastDate() })); return { titre: faker.company.catchPhrase(), description: text(), recompense: amount(500, 10000), delai: futureDate(), publiePar: one(membres)._id, soumissions, gagnantId: soumissions.length ? one(soumissions).membreId : null }; }), summary);
  await insert("Badge", Badge, Array.from({ length: COUNTS.badges }, () => ({ attribueA: one(membres)._id, badgeType: one(choices.badge), justification: faker.lorem.sentence(), attribuePar: one(membres)._id })), summary);
  await insert("Mentorat", Mentorat, Array.from({ length: COUNTS.mentorats }, () => ({ mentorId: one(membres)._id, apprenantId: one(membres)._id, suivi: [{ date: pastDate(), note: faker.lorem.sentence() }], remunerationParHeure: amount(0, 500), statut: one(choices.mentoratStatut) })), summary);
  await insert("BourseRecherche", BourseRecherche, Array.from({ length: COUNTS.bourses }, () => ({ financeurId: one(membres)._id, montant: amount(5000, 100000), criteres: ["Excellence academique", "Projet innovant"], doctorantId: one(membres)._id, statut: one(choices.bourseStatut) })), summary);
  const formations = await insert("Formation", Formation, Array.from({ length: COUNTS.formations }, () => ({ titre: faker.company.catchPhrase(), format: one(choices.formationFormat), contenuUrl: url("formations"), auteurId: one(membres)._id, notes: some(membres, 1, 5).map(membre => ({ membreId: membre._id, note: amount(0, 5) })), certificationCommunautaire: amount(0, 5) })), summary);
  const jeux = await insert("JeuDeDonnees", JeuDeDonnees, Array.from({ length: COUNTS.jeuxDeDonnees }, () => ({ nom: `${faker.science.chemicalElement().name} Dataset`, domaine: faker.science.unit().name, fichierUrl: url("datasets"), annotations: faker.lorem.sentence(), licence: "CC BY 4.0", qualite: amount(0, 1), uploadePar: one(membres)._id })), summary);
  await insert("ModeleIA", ModeleIA, Array.from({ length: COUNTS.modelesIA }, () => ({ nom: `${faker.company.buzzNoun()} AI`, tache: faker.person.jobType(), performance: { accuracy: amount(0.7, 0.99), f1: amount(0.7, 0.99) }, version: "1.0.0", explicabiliteUrl: url("models"), auteurId: one(membres)._id, jeuDeDonneesId: one(jeux)._id })), summary);

  const outils = await insert("Outil", Outil, Array.from({ length: COUNTS.outils }, () => ({ nom: faker.company.name(), categorie: one(choices.outilCategorie), fonction: faker.company.buzzPhrase(), coutUsage: amount(0, 250) })), summary);
  await insert("Atelier", Atelier, Array.from({ length: COUNTS.ateliers }, () => ({ nom: faker.company.catchPhrase(), etapes: some(outils, 1, 4).map(outil => ({ outilId: outil._id, statut: one(choices.atelierStatut), resultatUrl: url("ateliers") })), createdBy: one(membres)._id, statutGlobal: one(["en_cours", "termine", "echec"]) })), summary);
  await insert("TacheCrowdsourcing", TacheCrowdsourcing, Array.from({ length: COUNTS.taches }, () => { const lots = some(membres, 2, 5).map(membre => ({ description: faker.lorem.sentence(), assigneA: membre._id, statut: one(["ouverte", "assigne", "en_cours", "terminee"]), remunerationCalculee: amount(10, 200) })); return { titre: faker.company.catchPhrase(), lots, remunerationTotale: lots.reduce((total, lot) => total + lot.remunerationCalculee, 0) }; }), summary);

  const forums = await insert("Forum", Forum, Array.from({ length: COUNTS.forums }, () => ({ nom: `${faker.word.adjective()} Forum`, description: faker.lorem.sentence() })), summary);
  const thematiques = await insert("Thematique", Thematique, Array.from({ length: COUNTS.thematiques }, () => ({ nom: faker.word.words({ count: { min: 1, max: 3 } }), forumId: one(forums)._id })), summary);
  await Promise.all(forums.map(forum => Forum.updateOne({ _id: forum._id }, { $set: { thematiques: thematiques.filter(t => t.forumId.equals(forum._id)).map(t => t._id) } })));
  const sujets = await insert("Sujet", Sujet, Array.from({ length: COUNTS.sujets }, () => ({ titre: faker.lorem.sentence({ min: 3, max: 8 }), thematiqueId: one(thematiques)._id, auteurId: one(membres)._id })), summary);
  await Promise.all(thematiques.map(thematique => Thematique.updateOne({ _id: thematique._id }, { $set: { sujets: sujets.filter(s => s.thematiqueId.equals(thematique._id)).map(s => s._id) } })));
  const discussions = await insert("Discussion", Discussion, Array.from({ length: COUNTS.discussions }, () => ({ sujetId: one(sujets)._id, auteurId: one(membres)._id, contenu: text() })), summary);
  await Promise.all(sujets.map(sujet => Sujet.updateOne({ _id: sujet._id }, { $set: { discussions: discussions.filter(d => d.sujetId.equals(sujet._id)).map(d => d._id) } })));
  await insert("Sondage", Sondage, Array.from({ length: COUNTS.sondages }, () => ({ question: faker.lorem.sentence() + " ?", options: ["Oui", "Non", "Sans avis"], votes: { Oui: some(membres, 1, 5).map(m => m._id), Non: some(membres, 0, 4).map(m => m._id) }, auteurId: one(membres)._id, dateFin: futureDate(30) })), summary);
  await insert("Temoignage", Temoignage, Array.from({ length: COUNTS.temoignages }, () => ({ auteurId: one(membres)._id, titre: faker.lorem.sentence(), contenu: text(), tags: faker.helpers.multiple(() => faker.word.noun(), { count: 3 }) })), summary);
  await insert("Evenement", Evenement, Array.from({ length: COUNTS.evenements }, () => { const debut = futureDate(120); return { type: one(choices.evenementType), titre: faker.company.catchPhrase(), dates: { debut, fin: new Date(debut.getTime() + 2 * 86400000) }, programme: [{ intitule: "Ouverture", heure: "09:00", description: faker.lorem.sentence() }, { intitule: "Atelier", heure: "14:00", description: faker.lorem.sentence() }], organisateurId: one(membres)._id, inscrits: some(membres, 3, 12).map(m => m._id), capaciteMax: 100, espacePrive: faker.datatype.boolean(), oeuvresSoumises: some(publications, 0, 4).map(p => p._id) }; }), summary);
  await insert("Notification", Notification, Array.from({ length: COUNTS.notifications }, () => ({ destinataire: one(membres)._id, type: one(choices.notification), message: faker.lorem.sentence(), lien: "/tableau-de-bord", lu: faker.datatype.boolean() })), summary);
  await insert("Groupement", Groupement, Array.from({ length: COUNTS.groupements }, () => ({ nom: `${faker.word.adjective()} collectif`, theme: faker.word.noun(), description: text(), membres: some(membres, 3, 10).map(m => m._id), reglesAdhesion: faker.lorem.sentence() })), summary);

    console.table(summary);
    console.log(`Total cree : ${Object.values(summary).reduce((total, count) => total + count, 0)} documents.`);
  } finally {
    await mongoose.disconnect();
  }
}

seed()
  .catch(error => { console.error("Echec du seed :", error); process.exit(1); });
