pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/token/ERC20/TokenTimelock.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
 
/**
 * @title ValorTimelock
 * @dev ValorTimelock is a VALOR token holder contract that will allow a
 * beneficiary to extract the tokens after a given release time and includes an 
 * emergency exit mechanism which can be activated by owner (Smart Valor) to immediately
 * recover funds towards beneficiary
 */
contract ValorTimelock is TokenTimelock, Ownable{


    event EmergencyRelease(address from, address to, uint256 value);

    /**
     * @dev the duration arg is the number of seconds the fund is locked since creation
     */
    constructor(ERC20 _token, address _beneficiary, address _owner, uint256 duration )
    TokenTimelock(_token, _beneficiary, duration + block.timestamp)
    public {
        transferOwnership(_owner);
    }


    /**
    * @notice Transfers tokens held by timelock to beneficiary.
    */
    function release() public {
        //we override this to restrict to the legit beneficiary only
        require(msg.sender == beneficiary);
        super.release();
    }

    /**
    * @notice Transfers some tokens held by timelock to beneficiary.
    */
    function partialRelease(uint256 amount) public {
        //restrict this tx to the legit beneficiary only
        require(msg.sender == beneficiary);
        //check time is done
        require(block.timestamp >= releaseTime);
        
        uint256 balance = token.balanceOf(this);
        require(balance >= amount);

        require(amount > 0);

        token.safeTransfer(beneficiary, amount);
    }


    /**
     * @notice immediately Transfers tokens held by timelock to beneficiary
     * bypassing timelock
     */
    function emergencyRelease() onlyOwner public{
        uint256 amount = token.balanceOf(address(this));
        require(amount > 0);
        token.transfer(beneficiary, amount);
        emit EmergencyRelease(msg.sender, beneficiary, amount);
    }

}