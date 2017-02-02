var accounts;
var account;

function setStatus(message) {
  var status = document.getElementById("status");
  status.innerHTML = message;
};

function refreshBalance() {
  var value = web3.fromWei(web3.eth.getBalance(account),"ether").toNumber();
  var balance_element = document.getElementById("balance");
  balance_element.innerHTML = value.valueOf();
};

// function sendCoin() {
//   var meta = Roulette.deployed();

//   var amount = parseInt(document.getElementById("amount").value);
//   var receiver = document.getElementById("receiver").value;

//   setStatus("Initiating transaction... (please wait)");

//   meta.sendCoin(receiver, amount, {from: account}).then(function() {
//     setStatus("Transaction complete!");
//     refreshBalance();
//   }).catch(function(e) {
//     console.log(e);
//     setStatus("Error sending coin; see log.");
//   });
// };

function watchNewBets() {
  var roulette = Roulette.deployed();
  roulette.NewSingleBet(function(error, result) {
      if (error) {
        console.log(error);
        setStatus("Error on new single bet; see log.");
      } else {
        var row = document.getElementById("bets").insertRow(-1);
        row.insertCell(-1).innerHTML = result.args.bet.toNumber();
        row.insertCell(-1).innerHTML = result.args.player;
        row.insertCell(-1).innerHTML = result.args.number.toNumber();
        row.insertCell(-1).innerHTML = web3.fromWei(result.args.value.toNumber());
      }
  });
}

function watchFinishedRound() {
  var roulette = Roulette.deployed();
  roulette.Finished(function(error, result) {
      if (error) {
        console.log(error);
        setStatus("Error end of round; see log.");
      } else {
        document.getElementById("bets").innerHTML = '';
      }
  });
}

window.onload = function() {
  web3.eth.getAccounts(function(err, accounts) {
    if (err != null) {
      alert("There was an error fetching your accounts.");
      return;
    }

    if (accounts.length == 0) {
      alert("Couldn't get any accounts! Make sure your Ethereum client is configured correctly.");
      return;
    }

    account = accounts[0];

    document.getElementById("player").innerHTML = account;
    refreshBalance();

    watchNewBets();
  });
}
