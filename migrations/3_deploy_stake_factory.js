
var StakeFactory = artifacts.require("./ValorStakeFactory.sol");

module.exports = function(deployer,network,accounts) {
  //change the address with the actual token address
  deployer.deploy(StakeFactory, "0x914137d8e00f7ab330e38d441a854639769ec400");
};