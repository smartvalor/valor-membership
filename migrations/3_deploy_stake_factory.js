
const StakeFactory = artifacts.require("./ValorStakeFactory.sol");

module.exports = function(deployer,network,accounts) {
  //change the address with the actual VALOR token address
  deployer.deploy(StakeFactory, '0x4afe95019efd81239d0e5307493efb9ee67ded3b');
};