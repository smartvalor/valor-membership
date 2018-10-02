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

    ERC20 public token;

    event StakeCreated(address stake, 
                       address beneficiary,
                       uint256 lockPeriod, 
                       uint256 atStake); 


    constructor(address _tokenAddress, address companyWallet) public{
        require(_tokenAddress != address(0));
        require(companyWallet != address(0));
    	token = ERC20(_tokenAddress);
        owner = companyWallet;
    }

    function _createStake(address beneficiary, uint256 lockPeriod, uint256 atStake) 
    internal{
        require(lockPeriod <= 365 * 86400);//being 1 day = 86400s
        ValorTimelock stake = new ValorTimelock(token, beneficiary, owner, lockPeriod);
        token.transferFrom(msg.sender, address(stake), atStake);
        emit StakeCreated(address(stake), beneficiary, lockPeriod, atStake);
    }


    //creates a stake and tries to transfer the required amount atStake
    //if transferFrom fails the transaction fails and gas is burnt
    function createStake(uint256 lockPeriod, uint256 atStake) 
    public whenNotPaused {
        _createStake(msg.sender, lockPeriod, atStake);
    }

    //creates a stake and tries to transfer from another fund the required amount atStake
    //if transferFrom fails the transaction fails and gas is burnt
    function createStakeOnBehalf(address beneficiary, uint256 lockPeriod, uint256 atStake) 
    public onlyOwner {        
        _createStake(beneficiary, lockPeriod, atStake);
    }


}