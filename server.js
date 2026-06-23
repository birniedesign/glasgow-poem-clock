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

function seedFrom(time24, salt = 0) {
  const [hour, minute] = time24.split(":").map(Number);
  const now = new Date();
  return hour * 97 + minute * 31 + now.getDate() * 17 + now.getMonth() * 13 + salt;
}

function pick(items, seed) {
  if (!items || items.length === 0) return null;
  return items[Math.abs(seed) % items.length];
}

function loadPoems() {
  return JSON.parse(fs.readFileSync("./poems.json", "utf8"));
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

function scoreLine(game) {
  return `${game.home} ${cleanScore(game.home_score)}-${cleanScore(game.away_score)} ${game.away}`;
}

function cleanScorerName(text) {
  return String(text)
    .replace(/[{}"]/g, "")
    .replace(/[“”]/g, "")
    .replace(/,/g, "")
    .trim();
}

function parseScorers(raw) {
  if (!raw || raw === "null") return [];

  return String(raw)
    .replace(/[{}]/g, "")
    .split("\",\"")
    .map(cleanScorerName)
    .filter(Boolean);
}

function scorerNameOnly(scorer) {
  return scorer
    .replace(/\s+\d.*$/, "")
    .replace(/\s+\(OG\).*$/, "")
    .trim();
}

async function getGames() {
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

function liveGames(games) {
  return games.filter((g) => g.isLive);
}

function liveScoreUpdate(games) {
  const live = liveGames(games)[0];
  if (!live) return null;

  const status =
    String(live.time_elapsed).toLowerCase() === "live"
      ? "live now"
      : `${live.time_elapsed} mins`;

  return `LIVE NOW, / ${scoreLine(live)}, ${status}.`;
}

function liveGoalscorersUpdate(games) {
  const live = liveGames(games)[0];
  if (!live) return null;

  const scorers = [...live.homeScorers, ...live.awayScorers].slice(-3);
  if (!scorers.length) return liveScoreUpdate(games);

  return `GOALSCORERS, / ${scorers.join(", ")}.`;
}

function lastGoalUpdate(games) {
  const live = liveGames(games)[0];
  if (!live) return null;

  const scorers = [...live.homeScorers, ...live.awayScorers];
  const last = scorers[scorers.length - 1];

  if (!last) return liveScoreUpdate(games);

  return `LAST GOAL, / ${last}.`;
}

function liveMomentumUpdate(games) {
  const live = liveGames(games)[0];
  if (!live) return null;

  if (live.totalGoals >= 3) {
    return `MOMENTUM, / ${live.totalGoals} goals already in ${live.home} v ${live.away}.`;
  }

  return `LIVE WATCH, / ${scoreLine(live)}.`;
}

function buildGroupTables(games, includeLive = false) {
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

function topGroupTeams(table) {
  return Object.values(table)
    .sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf)
    .slice(0, 3);
}

function liveGroupImpactUpdate(games) {
  const live = liveGames(games)[0];
  if (!live || live.type !== "group") return null;

  const tables = buildGroupTables(games, true);
  const table = tables[live.group];
  if (!table) return null;

  const top = topGroupTeams(table);
  const leader = top[0];

  if (!leader) return null;

  return `LIVE TABLE, / ${leader.team} top Group ${live.group} on ${leader.pts} pts.`;
}

function qualificationUpdate(games) {
  const tables = buildGroupTables(games, true);
  const messages = [];

  for (const [group, table] of Object.entries(tables)) {
    const top = topGroupTeams(table);
    for (const team of top.slice(0, 2)) {
      if (team.played >= 2 && team.pts >= 4) {
        messages.push(`QUALIFIED, / ${team.team} look set for R32.`);
      }
    }
  }

  return messages[0] || null;
}

function eliminationUpdate(games) {
  const tables = buildGroupTables(games, true);
  const messages = [];

  for (const table of Object.values(tables)) {
    for (const team of Object.values(table)) {
      if (team.played >= 2 && team.pts === 0) {
        messages.push(`OUT, / ${team.team} are in trouble.`);
      }
    }
  }

  return messages[0] || null;
}

function upcomingUpdate(games) {
  const now = new Date();

  const upcoming = games
    .filter((g) => !g.isFinished && !g.isLive && g.date > now)
    .sort((a, b) => a.date - b.date)[0];

  if (!upcoming) return null;

  return `COMING UP, / ${upcoming.home} v ${upcoming.away}, ${ukTime(upcoming.date)} ${dayLabel(upcoming.date)}.`;
}

function todayGamesUpdate(games) {
  const now = new Date();

  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/London"
  }).format(now);

  const todayGames = games
    .filter((g) => {
      const gameDay = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Europe/London"
      }).format(g.date);

      return gameDay === today && !g.isFinished && !g.isLive;
    })
    .sort((a, b) => a.date - b.date);

  if (!todayGames.length) return null;

  const game = todayGames[0];
  return `TODAY, / ${game.home} v ${game.away}, ${ukTime(game.date)}.`;
}

function scotlandWatchUpdate(games) {
  const now = new Date();

  const liveScotland = games.find(
    (g) => g.isLive && (g.home === "Scotland" || g.away === "Scotland")
  );

  if (liveScotland) {
    return `SCOTLAND LIVE, / ${scoreLine(liveScotland)}.`;
  }

  const nextScotland = games
    .filter(
      (g) =>
        !g.isFinished &&
        !g.isLive &&
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

function scotlandCountdownUpdate(games) {
  const now = new Date();

  const nextScotland = games
    .filter(
      (g) =>
        !g.isFinished &&
        g.date > now &&
        (g.home === "Scotland" || g.away === "Scotland")
    )
    .sort((a, b) => a.date - b.date)[0];

  if (!nextScotland) return null;

  const hours = Math.max(1, Math.ceil((nextScotland.date - now) / (1000 * 60 * 60)));

  return `COUNTDOWN, / ${hours} hours until ${nextScotland.home} v ${nextScotland.away}.`;
}

function scotlandGroupPositionUpdate(games) {
  const tables = buildGroupTables(games, true);
  const table = tables.C;
  if (!table || !table.Scotland) return null;

  const ranked = topGroupTeams(table);
  const index = ranked.findIndex((t) => t.team === "Scotland");

  if (index === -1) return `SCOTLAND WATCH, / Scotland are outside Group C top three.`;

  return `SCOTLAND WATCH, / Scotland are ${index + 1}${index === 0 ? "st" : index === 1 ? "nd" : "rd"} in Group C.`;
}

function recentResultUpdate(games) {
  const recent = games
    .filter((g) => g.isFinished)
    .sort((a, b) => b.date - a.date)[0];

  if (!recent) return null;

  return `FULL TIME, / ${scoreLine(recent)}.`;
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

function biggestUpsetUpdate(games) {
  const finished = games.filter((g) => g.isFinished && g.homeGoals !== g.awayGoals);
  if (!finished.length) return null;

  const oneNil = finished.find((g) => g.totalGoals === 1);
  if (oneNil) return `UPSET ALERT, / ${scoreLine(oneNil)}.`;

  return null;
}

function goalFestUpdate(games) {
  const finished = games.filter((g) => g.isFinished);
  if (!finished.length) return null;

  const best = finished.sort((a, b) => b.totalGoals - a.totalGoals)[0];

  return `GOAL FEST, / ${scoreLine(best)} had ${best.totalGoals} goals.`;
}

function bestAttackUpdate(games) {
  const goals = {};

  for (const game of games.filter((g) => g.isFinished || g.isLive)) {
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
  const tables = buildGroupTables(games, true);
  const groupLetters = Object.keys(tables).sort();
  if (!groupLetters.length) return null;

  const group = pick(groupLetters, seedFrom(getLondonTime(), 900));
  const top = topGroupTeams(tables[group]);

  if (!top.length) return null;

  return `GROUP ${group}, / ${top.map((t) => `${t.team} ${t.pts}`).join(", ")}.`;
}

function unbeatenUpdate(games) {
  const tables = buildGroupTables(games, true);
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
    if (game.homeGoals > game.awayGoals && teams[game.away]) teams[game.away].lost += 1;
    if (game.awayGoals > game.homeGoals && teams[game.home]) teams[game.home].lost += 1;
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

function goldenBootUpdate(games) {
  const scorerCounts = {};

  for (const game of games.filter((g) => g.isFinished || g.isLive)) {
    for (const scorer of [...game.homeScorers, ...game.awayScorers]) {
      if (scorer.includes("(OG)")) continue;
      const name = scorerNameOnly(scorer);
      if (!name) continue;
      scorerCounts[name] = (scorerCounts[name] || 0) + 1;
    }
  }

  const top = Object.entries(scorerCounts).sort((a, b) => b[1] - a[1])[0];
  if (!top) return null;

  return `GOLDEN BOOT, / ${top[0]} has ${top[1]} goals.`;
}

function topScorersUpdate(games) {
  const scorerCounts = {};

  for (const game of games.filter((g) => g.isFinished || g.isLive)) {
    for (const scorer of [...game.homeScorers, ...game.awayScorers]) {
      if (scorer.includes("(OG)")) continue;
      const name = scorerNameOnly(scorer);
      if (!name) continue;
      scorerCounts[name] = (scorerCounts[name] || 0) + 1;
    }
  }

  const top = Object.entries(scorerCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  if (!top.length) return null;

  return `TOP SCORERS, / ${top.map(([name, goals]) => `${name} ${goals}`).join(", ")}.`;
}

async function makeWorldCupUpdate(time24, games) {
  const live = liveGames(games);

  if (live.length) {
    const liveUpdates = [
      liveScoreUpdate,
      liveGoalscorersUpdate,
      lastGoalUpdate,
      liveMomentumUpdate,
      liveGroupImpactUpdate,
      qualificationUpdate,
      eliminationUpdate
    ];

    const start = Math.abs(seedFrom(time24, 3000)) % liveUpdates.length;

    for (let i = 0; i < liveUpdates.length; i++) {
      const update = liveUpdates[(start + i) % liveUpdates.length](games);
      if (update) return update;
    }
  }

  const updateTypes = [
    scotlandWatchUpdate,
    scotlandCountdownUpdate,
    scotlandGroupPositionUpdate,
    todayGamesUpdate,
    upcomingUpdate,
    recentResultUpdate,
    groupSnapshotUpdate,
    qualificationUpdate,
    eliminationUpdate,
    goldenBootUpdate,
    topScorersUpdate,
    biggestWinUpdate,
    biggestUpsetUpdate,
    goalFestUpdate,
    bestAttackUpdate,
    bestDefenceUpdate,
    unbeatenUpdate,
    knockoutCountdownUpdate
  ];

  const start = Math.abs(seedFrom(time24, 2000)) % updateTypes.length;

  for (let i = 0; i < updateTypes.length; i++) {
    const update = updateTypes[(start + i) % updateTypes.length](games);
    if (update) return update;
  }

  return null;
}

async function makePoem(time24) {
  if (WORLD_CUP_MODE) {
    try {
      const games = await getGames();

      if (liveGames(games).length) {
        return await makeWorldCupUpdate(time24, games);
      }

      const useWorldCup = Math.abs(seedFrom(time24, 42)) % 10 < 8;

      if (useWorldCup) {
        const update = await makeWorldCupUpdate(time24, games);
        if (update) return update;
      }
    } catch {
      // If the World Cup API fails, fall back to family poem.
    }
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
