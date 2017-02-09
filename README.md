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

Last function is `launch()` and allows any player to toss as soon as the minimal interval of time is obeyed (defined by `_interval`, in second). In solidity there is no possible way to perform actions at regular intervals, similarly to `setInterval()` in Javascript: a transaction must be processed in a limited amount of time. The idea here is to let players decide whenever they are ready by giving them access to the `launch()` function. It's also possible to limit this feature only to the smart contract's, or any other entity that can be assimilated to the bank.

> Note on `Migrations.sol`
> Truffle provides by default a smart contract named `Migrations.sol` when using the `truffle init` command, but it is not a mandatory feature. It aims to record all the previous migrations directly in the blockchain. More details [here](https://truffle.readthedocs.io/en/latest/getting_started/migrations/).

## Compilation

Ethereum smart contracts written in Solidity must be compiled before being deployed in the blockchain. This can be done easily with Truffle by typing

```truffle compile```

or using the command `npm run compile` defined in our package.json, which is simply an alias for the commande above.
For each smart contract, the compilation will generate an artifact file under `./build/contracts`. In our case we get both `Migrations.sol.js` and `Roulette.sol.js`, which contain the signature API to interact with our smart contracts from Javascript using [web3](https://github.com/ethereum/web3.js).

## Deploy

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

Once testrpc is started, we can use truffle to deploy the smart contract through our local node. The command would be :

```
truffle migrate
```

or alternatively `npm run migrate`. To proceed, truffle uses the files under `./migrations`. As the order matters here, each file has a prefix with a number. In `2_deploy_contracts.js`, we can observe how a new Roulette is created :

```deployer.deploy(Roulette,0,{from: web3.eth.accounts[0], value: web3.toWei(1000, "ether")});```

The constructor parameter, `_interval`, is set to 0. This basically means that players don't have to wait between two runs (it's purely to make our tests easier here). We also specify the address of the sending account and the value transfered to the transaction in Wei. In this example, account 0 creates a Roulette with 100 Ethers, it's gonna be the bank reserve.

## Testing

Truffle also provide a support for testing our smart contracts. The command `truffle test` will execute all the tests available under `./test` using the test framwwork [mochajs](http://mochajs.org/).

## Running the web interface