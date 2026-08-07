/**
 * Test du flux generique de creation d'atelier (atelier-start).
 *
 * Verifie que le type canonique "neuro_symbolique" passe la validation
 * (ATELIER_DEFINITIONS + modele Mongoose) et aboutit en 201, et que
 * l'ancienne variante "ia-neuro-symbolique" est bien rejetee.
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

describe("POST /api/smart-tools/ateliers (flux generique atelier-start)", () => {
    it("cree un atelier avec le type canonique neuro_symbolique (201)", async () => {
        jest.spyOn(global, "fetch").mockResolvedValue({ ok: true, json: async () => ({}) });

        const { token, membre } = await tokenPourMembre("etudiant");
        const res = await withCookie(request(app)
            .post("/api/smart-tools/ateliers"), token)
            .send({ nom: "Analyse predictive Q3", type: "neuro_symbolique" });

        expect(res.status).toBe(201);
        expect(res.body.nom).toBe("Analyse predictive Q3");
        expect(res.body.createdBy.toString()).toBe(membre._id.toString());
        expect(res.body.etapes).toHaveLength(4);

        const doc = await Atelier.findById(res.body._id);
        expect(doc).not.toBeNull();
        expect(doc.etapes).toHaveLength(4);
    });

    it("rejette l'ancienne variante ia-neuro-symbolique avec 400", async () => {
        jest.spyOn(global, "fetch").mockResolvedValue({ ok: true, json: async () => ({}) });

        const { token } = await tokenPourMembre("etudiant");
        const res = await withCookie(request(app)
            .post("/api/smart-tools/ateliers"), token)
            .send({ nom: "Ancien flux", type: "ia-neuro-symbolique" });

        expect(res.status).toBe(400);
        expect(res.body.error).toContain("Type d'atelier inconnu");
    });

    it("renvoie 401 sans cookie JWT", async () => {
        const res = await request(app)
            .post("/api/smart-tools/ateliers")
            .send({ nom: "Atelier anonyme", type: "neuro_symbolique" });

        expect(res.status).toBe(401);
    });
});

describe("Pipeline complet atelier neuro-symbolique (orchestrateur simule)", () => {
    function mockFetchAvecEtapes() {
        const appels = [];
        jest.spyOn(global, "fetch").mockImplementation(async (url, opts) => {
            appels.push({ url: String(url), opts });
            return { ok: true, json: async () => ({}) };
        });
        return appels;
    }

    it("execute toutes les etapes et finalise avec statutGlobal termine", async () => {
        const appels = mockFetchAvecEtapes();

        const { token, membre } = await tokenPourMembre("etudiant");
        const res = await withCookie(request(app)
            .post("/api/smart-tools/ateliers"), token)
            .send({ nom: "Atelier neuro-symbolique e2e", type: "neuro_symbolique" });

        expect(res.status).toBe(201);
        const atelierId = res.body._id;

        const appelAgentic = appels.find((a) => a.url.includes("/agentic/run-workshop"));
        expect(appelAgentic).toBeDefined();
        const steps = JSON.parse(appelAgentic.opts.body).steps;
        expect(steps).toHaveLength(4);

        const generation = steps.find((s) => s.url.endsWith("/conversational/generate"));
        expect(generation).toBeDefined();
        expect(generation.payload.prompt).toBeTruthy();
        expect(generation.payload.type).toBeTruthy();
        expect(generation.payload.ton).toBeTruthy();

        const selection = steps.find((s) => s.url.endsWith("/conversational/assist-writing"));
        expect(selection.payload.brouillon).toBeTruthy();

        const entrainement = steps.find((s) => s.url.endsWith("/decisionnel/score-publication"));
        expect(entrainement.payload.contenu).toBeTruthy();
        expect(entrainement.payload.titre).toBeTruthy();
        expect(entrainement.payload.type).toBeTruthy();

        // Emulation de l'orchestrateur : chaque etape appelle le service cible avec son payload
        for (const step of steps) {
            const appel = await fetch(step.url, { method: step.method, body: JSON.stringify(step.payload) });
            expect(appel.ok).toBe(true);
        }

        // Rapports de progression + finalisation via les callbacks internes
        for (let index = 0; index < steps.length; index++) {
            const prog = await request(app)
                .post(`/api/smart-tools/ateliers/${atelierId}/progress`)
                .set("X-Internal-Key", process.env.INTERNAL_SERVICE_KEY)
                .send({ etape: { index, statut: "termine" } });
            expect(prog.status).toBe(200);
        }

        const fin = await request(app)
            .post(`/api/smart-tools/ateliers/${atelierId}/finalize`)
            .set("X-Internal-Key", process.env.INTERNAL_SERVICE_KEY)
            .send({ statutGlobal: "termine" });
        expect(fin.status).toBe(200);

        const status = await withCookie(request(app)
            .get(`/api/smart-tools/ateliers/${atelierId}`), token);

        expect(status.status).toBe(200);
        expect(status.body.statutGlobal).toBe("termine");
        expect(status.body.etapes).toHaveLength(4);
        for (const etape of status.body.etapes) {
            expect(etape.statut).toBe("termine");
        }
    });
});
