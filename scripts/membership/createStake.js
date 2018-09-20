
//Simple example to show how to interact server side with the Stake Factory
//and to watch the StakeCreated events
//author: Davide Carboni
//copyright of Smart Valor AG 2018


//load web3js lib
var Web3 = require('web3');

//instantiate web3
web3 = new Web3();


console.log("ensure you're running a web3 V1.0.0 provider on port 9545");
//set a websocket protocol to watch events
const eventProvider = new Web3
                      .providers
                      .WebsocketProvider('ws://localhost:9545');


web3.setProvider(eventProvider)




//put your actual factory ABI here
var ABI= [
    {
      "constant": false,
      "inputs": [],
      "name": "renounceOwnership",
      "outputs": [],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "constant": true,
      "inputs": [],
      "name": "owner",
      "outputs": [
        {
          "name": "",
          "type": "address"
        }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    },
    {
      "constant": false,
      "inputs": [
        {
          "name": "_newOwner",
          "type": "address"
        }
      ],
      "name": "transferOwnership",
      "outputs": [],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "constant": true,
      "inputs": [],
      "name": "token",
      "outputs": [
        {
          "name": "",
          "type": "address"
        }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "name": "_tokenAddress",
          "type": "address"
        }
      ],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "constructor"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "name": "stake",
          "type": "address"
        },
        {
          "indexed": false,
          "name": "atStake",
          "type": "uint256"
        }
      ],
      "name": "StakeCreated",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "name": "previousOwner",
          "type": "address"
        }
      ],
      "name": "OwnershipRenounced",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "name": "previousOwner",
          "type": "address"
        },
        {
          "indexed": true,
          "name": "newOwner",
          "type": "address"
        }
      ],
      "name": "OwnershipTransferred",
      "type": "event"
    },
    {
      "constant": false,
      "inputs": [
        {
          "name": "lockPeriod",
          "type": "uint256"
        },
        {
          "name": "atStake",
          "type": "uint256"
        }
      ],
      "name": "createStake",
      "outputs": [],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "constant": false,
      "inputs": [
        {
          "name": "beneficiary",
          "type": "address"
        },
        {
          "name": "lockPeriod",
          "type": "uint256"
        },
        {
          "name": "atStake",
          "type": "uint256"
        }
      ],
      "name": "createStakeOnBehalf",
      "outputs": [],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
    }
  ]

//put a ERC20 ABI here
var ERC20=[
    {
      "constant": true,
      "inputs": [],
      "name": "totalSupply",
      "outputs": [
        {
          "name": "",
          "type": "uint256"
        }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    },
    {
      "constant": true,
      "inputs": [
        {
          "name": "who",
          "type": "address"
        }
      ],
      "name": "balanceOf",
      "outputs": [
        {
          "name": "",
          "type": "uint256"
        }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    },
    {
      "constant": false,
      "inputs": [
        {
          "name": "to",
          "type": "address"
        },
        {
          "name": "value",
          "type": "uint256"
        }
      ],
      "name": "transfer",
      "outputs": [
        {
          "name": "",
          "type": "bool"
        }
      ],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "name": "owner",
          "type": "address"
        },
        {
          "indexed": true,
          "name": "spender",
          "type": "address"
        },
        {
          "indexed": false,
          "name": "value",
          "type": "uint256"
        }
      ],
      "name": "Approval",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "name": "from",
          "type": "address"
        },
        {
          "indexed": true,
          "name": "to",
          "type": "address"
        },
        {
          "indexed": false,
          "name": "value",
          "type": "uint256"
        }
      ],
      "name": "Transfer",
      "type": "event"
    },
    {
      "constant": true,
      "inputs": [
        {
          "name": "owner",
          "type": "address"
        },
        {
          "name": "spender",
          "type": "address"
        }
      ],
      "name": "allowance",
      "outputs": [
        {
          "name": "",
          "type": "uint256"
        }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    },
    {
      "constant": false,
      "inputs": [
        {
          "name": "from",
          "type": "address"
        },
        {
          "name": "to",
          "type": "address"
        },
        {
          "name": "value",
          "type": "uint256"
        }
      ],
      "name": "transferFrom",
      "outputs": [
        {
          "name": "",
          "type": "bool"
        }
      ],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "constant": false,
      "inputs": [
        {
          "name": "spender",
          "type": "address"
        },
        {
          "name": "value",
          "type": "uint256"
        }
      ],
      "name": "approve",
      "outputs": [
        {
          "name": "",
          "type": "bool"
        }
      ],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
    }
  ]

//put actual factory address here
var factoryAddr="0x90cd8e3995f4cf3fc62e107013b20b39ee7c63f7";


async function main(){
	let accounts = await web3.eth.getAccounts();
	console.log(accounts);

	let company  = accounts[0];
	let beneficiary     = accounts[1];


	//retrieve factory
	let factory =  new web3.eth.Contract(ABI, factoryAddr);
	console.log("factory:"+factory.options.address);

	//retrieve token
	let tokenAddr = await factory.methods.token()
	.call();
	//console.log(tokenAddr);

	let token = new web3.eth.Contract(ERC20, tokenAddr);
	console.log("token:"+token.options.address);



	//make sure company has tokens 
	let balance = await token.methods.balanceOf(company)
	.call();
	console.log("balance of company account:"+balance);

	//company approves 1000 token units to factory 
	let rcpt = await token.methods.approve(factoryAddr, 1000)
	.send({from:company});


	//verify the allowance is granted
	let allowance = await token.methods.allowance(company, factoryAddr).call({from:company});
	console.log("allowance:"+allowance);	
	




    //watch StakeCreated events
    factory
    .events
    .StakeCreated({},
    			  function(err,evt){
    			  	//replace this code with actual event callback code
    			  	console.log("err:"+err);
    			  	console.log("event", evt);
    });


	//company create on behalf of beneficiary stake with 10d expire time of 1000 token units
	await factory.methods.createStakeOnBehalf(beneficiary, 86400 * 10, 1000)
	.send({from:company, gas: 500000});


}


main()