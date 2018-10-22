pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";

/**
 * @title ValorTimelock
 * @dev ValorTimelock is a VALOR token holder contract that will allow a
 * beneficiary to extract the tokens after a given release time and includes an
 * emergency exit mechanism which can be activated by owner (Smart Valor) to immediately
 * recover funds towards beneficiary
 */
contract ValorTimelock{


    event EmergencyRelease(address from, address to, uint256 value);

    // ERC20 basic token contract being held
    ERC20 public token;

    // beneficiary of tokens after they are released
    address public beneficiary;

    // timestamp when token release is enabled
    uint256 public releaseTime;

    //admin address
    address public owner;

    /**
     * @dev the duration arg is the number of seconds the fund is locked since creation
     * @param _token the token managed by this contract
     * @param _beneficiary the address which will receive the locked funds at due time
     * @param _admin the account which can activate the emergency release
     * @param duration locking period in secs
     */
    constructor(ERC20 _token, address _beneficiary, address _admin, uint256 duration )
    public {
        token = _token;
        beneficiary = _beneficiary;
        releaseTime = block.timestamp + duration;//watchout, no safe math
        owner = _admin;
    }


    /**
    * @dev it releases all tokens held by this contract to beneficiary.
    */
    function release() external {
        uint256 balance = token.balanceOf(address(this));
        partialRelease(balance);
    }

    /**
    * @dev it releases some tokens held by this contract to beneficiary.
    * @param amount the number of tokens to be sent to beneficiary
    */
    function partialRelease(uint256 amount) public {
        //restrict this tx to the legit beneficiary only
        require(msg.sender == beneficiary);
        //check time is done
        require(block.timestamp >= releaseTime);

        uint256 balance = token.balanceOf(address(this));
        require(balance >= amount);
        require(amount > 0);

        token.transfer(beneficiary, amount);
    }


    /**
    * @dev it releases all tokens held by this contract to beneficiary. This
    * can be used by owner only and it works anytime
    */
    function emergencyRelease() external{
        require(msg.sender == owner);
        uint256 amount = token.balanceOf(address(this));
        require(amount > 0);
        token.transfer(beneficiary, amount);
        emit EmergencyRelease(msg.sender, beneficiary, amount);
    }

}
