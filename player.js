const params = new URLSearchParams(window.location.search);

const playerName = params.get("name");

document.getElementById("playerName").textContent = playerName;

loadPlayerStats();

async function loadPlayerStats() {

  const client = window.supabaseClient;

  const gameFilter =
    document.getElementById("playerGameFilter")?.value || "";

  let matchQuery = client
    .from("matches")
    .select("*");

  if (gameFilter) {
    matchQuery = matchQuery.eq("game_type", gameFilter);
  }

  const { data: matches, error: matchError } = await matchQuery;

  if (matchError) {
    console.error(matchError);
    return;
  }

  const matchIds = matches.map(match => match.id);

  let playerQuery = client
    .from("match_players")
    .select("*")
    .eq("player_name", playerName);

  const { data, error } = await playerQuery;

  if (error) {
    console.error(error);
    return;
  }

  const filteredData = data.filter(row =>
    matchIds.includes(row.match_id)
  );

  const wins =
    filteredData.filter(row => row.result === "winner").length;

  const losses =
    filteredData.filter(row => row.result !== "winner").length;

  const total = wins + losses;

  const winrate = total > 0
    ? Math.round((wins / total) * 100)
    : 0;

  const cricketWins = filteredData.filter(row =>
    row.result === "winner" &&
    row.cricket_score > 0
  ).length;

  const html = `
    <div class="profile-stat-grid">

      <div class="profile-stat-card">
        <small>Winrate</small>
        <strong>${winrate}%</strong>
      </div>

      <div class="profile-stat-card">
        <small>Siege</small>
        <strong>${wins}</strong>
      </div>

      <div class="profile-stat-card">
        <small>Niederlagen</small>
        <strong>${losses}</strong>
      </div>

    </div>
  `;

  document.getElementById("playerStats").innerHTML = html;
}