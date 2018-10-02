/*
 * NB: since truffle-hdwallet-provider 0.0.5 you must wrap HDWallet providers in a
 * function when declaring them. Failure to do so will cause commands to hang. ex:
 * ```
 * mainnet: {
 *     provider: function() {
 *       return new HDWalletProvider(mnemonic, 'https://mainnet.infura.io/<infura-key>')
 *     },
 *     network_id: '1',
 *     gas: 4500000,
 *     gasPrice: 10000000000,
 *   },
 */




const INFURA_API_KEY= console.log("REPLACE ME WITH REAL KEY"); 

const HDWalletProvider = require('truffle-hdwallet-provider');

// todo: this is just fake mnemonic for testing
var MNENOMIC = console.log("REPLACE ME WITH REAL MNENOMIC");





module.exports = {
   solc: {
    optimizer: {
      enabled: true,
      runs: 200
    }
  },

  networks: {
    development: {
      host: "localhost",
      port: 9545,
      network_id: "*" // Match any network id
    },

    test: {
      host: "localhost",
      port: 9545,
      network_id: "*",
    },

    infuraRopsten: {
      provider: () => new HDWalletProvider(MNENOMIC, "https://ropsten.infura.io/v3/" + INFURA_API_KEY),
      network_id: 3,// Ethereum test network
      gas: 15e5,//CHECK GAS USED BY TESTRPC
      gasPrice: 50e9,//check gasPrice in etherscan
     }
  }

};
