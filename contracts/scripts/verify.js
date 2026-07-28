const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    const networkName = hre.network.name;
    const deployedPath = path.resolve(__dirname, "..", "deployed-address.json");

    if (!fs.existsSync(deployedPath)) {
        throw new Error(`deployed-address.json not found. Deploy first.`);
    }

    const data = JSON.parse(fs.readFileSync(deployedPath, "utf8"));
    const address = data[networkName];

    if (!address) {
        throw new Error(`No address found for network "${networkName}" in deployed-address.json`);
    }

    console.log(`Verifying ProofRegistry at ${address} on ${networkName}...`);

    await hre.run("verify:verify", {
        address,
        constructorArguments: [],
    });

    console.log("Verification complete.");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
