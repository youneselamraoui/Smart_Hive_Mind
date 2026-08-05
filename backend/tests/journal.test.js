/**
 * Tests de propriete pour la soumission au journal.
 *
 * Verifie qu'un non-auteur reçoit 403 (et non 500) sur la route
 * POST /api/publications/:id/soumettre-journal (regression
 * req.membre._id vs req.membre.id).
 */

process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret-do-not-use-in-production";

const request = require("supertest");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const app = require("../src/app");
const Journal = require("../src/models/Journal");
const Publication = require("../src/models/Publication");
const Membre = require("../src/models/Membre");
let mongoServer;

function validToken(role = "etudiant", overrides = {}) {
    return jwt.sign(
        { id: new mongoose.Types.ObjectId().toHexString(), role, ...overrides },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
    );
}

async function tokenPourMembre(role = "etudiant") {
    const membre = await Membre.create({
        email: `${role}.${new mongoose.Types.ObjectId()}@test.local`,
        motDePasse: "Password123!",
        nom: "Test",
        prenom: "Testeur",
        role,
    });
    return { token: validToken(role, { id: membre._id.toString() }), membre };
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

describe("POST /api/publications/:id/soumettre-journal (propriete)", () => {
    async function journalEtPublication(auteurId) {
        const journal = await Journal.create({
            nom: "Revue SHM",
            domaines: ["IA"],
            statut: "actif",
        });
        const publication = await Publication.create({
            titre: "Contribution test",
            contenu: "Contenu de la publication.",
            type: "these",
            auteur: auteurId,
        });
        return { journal, publication };
    }

    it("rejette un non-auteur avec 403 (et non 500)", async () => {
        const { membre } = await tokenPourMembre("etudiant");
        const { journal, publication } = await journalEtPublication(membre._id);

        const intrus = validToken("etudiant");
        const res = await withCookie(request(app)
            .post(`/api/publications/${publication._id}/soumettre-journal`), intrus)
            .send({ journalId: journal._id.toString() });

        expect(res.status).toBe(403);
        expect(res.body.error).toBe("Seul l'auteur de la publication peut la soumettre à un journal.");
    });

    it("autorise l'auteur a soumettre sa publication (200)", async () => {
        const { token, membre } = await tokenPourMembre("etudiant");
        const { journal, publication } = await journalEtPublication(membre._id);

        const res = await withCookie(request(app)
            .post(`/api/publications/${publication._id}/soumettre-journal`), token)
            .send({ journalId: journal._id.toString() });

        expect(res.status).toBe(200);
        expect(res.body.journalId._id).toBe(journal._id.toString());

        const doc = await Publication.findById(publication._id);
        expect(doc.journalId.toString()).toBe(journal._id.toString());
    });

    it("autorise un admin a soumettre une publication (200)", async () => {
        const admin = validToken("admin");
        const { membre } = await tokenPourMembre("etudiant");
        const { journal, publication } = await journalEtPublication(membre._id);

        const res = await withCookie(request(app)
            .post(`/api/publications/${publication._id}/soumettre-journal`), admin)
            .send({ journalId: journal._id.toString() });

        expect(res.status).toBe(200);
    });
});
