
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
for (var contractName in output.contracts)
  console.log(contractName + ': ' + output.contracts[contractName].bytecode)



