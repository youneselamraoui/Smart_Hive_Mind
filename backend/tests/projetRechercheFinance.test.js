/**
 * Tests de propriete pour les projets de recherche finances.
 *
 * Verifie qu'un non-proprietaire reçoit 403 (et non 500) sur l'attribution
 * (regression req.membre._id vs req.membre.id).
 */

process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret-do-not-use-in-production";

const request = require("supertest");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const app = require("../src/app");
const ProjetRechercheFinance = require("../src/models/ProjetRechercheFinance");
const StructureRecherche = require("../src/models/StructureRecherche");
const Membre = require("../src/models/Membre");
let mongoServer;

function validToken(role = "organisation", overrides = {}) {
    return jwt.sign(
        { id: new mongoose.Types.ObjectId().toHexString(), role, ...overrides },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
    );
}

async function tokenPourMembre(role = "organisation") {
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

describe("PUT /api/projets-recherche/:id/attribuer (propriete)", () => {
    async function projetAvecCandidature(industrielId) {
        const equipe = await StructureRecherche.create({
            type: "equipe",
            nom: "Equipe test",
        });
        const projet = await ProjetRechercheFinance.create({
            theme: "IA neuro-symbolique",
            budget: 50000,
            industrielId,
            statut: "candidature",
            candidatures: [
                { equipeId: equipe._id, dateCandidature: new Date(), statut: "en_attente" },
            ],
        });
        return { projet, equipe };
    }

    it("rejette un non-proprietaire avec 403 (et non 500)", async () => {
        const { membre } = await tokenPourMembre("organisation");
        const { projet, equipe } = await projetAvecCandidature(membre._id);

        const intrus = validToken("organisation");
        const res = await withCookie(request(app)
            .put(`/api/projets-recherche/${projet._id}/attribuer`), intrus)
            .send({ equipeId: equipe._id.toString() });

        expect(res.status).toBe(403);
        expect(res.body.error).toBe("Seul l'industriel ayant publie ce projet peut l'attribuer.");
    });

    it("autorise le proprietaire a attribuer le projet (200)", async () => {
        const { token, membre } = await tokenPourMembre("organisation");
        const { projet, equipe } = await projetAvecCandidature(membre._id);

        const res = await withCookie(request(app)
            .put(`/api/projets-recherche/${projet._id}/attribuer`), token)
            .send({ equipeId: equipe._id.toString() });

        expect(res.status).toBe(200);
        expect(res.body.statut).toBe("en_cours");
        expect(res.body.candidatures[0].statut).toBe("retenue");
    });

    it("rejette un admin non-proprietaire avec 403 (controle de propriete strict)", async () => {
        const admin = validToken("admin");
        const { membre } = await tokenPourMembre("organisation");
        const { projet, equipe } = await projetAvecCandidature(membre._id);

        const res = await withCookie(request(app)
            .put(`/api/projets-recherche/${projet._id}/attribuer`), admin)
            .send({ equipeId: equipe._id.toString() });

        expect(res.status).toBe(403);
        expect(res.body.error).toBe("Seul l'industriel ayant publie ce projet peut l'attribuer.");
    });
});

describe("DELETE /api/projets-recherche/:id (role)", () => {
    it("rejette un non-admin avec 403", async () => {
        const { membre } = await tokenPourMembre("organisation");
        const projet = await ProjetRechercheFinance.create({
            theme: "IA neuro-symbolique",
            budget: 50000,
            industrielId: membre._id,
        });

        const res = await withCookie(request(app)
            .delete(`/api/projets-recherche/${projet._id}`), validToken("organisation"));

        expect(res.status).toBe(403);
    });
});
