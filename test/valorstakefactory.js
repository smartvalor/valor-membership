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

    it("check factory is built with proper parameters", async () => {
     //console.log("test");
     (await this.factory.token.call()).should.be.equal(this.token.address);
     (await this.factory.owner.call()).should.be.equal(companyWallet);

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

    it("someUser creates a stake for himself", async () => {

     //someUser approves 5000 VALOR allowance to factory
     await this.token.approve(this.factory.address, 5000 * VALOR, {from:someUser});
         
     //company creates stake (eg. from platform) on behalf of someUser
     let tx = await this.factory.createStake.sendTransaction(   1 * day, 
                                                                5000 * VALOR, 
                                                                {from: someUser});


     let deployTime  = await util.latestTime(); 

     let event = this.factory.StakeCreated();
     
     var stakeAddr;
     var atStake;


    function watchEvent(evt){
        return new Promise(function(resolve,reject){
            evt.watch(function(err,res){
                resolve({stake: res.args["stake"], 
                         atStake: res.args["atStake"]});
                evt.stopWatching();
            });
        });
    }

    var args = await watchEvent(event);

    

    let stake = await ValorTimelock.at(args['stake']);

    let beneficiary = await stake.beneficiary.call();
    beneficiary.should.be.equal(someUser);

    let amountStaked = await this.token.balanceOf(stake.address);
    amountStaked.should.be.bignumber.equal(5000*VALOR);

    let releaseTime = await stake.releaseTime.call();
    releaseTime.should.be.bignumber.equal(deployTime + 1*day);

    let owner = await stake.owner.call();
    owner.should.be.equal(companyWallet);


//console.log(beneficiary);

    });


    it("nobody can create a stake without tokens at stake", async () => {
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



    it("if tokens are insufficient the stake is not created", async () => {
        //someUser approves 5000 VALOR allowance to factory
        await this.token.approve(this.factory.address, 4999 * VALOR, {from:someUser});
        await this.factory.createStake.sendTransaction( 1 * day, 
                                                        5000 * VALOR, 
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







});