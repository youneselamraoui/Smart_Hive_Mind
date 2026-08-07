/**
 * Integration tests pour le CRUD outil (routes /api/outils).
 *
 * - Lecture (GET liste + GET /:id) : publique.
 * - Ecriture (POST / PUT / DELETE) : admin uniquement.
 */

process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret-do-not-use-in-production";

const request = require("supertest");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const app = require("../src/app");
const Outil = require("../src/models/Outil");
let mongoServer;

function validToken(role = "etudiant", overrides = {}) {
    return jwt.sign(
        { id: new mongoose.Types.ObjectId().toHexString(), role, ...overrides },
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

describe("GET /api/outils", () => {
    it("retourne la liste des outils existants", async () => {
        await Outil.create([
            { nom: "Gemini", categorie: "ai", fonction: "Generation de texte", coutUsage: 0 },
            { nom: "SonarQube", categorie: "devsecops", fonction: "Analyse statique", coutUsage: 5 },
        ]);

        const res = await request(app).get("/api/outils");

        expect(res.status).toBe(200);
        expect(res.body).toHaveLength(2);
        const noms = res.body.map(o => o.nom);
        expect(noms).toContain("Gemini");
        expect(noms).toContain("SonarQube");
    });

    it("filtre par categorie et par fonction", async () => {
        await Outil.create([
            { nom: "Gemini", categorie: "ai", fonction: "Generation de texte" },
            { nom: "Nmap", categorie: "it", fonction: "Scan reseau" },
        ]);

        const parCategorie = await request(app).get("/api/outils?categorie=it");
        expect(parCategorie.status).toBe(200);
        expect(parCategorie.body).toHaveLength(1);
        expect(parCategorie.body[0].nom).toBe("Nmap");

        const parFonction = await request(app).get("/api/outils?fonction=generation");
        expect(parFonction.status).toBe(200);
        expect(parFonction.body).toHaveLength(1);
        expect(parFonction.body[0].nom).toBe("Gemini");
    });

    it("rejette un filtre categorie invalide", async () => {
        const res = await request(app).get("/api/outils?categorie=nawak");
        expect(res.status).toBe(400);
    });
});

describe("GET /api/outils/:id", () => {
    it("retourne un outil par id", async () => {
        const outil = await Outil.create({ nom: "Zap", categorie: "devsecops" });
        const res = await request(app).get(`/api/outils/${outil._id}`);
        expect(res.status).toBe(200);
        expect(res.body.nom).toBe("Zap");
    });

    it("retourne 404 si l outil n existe pas", async () => {
        const res = await request(app).get(`/api/outils/${new mongoose.Types.ObjectId()}`);
        expect(res.status).toBe(404);
    });

    it("retourne 400 si l id est invalide", async () => {
        const res = await request(app).get("/api/outils/abc");
        expect(res.status).toBe(400);
    });
});

describe("POST /api/outils", () => {
    it("un admin peut creer un outil", async () => {
        const res = await withCookie(
            request(app).post("/api/outils").send({
                nom: "Burp Suite",
                categorie: "devsecops",
                fonction: "Test d intrusion",
                coutUsage: 10,
            }),
            validToken("admin")
        );

        expect(res.status).toBe(201);
        expect(res.body.nom).toBe("Burp Suite");
        expect(res.body.categorie).toBe("devsecops");
        expect(res.body.coutUsage).toBe(10);

        const enBase = await Outil.findById(res.body._id);
        expect(enBase).not.toBeNull();
    });

    it("rejette la creation pour un membre non admin", async () => {
        const res = await withCookie(
            request(app).post("/api/outils").send({ nom: "Wireshark", categorie: "it" }),
            validToken("etudiant")
        );
        expect(res.status).toBe(403);
        expect(await Outil.countDocuments()).toBe(0);
    });

    it("rejette la creation sans authentification", async () => {
        const res = await request(app).post("/api/outils").send({ nom: "Wireshark", categorie: "it" });
        expect(res.status).toBe(401);
    });

    it("rejette une categorie invalide", async () => {
        const res = await withCookie(
            request(app).post("/api/outils").send({ nom: "X", categorie: "nawak" }),
            validToken("admin")
        );
        expect(res.status).toBe(400);
    });

    it("rejette un nom vide", async () => {
        const res = await withCookie(
            request(app).post("/api/outils").send({ nom: "", categorie: "ai" }),
            validToken("admin")
        );
        expect(res.status).toBe(400);
    });
});

describe("PUT /api/outils/:id", () => {
    it("un admin peut modifier un outil", async () => {
        const outil = await Outil.create({ nom: "Ancien nom", categorie: "it" });
        const res = await withCookie(
            request(app).put(`/api/outils/${outil._id}`).send({ nom: "Nouveau nom", coutUsage: 3 }),
            validToken("admin")
        );
        expect(res.status).toBe(200);
        expect(res.body.nom).toBe("Nouveau nom");
        expect(res.body.coutUsage).toBe(3);
    });

    it("refuse la modification pour un non admin", async () => {
        const outil = await Outil.create({ nom: "Ancien nom", categorie: "it" });
        const res = await withCookie(
            request(app).put(`/api/outils/${outil._id}`).send({ nom: "Hack" }),
            validToken("encadrant")
        );
        expect(res.status).toBe(403);
    });
});

describe("DELETE /api/outils/:id", () => {
    it("un admin peut supprimer un outil", async () => {
        const outil = await Outil.create({ nom: "A supprimer", categorie: "ai" });
        const res = await withCookie(
            request(app).delete(`/api/outils/${outil._id}`),
            validToken("admin")
        );
        expect(res.status).toBe(200);
        expect(await Outil.findById(outil._id)).toBeNull();
    });

    it("refuse la suppression pour un non admin", async () => {
        const outil = await Outil.create({ nom: "A garder", categorie: "ai" });
        const res = await withCookie(
            request(app).delete(`/api/outils/${outil._id}`),
            validToken("etudiant")
        );
        expect(res.status).toBe(403);
        expect(await Outil.findById(outil._id)).not.toBeNull();
    });
});
