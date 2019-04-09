const Timelock = artifacts.require("./ValorTimelock.sol");

module.exports = function(deployer,network,accounts) {
  //change the address with the actual VALOR token address
  console.log("network:"+network);
  if(network == "ropsten"){
  	const tokenAddr    = "0x17594DFC9902d6373142CC4331532e11c536431B";//address of VALOR token in ropsten
  	const beneficiary  = "0x83E4FC11FE451293dcaC6762215CF6237f087901";
  	const admin = "0x25100E346bfB990CBc82B5EF658d32360285b582";
  	const lockPeriod = 7 * 86400; //a week

  	//(this.token.address, beneficiary, admin, 365 * day);

  	deployer.deploy(Timelock, tokenAddr, beneficiary, admin, lockPeriod);
  }
  if(network == "mainnet"){
    const tokenAddr    = "0x297E4e5e59Ad72B1B0A2fd446929e76117be0E0a"; //address of VALOR token in mainnet
    const beneficiary  = "0xBedC09625d4233631Bca1Ee670B24E0651CfBe17"; //address under SV control 
    const admin = "0xF7C306cCb09E5cC2CCab10bCfc827ab0cF88FE36";//address of admin role, he can unlock with emergencyRelease
    const lockPeriod = 7 * 86400; //this timelock is a test on mainnet, it must be 180days

    //(this.token.address, beneficiary, admin, 365 * day);

    deployer.deploy(Timelock, tokenAddr, beneficiary, admin, lockPeriod);
  }  	
};