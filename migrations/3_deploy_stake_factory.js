
const StakeFactory = artifacts.require("./ValorStakeFactory.sol");

module.exports = function(deployer,network,accounts) {
  //change the address with the actual VALOR token address
  console.log("network:"+network);
  if(network == "infuraRopsten")
  	deployer.deploy(StakeFactory, '0x6e748fe8f1f344ce557bfdbf29c085aa0dff73b9', accounts[0]);
};