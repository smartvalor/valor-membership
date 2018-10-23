pragma solidity ^0.4.25;

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
    uint32 public minLockPeriod;
    // minimum amount of tokens we request to create stake
    uint256 public minStake;

    //the token managed by this factory
    ERC20 public token;

    //dismissed == false during life of factory
    //once a factory is dismissed it cannot be resumed
    //a dismissed factory cannot create stakes
    bool public dismissed = false;

    //the next line keeps records of any stake created by this factory
    //indexed by beneficiary
    mapping (address => address[]) internal stakesCreated;

    //event to emit at each creation of a new timelock contract
    event StakeCreated(
        address indexed stake,
        address indexed beneficiary,
        uint256 lockPeriod,
        uint256 atStake
    );



    //event to emit if factory is dismissed
    event FactoryDismiss();

   /**
    * @dev it creates a new instance
    * @param _tokenAddress the address of token contract to be managed
    * @param _companyWallet the account who owns the factory
    */
    constructor(address _tokenAddress, address _companyWallet) public{
        require(_tokenAddress != address(0));
        require(_companyWallet != address(0));

        //we don't want the following happen
        require(_tokenAddress != _companyWallet);
        token = ERC20(_tokenAddress);
        owner = _companyWallet;

        // setting up minimum values
        minLockPeriod = 180 days; // around 6 months
        minStake = 250 * 1e18; // 250 ValorTokens
    }

   /**
    * @dev it creates a new timelock upon request
    * @param _lockPeriod the duration of timelock in secs
    * @param _atStake the amount of tokens to be held
    */
    function createStake(uint32 _lockPeriod, uint256 _atStake)
      whenNotPaused external{
        require(!dismissed);
        require(_lockPeriod <= 365 days && _lockPeriod >= minLockPeriod);
        require(_atStake >= minStake );

        ValorTimelock stake = new ValorTimelock(token, msg.sender, owner, _lockPeriod);
        require(token.transferFrom(msg.sender, address(stake), _atStake));
        stakesCreated[msg.sender].push(address(stake));
        emit StakeCreated(address(stake), msg.sender, _lockPeriod, _atStake);

    }

   /**
    * @dev transfers the current VALOR balance to the owner.
    * the factory is not supposed to receive/hold VALOR, however
    * in case of mistakenly sent tokens, the owner can pull these tokens and make it available
    * to external wallets.
    */
    function withdraw() external onlyOwner{
        uint256 balance = token.balanceOf(address(this));
        require(balance > 0);
        require(token.transfer(owner, balance));
    }

   /**
    * @dev dismiss the factory.
    */
    function dismiss()
      onlyOwner external {
        //this is non revocable state
        dismissed = true;
        emit FactoryDismiss();        
    }


   /**
    * @dev we allow the owner to set up new min value for Stake
    * @param _minStake the new min stake
    */
    function setMinStake(uint256 _minStake) onlyOwner external {
        minStake = _minStake;
    }

   /**
    * @dev we allow the owner to set up new min locking period
    * @param _minLockPeriod the new minLockPeriod
    */
    function setMinLockPeriod(uint32 _minLockPeriod) onlyOwner external {
        minLockPeriod = _minLockPeriod;
    }

   /**
    * @dev returns the num of stakes created per beneficiary
    * @param _beneficiary the account to get num of stake created by means of this factory
    */
    function countByBeneficiary(address _beneficiary) view external returns (uint256){
        return stakesCreated[_beneficiary].length;
    }


   /**
    * @dev returns stakes addresses created by _beneficiary
    * @param _beneficiary the account for which we lookup stake 
    * @param _index index to lookup stake address
    */
    function lookupByBeneficiary(address _beneficiary, uint256 _index) view external returns(address){
        return stakesCreated[_beneficiary][_index];
    }

}
