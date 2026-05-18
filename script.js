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
let startingPlayerIndex = 0;

const cricketTargets = [20, 19, 18, 17, 16, 15, "bull"];

function startGame() {
  gameType = document.getElementById("gameType").value;

  legsToWinSet = Number(document.getElementById("legsToWinSet")?.value || 3);
  setsToWinMatch = Number(document.getElementById("setsToWinMatch")?.value || 1);

  let selectedPlayers = Array.from(
    document.querySelectorAll(".playerCheck:checked")
  ).map(input => input.value);

  const randomOrder = document.getElementById("randomOrder")?.checked;

  if (randomOrder) {
    selectedPlayers = shuffleArray(selectedPlayers);
  }

  if (selectedPlayers.length < 1) {
    showToast("Bitte mindestens einen Spieler auswählen.");
    return;
  }

  startingPlayerIndex = 0;

  players = selectedPlayers.map(name => ({
    name,
    score: gameType === "301" ? 301 : 0,
    target: 1,
    legs: 0,
sets: 0,
totalLegsWon: 0,
totalSetsWon: 0,
cricketScore: 0,
    cricket: {
      20: 0,
      19: 0,
      18: 0,
      17: 0,
      16: 0,
      15: 0,
      bull: 0
    },
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

  if (multiplier === 1) document.getElementById("singleBtn").classList.add("active");
  if (multiplier === 2) document.getElementById("doubleBtn").classList.add("active");
  if (multiplier === 3) document.getElementById("tripleBtn").classList.add("active");
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
    number,
    multiplier: currentMultiplier,
    points
  });

  if (gameType === "301") {
    const stopTurn = handle301(player, points);
    if (stopTurn) return;
  }

  if (gameType === "around") {
    handleAroundTheClock(player, number);
  }

  if (gameType === "cricket") {
    handleCricket(player, number, currentMultiplier);
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
  if (number === 0) return "Miss";
  if (number === 25) return multiplier === 2 ? "DBull" : "Bull";
  if (multiplier === 2) return "D" + number;
  if (multiplier === 3) return "T" + number;
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
  player.totalLegsWon++;

  if (player.legs >= legsToWinSet) {
    player.sets++;
    player.totalSetsWon++;
    players.forEach(p => p.legs = 0);
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

  startingPlayerIndex++;

  if (startingPlayerIndex >= players.length) {
    startingPlayerIndex = 0;
  }

  currentPlayerIndex = startingPlayerIndex;
  currentDart = 1;
  currentMultiplier = 1;
  roundNumber = 1;
  currentRoundThrows = [];
  roundStartScore = players[currentPlayerIndex].score;

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

function handleCricket(player, number, multiplier) {
  let target = number;

  if (number === 25) {
    target = "bull";
  }

  if (!cricketTargets.includes(target)) {
    return;
  }

  const currentMarks = player.cricket[target];
  const newMarks = currentMarks + multiplier;

  if (currentMarks < 3) {
    const marksToClose = Math.min(multiplier, 3 - currentMarks);
    const extraHits = multiplier - marksToClose;

    player.cricket[target] += marksToClose;

    if (extraHits > 0 && canScoreOnTarget(player, target)) {
      player.cricketScore += extraHits * getCricketValue(target);
    }
  } else {
    if (canScoreOnTarget(player, target)) {
      player.cricketScore += multiplier * getCricketValue(target);
    }
  }

  checkCricketWinner(player);
}

function canScoreOnTarget(player, target) {
  return players.some(otherPlayer => {
    return otherPlayer !== player && otherPlayer.cricket[target] < 3;
  });
}

function getCricketValue(target) {
  if (target === "bull") {
    return 25;
  }

  return Number(target);
}

function checkCricketWinner(player) {
  const allClosed = cricketTargets.every(target => player.cricket[target] >= 3);

  if (!allClosed) {
    return;
  }

  const highestOtherScore = Math.max(
    ...players
      .filter(p => p !== player)
      .map(p => p.cricketScore)
  );

  if (player.cricketScore >= highestOtherScore) {
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
  currentPlayer.name + " ist am Zug";

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
      displayValue = renderCricketBoard(player);
    }

    const lastThrows =
      player.lastThrows.length > 0
        ? player.lastThrows.join(" | ")
        : "-";

    div.innerHTML = `
      <div class="player-left">
        <strong>${player.name}</strong>
        <div class="last-throws">
          Letzte Runde: ${lastThrows}
        </div>
      </div>

      <div class="player-right">
        ${displayValue}
      </div>
    `;

    scoreBoard.appendChild(div);
  });
}

function renderCricketBoard(player) {
  let rows = "";

  cricketTargets.forEach(target => {
    const label = target === "bull" ? "Bull" : target;
    const marks = renderCricketMarks(player.cricket[target]);

    rows += `
      <div class="cricket-row">
        <span>${label}</span>
        <strong>${marks}</strong>
      </div>
    `;
  });

  return `
    <div class="cricket-score">${player.cricketScore} Punkte</div>
    <div class="cricket-board">
      ${rows}
    </div>
  `;
}

function renderCricketMarks(count) {
  if (count <= 0) return "-";
  if (count === 1) return "X";
  if (count === 2) return "XX";
  return "XXX";
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
    setsToWinMatch,
    startingPlayerIndex
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
  startingPlayerIndex = lastState.startingPlayerIndex;

  hideWinner();

  setMultiplier(currentMultiplier);
  renderGame();
}

async function showWinner(name) {
  gameFinished = true;

  const winnerText = document.getElementById("winnerText");
  const winnerModal = document.getElementById("winnerModal");

  winnerText.textContent = "🏆 " + name + " gewinnt das Match!";

  winnerModal.classList.remove("hidden");
  winnerModal.classList.add("show");

  await saveMatchToSupabase(name);
}

function hideWinner() {
  const winnerModal = document.getElementById("winnerModal");

  if (!winnerModal) {
    return;
  }

  winnerModal.classList.remove("show");
  winnerModal.classList.add("hidden");
}

function shuffleArray(array) {
  const copy = [...array];

  for (let i = copy.length - 1; i > 0; i--) {
    const randomIndex = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[randomIndex]] = [copy[randomIndex], copy[i]];
  }

  return copy;
}
async function saveMatchToSupabase(winnerName) {
  if (!window.supabaseClient && typeof supabaseClient === "undefined") {
    showToast("Supabase ist nicht verbunden.");
    return;
  }

  const client = window.supabaseClient || supabaseClient;

  const matchData = {
    game_type: gameType,
    winner: winnerName
  };

  const { data: match, error: matchError } = await client
    .from("matches")
    .insert(matchData)
    .select()
    .single();

  if (matchError) {
    console.error(matchError);
    showToast("Match konnte nicht gespeichert werden.");
    return;
  }

const playerRows = players.map(player => ({
  match_id: match.id,
  player_name: player.name,
  result: player.name === winnerName ? "winner" : "loser",
sets: player.totalSetsWon || 0,
legs: player.totalLegsWon || 0,
  score: player.score || 0,
  cricket_score: player.cricketScore || 0
}));

  const { error: playersError } = await client
    .from("match_players")
    .insert(playerRows);

  if (playersError) {
    console.error(playersError);
    showToast("Spielergebnisse konnten nicht gespeichert werden.");
    return;
  }

  showToast("Match gespeichert ✅");
}