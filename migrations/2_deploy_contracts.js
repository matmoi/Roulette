module.exports = function(deployer) {
  // deployer.deploy(Roulette,10,{from: web3.eth.accounts[0]});
  deployer.deploy(Roulette,0,{from: web3.eth.accounts[0], value: web3.toWei(10, "ether")});
};
