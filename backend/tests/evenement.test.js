/**
 * Integration tests pour le flux evenement (routes POST /api/evenements,
 * /evenements/soumettre et /evenements/:id/programme).
 *
 * NOTE : Comme pour le flux publication, l appel blockchain est mocke
 * (global.fetch) pour eviter de consommer du vrai gas Sepolia en CI.
 */

process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret-do-not-use-in-production";

const request = require("supertest");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const app = require("../src/app");
const Evenement = require("../src/models/Evenement");
const Membre = require("../src/models/Membre");
let mongoServer;

function validToken(role = "encadrant", overrides = {}) {
    return jwt.sign(
        { id: new mongoose.Types.ObjectId().toHexString(), role, ...overrides },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
    );
}

async function tokenPourMembre(role = "encadrant") {
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

describe("POST /api/evenements", () => {
    const VALID_PAYLOAD = {
        type: "hackathon",
        titre: "Hackathon IA Maroc 2026",
        dates: {
            debut: "2026-10-01T09:00:00.000Z",
            fin: "2026-10-03T18:00:00.000Z",
        },
        programme: [{ intitule: "Ouverture", heure: "09:00", description: "Discours" }],
        capaciteMax: 150,
        espacePrive: false,
    };

    it("cree un evenement avec un role encadrant (201)", async () => {
        const { token } = await tokenPourMembre("encadrant");
        const res = await withCookie(request(app)
            .post("/api/evenements"), token)
            .send(VALID_PAYLOAD);

        expect(res.status).toBe(201);
        expect(res.body.titre).toBe(VALID_PAYLOAD.titre);
        expect(res.body.type).toBe("hackathon");
        expect(res.body.dates.debut).toBe("2026-10-01T09:00:00.000Z");
        expect(res.body.programme).toHaveLength(1);
        expect(res.body.inscrits).toEqual([]);

        const doc = await Evenement.findById(res.body._id);
        expect(doc.organisateurId.toString()).toBe(res.body.organisateurId._id);
    });

    it("refuse un role etudiant avec 403", async () => {
        const res = await withCookie(request(app)
            .post("/api/evenements"), validToken("etudiant"))
            .send(VALID_PAYLOAD);

        expect(res.status).toBe(403);
    });

    it("rejette un type invalide avec 400 (validation Zod)", async () => {
        const res = await withCookie(request(app)
            .post("/api/evenements"), validToken("encadrant"))
            .send({ ...VALID_PAYLOAD, type: "sport" });

        expect(res.status).toBe(400);
        expect(res.body.error).toBe("Validation echouee.");
        expect(res.body.details.length).toBeGreaterThan(0);
    });

    it("rejette une date non ISO avec 400", async () => {
        const res = await withCookie(request(app)
            .post("/api/evenements"), validToken("encadrant"))
            .send({ ...VALID_PAYLOAD, dates: { debut: "demain", fin: "apres-demain" } });

        expect(res.status).toBe(400);
        expect(res.body.error).toBe("Validation echouee.");
    });

    it("renvoie 401 sans cookie JWT", async () => {
        const res = await request(app)
            .post("/api/evenements")
            .send(VALID_PAYLOAD);

        expect(res.status).toBe(401);
    });
});

describe("POST /api/evenements/:id/programme", () => {
    it("ajoute un element au programme (201)", async () => {
        const evenement = await Evenement.create({
            type: "congres",
            titre: "Congres national",
            dates: { debut: new Date(), fin: new Date(Date.now() + 86400000) },
            organisateurId: new mongoose.Types.ObjectId(),
        });

        const res = await withCookie(request(app)
            .post(`/api/evenements/${evenement._id}/programme`), validToken())
            .send({ intitule: "Atelier", heure: "14:00", description: "Hands-on" });

        expect(res.status).toBe(201);
        expect(res.body.message).toBe("Élément ajouté au programme.");
        expect(res.body.programme).toHaveLength(1);
        expect(res.body.programme[0].intitule).toBe("Atelier");

        const doc = await Evenement.findById(evenement._id);
        expect(doc.programme).toHaveLength(1);
    });

    it("rejette un intitule manquant avec 400", async () => {
        const evenement = await Evenement.create({
            type: "congres",
            titre: "Congres national",
            dates: { debut: new Date(), fin: new Date(Date.now() + 86400000) },
            organisateurId: new mongoose.Types.ObjectId(),
        });

        const res = await withCookie(request(app)
            .post(`/api/evenements/${evenement._id}/programme`), validToken())
            .send({ heure: "14:00" });

        expect(res.status).toBe(400);
        expect(res.body.error).toBe("Validation echouee.");
    });

    it("renvoie 404 si l evenement n existe pas", async () => {
        const res = await withCookie(request(app)
            .post(`/api/evenements/${new mongoose.Types.ObjectId()}/programme`), validToken())
            .send({ intitule: "Atelier", heure: "14:00" });

        expect(res.status).toBe(404);
    });
});

describe("POST /api/evenements/soumettre", () => {
    it("soumet une oeuvre et l ancre si l appel blockchain reussit (201)", async () => {
        const txHash = "0x" + "cd".repeat(32);
        const blockNumber = 1234567;

        jest.spyOn(global, "fetch").mockResolvedValue({
            ok: true,
            json: async () => ({ txHash, blockNumber }),
        });

        const evenement = await Evenement.create({
            type: "concours",
            titre: "Concours d innovation",
            dates: { debut: new Date(), fin: new Date(Date.now() + 86400000) },
            organisateurId: new mongoose.Types.ObjectId(),
        });

        const res = await withCookie(request(app)
            .post("/api/evenements/soumettre"), validToken("etudiant"))
            .send({
                evenementId: evenement._id.toString(),
                titre: "Oeuvre test concours",
                contenu: "Ma contribution sur les systemes multi-agents.",
            });

        expect(res.status).toBe(201);
        expect(res.body.publication.preuve.statut).toBe("ancre");
        expect(res.body.publication.preuve.txHash).toBe(txHash);

        const doc = await Evenement.findById(evenement._id);
        expect(doc.oeuvresSoumises).toHaveLength(1);
    });

    it("rejette un evenementId invalide avec 400", async () => {
        const res = await withCookie(request(app)
            .post("/api/evenements/soumettre"), validToken("etudiant"))
            .send({ evenementId: "pas-un-objectid", titre: "Oeuvre", contenu: "Contenu" });

        expect(res.status).toBe(400);
        expect(res.body.error).toBe("Validation echouee.");
    });

    it("renvoie 502 si l ancrage blockchain echoue (RPC down)", async () => {
        jest.spyOn(global, "fetch").mockRejectedValue(new Error("RPC unreachable"));

        const evenement = await Evenement.create({
            type: "concours",
            titre: "Concours d innovation",
            dates: { debut: new Date(), fin: new Date(Date.now() + 86400000) },
            organisateurId: new mongoose.Types.ObjectId(),
        });

        const res = await withCookie(request(app)
            .post("/api/evenements/soumettre"), validToken("etudiant"))
            .send({
                evenementId: evenement._id.toString(),
                titre: "Oeuvre test concours",
                contenu: "Ma contribution sur les systemes multi-agents.",
            });

        expect(res.status).toBe(502);
        expect(res.body.error).toBe("Echec de l'ancrage blockchain.");
    });
});
