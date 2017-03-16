var Roulette = artifacts.require("Roulette.sol");

contract('Roulette', function() {
  it("smart contract should be created with 1000 ethers", function() {
    Roulette.deployed().then(function(roulette) {
        var balance = web3.fromWei(web3.eth.getBalance(roulette.address), "ether").toNumber();
        assert.equal(balance.valueOf(), 1000, `Smart contract is credited with ${balance.valueOf()}, expected 1000.`);
    });
  });

  it("create a single bet, wait for NewSingleBet event", function(done) {
    this.timeout(10000);
    Roulette.deployed().then(function(roulette) {
        var event = roulette.NewSingleBet(function(error, result) {
            if (error) {
                done(error);
            } else {
                done();
            }
            event.stopWatching();
        });
        roulette.betSingle(12,{from: web3.eth.accounts[0], value: web3.toWei(1, "ether")});
    });
  });


  it("account 1 bets on even, check final balance adequatly depending on roulette score", function(done) {
    Roulette.deployed().then(function(roulette) {

        var balance = web3.fromWei(web3.eth.getBalance(web3.eth.accounts[1]), "ether").toNumber();

        //even before betting and spinning the roulette, watch Finished events to check account[1]'s balance based on roulette result
        var event = roulette.Finished(function(error, result) {
            if (error) {
                done(error);
            }
            var new_balance = web3.fromWei(web3.eth.getBalance(web3.eth.accounts[1]), "ether").toNumber();
            var number = result.args.number.toNumber();
            try {
                if (number > 0 && number % 2 == 0) {
                    //won
                    assert.isAbove(new_balance,balance,`Result: ${number} => it's a win`);
                } else {
                    //lost
                    assert.isBelow(new_balance,balance,`Result: ${number} => it's a loss`);
                }
                done();
            }
            catch(e) {
                done(e);
            }
            finally {
                event.stopWatching();
            }
        });
        //bet 1 wei on even from account 1
        roulette.betEven({ from: web3.eth.accounts[1], value: web3.toWei(1, "ether")})
        //launch roulette
        .then(function() {
            roulette.launch();
        });
    });
  });
});