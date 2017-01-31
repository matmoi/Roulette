contract('Roulette', function() {
  it("smart contract should be created with 1 ether", function() {
    var roulette = Roulette.deployed();

    var balance = web3.fromWei(web3.eth.getBalance(roulette.address), "ether").toNumber();
    assert.equal(balance.valueOf(), 10, `10 wasn't in the smart contract, but ${balance.valueOf()}`);
  });

  it("account 1 bets on even, check final balance adequatly depending on roulette score", function(done) {
    var roulette = Roulette.deployed();

    var balance = web3.fromWei(web3.eth.getBalance(web3.eth.accounts[1]), "ether").toNumber();

    //bet 1 wei on even from account 1
    roulette.betEven({ from: web3.eth.accounts[1], value: web3.toWei(1, "ether")})
    //roll the roulette
    .then(function() {
        roulette.launch();
    })
    //look for draw result and compare if new balance is greater or lesser than initial balance
    //(due to transaction fees, it won't be the exact number of ether we sent)
    .then(function() {
        var event = roulette.Finished(function(error, result) {
            var new_balance = web3.fromWei(web3.eth.getBalance(web3.eth.accounts[1]), "ether").toNumber();
            var number = result.args.number.toNumber();
            try {
                if (number > 0 && number % 2 == 0) {
                    //won
                    assert.isAbove(new_balance,balance,`Result: ${number} => it's a win`);
                } else {
                    //lost
                    assert.isBelow(new_balance,balance,`Result: ${number} => it's a lost`);
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
    });
  });
});