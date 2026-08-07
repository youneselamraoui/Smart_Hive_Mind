/**
 * Tests du matching score via ai-predictive (placements).
 *
 * Verifie que le score affiche provient d'un appel reel a
 * /predictive/matching-score (features calculees depuis ProfilCertifie
 * + Offre), avec degradation gracieuse si le service IA est indisponible.
 */

process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret-do-not-use-in-production";

const request = require("supertest");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const app = require("../src/app");
const Offre = require("../src/models/Offre");
const Membre = require("../src/models/Membre");
const ProfilCertifie = require("../src/models/ProfilCertifie");
const Candidature = require("../src/models/Candidature");
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

async function creerOffre(exigences = ["python", "machine learning"]) {
    const org = await Membre.create({
        email: `org.${new mongoose.Types.ObjectId()}@test.local`,
        motDePasse: "Password123!",
        nom: "Org",
        prenom: "Test",
        role: "organisation",
    });
    return Offre.create({
        type: "emploi",
        titre: "Ingenieur IA",
        exigences,
        organisationId: org._id,
        statut: "ouverte",
    });
}

async function creerProfil(membreId) {
    return ProfilCertifie.create({
        membreId,
        competencesValidees: [
            { competence: "python", note: 4, validePar: new mongoose.Types.ObjectId(), date: new Date() },
            { competence: "machine learning", note: 5, validePar: new mongoose.Types.ObjectId(), date: new Date() },
        ],
        historiqueMissions: [
            { missionId: new mongoose.Types.ObjectId(), evaluationClient: 4 },
            { missionId: new mongoose.Types.ObjectId(), evaluationClient: 5 },
        ],
    });
}

describe("POST /api/placements/postuler (matching score ai-predictive)", () => {
    it("calcule les features depuis ProfilCertifie/Offre et retourne probabiliteSucces", async () => {
        let bodyCapture = null;
        jest.spyOn(global, "fetch").mockImplementation(async (url, opts) => {
            bodyCapture = JSON.parse(opts.body);
            return { ok: true, json: async () => ({ probabiliteSucces: 0.75 }) };
        });

        const { token, membre } = await tokenPourMembre("etudiant");
        const offre = await creerOffre();
        await creerProfil(membre._id);

        const res = await withCookie(request(app)
            .post("/api/placements/postuler"), token)
            .send({ offreId: offre._id.toString() });

        expect(res.status).toBe(201);
        expect(res.body.candidature.probabiliteSucces).toBe(0.75);

        expect(global.fetch).toHaveBeenCalledTimes(1);
        const url = global.fetch.mock.calls[0][0];
        expect(String(url)).toContain("/predictive/matching-score");
        expect(bodyCapture).toEqual({
            nbCompetencesMatchees: 2,
            nbAnneesExperience: 0,
            noteProfilMoyenne: 4.5,
            nbMissionsRealisees: 2,
        });

        const doc = await Candidature.findOne({ offreId: offre._id, membreId: membre._id });
        expect(doc.probabiliteSucces).toBe(0.75);
    });

    it("reste fonctionnel sans 500 si ai-predictive est indisponible", async () => {
        jest.spyOn(global, "fetch").mockRejectedValue(new Error("predictive down"));

        const { token, membre } = await tokenPourMembre("etudiant");
        const offre = await creerOffre();
        await creerProfil(membre._id);

        const res = await withCookie(request(app)
            .post("/api/placements/postuler"), token)
            .send({ offreId: offre._id.toString() });

        expect(res.status).toBe(201);
        expect(res.body.candidature.probabiliteSucces).toBeUndefined();

        const doc = await Candidature.findOne({ offreId: offre._id, membreId: membre._id });
        expect(doc.probabiliteSucces).toBeUndefined();
    });

    it("ne fait aucun appel IA si le membre n a pas de profil certifie", async () => {
        const fetchSpy = jest.spyOn(global, "fetch");

        const { token, membre } = await tokenPourMembre("etudiant");
        const offre = await creerOffre();

        const res = await withCookie(request(app)
            .post("/api/placements/postuler"), token)
            .send({ offreId: offre._id.toString() });

        expect(res.status).toBe(201);
        expect(res.body.candidature.probabiliteSucces).toBeUndefined();
        expect(fetchSpy).not.toHaveBeenCalled();
    });
});

describe("GET /api/placements/offres (matching score affiche)", () => {
    it("attache matchingScore aux offres quand le membre est authentifie", async () => {
        jest.spyOn(global, "fetch").mockImplementation(async () => ({
            ok: true,
            json: async () => ({ probabiliteSucces: 0.82 }),
        }));

        const { token, membre } = await tokenPourMembre("etudiant");
        const offre = await creerOffre(["python"]);
        await creerProfil(membre._id);

        const res = await withCookie(request(app)
            .get("/api/placements/offres"), token);

        expect(res.status).toBe(200);
        expect(res.body).toHaveLength(1);
        expect(res.body[0]._id).toBe(offre._id.toString());
        expect(res.body[0].matchingScore).toBe(0.82);
    });

    it("ne renvoie pas de matchingScore pour un visiteur anonyme", async () => {
        const fetchSpy = jest.spyOn(global, "fetch");
        await creerOffre();

        const res = await request(app).get("/api/placements/offres");

        expect(res.status).toBe(200);
        expect(res.body).toHaveLength(1);
        expect(res.body[0].matchingScore).toBeUndefined();
        expect(fetchSpy).not.toHaveBeenCalled();
    });

    it("n affiche aucun matchingScore si ai-predictive est indisponible", async () => {
        jest.spyOn(global, "fetch").mockRejectedValue(new Error("predictive down"));

        const { token, membre } = await tokenPourMembre("etudiant");
        await creerOffre(["python"]);
        await creerProfil(membre._id);

        const res = await withCookie(request(app)
            .get("/api/placements/offres"), token);

        expect(res.status).toBe(200);
        expect(res.body[0].matchingScore).toBeUndefined();
    });
});

describe("C2 — endpoints placements protégés par auth", () => {
    it("renvoie 401 sans cookie sur candidatures, missions, validations", async () => {
        for (const ep of ["candidatures", "missions", "validations"]) {
            const res = await request(app).get(`/api/placements/${ep}`);
            expect(res.status).toBe(401);
        }
    });

    it("renvoie 200 avec cookie valide sur candidatures, missions, validations", async () => {
        const { token } = await tokenPourMembre("encadrant");
        for (const ep of ["candidatures", "missions", "validations"]) {
            const res = await withCookie(request(app).get(`/api/placements/${ep}`), token);
            expect(res.status).toBe(200);
        }
    });
});
