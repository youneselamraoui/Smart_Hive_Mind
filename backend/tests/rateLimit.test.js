/**
 * Test du rate-limiting sur les routes sensibles d'authentification.
 *
 * AUTH_RATE_LIMIT_MAX est abaisse (5) avant le require de l'app pour
 * verifier rapidement le declenchement du 429 apres le seuil.
 */

process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret-do-not-use-in-production";
process.env.AUTH_RATE_LIMIT_MAX = "5";

const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const app = require("../src/app");
let mongoServer;

jest.setTimeout(30000);

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
    await mongoose.disconnect();
    if (mongoServer) await mongoServer.stop();
});

describe("Rate-limiting POST /api/auth/connexion", () => {
    it("renvoie 429 apres le seuil (brute force)", async () => {
        const payload = { email: "victime@test.local", motDePasse: "MotDePasse123!" };

        for (let i = 0; i < 5; i++) {
            const res = await request(app).post("/api/auth/connexion").send(payload);
            expect(res.status).not.toBe(429);
        }

        const res = await request(app).post("/api/auth/connexion").send(payload);
        expect(res.status).toBe(429);
        expect(res.body.error).toBe("Trop de requetes. Reessayez plus tard.");
    });
});
