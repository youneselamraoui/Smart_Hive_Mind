const { expect } = require("chai");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { ethers } = require("hardhat");

describe("ProofRegistry", function () {
    async function deployFixture() {
        const [owner, addr1, addr2] = await ethers.getSigners();
        const ProofRegistry = await ethers.getContractFactory("ProofRegistry");
        const registry = await ProofRegistry.deploy();
        await registry.waitForDeployment();
        return { registry, owner, addr1, addr2 };
    }

    it("doit ancrer une nouvelle preuve et emettre l evenement ProofAnchored", async function () {
        const { registry, owner } = await loadFixture(deployFixture);
        const hash = ethers.keccak256(ethers.toUtf8Bytes("first-proof"));

        const tx = await registry.anchorProof(hash);
        const receipt = await tx.wait();
        const block = await ethers.provider.getBlock(receipt.blockNumber);

        await expect(tx)
            .to.emit(registry, "ProofAnchored")
            .withArgs(hash, owner.address, block.timestamp);
    });

    it("doit rejeter l ancrage d un hash deja existant", async function () {
        const { registry } = await loadFixture(deployFixture);
        const hash = ethers.keccak256(ethers.toUtf8Bytes("duplicate"));

        await registry.anchorProof(hash);
        await expect(registry.anchorProof(hash)).to.be.revertedWith("Proof already exists");
    });

    it("verifyProof doit renvoyer les bonnes infos pour une preuve existante", async function () {
        const { registry, owner } = await loadFixture(deployFixture);
        const hash = ethers.keccak256(ethers.toUtf8Bytes("existing-proof"));
        const tx = await registry.anchorProof(hash);
        const receipt = await tx.wait();
        const block = await ethers.provider.getBlock(receipt.blockNumber);

        const [submitter, timestamp, exists] = await registry.verifyProof(hash);

        expect(submitter).to.equal(owner.address);
        expect(timestamp).to.equal(block.timestamp);
        expect(exists).to.be.true;
    });

    it("verifyProof doit renvoyer exists=false pour un hash inconnu", async function () {
        const { registry } = await loadFixture(deployFixture);
        const hash = ethers.keccak256(ethers.toUtf8Bytes("unknown"));

        const [submitter, timestamp, exists] = await registry.verifyProof(hash);

        expect(submitter).to.equal(ethers.ZeroAddress);
        expect(timestamp).to.equal(0);
        expect(exists).to.be.false;
    });

    it("doit permettre a des adresses differentes d ancrer des hashs differents", async function () {
        const { registry, addr1, addr2 } = await loadFixture(deployFixture);
        const hash1 = ethers.keccak256(ethers.toUtf8Bytes("alice-proof"));
        const hash2 = ethers.keccak256(ethers.toUtf8Bytes("bob-proof"));

        const tx1 = await registry.connect(addr1).anchorProof(hash1);
        const receipt1 = await tx1.wait();
        const block1 = await ethers.provider.getBlock(receipt1.blockNumber);

        await expect(tx1)
            .to.emit(registry, "ProofAnchored")
            .withArgs(hash1, addr1.address, block1.timestamp);

        const tx2 = await registry.connect(addr2).anchorProof(hash2);
        const receipt2 = await tx2.wait();
        const block2 = await ethers.provider.getBlock(receipt2.blockNumber);

        await expect(tx2)
            .to.emit(registry, "ProofAnchored")
            .withArgs(hash2, addr2.address, block2.timestamp);

        const [s1, , e1] = await registry.verifyProof(hash1);
        expect(s1).to.equal(addr1.address);
        expect(e1).to.be.true;

        const [s2, , e2] = await registry.verifyProof(hash2);
        expect(s2).to.equal(addr2.address);
        expect(e2).to.be.true;
    });
});
