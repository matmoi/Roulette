# Roulette

In the process of learning more about blockchain and dedicated tools, especially around Ethereum as it got lot of attractions lately, I started to look for tutorials online. One of the most accessible I found is presented [here](https://www.ethereum-france.com/ecrire-une-dapp-pour-ethereum-1-smart-contract/) (in french). Unfortunately the project itself is slightly outdated and needed a bit of refreshing to compile and run on most recent solidity (0.4.+) and truffle (3.+) versions. Once the code was compatible with the up-to-date tools, it naturally occured that few additional features would be great to implement, or this could be done otherwise, and without knowing it I simply became addicted to Ethereum. After spending few evenings on this code base, and sincerely having a lot of fun exploring this entirely paradigm, I reviewed enough of the basics to cover pretty much all the parts needed in building a decentralized application. At this point it makes sense to share a bit of my mind path, and what I learnt implementing this solution. Keep in mind that this project is far from meeting the requirements for being deployed in prodution, for both quality reasons and security concerns, that's why we'll be using a local environment only and stay away from the "real" blockchain.

This project proposes a smart contract for a simplified version of a roulette casino game: a player can bet on a single number,and win 35 times his stake in case of success, or whether the number is odd or even, and win twice his stake.

## Prerequisite

1. [nodejs](https://nodejs.org/en/download/) to install the following packages and run our web frontend
2. [testrpc](https://github.com/ethereumjs/testrpc) is an ethereum client for testing which simulate a local blockchain
3. [truffle](https://github.com/ConsenSys/truffle) is a development framework to build and deploy dApp easily

> On Windows 10+, I quickly realiszed that it's actually quite more convenient to install those dependencies in the [Ubuntu Bash Shell](https://msdn.microsoft.com/en-us/commandline/wsl/about), avoiding all the windows-related struggle in particular for [testrpc](https://github.com/ethereumjs/testrpc/wiki/Installing-TestRPC-on-Windows). It won't prevent you from using the polished IDEs and tools you like on Windows (atom/vscode/sublime...), but commands for building and testing your dApp would have to run under bash.

For Debian/Ubuntu distributions, once npm is installed, simply use the following command to install testrpc and truffle
```
sudo npm run preinstall
```

## Smart contract

If you're not acquainted with smart contracts yet, I recommend to first read the [official documentation](http://solidity.readthedocs.io/en/develop/introduction-to-smart-contracts.html).
Our smart contract `Roulette.sol` is located under `contracts`, following truffle recommendations for [project structure](http://truffleframework.com/docs/getting_started/project).

We propose a smart contract that contains the game logic, it's located under `contracts/Roulette.sol`. Its attributes define the internal state :
1. `_owner` is the smart contract creator. Useful to restrict some actions to the creator only (such as destruct, launch roulette etc.)
2. `nextRoundTimestamp` and `_interval` are used to force a minimal amount of time for bidding. In Ethereum there is no timer such as `setTimeout()` in Javascript. For this reason, we must assume that any player can launch the roulette at any time, the only possible constraint is to provide enough time between two runs for the eventual players to bet.
3. `bets` is the current collection of bets visible by all, such as in real-life. A bet has a type (Single, Odd, Even), a reference to the player who made it, an amount (in Ether) and a number (necessary for Single bet type only).

We also implement accessors for the public attributes, `getNextRoundTimestamp()` and `getBetsCountAndValue()`. `getBetsCountAndValue()` returns the number of bets and the total amount of Ether bid on the table.

The constructor is defined as :
```
function Roulette(uint interval) payable {
	    _interval = interval;
	    _owner = msg.sender;
	    nextRoundTimestamp = now + _interval;
    }
```

- `payable` means that the call to this constructor must contain some Ether, it will be used as the initial found for the bank.
- `now` is a Solidity variable representing the current block timestamp.

There are 3 different methods to bet : `betSingle(uint number)`, `betEven()` and `betOdd()`. The first one is to bet on a single number and potentially win 35 times your stake, the two following come out of the number being even or odd (0 excluded) and allow you to win twice your stake in case of success. Those methods have three [modifiers](http://solidity.readthedocs.io/en/develop/contracts.html#modifiers), a modifier is similar to a decorator in python: it allows you to easily modify the behavior of a function. The first modifier, `payable`, is a Solidity feature that allows your function to receive Ethers when it's called. The two others are defined firther away in `Roulette.sol`: `transactionMustContainEther()` makes sure bet contains some Ether, `bankMustBeAbleToPayForBetType()` verify if the bank has enough fund to satisfy all the bets. In case of failure, both modifiers throw an exception such as the bet is rejected.

Last function,`launch()`, allows players to spin the roulette as soon as the minimal interval of time is obeyed (defined by `_interval`, in second). As explaine above, in Solidity there is no possible way to perform actions at regular intervals, a transaction has to be processed in a limited amount of time. The idea here is give the power to players to decide whenever they want to trigger a new run.
Secondly, Solidity doesn't allow the generation of pseudo-random numbers as the blockchain must return the exact same result regardless of which node executes the transaction. To simulate a random int number between [0,36], we are actually using the hash of the last block :

``` uint(block.blockhash(block.number - 1)) % 37 ```

Keep in mind that it is in theory possible to manipulate the outcome result, even though it's complicated and expensive. To make our roulette more robust we could also use the hash of the previous `n` blocks.

> Note on `Migrations.sol`
> Truffle provides by default a smart contract named `Migrations.sol` when using the `truffle init` command, but it is not a mandatory feature. It aims to record all the previous migrations directly in the blockchain. More details [here](https://truffle.readthedocs.io/en/latest/getting_started/migrations/).

## Compilation

Ethereum smart contracts written in Solidity must be compiled into bytecode in order to be used in the blockchain. This can be done easily with Truffle by typing

```truffle compile```

or using the command `npm run compile` defined in `package.json`, which is simply an alias.
Compilation will generate an artifact per sol files under `./build/contracts`. In our case it's gonna be `Migrations.json` and `Roulette.json`, which contain the signature API used to trigger transactions from Javascript (for example) using [web3](https://github.com/ethereum/web3.js).

## Deployment in a test environment

Now it's time to deploy all that stuff gnerated above in the blockchain. For the purpose of testing, we are going to use testrpc to locally simulate a node client connected to the Ethereum network. Doing such has the big advantage of not consuming "real" gas. In Ethereum transactions have a cost (expressed in "gas"). The initiator of a transaction must propose a gas price, to which the miner can or not accept. This fundamental mechanism is described in [the doc](http://ethdocs.org/en/latest/contracts-and-transactions/account-types-gas-and-transactions.html#what-is-gas).

First, run testrpc using the command

```
npm run testrpc
```

Again, it's simply a alias for the underlying command defined in `package.json`:

```
testrpc --account="0x40e16bbfe219ecaa733169b9192604338d0c55d48a3c90dae45badaede6822ff,10000000000000000000000" --account="0xf5d09e61086d537581377e29c93edcf19de73b42230c7b9fe390e4dd560ffc0a,10000000000000000000000"
```

which explicitly run testrpc with two accounts, credited with 1000 Ethers each.

Once testrpc is up and running, Truffle facilitates the deployment of smart contracts in a convenient way. The command would be :

```
npm run migrate
```

or alternatively `truffle migrate`. Truffle uses files located under `./migrations` to proceed. As the order matters here, each file is prefixed by a number. In `2_deploy_contracts.js`, we can observe how a new Roulette is created :

```
deployer.deploy(Roulette,0,{from: web3.eth.accounts[0], value: web3.toWei(1000, "ether")});
```

The `_interval` parameter sent to the constructor is set to 0. It basically means that players don't necessarly have to wait between two runs (it's purely to make our automated tests easier). We also specify the address of the sending account and the value transfered to the smart contract in Wei. In this example, account 0 creates a Roulette smart contract with 1000 Ethers (why not ? so far it's just fake Ether... But be careful if you want to deploy this smart contract in the "real" Ethereum blockchain), which will be the initial bank fund to pay back potential winners.

## Testing

Truffle provides a tool for testing our smart contracts (do we need to repeat how magnificent is Truffle at this point ?). The command `truffle test` will execute all the tests available under `./test`. Those tests are written in pure javascript and based
 on [mochajs](http://mochajs.org/) framework, with slight upgrades explained in [here](http://truffleframework.com/docs/getting_started/javascript-tests) to make your life easier.

As an example we wrote three tests in `roulette.js`, each one of them is identified by the `it(...)` control structure. First instruction in test blocks looking like `var roulette = Roulette.deployed();` allows us to retrieve an instance of the smart contract previously deployed in our node (see section above).

The first test is fairly simple, we make sure that our smart contract is credited with 1000 Ethers as explicitly described in `2_deploy_contracts.js`. For that, we retrieve the current balance of our smart contract :

```
var balance = web3.fromWei(web3.eth.getBalance(roulette.address), "ether").toNumber();
```

and makes sure it equals 1000 :

```
assert.equal(balance.valueOf(), 1000, `Smart contract is credited with ${balance.valueOf()} Ether, expected 1000.`);
```

Second test covers Solidity [events](http://solidity.readthedocs.io/en/develop/contracts.html#events). An event is a callback function allowing our application to be aware of predefined actions triggered from a smart contract. In our case, we use events to notify all the observers when a participant puts a bet. Just like in real life, anyone around the table has the possibility to know who bets what.
Because we wait for an event that might never happen, it's safe to set a timeout for this test. That's done by using the timeout option, 10 seconds should be enough :

```
this.timeout(10000);
```

We also have to inform mochajs that this test is asynchronous by using a callback function named `done` as a parameter in the test declaration. That way, it will wait for `done(...)` to be called or raise a timeout after 10 seconds. An optional parameter can be passed to the callback function, which basically indicate that the test failed.
First thing we need to do in our test is define an observer on `NewSingleBet` events (refers to `Roulette.sol`), such as :

```
var event = roulette.NewSingleBet(function(error, result) {
	if (error) {
		done(error);
	} else {
		done();
	}
	event.stopWatching();
});
```

Event produces a result and potentially an error. The result contains the parameters indicated in the event prototype, aka. `event NewSingleBet(uint bet, address player, uint number, uint value)`: the bet number, the account address of the gambler, the roulette number on which the bet is put and the amount in Ethers. If an error figures in the event callback, we consider that the test failed, otherwise it succeeded. Last instruction, `event.stopWatching()`, simply removes the observer on `NewSingleBet` events.
Once our observer is setup, we create a single bet from account 0 of 1 Ether on number 12 :

```
roulette.betSingle(12,{from: web3.eth.accounts[0], value: web3.toWei(1, "ether")});
```

and wait for the corresponding event to be triggered.

The third test ends in a more accomplished scenario. A player bets 1 Ether on even numbers, then triggers the roulette and depending on the outcome we check if the player is credited with Ethers (in case it's a win) or if he lost Ethers compared to the initial situation (if the roulette outputs an odd number).

Before taking any action, we check how much Ethers account 1 has :

```
var balance = web3.fromWei(web3.eth.getBalance(web3.eth.accounts[1]), "ether").toNumber();
```

Then we place an observer on `Finished` events, corresponding to the end of a roulette game. To get the outcome roulette number we simply look at the result parameter :

```
var number = result.args.number.toNumber();
```

If it is an even number, we expect account 1 to be credited with more Ethers than previously :

```
assert.isAbove(new_balance,balance,`Result: ${number} => it's a win`);
```

and vice versa if it's an odd number :

```
assert.isBelow(new_balance,balance,`Result: ${number} => it's a loss`);
```

Finally, we create a bet from account 1 and trigger the roulette :

```
roulette.betEven({ from: web3.eth.accounts[1], value: web3.toWei(1, "ether")})
.then(function() {
	roulette.launch();
});
```

It's required to use promises as the order of action matters. Luckily, Truffle already provides a javascript API generated from our smart contract which automatically returns a promise on transaction calls.

## Running Roulette through a web interface

At this point we have compiled and deployed our smart contract in the blockchain (at least in a local environment which simulates the real blockchain), and our tests are running successfully. Great ! Now how am I supposed to interact with it as a user ? I could use some javascript directly through the Truffle [console](http://truffleframework.com/docs/getting_started/console), but it's just not convenient nor user-friendly. What we need instead is a web frontend, connected to our Ethereum node using the signature API generated above. Once again, Truffle comes with a turn key solution. To simplify our setup, the web server and the Ethereum client run on the same machine. Our web frontend is located under `./app`, which the default location in Truffle.

Let's enumerate what information we should get via this interface :
* the account id (or hash)
* the amount of Ether owned by this account
* the list of bets for the current run : single roulette number (or odd/even depending on the type of bet), player's hash and Ether amount
* the last roulette output number

Similarly, the list of actions would be :
* select an account by hash
* wager Ether on a number or odd/even type
* launch roulette

At this stage we don't need a strong authentification mechanism for users, so we'll go as stupid as it could be and simply get the account id by URI parameters (on our test environment all accounts are unlocked, meaning that we can transfer "fake" Ethers from them with no further requirements). We registered two users on testrpc, we'll use them both and see how events cascade from one to the other.

Let's see what happens on page loading :

```
window.onload = function() {
  Roulette.deployed().then(function(instance) {
    roulette = instance;
  
    web3.eth.getAccounts(function(err, accounts) {
      if (err != null) {
        alert("There was an error fetching your accounts.");
        return;
      }

      if (accounts.length == 0) {
        alert("Couldn't get any accounts! Make sure your Ethereum client is configured correctly.");
        return;
      }

      account = getAccountFromUrl();
      if (account == null || ! accounts.includes(account)) {
        account = accounts[0];
      }

      document.getElementById("player").innerHTML = account;

      refreshBalance();
      watchNewBets();
      watchFinishedRound();
    });
  });
}
```

First we need to retrieve our Roulette smart contract from the blockchain, that's done by `Roulette.deployed()` which returns a javascript promise. Remember, smart contract was previously deployed using `npm run migrate` (see above).
So at this point we have our Roulette, but we also need users to trigger actions. It's made possible with `web3.eth.getAccounts()`, an async function call to retrieve the list of accounts controlled by the ethereum node. All we have to do then is to compare the URI account parameter  coming from `getAccountFromUrl()` (if exists) with the list of actual accounts returned by the node, pick the corresponding one or first of the list by default.
To finish, `refreshBalance()` updates the amount of Ethers owned by the current account, while `watchNewBets()` and `watchFinishedRound()` will observe actions performed on smart contract and refresh the UI accordingly.
Finally, the last operation we need to operate is place a bet, that's done in `newBet()`.

After this tiny bit of explanation, it's time to see some action ! All we have to do is run
```
npm run serve
```
which is, once again, an alias to a Truffle command `truffle serve`. First, the command builds our web application by combining the web frontend we wrote above together with a web3 based glue layer to interact with smart contracts. Secondly, it runs a web server to serve our app statically for testing purposes.