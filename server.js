import express from "express";
import fs from "fs";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

const WORLDCUP_API = "https://worldcup26.ir/get/games";
const WORLD_CUP_MODE = true;

const numberWords = [
  "zero","one","two","three","four","five","six","seven","eight","nine",
  "ten","eleven","twelve","thirteen","fourteen","fifteen","sixteen",
  "seventeen","eighteen","nineteen","twenty","twenty-one","twenty-two",
  "twenty-three","twenty-four","twenty-five","twenty-six","twenty-seven",
  "twenty-eight","twenty-nine","thirty","thirty-one","thirty-two",
  "thirty-three","thirty-four","thirty-five","thirty-six","thirty-seven",
  "thirty-eight","thirty-nine","forty","forty-one","forty-two",
  "forty-three","forty-four","forty-five","forty-six","forty-seven",
  "forty-eight","forty-nine","fifty","fifty-one","fifty-two",
  "fifty-three","fifty-four","fifty-five","fifty-six","fifty-seven",
  "fifty-eight","fifty-nine"
];

function hourWord(hour) {
  return numberWords[hour % 12 || 12];
}

function timeToWords(time24) {
  const [hour, minute] = time24.split(":").map(Number);
  if (minute === 0) return `${hourWord(hour)} o'clock`;
  if (minute === 15) return `quarter past ${hourWord(hour)}`;
  if (minute === 30) return `half past ${hourWord(hour)}`;
  if (minute === 45) return `quarter to ${hourWord(hour + 1)}`;
  if (minute < 10) return `${hourWord(hour)} oh ${numberWords[minute]}`;
  return `${hourWord(hour)} ${numberWords[minute]}`;
}

function getLondonTime() {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).format(new Date());
}

function loadPoems() {
  return JSON.parse(fs.readFileSync("./poems.json", "utf8"));
}

function seedFrom(time24, salt = 0) {
  const [hour, minute] = time24.split(":").map(Number);
  const now = new Date();
  return hour * 97 + minute * 31 + now.getDate() * 17 + now.getMonth() * 13 + salt;
}

function pick(items, seed) {
  if (!items || items.length === 0) return null;
  return items[Math.abs(seed) % items.length];
}

function makeFamilyPoem(time24) {
  const poems = loadPoems();
  const poem = pick(poems, seedFrom(time24, 500));
  return `It's ${timeToWords(time24)}, / ${poem.line2}`;
}

function parseEasternDate(value) {
  const [datePart, timePart] = value.split(" ");
  const [month, day, year] = datePart.split("/").map(Number);
  const [hour, minute] = timePart.split(":").map(Number);
  return new Date(Date.UTC(year, month - 1, day, hour + 4, minute));
}

function ukTime(date) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    hour: "numeric",
    minute: "2-digit",
    hour12: false
  }).format(date);
}

function dayLabel(date) {
  const now = new Date();
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/London" }).format(now);
  const target = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/London" }).format(date);

  const tomorrowDate = new Date(now);
  tomorrowDate.setDate(now.getDate() + 1);
  const tomorrow = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/London" }).format(tomorrowDate);

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
  return name
    .replace("Democratic Republic of the Congo", "DR Congo")
    .replace("Czech Republic", "Czechia")
    .replace("Bosnia and Herzegovina", "Bosnia");
}

function scoreLine(game) {
  return `${cleanTeam(teamName(game, "home"))} ${game.home_score}-${game.away_score} ${cleanTeam(teamName(game, "away"))}`;
}

async function getGames() {
  const response = await fetch(WORLDCUP_API);
  const data = await response.json();

  return (data.games || []).map((game) => ({
    ...game,
    date: parseEasternDate(game.local_date),
    home: cleanTeam(teamName(game, "home")),
    away: cleanTeam(teamName(game, "away")),
    homeGoals: Number(game.home_score || 0),
    awayGoals: Number(game.away_score || 0),
    totalGoals: Number(game.home_score || 0) + Number(game.away_score || 0),
    isFinished: String(game.finished).toUpperCase() === "TRUE",
    isStarted: game.time_elapsed && game.time_elapsed !== "notstarted"
  }));
}

function buildGroupTables(games) {
  const tables = {};

  for (const game of games.filter((g) => g.type === "group" && g.isFinished)) {
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

function topGroupTeams(table) {
  return Object.values(table)
    .sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf)
    .slice(0, 3);
}

function upcomingUpdate(games) {
  const now = new Date();
  const upcoming = games
    .filter((g) => !g.isFinished && g.date > now)
    .sort((a, b) => a.date - b.date)[0];

  if (!upcoming) return null;

  return `COMING UP, / ${upcoming.home} v ${upcoming.away}, ${ukTime(upcoming.date)} ${dayLabel(upcoming.date)}.`;
}

function liveUpdate(games) {
  const now = new Date();

  const live = games.find((g) => {
    const matchEndEstimate = new Date(g.date.getTime() + 2 * 60 * 60 * 1000);

    return (
      !g.isFinished &&
      (
        g.isStarted ||
        (now >= g.date && now <= matchEndEstimate)
      )
    );
  });

  if (!live) return null;

  const minute =
    live.time_elapsed && live.time_elapsed !== "notstarted"
      ? `${live.time_elapsed} mins`
      : "live now";

  return `LIVE NOW, / ${live.home} ${live.home_score}-${live.away_score} ${live.away}, ${minute}.`;
}

function recentResultUpdate(games) {
  const recent = games
    .filter((g) => g.isFinished)
    .sort((a, b) => b.date - a.date)[0];

  if (!recent) return null;

  return `FULL TIME, / ${scoreLine(recent)}.`;
}

function todayGamesUpdate(games) {
  const now = new Date();
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/London" }).format(now);

  const todayGames = games
    .filter((g) => {
      const gameDay = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/London" }).format(g.date);
      return gameDay === today && !g.isFinished;
    })
    .sort((a, b) => a.date - b.date);

  if (!todayGames.length) return null;

  const game = todayGames[0];
  return `TODAY, / ${game.home} v ${game.away}, ${ukTime(game.date)}.`;
}

function scotlandWatchUpdate(games) {
  const now = new Date();

  const liveScotland = games.find((g) =>
    !g.isFinished &&
    g.isStarted &&
    (g.home === "Scotland" || g.away === "Scotland")
  );

  if (liveScotland) {
    return `SCOTLAND LIVE, / ${liveScotland.home} ${liveScotland.home_score}-${liveScotland.away_score} ${liveScotland.away}.`;
  }

  const nextScotland = games
    .filter((g) =>
      !g.isFinished &&
      g.date > now &&
      (g.home === "Scotland" || g.away === "Scotland")
    )
    .sort((a, b) => a.date - b.date)[0];

  if (nextScotland) {
    return `SCOTLAND WATCH, / ${nextScotland.home} v ${nextScotland.away}, ${ukTime(nextScotland.date)} ${dayLabel(nextScotland.date)}.`;
  }

  const lastScotland = games
    .filter((g) => g.isFinished && (g.home === "Scotland" || g.away === "Scotland"))
    .sort((a, b) => b.date - a.date)[0];

  if (lastScotland) {
    return `SCOTLAND RESULT, / ${scoreLine(lastScotland)}.`;
  }

  return null;
}

function biggestWinUpdate(games) {
  const finished = games.filter((g) => g.isFinished);
  if (!finished.length) return null;

  const biggest = finished
    .map((g) => ({ ...g, margin: Math.abs(g.homeGoals - g.awayGoals) }))
    .sort((a, b) => b.margin - a.margin)[0];

  if (!biggest || biggest.margin === 0) return null;

  return `BIGGEST WIN, / ${scoreLine(biggest)}.`;
}

function goalFestUpdate(games) {
  const finished = games.filter((g) => g.isFinished);
  if (!finished.length) return null;

  const best = finished.sort((a, b) => b.totalGoals - a.totalGoals)[0];

  return `GOAL FEST, / ${scoreLine(best)} had ${best.totalGoals} goals.`;
}

function bestAttackUpdate(games) {
  const goals = {};

  for (const game of games.filter((g) => g.isFinished)) {
    goals[game.home] = (goals[game.home] || 0) + game.homeGoals;
    goals[game.away] = (goals[game.away] || 0) + game.awayGoals;
  }

  const top = Object.entries(goals).sort((a, b) => b[1] - a[1])[0];
  if (!top) return null;

  return `TOP ATTACK, / ${top[0]} have scored ${top[1]}.`;
}

function bestDefenceUpdate(games) {
  const conceded = {};
  const played = {};

  for (const game of games.filter((g) => g.isFinished)) {
    conceded[game.home] = (conceded[game.home] || 0) + game.awayGoals;
    conceded[game.away] = (conceded[game.away] || 0) + game.homeGoals;
    played[game.home] = (played[game.home] || 0) + 1;
    played[game.away] = (played[game.away] || 0) + 1;
  }

  const top = Object.entries(conceded)
    .filter(([team]) => played[team] >= 2)
    .sort((a, b) => a[1] - b[1])[0];

  if (!top) return null;

  return `BEST DEFENCE, / ${top[0]} have conceded ${top[1]}.`;
}

function groupSnapshotUpdate(games) {
  const tables = buildGroupTables(games);
  const groupLetters = Object.keys(tables).sort();
  if (!groupLetters.length) return null;

  const group = pick(groupLetters, seedFrom(getLondonTime(), 900));
  const top = topGroupTeams(tables[group]);

  if (!top.length) return null;

  return `GROUP ${group}, / ${top.map((t) => `${t.team} ${t.pts}`).join(", ")}.`;
}

function unbeatenUpdate(games) {
  const tables = buildGroupTables(games);
  const teams = {};

  for (const group of Object.values(tables)) {
    for (const team of Object.values(group)) {
      teams[team.team] = {
        team: team.team,
        played: team.played,
        lost: 0
      };
    }
  }

  for (const game of games.filter((g) => g.isFinished)) {
    if (game.homeGoals > game.awayGoals) teams[game.away].lost += 1;
    if (game.awayGoals > game.homeGoals) teams[game.home].lost += 1;
  }

  const unbeaten = Object.values(teams)
    .filter((t) => t.played >= 2 && t.lost === 0)
    .map((t) => t.team);

  if (!unbeaten.length) return null;

  const chosen = pick(unbeaten, seedFrom(getLondonTime(), 1200));
  return `UNBEATEN, / ${chosen} still haven't lost.`;
}

function knockoutCountdownUpdate(games) {
  const now = new Date();
  const knockout = games
    .filter((g) => g.type !== "group" && g.date > now)
    .sort((a, b) => a.date - b.date)[0];

  if (!knockout) return null;

  const diffDays = Math.ceil((knockout.date - now) / (1000 * 60 * 60 * 24));
  return `KNOCKOUTS, / Round of 32 starts in ${diffDays} days.`;
}

async function makeWorldCupUpdate(time24) {
  try {
    const games = await getGames();

    const live = liveUpdate(games);
    if (live) return live;

    const updateTypes = [
      scotlandWatchUpdate,
      todayGamesUpdate,
      upcomingUpdate,
      recentResultUpdate,
      biggestWinUpdate,
      goalFestUpdate,
      bestAttackUpdate,
      bestDefenceUpdate,
      groupSnapshotUpdate,
      unbeatenUpdate,
      knockoutCountdownUpdate
    ];

async function makePoem(time24) {
  const useWorldCup = WORLD_CUP_MODE && Math.abs(seedFrom(time24, 42)) % 10 < 8;

  if (useWorldCup) {
    const update = await makeWorldCupUpdate(time24);
    if (update) return update;
  }

  return makeFamilyPoem(time24);
}

app.get("/", (_req, res) => {
  res.json({
    success: true,
    name: "Glasgow Poem Clock",
    message: "Server is running",
    mode: WORLD_CUP_MODE ? "World Cup Clock" : "Family Clock"
  });
});

app.post("/api/v1/clock/status", (req, res) => {
  const now = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");

  res.json({
    success: true,
    device: {
      screenId: req.body?.screenId || "unknown",
      buildId: req.body?.buildId || null,
      lastSeen: now,
      seen: 1,
      createdAt: now,
      isClaimed: true
    }
  });
});

app.post("/api/v1/clock/compose", async (req, res) => {
  const time24 = req.body?.time24 || getLondonTime();

  res.json({
    poemId: `glasgow-${time24.replace(":", "")}-${new Date().getDate()}`,
    time24,
    poem: await makePoem(time24),
    preferredFont: "PLAYFAIR",
    screensaver: false
  });
});

app.post("/api/v1/clock/likes/:poemId/mark", (_req, res) => {
  res.json({ success: true });
});

app.post("/api/v1/clock/likes/:poemId/unmark", (_req, res) => {
  res.json({ success: true });
});

app.post("/api/v1/clock/notes/:noteId/seen", (_req, res) => {
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`Glasgow Poem Clock running on port ${PORT}`);
});
