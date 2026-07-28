const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    const networkName = hre.network.name;

    const factory = await hre.ethers.getContractFactory("ProofRegistry");
    const contract = await factory.deploy();
    await contract.waitForDeployment();

    const address = await contract.getAddress();
    console.log(`ProofRegistry deployed to ${address} on ${networkName}`);

    const deployedPath = path.resolve(__dirname, "..", "deployed-address.json");
    const data = {};
    if (fs.existsSync(deployedPath)) {
        Object.assign(data, JSON.parse(fs.readFileSync(deployedPath, "utf8")));
    }
    data[networkName] = address;
    fs.writeFileSync(deployedPath, JSON.stringify(data, null, 4) + "\n");
    console.log(`Address written to ${deployedPath}`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
