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

## Compile smart contract

