const publicationSchema = require("./publicationSchema");
const { inscriptionSchema, connexionSchema } = require("./membreSchema");
const evaluationSchema = require("./evaluationSchema");
const { createEvenementSchema } = require("./evenementSchema");
const { createOffreSchema } = require("./offreSchema");
const { createBountySchema } = require("./bountySchema");
const { createBourseRechercheSchema } = require("./bourseRechercheSchema");
const { createTacheCrowdsourcingSchema } = require("./tacheCrowdsourcingSchema");
const { createAtelierSchema } = require("./atelierSchema");

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
};
