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
     await this.factory.dismiss.sendTransaction({from:anotherUser}).should.be.rejected;
 
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
     await this.factory.dismiss.sendTransaction({from:companyWallet}).should.be.fulfilled;

     //someUser preapproves 5000 VALOR allowance to factory
     await this.token.approve(this.factory.address, 5000 * VALOR, {from:someUser});
     //simulate a create stake from someUser
     await this.factory.createStake.sendTransaction( 1 * day, 
                                                     5000 * VALOR, 
                                                     {from: someUser}).should.be.rejected;

 
    });

   it("dismissed factory emits event", async () => {
    let event = this.factory.FactoryDismiss();
    let factoryAddress = this.factory.address;

    event.watch(function(err,evt){
        console.log(evt);
        console.log(evt["address"]);
        evt["address"].should.be.equal(factoryAddress);
        evt["event"].should.be.equal("FactoryDismiss");

    });    
     //console.log("test");
    await this.factory.dismiss.sendTransaction({from:companyWallet}).should.be.fulfilled;

    });


    it("factory is built with proper parameters", async () => {
     //console.log("test");
     (await this.factory.token.call()).should.be.equal(this.token.address);
     (await this.factory.owner.call()).should.be.equal(companyWallet);

    });


    it("change factory ownership from companyWallet to anotherUser", async () => {
        await this.factory.transferOwnership(anotherUser,{from:companyWallet}).should.be.fulfilled;
        (await this.factory.owner.call()).should.be.equal(anotherUser);

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


    it("countByBeneficiary() == 0 if user did not create stakes", async () => {
        let count = await this.factory.countByBeneficiary.call(someUser);
        console.log(count);
        count.toNumber().should.be.equal(0);
    });



    it("Alice creates one stake and later checks it", async () => {
        //someUser approves 5000 VALOR allowance to factory
        await this.token.approve(this.factory.address, 5000 * VALOR, {from:someUser});

        await this.factory.createStake.sendTransaction( 365 * day, 
                                                        5000 * VALOR, 
                                                        {from: someUser})
        .should.be.fulfilled;


        let stakeAddr = await this.factory.lookupByBeneficiary.call(someUser,0);

        let stake = await ValorTimelock.at(stakeAddr);

        (await stake.beneficiary.call()).should.be.equal(someUser);
        (await stake.releaseTime.call()).should.be.bignumber.equal(util.latestTime() + 365*day);

    });

    it("Alice and Bob create many stakes and later browse them", async () => {
        //give some fuels to anotherUser
        await this.token.transfer(anotherUser, 5000 * VALOR, {from:companyWallet});

        //someUser and anotherUser approve 5000 VALOR allowance to factory
        await this.token.approve(this.factory.address, 4500 * VALOR, {from:someUser});
        await this.token.approve(this.factory.address, 5000 * VALOR, {from:anotherUser});

        //burst of stakes created by some user
        await this.factory.createStake.sendTransaction( 365  * day, 
                                                        1500 * VALOR, 
                                                        {from: someUser})


        await this.factory.createStake.sendTransaction( 365  * day, 
                                                        1500 * VALOR, 
                                                        {from: someUser})



        await this.factory.createStake.sendTransaction( 365  * day, 
                                                        1500 * VALOR, 
                                                        {from: someUser})
       
        //burst of stakes created by another user
        await this.factory.createStake.sendTransaction( 180  * day, 
                                                        2500 * VALOR, 
                                                        {from: anotherUser})
        await this.factory.createStake.sendTransaction( 180  * day, 
                                                        2500 * VALOR, 
                                                        {from: anotherUser})


        //lets count how many stakes are created
        let numSomeUser = await this.factory.countByBeneficiary.call(someUser);
        //test
        numSomeUser.should.be.bignumber.equal(3);

        //iterate over stake records and verify
        for(i=0; i< numSomeUser; i++){
            let stakeAddr = await this.factory.lookupByBeneficiary.call(someUser,i);
            let stake = await ValorTimelock.at(stakeAddr);
            
            (await stake.beneficiary.call()).should.be.equal(someUser);
            (await stake.releaseTime.call()).toNumber().should.be.closeTo(util.latestTime() + 365*day, 60);
        }

        //same of above, but for anotherUser
        let numAnotherUser = await this.factory.countByBeneficiary.call(anotherUser);

        numAnotherUser.should.be.bignumber.equal(2);

        for(i=0; i< numAnotherUser; i++){
            let stakeAddr = await this.factory.lookupByBeneficiary.call(anotherUser,i);
            let stake = await ValorTimelock.at(stakeAddr);
            console.log(stakeAddr);
            (await stake.beneficiary.call()).should.be.equal(anotherUser);
            (await stake.releaseTime.call()).toNumber().should.be.closeTo(util.latestTime() + 180*day, 60);
        }


    });



    it("Once the user Alice preapproves tokens, user Charlie cannot create stake for Alice", async () => {
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


    it("A ETH account can be beneficiary of more stakes", async () => {
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