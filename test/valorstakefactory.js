// not nice import, useful to have some helper functions available
// especially .shoud.be.rejected interface
//waiting for open-zeppelin helpers.js to remove babel dependencies


var util = require ("./util.js");


var BigNumber      = util.BigNumber;

const day = 86400; 

const ValorTokenMockup = artifacts.require('./mocks/ValorTokenMockup.sol');
const ValorTimelock = artifacts.require("./ValorTimelock.sol");
const ValorStakeFactory = artifacts.require("./ValorStakeFactory.sol");

const VALOR = 1e18;
const holdings = 10000 * VALOR;


contract('ValorStakeFactory', async ([deployer,companyWallet,someUser,anotherUser]) => {


    beforeEach(async () => {
     //lets build a VALOR token with all funds allocated to companyWallet
     this.token       = await ValorTokenMockup.new(companyWallet, companyWallet, companyWallet);
     this.factory     = await ValorStakeFactory.new(this.token.address, companyWallet);

     //lets give some tokens to someUser
     await this.token.transfer.sendTransaction(someUser, 10000 *VALOR, {from: companyWallet});
    });

    it("factory is paused/resumed by companyWallet", async () => {
     //console.log("test");
     (await this.factory.paused.call()).should.be.equal(false);

     await this.factory.pause.sendTransaction({from:companyWallet}).should.be.fulfilled;
     (await this.factory.paused.call()).should.be.equal(true);
     await this.factory.pause.sendTransaction({from:companyWallet}).should.be.rejected;
     await this.factory.unpause.sendTransaction({from:companyWallet}).should.be.fulfilled;
     (await this.factory.paused.call()).should.be.equal(false);
    });

    it("factory cannot be paused or dismissed by other than companyWallet", async () => {
     //console.log("test");
     await this.factory.pause.sendTransaction({from:anotherUser}).should.be.rejected;
     await this.factory.destroy.sendTransaction({from:anotherUser}).should.be.rejected;
 
    });

    it("paused factory won't accept any create stake request", async () => {
     //console.log("test");
     await this.factory.pause.sendTransaction({from:companyWallet}).should.be.fulfilled;

     //someUser preapproves 5000 VALOR allowance to factory
     await this.token.approve(this.factory.address, 5000 * VALOR, {from:someUser});
     //simulate a create stake from someUser
     await this.factory.createStake.sendTransaction( 1 * day, 
                                                     5000 * VALOR, 
                                                     {from: someUser}).should.be.rejected;

 
    });

   it("dismissed factory won't accept any create stake request", async () => {
     //console.log("test");
     await this.factory.destroy.sendTransaction({from:companyWallet}).should.be.fulfilled;

     //someUser preapproves 5000 VALOR allowance to factory
     await this.token.approve(this.factory.address, 5000 * VALOR, {from:someUser});
     //simulate a create stake from someUser
     await this.factory.createStake.sendTransaction( 1 * day, 
                                                     5000 * VALOR, 
                                                     {from: someUser}).should.be.rejected;

 
    });

    it("factory is built with proper parameters", async () => {
     //console.log("test");
     (await this.factory.token.call()).should.be.equal(this.token.address);
     (await this.factory.owner.call()).should.be.equal(companyWallet);

    });


   it("nobody, except company, can create stake with beneficiary other than himself", async () => {
     //someUser preapproves 5000 VALOR allowance to factory
     await this.token.approve(this.factory.address, 5000 * VALOR, {from:someUser});
     //simulate a create stake from someUser
     await this.factory.createStakeOnBehalf.sendTransaction( anotherUser,
                                                             1 * day, 
                                                             5000 * VALOR, 
                                                             {from: someUser}).should.be.rejected;

 
    });


    it("change factory ownership from companyWallet to anotherUser", async () => {
        await this.factory.transferOwnership(anotherUser,{from:companyWallet}).should.be.fulfilled;
        (await this.factory.owner.call()).should.be.equal(anotherUser);

    });



    it("BD-57 Fix -- companyWallet manages funds on behalf of someUser and creates a stake for him", async () => {
     
     //someUser has tokens manged by company
     //NOTICE: it is company who is approving allowance to factory
     await this.token.approve(this.factory.address, 5000 * VALOR, {from:companyWallet});
         
     //company creates stake (eg. from platform) on behalf of someUser using
     //funds managed by company on behlaf of user
     await this.factory.createStakeOnBehalf.sendTransaction(
                                                    someUser,
                                                    1 * day, 
                                                    5000 * VALOR, 
                                                    {from: companyWallet})
     .should.be.fulfilled;

    });

    it("factory emits an event for each stake, ", async () => {

     //someUser approves 5000 VALOR allowance to factory
     await this.token.approve(this.factory.address, 5000 * VALOR, {from:someUser});
         
     let tx = await this.factory.createStake.sendTransaction(   1 * day, 
                                                                5000 * VALOR, 
                                                                {from: someUser});


     let deployTime  = await util.latestTime(); 

     let eventClass = this.factory.StakeCreated();
     
     var stakeAddr;
     var atStake;


    function watchEvent(evt){
        return new Promise(function(resolve,reject){
            evt.watch(function(err,res){
                resolve({stake: res.args.stake, 
                         atStake: res.args.atStake,
                         beneficiary: res.args.beneficiary,
                         lockPeriod: res.args.lockPeriod});
                evt.stopWatching();
            });
        });
    }

    var evt = await watchEvent(eventClass);

    

    let stake = await ValorTimelock.at(evt['stake']);

    let beneficiary = await stake.beneficiary.call();
    beneficiary.should.be.equal(someUser);
    evt.beneficiary.should.be.equal(beneficiary);

    let amountStaked = await this.token.balanceOf(stake.address);
    amountStaked.should.be.bignumber.equal(5000*VALOR);
    evt.atStake.should.be.bignumber.equal(amountStaked);

    let releaseTime = await stake.releaseTime.call();
    releaseTime.should.be.bignumber.equal(deployTime + 1*day);
    evt.lockPeriod.should.be.bignumber.equal(1*day);

    let owner = await stake.owner.call();
    owner.should.be.equal(companyWallet);


//console.log(beneficiary);

    });


    it("nobody can create a stake without preapproving tokens to factory", async () => {
        await this.factory.createStake.sendTransaction( 1 * day, 
                                                        5000 * VALOR, 
                                                        {from: someUser})
        .should.be.rejected;


        await this.factory.createStakeOnBehalf.sendTransaction( someUser,
                                                                1 * day, 
                                                                5000 * VALOR, 
                                                                {from: companyWallet})
        .should.be.rejected;

    });



    it("Bugfix BD-58: reject anotherUser to create a stake for someUser after the latter approves funds", async () => {
        //someUser approves 5000 VALOR allowance to factory
        await this.token.approve(this.factory.address, 5000 * VALOR, {from:someUser});

        //another user tries to create stake with arbitrary timelock
        await this.factory.createStake.sendTransaction(someUser,
                                                        100000 * day, 
                                                        5000 * VALOR, 
                                                        {from: anotherUser})
        .should.be.rejected;
    });



    it("cannot create a stake of N without preapproving N tokens to the stake factory", async () => {
        //someUser approves 5000 VALOR allowance to factory
        let N=5000;
        await this.token.approve(this.factory.address, (N-1) * VALOR, {from:someUser});
        await this.factory.createStake.sendTransaction( 1 * day, 
                                                        N * VALOR, 
                                                        {from:someUser})
        .should.be.rejected;
    });    


   it("no stake is created with more than 365 days of timelock", async () => {
        //someUser approves 5000 VALOR allowance to factory
        let N=5000;
        await this.token.approve(this.factory.address, N * VALOR, {from:someUser});
        await this.factory.createStake.sendTransaction( 366 * day, 
                                                        N * VALOR, 
                                                        {from:someUser})
        .should.be.rejected;
    });  


    it("an account someUser can have multiple different stakes", async () => {
        //someUser approves 5000 VALOR allowance to factory
        await this.token.approve(this.factory.address, 5000 * VALOR, {from:someUser});

        await this.factory.createStake.sendTransaction( 1 * day, 
                                                        2000 * VALOR, 
                                                        {from: someUser})
        .should.be.fulfilled;

        await this.factory.createStake.sendTransaction( 10 * day, 
                                                        3000 * VALOR, 
                                                        {from: someUser})
        .should.be.fulfilled;

    });


    it("measuring gas", async () => {
        //someUser approves 5000 VALOR allowance to factory
        console.log("approve");
        tx = await this.token.approve(this.factory.address, 5000 * VALOR, {from:someUser});
        console.log("gas used:"+tx.receipt.gasUsed);

        console.log("create stake");
        tx = await this.factory.createStake( 1 * day, 
                                             5000 * VALOR, 
                                             {from: someUser});

        console.log("gas used:"+tx.receipt.gasUsed);


        console.log("transfer tokens");
        tx=await this.token.transfer(someUser, 10000 *VALOR, {from: companyWallet});
        console.log("gas used:"+tx.receipt.gasUsed);


    });




});