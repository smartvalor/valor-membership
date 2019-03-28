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


module.exports = {

    compilers: {
      solc: {
        version: "0.4.25", // A version or constraint - Ex. "^0.5.0"
          optimizer: {
            enabled: true,
            runs: 200   // Optimize for how many times you intend to run the code
          }          
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
        ropsten: {
            provider: function () {
                const HDWalletProvider = require('truffle-hdwallet-provider');
                const INFURA_KEY = "your key";
                const mnemonic = "your mnemonic";
                return new HDWalletProvider(mnemonic, 'https://ropsten.infura.io/v3/' + INFURA_KEY);
            },
            network_id: '3',
            gas: 4500000,
            gasPrice: 100e9,
        },
        coverage: {
            host: "127.0.0.1",
            network_id: "*",
            port: 8555,
            gas: 0xfffffffffff,
            gasPrice: 0x01
        }
    }
};
