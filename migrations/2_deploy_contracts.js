var Roulette = artifacts.require("Roulette.sol");

module.exports = function(deployer) {
  deployer.deploy(Roulette,0,{from: web3.eth.accounts[0], value: web3.toWei(1000, "ether")});
};
