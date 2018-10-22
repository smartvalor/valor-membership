pragma solidity ^0.4.24;

import "./ValorTimelock.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/lifecycle/Pausable.sol";
/**
 * @title ValorStakeFactory
 * @dev ValorStakeFactory creates ValorTimelock objects on demand
 * the ownership of factory is assigned to companyWallet and it can be
 * different from deployer msg.sender
 */
contract ValorStakeFactory is Ownable, Pausable{

    // minimum time lock period we request to create stake
    uint256 public minLockPeriod;
    // minimum amount of tokens we request to create stake
    uint256 public minAtStake;

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

        //we don't want the following happen
        require(_tokenAddress != companyWallet);
    	  token = ERC20(_tokenAddress);
        owner = companyWallet;

        // setting up minimum values
        minLockPeriod = 30 days * 6; // 6 months
        minAtStake = 250 * 1e18; // 250 ValorTokens

    }

    /**
    * @dev it creates a new timelock upon request
    * @param lockPeriod the duration of timelock in secs
    * @param atStake the amount of tokens to be held
    */
    function createStake(uint256 lockPeriod, uint256 atStake)
    public whenNotPaused {
        require(lockPeriod <= 365 days && lockPeriod >= minLockPeriod);
        require(atStake >= minAtStake );

        address beneficiary = msg.sender;
        ValorTimelock stake = new ValorTimelock(token, beneficiary, owner, lockPeriod);
        token.transferFrom(msg.sender, address(stake), atStake);
        emit StakeCreated(address(stake), msg.sender, lockPeriod, atStake);
    }


    /**
    * @dev transfers the current balance to the owner and terminates the factory.
    */
    function dismiss() onlyOwner public {
        selfdestruct(owner);
    }

    /**
    * @dev we allow the owner to set up new min values for LockPeriod and atStake.
    */
    function setMinCreateStakeValues(uint256 _minLockPeriod, uint256 _minAtStake)
      onlyOwner
      external {
        minLockPeriod = _minLockPeriod;
        minAtStake = _minAtStake;
      }

}
