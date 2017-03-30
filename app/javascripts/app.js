var account;
var roulette;

function setStatus(message) {
  var status = document.getElementById("status");
  status.innerHTML = message;
};

function getAccountFromUrl() {
    var regex = new RegExp("[?&]account(=([^&#]*)|&|#|$)"),
        results = regex.exec(window.location.href);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}

function refreshBalance() {
  var value = web3.fromWei(web3.eth.getBalance(account),"ether").toNumber();
  var balance_element = document.getElementById("balance");
  balance_element.innerHTML = value.valueOf();
};

function watchNewBets() {
  roulette.NewSingleBet(function(error, result) {
      if (error) {
        console.log(error);
        setStatus("Error end of round; see log.");
      } else {
        var row = document.getElementById("bets").insertRow(-1);
        row.insertCell(-1).innerHTML = result.args.bet.toNumber();
        row.insertCell(-1).innerHTML = result.args.player;
        row.insertCell(-1).innerHTML = result.args.number.toNumber();
        row.insertCell(-1).innerHTML = web3.fromWei(result.args.value.toNumber());
      }
  });
  roulette.NewEvenBet(function(error, result) {
      if (error) {
        console.log(error);
        setStatus("Error end of round; see log.");
      } else {
        var row = document.getElementById("bets").insertRow(-1);
        row.insertCell(-1).innerHTML = result.args.bet.toNumber();
        row.insertCell(-1).innerHTML = result.args.player;
        row.insertCell(-1).innerHTML = "Even";
        row.insertCell(-1).innerHTML = web3.fromWei(result.args.value.toNumber());
      }
  });
  roulette.NewOddBet(function(error, result) {
      if (error) {
        console.log(error);
      } else {
        var row = document.getElementById("bets").insertRow(-1);
        row.insertCell(-1).innerHTML = result.args.bet.toNumber();
        row.insertCell(-1).innerHTML = result.args.player;
        row.insertCell(-1).innerHTML = "Odd";
        row.insertCell(-1).innerHTML = web3.fromWei(result.args.value.toNumber());
      }
  });
}

function watchFinishedRound() {
  roulette.Finished(function(error, result) {
      if (error) {
        console.log(error);
        setStatus("Error end of round; see log.");
      } else {
        document.getElementById("bets").innerHTML = '';
        document.getElementById("outcome_number").innerHTML = result.args.number.toNumber();
      }
      refreshBalance();
  });
}

function newBet() {
  var select = document.getElementById("new_bet_type");
  var type = select.options[select.selectedIndex].value;
  var value = document.getElementById("new_bet_value").value;
  if (type === "even") {
    roulette.betEven({from: account, value: web3.toWei(value), gas: 2000000}).then(function() {
      refreshBalance();
    });
  } else if (type === "odd") {
    roulette.betOdd({from: account, value: web3.toWei(value), gas: 2000000})
    .then(function() {
      refreshBalance();
    });
  } else {
    roulette.betSingle(parseInt(type),{from: account, value: web3.toWei(value), gas: 2000000})
    .then(function() {
      refreshBalance();
    });
  }
}

function launch() {
  roulette.launch({from: account});
}

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
