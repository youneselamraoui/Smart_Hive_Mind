const publicationSchema = require("./publicationSchema");
const { inscriptionSchema, connexionSchema } = require("./membreSchema");
const evaluationSchema = require("./evaluationSchema");
const { createEvenementSchema } = require("./evenementSchema");
const { createOffreSchema } = require("./offreSchema");
const { createBountySchema } = require("./bountySchema");
const { createBourseRechercheSchema } = require("./bourseRechercheSchema");
const { createTacheCrowdsourcingSchema } = require("./tacheCrowdsourcingSchema");
const { createAtelierSchema } = require("./atelierSchema");
const { createAtelierNeuroSymboliqueSchema, updateReglesSchema, testerReglesSchema } = require("./atelierNeuroSymboliqueSchema");
const { createJournalSchema, updateJournalSchema, soumettreJournalSchema } = require("./journalSchema");
const { createStructureRechercheSchema, updateStructureRechercheSchema } = require("./structureRechercheSchema");
const {
    createProjetRechercheFinanceSchema,
    updateProjetRechercheFinanceSchema,
    candidaterProjetSchema,
    attribuerProjetSchema,
} = require("./projetRechercheFinanceSchema");

module.exports = {
    publicationSchema,
    inscriptionSchema,
    connexionSchema,
    evaluationSchema,
    createEvenementSchema,
    createOffreSchema,
    createBountySchema,
    createBourseRechercheSchema,
    createTacheCrowdsourcingSchema,
    createAtelierSchema,
    createAtelierNeuroSymboliqueSchema,
    updateReglesSchema,
    testerReglesSchema,
    createJournalSchema,
    updateJournalSchema,
    soumettreJournalSchema,
    createStructureRechercheSchema,
    updateStructureRechercheSchema,
    createProjetRechercheFinanceSchema,
    updateProjetRechercheFinanceSchema,
    candidaterProjetSchema,
    attribuerProjetSchema,
};
