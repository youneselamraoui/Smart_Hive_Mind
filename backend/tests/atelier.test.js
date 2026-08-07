/**
 * Tests de propriete pour l'atelier neuro-symbolique.
 *
 * Verifie qu'un non-proprietaire reçoit 403 (et non 500) sur les routes
 * protegees par createdBy (regression req.membre._id vs req.membre.id).
 */

process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret-do-not-use-in-production";
process.env.INTERNAL_SERVICE_KEY = process.env.INTERNAL_SERVICE_KEY || "test-internal-key";

const request = require("supertest");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const app = require("../src/app");
const Atelier = require("../src/models/Atelier");
const Membre = require("../src/models/Membre");
const ModeleIA = require("../src/models/ModeleIA");
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

describe("PUT /api/smart-tools/ateliers/neuro-symbolique/:id/regles (propriete)", () => {
    const REGLES_VALIDES = [
        {
            nom: "Originalite",
            condition: "originalite > 0.6",
            poids: 0.7,
            actif: true,
            impactSiDeclenchee: "positif",
        },
    ];

    it("rejette un non-proprietaire avec 403 (et non 500)", async () => {
        const { membre } = await tokenPourMembre("etudiant");
        const atelier = await Atelier.create({
            nom: "Atelier neuro-symbolique",
            type: "neuro_symbolique",
            createdBy: membre._id,
            regles: [],
            etapes: [],
        });

        const intrus = validToken("etudiant");
        const res = await withCookie(request(app)
            .put(`/api/smart-tools/ateliers/neuro-symbolique/${atelier._id}/regles`), intrus)
            .send({ regles: REGLES_VALIDES });

        expect(res.status).toBe(403);
        expect(res.body.error).toBe("Seul le proprietaire de l'atelier peut modifier ses regles.");
    });

    it("autorise le proprietaire a modifier ses regles (200)", async () => {
        const { token, membre } = await tokenPourMembre("etudiant");
        const atelier = await Atelier.create({
            nom: "Atelier neuro-symbolique",
            type: "neuro_symbolique",
            createdBy: membre._id,
            regles: [],
            etapes: [],
        });

        const res = await withCookie(request(app)
            .put(`/api/smart-tools/ateliers/neuro-symbolique/${atelier._id}/regles`), token)
            .send({ regles: REGLES_VALIDES });

        expect(res.status).toBe(200);
        expect(res.body.regles).toHaveLength(1);
    });

    it("autorise un admin a modifier les regles (200)", async () => {
        const admin = validToken("admin");
        const { membre } = await tokenPourMembre("etudiant");
        const atelier = await Atelier.create({
            nom: "Atelier neuro-symbolique",
            type: "neuro_symbolique",
            createdBy: membre._id,
            regles: [],
            etapes: [],
        });

        const res = await withCookie(request(app)
            .put(`/api/smart-tools/ateliers/neuro-symbolique/${atelier._id}/regles`), admin)
            .send({ regles: REGLES_VALIDES });

        expect(res.status).toBe(200);
        expect(res.body.regles).toHaveLength(1);
    });
});

describe("POST /api/smart-tools/models/json (publication sans fichier)", () => {
    it("publie un modele JSON avec une session utilisateur (201)", async () => {
        const { token } = await tokenPourMembre("etudiant");

        const res = await withCookie(request(app)
            .post("/api/smart-tools/models/json"), token)
            .send({ nom: "modele-json", tache: "atelier_neuro_symbolique", version: "1.0.0" });

        expect(res.status).toBe(201);
        expect(res.body.model.nom).toBe("modele-json");
        const doc = await ModeleIA.findById(res.body.model.id);
        expect(doc).not.toBeNull();
        expect(doc.fichierUrl).toBeUndefined();
    });

    it("accepte l'appel de l'orchestrateur via X-Internal-Key sans session (201)", async () => {
        const res = await request(app)
            .post("/api/smart-tools/models/json")
            .set("X-Internal-Key", process.env.INTERNAL_SERVICE_KEY)
            .send({ nom: "modele-orchestre", tache: "atelier_neuro_symbolique" });

        expect(res.status).toBe(201);
        expect(res.body.model.nom).toBe("modele-orchestre");
    });

    it("rejette un nom manquant (400, validation Zod)", async () => {
        const { token } = await tokenPourMembre("etudiant");

        const res = await withCookie(request(app)
            .post("/api/smart-tools/models/json"), token)
            .send({ tache: "atelier_neuro_symbolique" });

        expect(res.status).toBe(400);
    });

    it("rejette sans session et sans cle interne (401)", async () => {
        const res = await request(app)
            .post("/api/smart-tools/models/json")
            .send({ nom: "x", tache: "y" });

        expect(res.status).toBe(401);
    });
});
