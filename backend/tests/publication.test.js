/**
 * Integration tests pour le flux publication.
 *
 * NOTE : Ce test mocke l appel blockchain (global.fetch) pour eviter de
 * consommer du vrai gas Sepolia a chaque run de CI. Le flux reel avec
 * ancrage on-chain est valide manuellement ou en staging contre le vrai
 * testnet Sepolia.
 */

process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret-do-not-use-in-production";

const request = require("supertest");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const app = require("../src/app");
const Publication = require("../src/models/Publication");
let mongoServer;

const VALID_PAYLOAD = {
    titre: "Impact de l IA sur le diagnostic medical",
    contenu: "Cette etude explore comment les reseaux de neurones transforment le diagnostic.",
    type: "these",
    auteur: new mongoose.Types.ObjectId().toHexString(),
};

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

describe("POST /api/publications", () => {
    it("cree la publication et ancre la preuve si l appel blockchain reussit", async () => {
        const txHash = "0x" + "ab".repeat(32);
        const blockNumber = 9876543;

        jest.spyOn(global, "fetch").mockResolvedValue({
            ok: true,
            json: async () => ({ txHash, blockNumber }),
        });

        const res = await withCookie(request(app)
            .post("/api/publications"), validToken())
            .send(VALID_PAYLOAD);

        expect(res.status).toBe(201);
        expect(res.body.publication.preuve.statut).toBe("ancre");
        expect(res.body.publication.preuve.txHash).toBe(txHash);
        expect(res.body.publication.preuve.blockNumber).toBe(blockNumber);
        expect(res.body.publication.hashContenu).toMatch(/^0x[a-f0-9]{64}$/);

        const doc = await Publication.findById(res.body.publication.id);
        expect(doc.preuve.statut).toBe("ancre");
    });

    it("rejette un titre vide avec 400 (validation Zod)", async () => {
        const res = await withCookie(request(app)
            .post("/api/publications"), validToken())
            .send({ ...VALID_PAYLOAD, titre: "" });

        expect(res.status).toBe(400);
        expect(res.body.error).toBe("Validation echouee.");
        expect(res.body.details.length).toBeGreaterThan(0);
    });

    it("renvoie 401 sans cookie JWT", async () => {
        const res = await request(app)
            .post("/api/publications")
            .send(VALID_PAYLOAD);

        expect(res.status).toBe(401);
        expect(res.body.error).toBe("Authentification requise.");
    });

    it("renvoie 502 si l appel blockchain echoue (RPC down)", async () => {
        jest.spyOn(global, "fetch").mockRejectedValue(new Error("RPC unreachable"));

        const res = await withCookie(request(app)
            .post("/api/publications"), validToken())
            .send(VALID_PAYLOAD);

        expect(res.status).toBe(502);
        expect(res.body.error).toBe("Echec de l'ancrage blockchain.");

        const doc = await Publication.findOne({ titre: VALID_PAYLOAD.titre });
        expect(doc.preuve.statut).toBe("echec");
    });

    it("renvoie 502 si le service blockchain repond avec une erreur (gas insuffisant)", async () => {
        jest.spyOn(global, "fetch").mockResolvedValue({
            ok: false,
            status: 422,
            json: async () => ({ error: "Transaction failed: insufficient funds." }),
        });

        const res = await withCookie(request(app)
            .post("/api/publications"), validToken())
            .send(VALID_PAYLOAD);

        expect(res.status).toBe(502);
        expect(res.body.detail).toContain("Transaction failed");
    });
});
