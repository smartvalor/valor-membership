
//Simple example to show how deploy a ValorTimelock from pure js code


const path = require('path');
const fs = require('fs');
const solc = require('solc');

console.log("starting...")

const sourcePath = path.resolve("../..", 'contracts', 'membership');
const importPath = path.resolve("../../","node_modules");

console.log("sourcePath:"+sourcePath);
console.log("importPath:"+importPath);
//const source = fs.readFileSync(timelockPath, 'UTF-8');

//console.log("source:"+source);

var input = {
  'ValorTimelock.sol': fs.readFileSync(sourcePath+"/ValorTimelock.sol", 'UTF-8')
}

function findImports (path) {

  console.log("lookup of ..."+path);
  if (path.startsWith('openzeppelin-solidity'))
    path = importPath + "/" + path;
  else 
    path = sourcePath + "/" + path;
    
  console.log("finalizedPath:" + path);
  return {'contents':fs.readFileSync(path, 'UTF-8')}
}
    
  

var output = solc.compile({ sources: input }, 1, findImports)
//for (var contractName in output.contracts)
//  console.log(contractName + ': ' + output.contracts[contractName].bytecode)


var artifact = output.contracts['ValorTimelock.sol:ValorTimelock'];
for(i in artifact) console.log("artifact:"+i);

var bytecode = artifact.bytecode;
console.log("bytecode:"+bytecode);

var abi = artifact.interface;
console.log("abi:"+abi)



console.log("deployment ...")

const Web3 = require('web3');

const HDWalletProvider=require('truffle-hdwallet-provider');
const INFURA_KEY=process.env.INFURA_KEY;
const mnemonic  = process.env.mnemonic;
const provider = new HDWalletProvider(mnemonic, 'https://kovan.infura.io/v3/'+INFURA_KEY);
const web3 = new Web3(provider);

(async () => {
  const deployer = '0x25100E346bfB990CBc82B5EF658d32360285b582';

  console.log(`Attempting to deploy from account: ${deployer}`);

  const contract = await new web3.eth.Contract(JSON.parse(abi));

  let tx = await  contract.deploy({
      data: '0x' + bytecode,
      arguments: ['0xbcb3ec9da276a445bfa7586dc895304119858cd6', 
                  '0x25100E346bfB990CBc82B5EF658d32360285b582',
                  '0x25100E346bfB990CBc82B5EF658d32360285b582',
                  300]
    });

  await tx.send({
      from: deployer,
      gas: '2000000'
  }).then(instance => {console.log("instance:"+instance.options.address)});



  provider.engine.stop();
})();
