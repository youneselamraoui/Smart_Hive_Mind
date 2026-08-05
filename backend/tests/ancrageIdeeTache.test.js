/**
 * Integration tests pour l'ancrage blockchain des entites Idee et
 * TacheCrowdsourcing (anchorEntity branchee sur les nouvelles routes
 * POST /entrepreneuriat/idees/:id/ancrer et /taches-crowdsourcing/:id/ancrer).
 *
 * NOTE : Comme pour publication.test.js, l'appel blockchain est mocke
 * (global.fetch) pour eviter de consommer du vrai gas Sepolia en CI.
 */

process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret-do-not-use-in-production";

const request = require("supertest");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const app = require("../src/app");
const Idee = require("../src/models/Idee");
const TacheCrowdsourcing = require("../src/models/TacheCrowdsourcing");
let mongoServer;

function validToken(overrides = {}) {
    return jwt.sign(
        { id: new mongoose.Types.ObjectId().toHexString(), role: "etudiant", ...overrides },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
    );
}

function withCookie(req, token) {
    return req.set("Cookie", `token=${token}`);
}

function anchorOkMock() {
    const txHash = "0x" + "cd".repeat(32);
    const blockNumber = 5554443;
    jest.spyOn(global, "fetch").mockResolvedValue({
        ok: true,
        json: async () => ({ txHash, blockNumber }),
    });
    return { txHash, blockNumber };
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

describe("POST /api/entrepreneuriat/idees/:id/ancrer", () => {
    it("ancre l'idee pour son auteur et persiste la preuve", async () => {
        const token = validToken();
        const membreId = jwt.decode(token).id;
        const idee = await Idee.create({
            titre: "Smart Hive Mind",
            description: "Plateforme d'intelligence collective.",
            auteurId: membreId,
        });
        const { txHash, blockNumber } = anchorOkMock();

        const res = await withCookie(
            request(app).post(`/api/entrepreneuriat/idees/${idee._id}/ancrer`),
            token
        );

        expect(res.status).toBe(200);
        expect(res.body.message).toBe("Idee ancre sur la blockchain.");
        expect(res.body.hashContenu).toMatch(/^0x[a-f0-9]{64}$/);
        expect(res.body.preuve.statut).toBe("ancre");
        expect(res.body.preuve.txHash).toBe(txHash);
        expect(res.body.preuve.blockNumber).toBe(blockNumber);
        expect(res.body.preuve.typeEntite).toBe("idee");
        expect(res.body.idee.preuve.statut).toBe("ancre");

        const doc = await Idee.findById(idee._id);
        expect(doc.preuve.statut).toBe("ancre");
        expect(doc.preuve.typeEntite).toBe("idee");
    });

    it("renvoie 403 si le membre n'est pas l'auteur et pas admin", async () => {
        const auteur = new mongoose.Types.ObjectId().toHexString();
        const idee = await Idee.create({
            titre: "Idee privee",
            description: "Contenu",
            auteurId: auteur,
        });

        const res = await withCookie(
            request(app).post(`/api/entrepreneuriat/idees/${idee._id}/ancrer`),
            validToken()
        );

        expect(res.status).toBe(403);
    });

    it("autorise un admin a ancrer une idee dont il n'est pas l'auteur", async () => {
        const idee = await Idee.create({
            titre: "Idee admin",
            description: "Contenu",
            auteurId: new mongoose.Types.ObjectId().toHexString(),
        });
        anchorOkMock();

        const res = await withCookie(
            request(app).post(`/api/entrepreneuriat/idees/${idee._id}/ancrer`),
            validToken({ role: "admin" })
        );

        expect(res.status).toBe(200);
        expect(res.body.preuve.statut).toBe("ancre");
    });

    it("renvoie 404 si l'idee n'existe pas", async () => {
        const res = await withCookie(
            request(app).post(
                `/api/entrepreneuriat/idees/${new mongoose.Types.ObjectId().toHexString()}/ancrer`
            ),
            validToken()
        );

        expect(res.status).toBe(404);
    });

    it("renvoie 400 si l'idee est deja ancree", async () => {
        const token = validToken();
        const idee = await Idee.create({
            titre: "Deja ancree",
            description: "Contenu",
            auteurId: jwt.decode(token).id,
            preuve: {
                hash: "0x" + "11".repeat(32),
                txHash: "0x" + "22".repeat(32),
                blockNumber: 123,
                statut: "ancre",
                typeEntite: "idee",
            },
        });

        const res = await withCookie(
            request(app).post(`/api/entrepreneuriat/idees/${idee._id}/ancrer`),
            token
        );

        expect(res.status).toBe(400);
        expect(res.body.error).toContain("deja ancree");
    });

    it("renvoie 502 si l'appel blockchain echoue et persiste la preuve echec", async () => {
        const token = validToken();
        const idee = await Idee.create({
            titre: "Ancrage faille",
            description: "Contenu",
            auteurId: jwt.decode(token).id,
        });
        jest.spyOn(global, "fetch").mockRejectedValue(new Error("RPC unreachable"));

        const res = await withCookie(
            request(app).post(`/api/entrepreneuriat/idees/${idee._id}/ancrer`),
            token
        );

        expect(res.status).toBe(502);
        expect(res.body.error).toBe("Echec de l'ancrage blockchain.");

        const doc = await Idee.findById(idee._id);
        expect(doc.preuve.statut).toBe("echec");
    });

    it("renvoie 401 sans cookie JWT", async () => {
        const res = await request(app).post(
            `/api/entrepreneuriat/idees/${new mongoose.Types.ObjectId().toHexString()}/ancrer`
        );

        expect(res.status).toBe(401);
    });
});

describe("POST /api/taches-crowdsourcing/:id/ancrer", () => {
    it("ancre la tache pour un admin et persiste la preuve (typeEntite contribution)", async () => {
        const tache = await TacheCrowdsourcing.create({
            titre: "Traduction documentation",
            lots: [{ description: "Traduire le README", remunerationCalculee: 50 }],
            remunerationTotale: 50,
        });
        const { txHash, blockNumber } = anchorOkMock();

        const res = await withCookie(
            request(app).post(`/api/taches-crowdsourcing/${tache._id}/ancrer`),
            validToken({ role: "admin" })
        );

        expect(res.status).toBe(200);
        expect(res.body.message).toBe("Tache ancree sur la blockchain.");
        expect(res.body.hashContenu).toMatch(/^0x[a-f0-9]{64}$/);
        expect(res.body.preuve.statut).toBe("ancre");
        expect(res.body.preuve.txHash).toBe(txHash);
        expect(res.body.preuve.blockNumber).toBe(blockNumber);
        expect(res.body.preuve.typeEntite).toBe("contribution");

        const doc = await TacheCrowdsourcing.findById(tache._id);
        expect(doc.preuve.statut).toBe("ancre");
        expect(doc.preuve.typeEntite).toBe("contribution");
    });

    it("renvoie 403 pour un membre non admin (pas de proprietaire racine sur le modele)", async () => {
        const tache = await TacheCrowdsourcing.create({
            titre: "Tache membre",
            lots: [{ description: "Lot 1", remunerationCalculee: 10 }],
        });

        const res = await withCookie(
            request(app).post(`/api/taches-crowdsourcing/${tache._id}/ancrer`),
            validToken()
        );

        expect(res.status).toBe(403);
        expect(res.body.error).toContain("admins");
    });

    it("renvoie 404 si la tache n'existe pas", async () => {
        const res = await withCookie(
            request(app).post(
                `/api/taches-crowdsourcing/${new mongoose.Types.ObjectId().toHexString()}/ancrer`
            ),
            validToken({ role: "admin" })
        );

        expect(res.status).toBe(404);
    });

    it("renvoie 400 si la tache est deja ancree", async () => {
        const tache = await TacheCrowdsourcing.create({
            titre: "Deja ancree",
            lots: [{ description: "Lot 1", remunerationCalculee: 10 }],
            preuve: {
                hash: "0x" + "33".repeat(32),
                txHash: "0x" + "44".repeat(32),
                blockNumber: 456,
                statut: "ancre",
                typeEntite: "contribution",
            },
        });

        const res = await withCookie(
            request(app).post(`/api/taches-crowdsourcing/${tache._id}/ancrer`),
            validToken({ role: "admin" })
        );

        expect(res.status).toBe(400);
        expect(res.body.error).toContain("deja ancree");
    });

    it("renvoie 502 si l'appel blockchain echoue et persiste la preuve echec", async () => {
        const tache = await TacheCrowdsourcing.create({
            titre: "Ancrage faille",
            lots: [{ description: "Lot 1", remunerationCalculee: 10 }],
        });
        jest.spyOn(global, "fetch").mockRejectedValue(new Error("RPC unreachable"));

        const res = await withCookie(
            request(app).post(`/api/taches-crowdsourcing/${tache._id}/ancrer`),
            validToken({ role: "admin" })
        );

        expect(res.status).toBe(502);
        expect(res.body.error).toBe("Echec de l'ancrage blockchain.");

        const doc = await TacheCrowdsourcing.findById(tache._id);
        expect(doc.preuve.statut).toBe("echec");
    });
});
