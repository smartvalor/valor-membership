
const {time} = require('openzeppelin-test-helpers');

const chai = require('chai');

const BN = web3.utils.BN;

const should = chai
  .use(require('chai-bn')(BN))
  .use(require('chai-as-promised'))
  .should();



const ValorToken = artifacts.require('./ValorTokenMockup.sol');
const ValorTimelock = artifacts.require("./ValorTimelock.sol");

const VALOR = (new BN(10)).pow(new BN(18)); //1 VALOR = 10^18
const holdings = new BN(10000).mul(VALOR); //holdings = 10 000 VALOR
const day = 86400;

contract('ValorTimelock', async ([admin,beneficiary,anotherUser]) => {


  beforeEach(async () => {
     //lets build a VALOR token with all funds allocated to admin
     this.token       = await ValorToken.new(admin, admin, admin);

     this.deployTime = await time.latest();
     //this.deployTime  = await util.latestTime();

     //a timelock of 365d
     this.timelock    = await ValorTimelock.new(this.token.address, beneficiary, admin, 365 * day);

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
     (await this.token.balanceOf.call(this.timelock.address)).should.be.bignumber.equal(holdings);
     (await this.timelock.releaseTime.call()).should.be.bignumber.closeTo(new BN(this.deployTime).add(new BN(365 * day)),new BN(10));
     (await this.timelock.beneficiary.call()).should.be.equal(beneficiary);
     (await this.timelock.owner.call()).should.be.equal(admin);
  });


  it("after release time the tokens can be unlocked by beneficiary", async () => {
    await time.increaseTo(this.releaseTime);
    (await this.token.balanceOf(beneficiary)).should.be.bignumber.equal(new BN(0));
    await this.timelock.release.sendTransaction({from: beneficiary}).should.be.fulfilled;
    (await this.token.balanceOf(this.timelock.address)).should.be.bignumber.equal(new BN(0));
    (await this.token.balanceOf(beneficiary)).should.be.bignumber.equal(holdings);
  });


  it("after release time the tokens can be unlocked by anyone but only beneficiary will receive them", async () => {
    await time.increaseTo(this.releaseTime);
    (await this.token.balanceOf(beneficiary)).should.be.bignumber.equal(new BN(0));
    await this.timelock.release.sendTransaction({from: anotherUser}).should.be.fulfilled;
    (await this.token.balanceOf(this.timelock.address)).should.be.bignumber.equal(new BN(0));
    (await this.token.balanceOf(beneficiary)).should.be.bignumber.equal(holdings);
  });



  it("admin can trigger emergencyrelease anytime, tokens go to beneficiary", async () => {
    (await time.latest()).should.be.bignumber.below(this.releaseTime);
    (await this.token.balanceOf(beneficiary)).should.be.bignumber.equal(new BN(0));
    await this.timelock.emergencyRelease.sendTransaction({from: admin}).should.be.fulfilled;
    (await this.token.balanceOf(this.timelock.address)).should.be.bignumber.equal(new BN(0));
    (await this.token.balanceOf(beneficiary)).should.be.bignumber.equal(holdings);
  });


  it("emergencyrelease fails if timelock is empty", async () => {
    (await time.latest()).should.be.bignumber.below(this.releaseTime);
    await this.timelock.emergencyRelease.sendTransaction({from: admin}).should.be.fulfilled;
    (await this.token.balanceOf(this.timelock.address)).should.be.bignumber.equal(new BN(0));
    // at this point timelock balance is zero.

    (await time.latest()).should.be.bignumber.below(this.releaseTime);
    await this.timelock.emergencyRelease.sendTransaction({from: admin}).should.be.rejected;


  });


  it("admin can trigger emergencyrelease multiple times if funds are refilled", async () => {
    (await time.latest()).should.be.bignumber.below(this.releaseTime);
    await this.timelock.emergencyRelease.sendTransaction({from: admin}).should.be.fulfilled;
    (await this.token.balanceOf(this.timelock.address)).should.be.bignumber.equal(new BN(0));
    (await this.token.balanceOf(beneficiary)).should.be.bignumber.equal(holdings);

    console.log("refilling ...");

    //put some tokens in the timelocked fund
    await this.token.transfer(this.timelock.address,holdings, {from: beneficiary});
    (await this.token.balanceOf(this.timelock.address)).should.be.bignumber.equal(holdings);

    console.log("re-emergency call ..."); 
    (await time.latest()).should.be.bignumber.below(this.releaseTime);
    await this.timelock.emergencyRelease.sendTransaction({from: admin}).should.be.fulfilled;
    (await this.token.balanceOf(this.timelock.address)).should.be.bignumber.equal(new BN(0));
    (await this.token.balanceOf(beneficiary)).should.be.bignumber.equal(holdings);

  });


 it("tokens cannot be released by anyone before releaseTime", async () => {
    (await time.latest()).should.be.bignumber.below(this.releaseTime);
    await this.timelock.release.sendTransaction({from: beneficiary}).should.be.rejected;
    await this.timelock.release.sendTransaction({from: admin}).should.be.rejected;
    await this.timelock.release.sendTransaction({from: anotherUser}).should.be.rejected;

  });

 it("partial release is forbidden before releaseTime", async () => {
    (await time.latest()).should.be.bignumber.below(this.releaseTime);
    await this.timelock.partialRelease.sendTransaction({from: beneficiary}).should.be.rejected;
    await this.timelock.partialRelease.sendTransaction({from: admin}).should.be.rejected;
    await this.timelock.partialRelease.sendTransaction({from: anotherUser}).should.be.rejected;

  });

  it("after release time the beneficiary can pull a fraction of the funds", async () => {
    await time.increaseTo(this.releaseTime);
    const reimbursement = new BN(1000).mul(VALOR);
    (await this.token.balanceOf(beneficiary)).should.be.bignumber.equal(new BN(0));
    await this.timelock.partialRelease.sendTransaction(reimbursement,{from: beneficiary}).should.be.fulfilled;
    (await this.token.balanceOf(this.timelock.address)).should.be.bignumber.equal(holdings.sub(reimbursement));
    (await this.token.balanceOf(beneficiary)).should.be.bignumber.equal(reimbursement);    
  });


  it("after release time the legit user cannot pull more funds than available", async () => {
    await time.increaseTo(this.releaseTime);
    const reimbursement = (holdings).add(new BN(1));
    console.log("reimbursement:"+reimbursement.toString());
    await this.timelock.partialRelease.sendTransaction(reimbursement,{from: beneficiary}).should.be.rejected;   
  });

  it("after release time the beneficiary can receive multiple partial releases", async () => {
    await time.increaseTo(this.releaseTime);
    const reimbursement = new BN(100).mul(VALOR);
    console.log("reimbursement:"+reimbursement.toString());

    await this.timelock.partialRelease.sendTransaction(reimbursement,{from: beneficiary}).should.be.fulfilled;
    (await this.token.balanceOf(this.timelock.address)).should.be.bignumber.equal(holdings.sub(reimbursement));
    (await this.token.balanceOf(beneficiary)).should.be.bignumber.equal(reimbursement);

    //increase time to 1 day later
    await time.increaseTo(this.releaseTime.add(new BN(86400)));

    await this.timelock.partialRelease.sendTransaction(reimbursement,{from: beneficiary}).should.be.fulfilled;
    (await this.token.balanceOf(this.timelock.address)).should.be.bignumber.equal(holdings.sub(reimbursement.mul(new BN(2))));
    (await this.token.balanceOf(beneficiary)).should.be.bignumber.equal(reimbursement.mul(new BN(2)));

  });

  it("after release time, anyone can trigger partialRelease(), the legit user will get a fraction of the funds", async () => {
    await time.increaseTo(this.releaseTime);
    const reimbursement = new BN(100).mul(VALOR);
    (await this.token.balanceOf(beneficiary)).should.be.bignumber.equal(new BN(0));
    await this.timelock.partialRelease.sendTransaction(reimbursement, {from: anotherUser}).should.be.fulfilled;
    (await this.token.balanceOf(beneficiary)).should.be.bignumber.equal(reimbursement);
    (await this.token.balanceOf(this.timelock.address)).should.be.bignumber.equal(holdings.sub(reimbursement));    
  });

  it("after release time, the admin can still use emergencyRelease to all of the funds", async () => {
    await time.increaseTo(this.releaseTime);
    (await this.token.balanceOf(beneficiary)).should.be.bignumber.equal(new BN(0));
    await this.timelock.emergencyRelease.sendTransaction({from: admin}).should.be.fulfilled;
    (await this.token.balanceOf(beneficiary)).should.be.bignumber.equal(holdings);
    (await this.token.balanceOf(this.timelock.address)).should.be.bignumber.equal(new BN(0));    

  });




});
