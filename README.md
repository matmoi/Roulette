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

## Compilation

Ethereum smart contracts written in Solidity must be compiled before being deployed in the blockchain. 