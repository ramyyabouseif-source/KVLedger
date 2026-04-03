require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      },
      viaIR: true
    }
  },
  networks: {
    hardhat: {
      chainId: 1337,
    },
    // Used with `npx hardhat node` — matches frontend NETWORK_CONFIG localhost (chainId 31337)
    localhost: {
      url: "http://127.0.0.1:8545",
    },
  },
};