const Token = artifacts.require("./ValorTokenMockup.sol");

module.exports = function(deployer,network,accounts) {
  deployer.deploy(Token, accounts[0], accounts[0], accounts[0]);
};