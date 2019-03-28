const Timelock = artifacts.require("./ValorTimelock.sol");

module.exports = function(deployer,network,accounts) {
  //change the address with the actual VALOR token address
  console.log("network:"+network);
  if(network == "ropsten"){
  	const tokenAddr    = "0x17594DFC9902d6373142CC4331532e11c536431B";
  	const beneficiary  = "0x83E4FC11FE451293dcaC6762215CF6237f087901";
  	const admin = "0x25100E346bfB990CBc82B5EF658d32360285b582";
  	const lockPeriod = 1800; //half an hour

  	//(this.token.address, beneficiary, admin, 365 * day);

  	deployer.deploy(Timelock, tokenAddr, beneficiary, admin, lockPeriod);
  }
  	
};