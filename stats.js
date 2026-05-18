let allMatches = [];
let allMatchPlayers = [];

let filteredMatches = [];
let filteredMatchPlayers = [];
let recentMatchesLimit = 5;

document.addEventListener("DOMContentLoaded", async () => {
  await loadStats();
});

async function loadStats() {
  const client = window.supabaseClient;

  const { data: matches, error: matchError } = await client
    .from("matches")
    .select("*")
    .order("created_at", { ascending: false });

  if (matchError) {
    console.error(matchError);
    return;
  }

  const { data: matchPlayers, error: playerError } = await client
    .from("match_players")
    .select("*");

  if (playerError) {
    console.error(playerError);
    return;
  }

  allMatches = matches || [];
  allMatchPlayers = matchPlayers || [];

  filteredMatches = allMatches;
  filteredMatchPlayers = allMatchPlayers;

  renderOverallStats();
  renderPlayerSelects();
  renderRecentMatches();
}

function renderOverallStats() {
  const container = document.getElementById("overallStats");
  container.innerHTML = "";

  const stats = {};

  filteredMatchPlayers.forEach(row => {
    if (!stats[row.player_name]) {
      stats[row.player_name] = {
        wins: 0,
        losses: 0
      };
    }

    if (row.result === "winner") {
      stats[row.player_name].wins++;
    } else {
      stats[row.player_name].losses++;
    }
  });

  Object.keys(stats).forEach(playerName => {
    const player = stats[playerName];
    const total = player.wins + player.losses;
    const winrate = total > 0
      ? Math.round((player.wins / total) * 100)
      : 0;

    const div = document.createElement("div");
    div.className = "stat-row";

    div.innerHTML = `
      <div class="stat-card-top">
     <a class="player-link" href="player.html?name=${encodeURIComponent(playerName)}">
  ${playerName}
</a>
        <div class="winrate">${winrate}%</div>
      </div>

      <div class="stat-card-bottom">
        <span>${player.wins}W</span>
        <span>${player.losses}L</span>
      </div>
    `;

    container.appendChild(div);
  });
}

function renderPlayerSelects() {
  const playerNames = [
    ...new Set(filteredMatchPlayers.map(row => row.player_name))
  ].sort();

  const selectOne = document.getElementById("playerOneSelect");
  const selectTwo = document.getElementById("playerTwoSelect");

  selectOne.innerHTML = "";
  selectTwo.innerHTML = "";

  playerNames.forEach(name => {
    const optionOne = document.createElement("option");
    optionOne.value = name;
    optionOne.textContent = name;

    const optionTwo = document.createElement("option");
    optionTwo.value = name;
    optionTwo.textContent = name;

    selectOne.appendChild(optionOne);
    selectTwo.appendChild(optionTwo);
  });

  if (playerNames.length > 1) {
    selectTwo.selectedIndex = 1;
  }
}

function calculateHeadToHead() {
  const playerOne = document.getElementById("playerOneSelect").value;
  const playerTwo = document.getElementById("playerTwoSelect").value;
  const onlyOneVsOne = document.getElementById("onlyOneVsOne").checked;

  if (!playerOne || !playerTwo) {
    document.getElementById("headToHeadResult").innerHTML =
      "<p>Keine ausreichenden Daten vorhanden.</p>";
    return;
  }

  if (playerOne === playerTwo) {
    document.getElementById("headToHeadResult").innerHTML =
      "<p>Bitte zwei unterschiedliche Spieler auswählen.</p>";
    return;
  }

  let playerOneWins = 0;
  let playerTwoWins = 0;
  let matchesPlayed = 0;

  filteredMatches.forEach(match => {
    const rows = filteredMatchPlayers.filter(row => row.match_id === match.id);

    const hasPlayerOne = rows.some(row => row.player_name === playerOne);
    const hasPlayerTwo = rows.some(row => row.player_name === playerTwo);

    if (!hasPlayerOne || !hasPlayerTwo) {
      return;
    }

    if (onlyOneVsOne && rows.length !== 2) {
      return;
    }

    matchesPlayed++;

    const winner = rows.find(row => row.result === "winner");

    if (!winner) {
      return;
    }

    if (winner.player_name === playerOne) {
      playerOneWins++;
    }

    if (winner.player_name === playerTwo) {
      playerTwoWins++;
    }
  });

  const modeText = onlyOneVsOne
    ? "Nur echte 1:1 Duelle"
    : "Alle gemeinsamen Matches";

  document.getElementById("headToHeadResult").innerHTML = `
    <div class="head-to-head-box">
      <small>${modeText}</small>
      <strong>${playerOne} vs ${playerTwo}</strong>
      <div>${playerOneWins} : ${playerTwoWins}</div>
      <small>${matchesPlayed} gewertete Matches</small>
    </div>
  `;
}

function renderRecentMatches() {
  const container = document.getElementById("recentMatches");
  container.innerHTML = "";

  const matchesToRender = filteredMatches.slice(0, recentMatchesLimit);

  matchesToRender.forEach(match => {
    const rows = filteredMatchPlayers.filter(row => row.match_id === match.id);

    const players = rows
      .map(row => row.player_name)
      .join(", ");

    const date = new Date(match.created_at).toLocaleString("de-DE");

    const div = document.createElement("div");
    div.className = "match-row";

    div.innerHTML = `
      <strong>${match.game_type}</strong>
      <span>Gewinner: ${match.winner}</span>
      <small>${players}</small>
      <small>${date}</small>
    `;

    container.appendChild(div);
  });

  if (filteredMatches.length > recentMatchesLimit) {

    const loadMoreButton = document.createElement("button");

    loadMoreButton.className = "secondary";
    loadMoreButton.textContent = "Weitere 5 anzeigen";

    loadMoreButton.onclick = () => {
      recentMatchesLimit += 5;
      renderRecentMatches();
    };

    container.appendChild(loadMoreButton);
  }
}

function applyDateFilter() {
  const fromValue = document.getElementById("dateFrom").value;
  const toValue = document.getElementById("dateTo").value;
  const gameFilter = document.getElementById("gameFilter").value;

  filteredMatches = allMatches.filter(match => {
    const matchDate = new Date(match.created_at);

    if (fromValue) {
      const fromDate = new Date(fromValue + "T00:00:00");
      if (matchDate < fromDate) {
        return false;
      }
    }

    if (toValue) {
      const toDate = new Date(toValue + "T23:59:59");
      if (matchDate > toDate) {
        return false;
      }
    }

  if (gameFilter && match.game_type !== gameFilter) {
  return false;
}

return true;
  });

  const filteredMatchIds = filteredMatches.map(match => match.id);

  filteredMatchPlayers = allMatchPlayers.filter(row =>
    filteredMatchIds.includes(row.match_id)
  );

  recentMatchesLimit = 5;
  renderOverallStats();
  renderPlayerSelects();
  renderRecentMatches();
  calculateHeadToHead();
}

function resetDateFilter() {
  document.getElementById("dateFrom").value = "";
  document.getElementById("dateTo").value = "";
  document.getElementById("gameFilter").value = "";

  filteredMatches = allMatches;
  filteredMatchPlayers = allMatchPlayers;

  recentMatchesLimit = 5;
  renderOverallStats();
  renderPlayerSelects();
  renderRecentMatches();
  calculateHeadToHead();
}