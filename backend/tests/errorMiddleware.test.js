/**
 * Test du middleware d'erreur global (errorHandler).
 *
 * Verifie qu'une erreur non catchée renvoie une reponse JSON uniforme
 * au lieu de crasher le process.
 */

process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret-do-not-use-in-production";

const express = require("express");
const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const errorHandler = require("../src/middlewares/errorHandler");
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

describe("errorHandler (middleware d'erreur global)", () => {
    it("transforme une erreur synchrone non catchée en 500 JSON uniforme", async () => {
        const app = express();
        app.get("/crash", () => {
            throw new Error("boom");
        });
        app.use(errorHandler);

        const res = await request(app).get("/crash");

        expect(res.status).toBe(500);
        expect(res.body).toEqual({ error: "Erreur interne du serveur." });
    });

    it("transforme un rejet async non catché en 500 JSON uniforme", async () => {
        const app = express();
        app.get("/crash-async", async () => {
            throw new Error("boom async");
        });
        app.use(errorHandler);

        const res = await request(app).get("/crash-async");

        expect(res.status).toBe(500);
        expect(res.body).toEqual({ error: "Erreur interne du serveur." });
    });

    it("respecte un status explicite porte par l'erreur (ex. 400 JSON parse)", async () => {
        const app = express();
        app.use(express.json());
        app.post("/api/evenements", () => {
            throw new Error("jamais atteint");
        });
        app.use(errorHandler);

        const res = await request(app)
            .post("/api/evenements")
            .set("Content-Type", "application/json")
            .send("{pas du json");

        expect(res.status).toBe(400);
        expect(res.body).toEqual({ error: "Erreur interne du serveur." });
    });
});
