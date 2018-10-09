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
        },
        devbc: {
            network_id: "98052",
            from: "0x710576f743f73d5049cf2870eee806f18077cbd8",
            provider: function () {
                const WalletProvider = require("truffle-wallet-provider");
                const privateKeyString = "0x1c59a305fd7a43dd321a93cdd0fb0c9f78bf62523b6e4c72d0d409a006d26717";
                const privateKeyBuffer = require('ethereumjs-util').toBuffer(privateKeyString);
                const wallet = require('ethereumjs-wallet').fromPrivateKey(privateKeyBuffer);
                return new WalletProvider(wallet, "http://dev-bc-ethereum-geth-tx.default:8545")
            }
        }
    }
};
