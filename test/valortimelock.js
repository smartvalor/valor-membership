//not nice import, useful to have some helper functions available
//especially .shoud.be.rejected interface
//waiting for open-zeppelin helpers.js to remove babel dependencies
var util = require ("./util.js");
var BigNumber      = util.BigNumber;



const ValorToken = artifacts.require('./ValorTokenMockup.sol');
const ValorTimelock = artifacts.require("./ValorTimelock.sol");

const VALOR = 1e18;
const holdings = 10000 * VALOR;
const day = 86400;

contract('ValorTimelock', async ([companyWallet,someUser,anotherUser]) => {


  beforeEach(async () => {
     //lets build a VALOR token with all funds allocated to companyWallet
     this.token       = await ValorToken.new(companyWallet, companyWallet, companyWallet);

     this.deployTime  = await util.latestTime();

     //a timelock of 365d
     this.timelock    = await ValorTimelock.new(this.token.address, someUser, companyWallet, 365 * day);

     //put some tokens in the timelocked fund
     await this.token.transfer(this.timelock.address,holdings);

     this.releaseTime = await this.timelock.releaseTime.call();

  });

  it("check timelock is built with proper parameters", async () => {
     console.log("releaseTime "+this.releaseTime.toNumber());
     console.log("deployTime " +this.deployTime);
     console.log("hold period is");
     console.log((this.releaseTime.toNumber() - this.deployTime) + " seconds");
     console.log((this.releaseTime.toNumber() - this.deployTime)/86400 + " days");
     (await this.token.balanceOf(this.timelock.address)).should.be.bignumber.equal(holdings);
     (await this.timelock.beneficiary.call()).should.be.equal(someUser);
     (await this.timelock.owner.call()).should.be.equal(companyWallet);
  });


  it("after release time the tokens can be unlocked by beneficiary", async () => {
    await util.increaseTimeTo(this.releaseTime);
    await this.timelock.release.sendTransaction({from: someUser}).should.be.fulfilled;
    (await this.token.balanceOf(this.timelock.address)).should.be.bignumber.equal(0);
    (await this.token.balanceOf(someUser)).should.be.bignumber.equal(holdings);
  });


  it("company can release anytime (ie. in case of emergency, security exploit etc.) the stake", async () => {
    await this.timelock.emergencyRelease.sendTransaction({from: companyWallet}).should.be.fulfilled;
    (await this.token.balanceOf(this.timelock.address)).should.be.bignumber.equal(0);
    (await this.token.balanceOf(someUser)).should.be.bignumber.equal(holdings);
  });

 it("tokens cannot be released by anyone (except emergency pull by company) before releaseTime", async () => {
    await this.timelock.release.sendTransaction({from: someUser}).should.be.rejected;
    await this.timelock.release.sendTransaction({from: companyWallet}).should.be.rejected;
    await this.timelock.release.sendTransaction({from: anotherUser}).should.be.rejected;

  });


  it("after release time the legit user can pull a fraction of the funds", async () => {
    await util.increaseTimeTo(this.releaseTime);
    const reimbursement = 1000 * VALOR;
    await this.timelock.partialRelease.sendTransaction(reimbursement,{from: someUser}).should.be.fulfilled;
    (await this.token.balanceOf(this.timelock.address)).should.be.bignumber.equal(holdings - reimbursement);
    (await this.token.balanceOf(someUser)).should.be.bignumber.equal(reimbursement);    
  });

  it("after release time the legit user cannot pull more funds than available", async () => {
    await util.increaseTimeTo(this.releaseTime);
    const reimbursement = (new BigNumber(holdings)).add(1);
    console.log("reimbursement:"+reimbursement);
    await this.timelock.partialRelease.sendTransaction(reimbursement,{from: someUser}).should.be.rejected;   
  });


  it("after release time, ONLY the legit user can pull a fraction of the funds", async () => {
    await util.increaseTimeTo(this.releaseTime);
    const reimbursement = 100 * VALOR;
    await this.timelock.partialRelease.sendTransaction(reimbursement, {from: anotherUser}).should.be.rejected;
    await this.timelock.partialRelease.sendTransaction(reimbursement, {from:    someUser}).should.be.fulfilled;
  });

  it("after release time, the company can still release all of the funds", async () => {
    await util.increaseTimeTo(this.releaseTime);
    await this.timelock.emergencyRelease.sendTransaction({from: companyWallet}).should.be.fulfilled;
  });

});
