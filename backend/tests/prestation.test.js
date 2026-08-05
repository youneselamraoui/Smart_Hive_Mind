/**
 * Integration tests pour l'evaluation finale des prestations.
 *
 * Valide que la cloture d'une prestation avec evaluation finale s'enregistre
 * sans erreur Mongoose (ref "Evaluation" resolue, pas de cast error).
 */

process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret-do-not-use-in-production";

const request = require("supertest");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const app = require("../src/app");
const Prestation = require("../src/models/Prestation");
const Membre = require("../src/models/Membre");
const Evaluation = require("../src/models/Evaluation");
let mongoServer;

function validToken(id, role = "etudiant", overrides = {}) {
    return jwt.sign(
        { id, role, ...overrides },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
    );
}

async function creerMembre(role = "etudiant") {
    return Membre.create({
        email: `${role}.${new mongoose.Types.ObjectId()}@test.local`,
        motDePasse: "Password123!",
        nom: "Test",
        prenom: "Testeur",
        role,
    });
}

function withCookie(req, token) {
    return req.set("Cookie", `token=${token}`);
}

jest.setTimeout(30000);

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
    await mongoose.disconnect();
    if (mongoServer) await mongoServer.stop();
});

afterEach(async () => {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
        await collections[key].deleteMany({});
    }
    jest.restoreAllMocks();
});

describe("POST /api/prestations/:id/evaluation", () => {
    it("cloture la prestation avec une evaluation finale (201) sans erreur de ref", async () => {
        const client = await creerMembre();
        const prestataire = await creerMembre();
        const prestation = await Prestation.create({
            description: "Developpement d un site web",
            tarif: 2500,
            prestataireId: prestataire._id,
            clientId: client._id,
            statut: "en_cours",
        });

        const res = await withCookie(request(app)
            .post(`/api/prestations/${prestation._id}/evaluation`), validToken(client._id.toString()))
            .send({ note: 8, commentaire: "Travail de qualite." });

        expect(res.status).toBe(201);
        expect(res.body.message).toBe("Evaluation enregistree et prestation cloturee.");
        expect(res.body.evaluation.entiteType).toBe("prestation");
        expect(res.body.evaluation.entiteId).toBe(prestation._id.toString());
        expect(res.body.evaluation.note).toBe(8);

        const doc = await Prestation.findById(prestation._id).populate("evaluationFinale");
        expect(doc.evaluationFinale).not.toBeNull();
        expect(doc.evaluationFinale.evaluateurId.toString()).toBe(client._id.toString());
        expect(doc.evaluationFinale.note).toBe(8);
        expect(doc.statut).toBe("terminee");
    });

    it("refuse l evaluation par un non-client avec 403", async () => {
        const client = await creerMembre();
        const prestataire = await creerMembre();
        const tiers = await creerMembre();
        const prestation = await Prestation.create({
            description: "Design logo",
            tarif: 500,
            prestataireId: prestataire._id,
            clientId: client._id,
        });

        const res = await withCookie(request(app)
            .post(`/api/prestations/${prestation._id}/evaluation`), validToken(tiers._id.toString()))
            .send({ note: 7 });

        expect(res.status).toBe(403);
    });

    it("rejette une note hors bornes avec 400 (validation Zod)", async () => {
        const client = await creerMembre();
        const prestataire = await creerMembre();
        const prestation = await Prestation.create({
            description: "Design logo",
            tarif: 500,
            prestataireId: prestataire._id,
            clientId: client._id,
        });

        const res = await withCookie(request(app)
            .post(`/api/prestations/${prestation._id}/evaluation`), validToken(client._id.toString()))
            .send({ note: 11 });

        expect(res.status).toBe(400);
        expect(res.body.error).toBe("Validation echouee.");
    });

    it("refuse une double evaluation avec 409", async () => {
        const client = await creerMembre();
        const prestataire = await creerMembre();
        const prestation = await Prestation.create({
            description: "Design logo",
            tarif: 500,
            prestataireId: prestataire._id,
            clientId: client._id,
            statut: "terminee",
            evaluationFinale: (await Evaluation.create({
                entiteType: "prestation",
                entiteId: new mongoose.Types.ObjectId(),
                evaluateurId: client._id,
                note: 6,
            }))._id,
        });

        const res = await withCookie(request(app)
            .post(`/api/prestations/${prestation._id}/evaluation`), validToken(client._id.toString()))
            .send({ note: 9 });

        expect(res.status).toBe(409);
    });

    it("renvoie 401 sans cookie JWT", async () => {
        const client = await creerMembre();
        const prestataire = await creerMembre();
        const prestation = await Prestation.create({
            description: "Design logo",
            tarif: 500,
            prestataireId: prestataire._id,
            clientId: client._id,
        });

        const res = await request(app)
            .post(`/api/prestations/${prestation._id}/evaluation`)
            .send({ note: 7 });

        expect(res.status).toBe(401);
    });
});

describe("GET /api/prestations/:id/evaluation", () => {
    it("retourne l evaluation finale peuplee (200)", async () => {
        const client = await creerMembre();
        const prestataire = await creerMembre();
        const prestation = await Prestation.create({
            description: "Developpement d un site web",
            tarif: 2500,
            prestataireId: prestataire._id,
            clientId: client._id,
        });

        const evalRes = await withCookie(request(app)
            .post(`/api/prestations/${prestation._id}/evaluation`), validToken(client._id.toString()))
            .send({ note: 9, commentaire: "Excellent." });

        const res = await request(app).get(`/api/prestations/${prestation._id}/evaluation`);

        expect(res.status).toBe(200);
        expect(res.body._id).toBe(evalRes.body.evaluation._id);
        expect(res.body.note).toBe(9);
    });

    it("renvoie 404 si aucune evaluation", async () => {
        const client = await creerMembre();
        const prestataire = await creerMembre();
        const prestation = await Prestation.create({
            description: "Design logo",
            tarif: 500,
            prestataireId: prestataire._id,
            clientId: client._id,
        });

        const res = await request(app).get(`/api/prestations/${prestation._id}/evaluation`);

        expect(res.status).toBe(404);
    });
});
