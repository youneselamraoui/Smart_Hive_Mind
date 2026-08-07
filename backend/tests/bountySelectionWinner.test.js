/**
 * Tests de la selection du gagnant d'une bounty via ai-decisionnel.
 *
 * Verifie que POST /api/marketplace/bounties/:id/selectionner-gagnant
 * classe les soumissions via /decisionnel/classer-soumissions, met a jour
 * gagnantId en base et notifie le gagnant.
 */

process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret-do-not-use-in-production";

const request = require("supertest");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const app = require("../src/app");
const Bounty = require("../src/models/Bounty");
const Membre = require("../src/models/Membre");
const Notification = require("../src/models/Notification");
let mongoServer;

function validToken(role, overrides = {}) {
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

async function creerBounty(auteurId, soumissionneurs = []) {
    const bounty = await Bounty.create({
        titre: "Bounty test",
        description: "Description de la bounty test.",
        recompense: 500,
        delai: new Date(Date.now() + 7 * 24 * 3600 * 1000),
        publiePar: auteurId,
    });
    for (const membreId of soumissionneurs) {
        bounty.soumissions.push({
            membreId,
            contenuUrl: `https://exemple.test/solutions/${membreId}`,
            dateSubmission: new Date(),
        });
    }
    await bounty.save();
    return bounty;
}

function mockIA(recommande, classement = null) {
    return jest.spyOn(global, "fetch").mockImplementation(async (url) => {
        expect(String(url)).toContain("/decisionnel/classer-soumissions");
        return {
            ok: true,
            json: async () => ({
                classement: classement || [
                    { membreId: recommande, score: 0.95, rang: 1 },
                    { membreId: "autre", score: 0.4, rang: 2 },
                ],
                recommande,
            }),
        };
    });
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

describe("POST /api/marketplace/bounties/:id/selectionner-gagnant", () => {
    it("classe via ai-decisionnel, persiste gagnantId et notifie le gagnant", async () => {
        const { token, membre: auteur } = await tokenPourMembre("etudiant");
        const { membre: gagnant } = await tokenPourMembre("etudiant");
        const { membre: perdant } = await tokenPourMembre("etudiant");
        const bounty = await creerBounty(auteur._id, [gagnant._id, perdant._id]);
        mockIA(gagnant._id.toString());

        const res = await withCookie(request(app)
            .post(`/api/marketplace/bounties/${bounty._id}/selectionner-gagnant`), token)
            .send({ gagnantId: gagnant._id.toString() });

        expect(res.status).toBe(200);
        expect(res.body.gagnantId).toBe(gagnant._id.toString());
        expect(res.body.classementIA.recommande).toBe(gagnant._id.toString());

        const enBase = await Bounty.findById(bounty._id);
        expect(enBase.gagnantId.toString()).toBe(gagnant._id.toString());

        const notif = await Notification.findOne({ destinataire: gagnant._id });
        expect(notif).not.toBeNull();
        expect(notif.type).toBe("bounty");
        expect(notif.message).toContain("selectionnee comme gagnante");
        expect(notif.lien).toContain("/marketplace/bounty/");
    });

    it("choisit le gagnant recommande par l IA si gagnantId est absent", async () => {
        const { token, membre: auteur } = await tokenPourMembre("etudiant");
        const { membre: gagnant } = await tokenPourMembre("etudiant");
        const bounty = await creerBounty(auteur._id, [gagnant._id]);
        mockIA(gagnant._id.toString());

        const res = await withCookie(request(app)
            .post(`/api/marketplace/bounties/${bounty._id}/selectionner-gagnant`), token)
            .send({});

        expect(res.status).toBe(200);
        expect(res.body.gagnantId).toBe(gagnant._id.toString());
        const enBase = await Bounty.findById(bounty._id);
        expect(enBase.gagnantId.toString()).toBe(gagnant._id.toString());
    });

    it("autorise un admin a selectionner le gagnant", async () => {
        const { token: adminToken } = await tokenPourMembre("admin");
        const { membre: auteur } = await tokenPourMembre("etudiant");
        const { membre: gagnant } = await tokenPourMembre("etudiant");
        const bounty = await creerBounty(auteur._id, [gagnant._id]);
        mockIA(gagnant._id.toString());

        const res = await withCookie(request(app)
            .post(`/api/marketplace/bounties/${bounty._id}/selectionner-gagnant`), adminToken)
            .send({ gagnantId: gagnant._id.toString() });

        expect(res.status).toBe(200);
        expect(res.body.gagnantId).toBe(gagnant._id.toString());
    });

    it("refuse un membre qui n'est ni auteur ni admin (403)", async () => {
        const { token } = await tokenPourMembre("etudiant");
        const { membre: auteur } = await tokenPourMembre("etudiant");
        const { membre: gagnant } = await tokenPourMembre("etudiant");
        const bounty = await creerBounty(auteur._id, [gagnant._id]);

        const res = await withCookie(request(app)
            .post(`/api/marketplace/bounties/${bounty._id}/selectionner-gagnant`), token)
            .send({ gagnantId: gagnant._id.toString() });

        expect(res.status).toBe(403);
        const enBase = await Bounty.findById(bounty._id);
        expect(enBase.gagnantId).toBeUndefined();
    });

    it("refuse une bounty sans soumission (400)", async () => {
        const { token, membre: auteur } = await tokenPourMembre("etudiant");
        const bounty = await creerBounty(auteur._id, []);

        const res = await withCookie(request(app)
            .post(`/api/marketplace/bounties/${bounty._id}/selectionner-gagnant`), token)
            .send({ gagnantId: auteur._id.toString() });

        expect(res.status).toBe(400);
        expect(res.body.error).toBe("Aucune soumission a classer.");
    });

    it("refuse si un gagnant a deja ete choisi (400)", async () => {
        const { token, membre: auteur } = await tokenPourMembre("etudiant");
        const { membre: gagnant } = await tokenPourMembre("etudiant");
        const bounty = await creerBounty(auteur._id, [gagnant._id]);
        bounty.gagnantId = gagnant._id;
        await bounty.save();

        const res = await withCookie(request(app)
            .post(`/api/marketplace/bounties/${bounty._id}/selectionner-gagnant`), token)
            .send({ gagnantId: gagnant._id.toString() });

        expect(res.status).toBe(400);
        expect(res.body.error).toBe("Un gagnant a deja ete choisi.");
    });

    it("ne bloque pas si ai-decisionnel est down quand gagnantId est fourni", async () => {
        const { token, membre: auteur } = await tokenPourMembre("etudiant");
        const { membre: gagnant } = await tokenPourMembre("etudiant");
        const bounty = await creerBounty(auteur._id, [gagnant._id]);
        jest.spyOn(global, "fetch").mockRejectedValue(new Error("decisionnel down"));

        const res = await withCookie(request(app)
            .post(`/api/marketplace/bounties/${bounty._id}/selectionner-gagnant`), token)
            .send({ gagnantId: gagnant._id.toString() });

        expect(res.status).toBe(200);
        expect(res.body.gagnantId).toBe(gagnant._id.toString());
        expect(res.body.classementIA.erreur).toBeDefined();
        const notif = await Notification.findOne({ destinataire: gagnant._id });
        expect(notif).not.toBeNull();
    });

    it("refuse sans gagnantId quand l IA est indisponible (400)", async () => {
        const { token, membre: auteur } = await tokenPourMembre("etudiant");
        const { membre: gagnant } = await tokenPourMembre("etudiant");
        const bounty = await creerBounty(auteur._id, [gagnant._id]);
        jest.spyOn(global, "fetch").mockRejectedValue(new Error("decisionnel down"));

        const res = await withCookie(request(app)
            .post(`/api/marketplace/bounties/${bounty._id}/selectionner-gagnant`), token)
            .send({});

        expect(res.status).toBe(400);
        expect(res.body.error).toContain("IA indisponible");
        const enBase = await Bounty.findById(bounty._id);
        expect(enBase.gagnantId).toBeUndefined();
    });

    it("repond aussi sur le chemin canonique /api/bounties/:id/selectionner-gagnant", async () => {
        const { token, membre: auteur } = await tokenPourMembre("etudiant");
        const { membre: gagnant } = await tokenPourMembre("etudiant");
        const bounty = await creerBounty(auteur._id, [gagnant._id]);
        mockIA(gagnant._id.toString());

        const res = await withCookie(request(app)
            .post(`/api/bounties/${bounty._id}/selectionner-gagnant`), token)
            .send({});

        expect(res.status).toBe(200);
        expect(res.body.gagnantId).toBe(gagnant._id.toString());
        const enBase = await Bounty.findById(bounty._id);
        expect(enBase.gagnantId.toString()).toBe(gagnant._id.toString());
    });

    it("refuse un gagnantId qui n'a pas soumis (400)", async () => {
        const { token, membre: auteur } = await tokenPourMembre("etudiant");
        const { membre: gagnant } = await tokenPourMembre("etudiant");
        const { membre: intrus } = await tokenPourMembre("etudiant");
        const bounty = await creerBounty(auteur._id, [gagnant._id]);
        mockIA(gagnant._id.toString());

        const res = await withCookie(request(app)
            .post(`/api/marketplace/bounties/${bounty._id}/selectionner-gagnant`), token)
            .send({ gagnantId: intrus._id.toString() });

        expect(res.status).toBe(400);
        expect(res.body.error).toBe("Ce membre n'a pas soumis de solution.");
    });
});
