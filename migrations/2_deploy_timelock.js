const Timelock = artifacts.require("./ValorTimelock.sol");

module.exports = function(deployer,network,accounts) {
  //change the address with the actual VALOR token address
  console.log("network:"+network);
  if(network == "ropsten"){
  	const tokenAddr    = "0x6e748fe8f1f344ce557bfdbf29c085aa0dff73b9";
  	const beneficiary  = "";
  	const admin = "";
  	const lockPeriod = 1800; //half an hour

  	//(this.token.address, beneficiary, admin, 365 * day);

  	deployer.deploy(Timelock, tokenAddr, beneficiary, admin, lockPeriod);
  }
  	
};