let players = [];
let gameType = "301";

let currentPlayerIndex = 0;
let currentDart = 1;
let currentMultiplier = 1;
let roundNumber = 1;

let roundStartScore = 0;
let currentRoundThrows = [];
let history = [];
let gameFinished = false;

let legsToWinSet = 3;
let setsToWinMatch = 1;

function startGame() {
  gameType = document.getElementById("gameType").value;

  legsToWinSet = Number(document.getElementById("legsToWinSet").value);
  setsToWinMatch = Number(document.getElementById("setsToWinMatch").value);

  const selectedPlayers = Array.from(
    document.querySelectorAll(".playerCheck:checked")
  ).map(input => input.value);

  if (selectedPlayers.length < 1) {
    showToast("Bitte mindestens einen Spieler auswählen.");
    return;
  }

  players = selectedPlayers.map(name => ({
    name: name,
    score: gameType === "301" ? 301 : 0,
    target: 1,
    legs: 0,
    sets: 0,
    throws: [],
    lastThrows: []
  }));

  currentPlayerIndex = 0;
  currentDart = 1;
  currentMultiplier = 1;
  roundNumber = 1;
  roundStartScore = players[0].score;
  currentRoundThrows = [];
  history = [];
  gameFinished = false;

  hideWinner();

  document.getElementById("setupScreen").classList.add("hidden");
  document.getElementById("gameScreen").classList.remove("hidden");

  createNumberButtons();
  setMultiplier(1);
  renderGame();
}

function createNumberButtons() {
  const container = document.getElementById("numberButtons");
  container.innerHTML = "";

  for (let i = 1; i <= 20; i++) {
    const button = document.createElement("button");
    button.textContent = i;
    button.onclick = () => throwDart(i);
    container.appendChild(button);
  }

  const bullButton = document.createElement("button");
  bullButton.textContent = "Bull";
  bullButton.onclick = () => throwDart(25);
  container.appendChild(bullButton);
}

function setMultiplier(multiplier) {
  currentMultiplier = multiplier;

  document.getElementById("singleBtn").classList.remove("active");
  document.getElementById("doubleBtn").classList.remove("active");
  document.getElementById("tripleBtn").classList.remove("active");

  if (multiplier === 1) {
    document.getElementById("singleBtn").classList.add("active");
  }

  if (multiplier === 2) {
    document.getElementById("doubleBtn").classList.add("active");
  }

  if (multiplier === 3) {
    document.getElementById("tripleBtn").classList.add("active");
  }
}

function throwDart(number) {
  if (gameFinished) {
    showToast("Spiel ist bereits beendet 🎯");
    return;
  }

  if (number === 25 && currentMultiplier === 3) {
    showToast("Triple Bull gibt's nicht 😄");
    return;
  }

  saveHistory();

  const player = players[currentPlayerIndex];
  const points = number * currentMultiplier;
  const throwText = buildThrowText(number, currentMultiplier);

  currentRoundThrows.push(throwText);

  player.throws.push({
    round: roundNumber,
    dart: currentDart,
    number: number,
    multiplier: currentMultiplier,
    points: points
  });

  if (gameType === "301") {
    const stopTurn = handle301(player, points);

    if (stopTurn) {
      return;
    }
  }

  if (gameType === "around") {
    handleAroundTheClock(player, number);
  }

  if (currentDart >= 3) {
    player.lastThrows = [...currentRoundThrows];
    nextPlayer();
  } else {
    currentDart++;
  }

  setMultiplier(1);
  renderGame();
}

function buildThrowText(number, multiplier) {
  if (number === 0) {
    return "Miss";
  }

  if (number === 25) {
    return multiplier === 2 ? "DBull" : "Bull";
  }

  if (multiplier === 2) {
    return "D" + number;
  }

  if (multiplier === 3) {
    return "T" + number;
  }

  return String(number);
}

function handle301(player, points) {
  const newScore = player.score - points;

  if (newScore < 0) {
    player.score = roundStartScore;
    player.lastThrows = [...currentRoundThrows];

    showToast("Zu viel du Lappen 🎯");

    nextPlayer();
    setMultiplier(1);
    renderGame();

    return true;
  }

  player.score = newScore;

  if (player.score === 0) {
    finishLeg(player);
    return true;
  }

  return false;
}

function finishLeg(player) {
  player.lastThrows = [...currentRoundThrows];
  player.legs++;

  if (player.legs >= legsToWinSet) {
    player.sets++;
    players.forEach(p => {
      p.legs = 0;
    });

    showToast(player.name + " gewinnt ein Set 🎯");
  } else {
    showToast(player.name + " gewinnt ein Leg 🎯");
  }

  if (player.sets >= setsToWinMatch) {
    showWinner(player.name);
    renderGame();
    return;
  }

  startNextLeg();
}

function startNextLeg() {
  players.forEach(player => {
    player.score = 301;
    player.lastThrows = [];
  });

  currentPlayerIndex = 0;
  currentDart = 1;
  currentMultiplier = 1;
  roundNumber = 1;
  currentRoundThrows = [];
  roundStartScore = players[0].score;

  setMultiplier(1);
  renderGame();
}

function handleAroundTheClock(player, number) {
  if (number === player.target) {
    player.target++;
  }

  if (player.target > 20) {
    showWinner(player.name);
  }
}

function nextPlayer() {
  currentPlayerIndex++;

  if (currentPlayerIndex >= players.length) {
    currentPlayerIndex = 0;
    roundNumber++;
  }

  currentDart = 1;
  currentRoundThrows = [];
  roundStartScore = players[currentPlayerIndex].score;
}

function renderGame() {
  const currentPlayer = players[currentPlayerIndex];

  document.getElementById("currentPlayerName").textContent =
    "🎯 " + currentPlayer.name + " ist am Zug";

  document.getElementById("dartInfo").textContent =
    "Runde " + roundNumber + " • Dart " + currentDart + "/3";

  const scoreBoard = document.getElementById("scoreBoard");
  scoreBoard.innerHTML = "";

  players.forEach((player, index) => {
    const div = document.createElement("div");

    div.className = "player-score";

    if (index === currentPlayerIndex) {
      div.classList.add("active");
    }

    let displayValue = "";

    if (gameType === "301") {
      displayValue = `
        <div class="big-score">${player.score}</div>
        <div class="match-info">
          Legs: ${player.legs}/${legsToWinSet} · Sets: ${player.sets}/${setsToWinMatch}
        </div>
      `;
    }

    if (gameType === "around") {
      displayValue = `<div class="big-score">${player.target}</div>`;
    }

    if (gameType === "cricket") {
      displayValue = `<div class="big-score">Cricket</div>`;
    }

    const lastThrows =
      player.lastThrows.length > 0
        ? player.lastThrows.join(" | ")
        : "-";

    div.innerHTML = `
      <div>
        <strong>${player.name}</strong>
        <div class="last-throws">
          Letzte Runde: ${lastThrows}
        </div>
      </div>

      <div>
        ${displayValue}
      </div>
    `;

    scoreBoard.appendChild(div);
  });
}

function resetGame() {
  gameFinished = false;
  history = [];
  players = [];
  currentPlayerIndex = 0;
  currentDart = 1;
  currentMultiplier = 1;
  roundNumber = 1;
  roundStartScore = 0;
  currentRoundThrows = [];

  hideWinner();

  document.getElementById("gameScreen").classList.add("hidden");
  document.getElementById("setupScreen").classList.remove("hidden");
}

function showToast(message) {
  const toast = document.getElementById("toast");

  if (!toast) {
    console.error("Toast-Element wurde nicht gefunden.");
    return;
  }

  toast.textContent = message;
  toast.classList.remove("hidden");

  setTimeout(() => {
    toast.classList.add("hidden");
  }, 3500);
}

function saveHistory() {
  history.push({
    players: JSON.parse(JSON.stringify(players)),
    currentPlayerIndex,
    currentDart,
    currentMultiplier,
    roundNumber,
    roundStartScore,
    currentRoundThrows: [...currentRoundThrows],
    gameFinished,
    legsToWinSet,
    setsToWinMatch
  });
}

function undoLastThrow() {
  if (history.length === 0) {
    showToast("Nichts zum Zurücknehmen 😄");
    return;
  }

  const lastState = history.pop();

  players = lastState.players;
  currentPlayerIndex = lastState.currentPlayerIndex;
  currentDart = lastState.currentDart;
  currentMultiplier = lastState.currentMultiplier;
  roundNumber = lastState.roundNumber;
  roundStartScore = lastState.roundStartScore;
  currentRoundThrows = lastState.currentRoundThrows;
  gameFinished = lastState.gameFinished;
  legsToWinSet = lastState.legsToWinSet;
  setsToWinMatch = lastState.setsToWinMatch;

  hideWinner();

  setMultiplier(currentMultiplier);
  renderGame();
}

function showWinner(name) {
  gameFinished = true;

  const winnerText = document.getElementById("winnerText");
  const winnerModal = document.getElementById("winnerModal");

  winnerText.textContent = "🏆 " + name + " gewinnt das Match!";

  winnerModal.classList.remove("hidden");
  winnerModal.classList.add("show");
}

function hideWinner() {
  const winnerModal = document.getElementById("winnerModal");

  if (!winnerModal) {
    return;
  }

  winnerModal.classList.remove("show");
  winnerModal.classList.add("hidden");
}