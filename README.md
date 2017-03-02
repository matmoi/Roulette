# Roulette

Since I wanted to learn more about blockchain technology, especially around Ethereum as it got lot of attractions lately, I started to look around for tutorials and found this great on to get familiar with syntax and tools dedicated to Ethereum: https://www.ethereum-france.com/ecrire-une-dapp-pour-ethereum-1-smart-contract/ (french only). Unfortunately the project itself is slightly outdated, compilation fails with solidity 0.4.+, so I decided to fork it in order to fix/extend/improve the original code base.

The project proposes a smart contract for a simplified version of roulette: a player can bet on a single number (and win 35 times his stake) or whether the number is odd or even (and 2 times his stake).

## Prerequisite

1. [nodejs](https://nodejs.org/en/download/) to install the following packages and run our web frontend
2. [testrpc](https://github.com/ethereumjs/testrpc) is an ethereum client for testing which simulate a local blockchain
3. [truffle](https://github.com/ConsenSys/truffle) is a development framework to build and deploy dApp easily

> On Windows 10+, you might find more convenient to install those dependencies in the [Ubuntu Bash Shell](https://msdn.microsoft.com/en-us/commandline/wsl/about), avoiding all the struggle in particular for [testrpc](https://github.com/ethereumjs/testrpc/wiki/Installing-TestRPC-on-Windows). It won't prevent you from using the polished IDEs and tools you like on Windows (atom/vscode), but the commands for building and testing your dApp would have to run in a bash.

For Debian/Ubuntu distributions, once npm is installed, simply use the following command to install testrpc and truffle
```
npm run preinstall
```

## Smart contract

If you're not acquainted with smart contracts yet, it would be helpful to read the [official documentation](http://solidity.readthedocs.io/en/develop/introduction-to-smart-contracts.html) first.
Our smart contract `Roulette.sol` is located under `contracts`, following truffle recommendations for [project structure](http://truffleframework.com/docs/getting_started/project).

Smart contract attributes define its internal state :
1. `_owner` is the smart contract creator. Useful to restrict some actions to the creator only (such as destruct, spining wheel etc.)
2. `nextRoundTimestamp` and `_interval` are used to force a minimal amount of time for bidding. In Ethereum there is no timer such as `setTimeout()` in Javascript. Because of this, we decided that any player can spin the wheel at any time, the only possible constraint is to provide enough time for the eventual other players to bet.
3. `bets` is the current collection of bets visible by all, like in real-life. A bet has a type (Single, Odd, Even), a reference to the player who placed it, an amount (in ether) and a number (necessary for Single bet type only).

We also implemented accessors for the public attributes, `getNextRoundTimestamp()` and `getBetsCountAndValue()`. `getBetsCountAndValue()` returns the number of bets and the sum of their ether (all bets combined).

The constructor is defined as :
```
function Roulette(uint interval) payable {
	    _interval = interval;
	    _owner = msg.sender;
	    nextRoundTimestamp = now + _interval;
    }
```

- `payable` means that the call to this constructor must contain some ether, it will be the reserve of money for the bank.
- `now` is a special solidity variable representing the current block timestamp.

There are 3 different methods to bet : `betSingle(uint number)`, `betEven()` and `betOdd()`. The first one is to bet on a single number and potentially win 35 times your stake, the two following come out of the number being even or odd (0 excluded) and allow you to win twice your stake in case of success. Those methods have three [modifiers](http://solidity.readthedocs.io/en/develop/contracts.html#modifiers), a modifier is similar to a decorator in python: it allows you to easily modify the behavior of a function. The first modifier, `payable`, is provided by solidity directly and allows to receive Ether together with a call. The two others are defined in `Roulette.sol`, `transactionMustContainEther()` makes sure bet contains some Ether, `bankMustBeAbleToPayForBetType()` verify if the bank has enough fund to satisfy all the bets. In case of failure, both modifiers throw an exception such as the bet is rejected.

Last function is `launch()` and allows any player to toss as soon as the minimal interval of time is obeyed (defined by `_interval`, in second). In solidity there is no possible way to perform actions at regular intervals, similarly to `setInterval()` in Javascript: a transaction must be processed in a limited amount of time. The idea here is to let players decide whenever they are ready by giving them access to the `launch()` function. It's also possible to limit this feature only to the smart contract's creator, or any other entity that can be assimilated to the bank.
Secondly, Solidity doesn't allow the generation of pseudo-random numbers as the blockchain must return the exact same result regardless of which node executes the transaction. To simulate a random int number between [0,36], we are actually using the hash of the last block :

``` uint(block.blockhash(block.number - 1)) % 37 ```

Keep in mind that it is in theory possible to manipulate the outcome result, even though it's complicated and expensive. To make our roulette more robust we could also use the hash of the previous `n` blocks.

> Note on `Migrations.sol`
> Truffle provides by default a smart contract named `Migrations.sol` when using the `truffle init` command, but it is not a mandatory feature. It aims to record all the previous migrations directly in the blockchain. More details [here](https://truffle.readthedocs.io/en/latest/getting_started/migrations/).

## Compilation

Ethereum smart contracts written in Solidity must be compiled before being deployed in the blockchain. This can be done easily with Truffle by typing

```truffle compile```

or using the command `npm run compile` defined in our package.json, which is simply an alias for the commande above.
For each smart contract, the compilation will generate an artifact file under `./build/contracts`. In our case we get both `Migrations.sol.js` and `Roulette.sol.js`, which contain the signature API to interact with our smart contracts from Javascript using [web3](https://github.com/ethereum/web3.js).

## Deployment in a test environment

You have previously compiled your smart contracts and generate their corresponding artifact files. Now it's time to deploy them in the blockchain. For the purpose of testing, we are going to use testrpc to simulate a Ethereum node client locally instead of using the real Ethereum network, which would have the big disavantage of consuming "real" gas. In Ethereum, all transactions have a cost (expressed in "gas"), and you must provide some gas if you want your transaction to be mined by other nodes of the network. The mechanism is fully described in [this article](https://www.cryptocompare.com/coins/guides/what-is-the-gas-in-ethereum/).

First, you need to run testrpc using the command

```
npm run testrpc
```

To understand exactly what's happening here, a simply look to `package.json` will show the full command :

```
testrpc --account="0x40e16bbfe219ecaa733169b9192604338d0c55d48a3c90dae45badaede6822ff,10000000000000000000000" --account="0xf5d09e61086d537581377e29c93edcf19de73b42230c7b9fe390e4dd560ffc0a,10000000000000000000000"
```

Basically, we start testrpc with two accounts, credited with 1000 Ether each.

Once testrpc has started, we can use truffle to deploy the smart contract through our local node. The command would be :

```
truffle migrate
```

or alternatively `npm run migrate`. To proceed, truffle uses the files under `./migrations`. As the order matters here, each file has a prefix with a number. In `2_deploy_contracts.js`, we can observe how a new Roulette is created :

```deployer.deploy(Roulette,0,{from: web3.eth.accounts[0], value: web3.toWei(1000, "ether")});```

The `_interval` parameter sent to the constructor is set to 0. It basically means that players don't necessarly have to wait between two runs (it's purely to make our automated tests easier). We also specify the address of the sending account and the value transfered to the smart contract in Wei. In this example, account 0 creates a Roulette smart contract with 1000 Ethers (why not ? so far it's just fake Ether... But be careful if you want to deploy this smart contract in the "real" Ethereum blockchain), which will be the initial bank fund to pay back potential winners.

## Testing

Truffle also provides a tool for testing our smart contracts. The command `truffle test` will execute all the tests available under `./test`. Those tests are written in javascript and based
 on [mochajs](http://mochajs.org/) framework, with slight upgrades explained in [here](http://truffleframework.com/docs/getting_started/javascript-tests) to make your life easier.

As an example we wrote three tests in `roulette.js`, each one of them is identified by the `it(...)` control structure. First instruction in the test block looking as `var roulette = Roulette.deployed();` allows us to retrieve the smart contract deployed in our local node (see section above).

The first one is fairly simple, we make sure that our smart contract is credited with 1000 Ethers as explicitly described in `2_deploy_contracts.js`. For that, we retrieve the current balance of our smart contract :

```var balance = web3.fromWei(web3.eth.getBalance(roulette.address), "ether").toNumber();```

and makes sure it equals 1000 :

```assert.equal(balance.valueOf(), 1000, `Smart contract is credited with ${balance.valueOf()} Ether, expected 1000.`);```

Second test covers Solidity (events)[http://solidity.readthedocs.io/en/develop/contracts.html#events]. An event is a callback function allowing our javascript code to be aware of predefined actions happening in a smart contract. In our case, we use events to notify all the observers when a participant puts a bet. Just like in real life, anyone around the table has the possibility to know who bets what.
Because we wait for an event that might never happen, it's safe to set a timeout for this test. That's done by using the timeout option, 10 seconds should be enough :

```this.timeout(10000);```

We also have to inform mochajs that this test is asynchronous by using a callback function named `done` as a parameter in the test declaration. That way, it will wait for `done(...)` to be called or raise a timeout after 10 seconds. An optional parameter can be passed to the callback function, which basically indicate that the test failed.
First thing in our test, we define an observer on NewSingleBet events defined in our smart contract (see `Roulette.sol`), such as :

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

Each event produces a result and potentially an error. The result contains the parameters indicated in the event prototype, aka. `event NewSingleBet(uint bet, address player, uint number, uint value);` : the bet number, the account address of the gambler, the roulette number on which the bet is put and the amount in Ethers. If an error figures in the event callback, we consider that the test fails, otherwise it succeeds. Last instruction, `event.stopWatching()`, simply removes this observer on NewSingleBet events.
Once our observer is setup, we place a single bet from account 0 of 1 Ether on number 12 :

```roulette.betSingle(12,{from: web3.eth.accounts[0], value: web3.toWei(1, "ether")});```

and wait for the corresponding event to be triggered.

The third test ends in a more accomplished scenario. A player bets 1 Ether on even numbers, then the wheel is launched and depending on the outcome we check if player is credited with Ethers (in case of a win) or if he lost Ether compared to the initial situation (if the roulette outputs an odd number).

## Running dapp Roulette in a web browser