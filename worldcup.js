const WORLDCUP_API = "https://worldcup26.ir/get/games";

export function parseEasternDate(value) {
  const [datePart, timePart] = value.split(" ");
  const [month, day, year] = datePart.split("/").map(Number);
  const [hour, minute] = timePart.split(":").map(Number);
  return new Date(Date.UTC(year, month - 1, day, hour + 4, minute));
}

export function ukTime(date) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    hour: "numeric",
    minute: "2-digit",
    hour12: true
  })
    .format(date)
    .replace(":00", "")
    .replace("am", "am")
    .replace("pm", "pm");
}

export function dayLabel(date) {
  const now = new Date();

  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/London"
  }).format(now);

  const target = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/London"
  }).format(date);

  const tomorrowDate = new Date(now);
  tomorrowDate.setDate(now.getDate() + 1);

  const tomorrow = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/London"
  }).format(tomorrowDate);

  if (target === today) return "today";
  if (target === tomorrow) return "tomorrow";

  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    weekday: "short",
    day: "numeric",
    month: "short"
  }).format(date);
}

function teamName(game, side) {
  return game[`${side}_team_name_en`] || game[`${side}_team_label`] || "TBD";
}

function cleanTeam(name) {
  return String(name)
    .replace("Democratic Republic of the Congo", "DR Congo")
    .replace("Czech Republic", "Czechia")
    .replace("Bosnia and Herzegovina", "Bosnia");
}

function cleanScore(value) {
  if (value === null || value === undefined || value === "null") return "0";
  return String(value);
}

function cleanScorerName(text) {
  return String(text)
    .replace(/[{}"]/g, "")
    .replace(/[“”]/g, "")
    .replace(/,/g, "")
    .trim();
}

export function parseScorers(raw) {
  if (!raw || raw === "null") return [];

  return String(raw)
    .replace(/[{}]/g, "")
    .split("\",\"")
    .map(cleanScorerName)
    .filter(Boolean);
}

export function scorerNameOnly(scorer) {
  return scorer
    .replace(/\s+\d.*$/, "")
    .replace(/\s+\(OG\).*$/, "")
    .trim();
}

export function scoreLine(game) {
  return `${game.home} ${cleanScore(game.home_score)}-${cleanScore(game.away_score)} ${game.away}`;
}

export async function getGames() {
  const response = await fetch(WORLDCUP_API);
  const data = await response.json();

  return (data.games || []).map((game) => ({
    ...game,
    date: parseEasternDate(game.local_date),
    home: cleanTeam(teamName(game, "home")),
    away: cleanTeam(teamName(game, "away")),
    homeGoals: Number(cleanScore(game.home_score)),
    awayGoals: Number(cleanScore(game.away_score)),
    totalGoals: Number(cleanScore(game.home_score)) + Number(cleanScore(game.away_score)),
    homeScorers: parseScorers(game.home_scorers),
    awayScorers: parseScorers(game.away_scorers),
    isFinished: String(game.finished).toUpperCase() === "TRUE",
    isLive:
      String(game.finished).toUpperCase() !== "TRUE" &&
      game.time_elapsed &&
      String(game.time_elapsed).toLowerCase() !== "notstarted"
  }));
}

export function liveGames(games) {
  return games.filter((g) => g.isLive);
}

export function buildGroupTables(games, includeLive = false) {
  const tables = {};

  for (const game of games.filter((g) => g.type === "group" && (g.isFinished || (includeLive && g.isLive)))) {
    if (!tables[game.group]) tables[game.group] = {};

    for (const team of [game.home, game.away]) {
      if (!tables[game.group][team]) {
        tables[game.group][team] = {
          team,
          pts: 0,
          played: 0,
          gf: 0,
          ga: 0,
          gd: 0
        };
      }
    }

    const home = tables[game.group][game.home];
    const away = tables[game.group][game.away];

    home.played += 1;
    away.played += 1;

    home.gf += game.homeGoals;
    home.ga += game.awayGoals;
    away.gf += game.awayGoals;
    away.ga += game.homeGoals;

    if (game.homeGoals > game.awayGoals) home.pts += 3;
    else if (game.awayGoals > game.homeGoals) away.pts += 3;
    else {
      home.pts += 1;
      away.pts += 1;
    }
  }

  for (const group of Object.keys(tables)) {
    for (const team of Object.values(tables[group])) {
      team.gd = team.gf - team.ga;
    }
  }

  return tables;
}

export function rankedGroup(table) {
  return Object.values(table).sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf);
}
