var Token = artifacts.require("./ValorTokenMockup.sol");
//var Hello = artifacts.require("./Hello.sol");

module.exports = function(deployer,network,accounts) {
  deployer.deploy(Token, accounts[0], accounts[0], accounts[0]);
};