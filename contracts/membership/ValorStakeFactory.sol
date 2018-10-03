pragma solidity ^0.4.24;

import "./ValorTimelock.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/lifecycle/Pausable.sol";
import "openzeppelin-solidity/contracts/lifecycle/Destructible.sol";
/**
 * @title ValorStakeFactory
 * @dev ValorStakeFactory creates ValorTimelock objects on demand
 * the ownership of factory is assigned to companyWallet and it can be 
 * different from deployer msg.sender
 */
contract ValorStakeFactory is Ownable, Pausable, Destructible{

    //the token managed by this factory
    ERC20 public token;

    //event to emit at each creation of a new timelock contract
    event StakeCreated(address stake, 
                       address beneficiary,
                       uint256 lockPeriod, 
                       uint256 atStake); 


    /**
    * @dev it creates a new instance
    * @param _tokenAddress the address of token contract to be managed 
    * @param companyWallet the account who owns the factory
    */
    constructor(address _tokenAddress, address companyWallet) public{
        require(_tokenAddress != address(0));
        require(companyWallet != address(0));
    	token = ERC20(_tokenAddress);
        owner = companyWallet;
    }

    /**
    * @dev it creates a new timelock upon request
    * @param lockPeriod the duration of timelock in secs
    * @param atStake the amount of tokens to be held
    */
    function createStake(uint256 lockPeriod, uint256 atStake) 
    public whenNotPaused {
        require(lockPeriod <= 365 * 86400);//being 1 day = 86400s
        ValorTimelock stake = new ValorTimelock(token, msg.sender, owner, lockPeriod);
        token.transferFrom(msg.sender, address(stake), atStake);
        emit StakeCreated(address(stake), msg.sender, lockPeriod, atStake);
    }

}