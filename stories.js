import {
  liveGames,
  buildGroupTables,
  rankedGroup,
  scoreLine,
  scorerNameOnly,
  ukTime,
  dayLabel
} from "./worldcup.js";

function story(key, title, body, priority, cooldownMinutes = 30, expiresAt = null) {
  return {
    key,
    title,
    body,
    priority,
    cooldownMinutes,
    expiresAt
  };
}

function hoursFromNow(hours) {
  return new Date(Date.now() + hours * 60 * 60 * 1000);
}

function scorerCounts(games) {
  const counts = {};

  for (const game of games.filter((g) => g.isFinished || g.isLive)) {
    for (const scorer of [...game.homeScorers, ...game.awayScorers]) {
      if (scorer.includes("(OG)")) continue;
      const name = scorerNameOnly(scorer);
      if (!name) continue;
      counts[name] = (counts[name] || 0) + 1;
    }
  }

  return counts;
}

function addLiveStories(stories, games) {
  const live = liveGames(games)[0];
  if (!live) return;

  const status =
    String(live.time_elapsed).toLowerCase() === "live"
      ? "live now"
      : `${live.time_elapsed} mins`;

  stories.push(
    story(
      `live-score-${live.id}`,
      "LIVE NOW",
      `${scoreLine(live)}, ${status}.`,
      100,
      2,
      hoursFromNow(2)
    )
  );

  const scorers = [...live.homeScorers, ...live.awayScorers];

  if (scorers.length) {
    stories.push(
      story(
        `goalscorers-${live.id}`,
        "GOALSCORERS",
        scorers.slice(-3).join(", "),
        98,
        8,
        hoursFromNow(2)
      )
    );

    stories.push(
      story(
        `last-goal-${live.id}-${scorers.length}`,
        "LAST GOAL",
        scorers[scorers.length - 1],
        99,
        5,
        hoursFromNow(1)
      )
    );
  }

  if (live.totalGoals >= 3) {
    stories.push(
      story(
        `momentum-${live.id}`,
        "MOMENTUM",
        `${live.totalGoals} goals already in ${live.home} v ${live.away}.`,
        92,
        12,
        hoursFromNow(2)
      )
    );
  }

  const tables = buildGroupTables(games, true);
  const table = tables[live.group];

  if (table) {
    const leader = rankedGroup(table)[0];

    stories.push(
      story(
        `live-table-${live.group}`,
        "LIVE TABLE",
        `${leader.team} top Group ${live.group} on ${leader.pts} pts.`,
        90,
        10,
        hoursFromNow(2)
      )
    );
  }
}

function addFreshResultStories(stories, games) {
  const now = new Date();

  for (const game of games.filter((g) => g.isFinished)) {
    const hoursOld = (now - game.date) / (1000 * 60 * 60);

    if (hoursOld > 10) continue;

    stories.push(
      story(
        `fresh-result-${game.id}`,
        "FULL TIME",
        scoreLine(game),
        88,
        180,
        hoursFromNow(6)
      )
    );

    if (game.totalGoals >= 5) {
      stories.push(
        story(
          `fresh-goalfest-${game.id}`,
          "GOAL FEST",
          `${scoreLine(game)} had ${game.totalGoals} goals.`,
          91,
          240,
          hoursFromNow(12)
        )
      );
    }
  }
}

function addTodayStories(stories, games) {
  const now = new Date();
  const next24 = new Date(Date.now() + 24 * 60 * 60 * 1000);

  const upcoming = games
    .filter((g) => !g.isFinished && !g.isLive && g.date > now && g.date < next24)
    .sort((a, b) => a.date - b.date);

  for (const game of upcoming.slice(0, 4)) {
    stories.push(
      story(
        `today-${game.id}`,
        "COMING UP",
        `${game.home} v ${game.away}, ${ukTime(game.date)} ${dayLabel(game.date)}.`,
        72,
        90,
        game.date
      )
    );

    stories.push(
      story(
        `why-${game.id}`,
        "WHY IT MATTERS",
        `${game.home} v ${game.away} could reshape Group ${game.group}.`,
        80,
        120,
        game.date
      )
    );
  }
}

function addScotlandStories(stories, games) {
  const now = new Date();

  const live = games.find((g) => g.isLive && (g.home === "Scotland" || g.away === "Scotland"));

  if (live) {
    stories.push(
      story(
        `scotland-live-${live.id}`,
        "SCOTLAND LIVE",
        scoreLine(live),
        101,
        2,
        hoursFromNow(2)
      )
    );
    return;
  }

  const next = games
    .filter((g) => !g.isFinished && g.date > now && (g.home === "Scotland" || g.away === "Scotland"))
    .sort((a, b) => a.date - b.date)[0];

  if (next) {
    const hours = Math.max(1, Math.ceil((next.date - now) / (1000 * 60 * 60)));

    stories.push(
      story(
        `scotland-next-${next.id}`,
        "SCOTLAND WATCH",
        `${next.home} v ${next.away}, ${ukTime(next.date)} ${dayLabel(next.date)}.`,
        86,
        90,
        next.date
      )
    );

    stories.push(
      story(
        `scotland-countdown-${next.id}`,
        "COUNTDOWN",
        `${hours} hours until ${next.home} v ${next.away}.`,
        85,
        120,
        next.date
      )
    );
  }

  const recent = games
    .filter((g) => g.isFinished && (g.home === "Scotland" || g.away === "Scotland"))
    .sort((a, b) => b.date - a.date)[0];

  if (recent) {
    const hoursOld = (now - recent.date) / (1000 * 60 * 60);

    if (hoursOld < 12) {
      stories.push(
        story(
          `scotland-recent-${recent.id}`,
          "SCOTLAND RESULT",
          scoreLine(recent),
          82,
          180,
          hoursFromNow(6)
        )
      );
    }
  }
}

function addGroupStories(stories, games) {
  const tables = buildGroupTables(games, true);

  for (const [group, table] of Object.entries(tables)) {
    const ranked = rankedGroup(table);
    if (ranked.length < 3) continue;

    const topThreeGap = ranked[0].pts - ranked[2].pts;

    stories.push(
      story(
        `group-table-${group}`,
        `GROUP ${group}`,
        ranked.slice(0, 3).map((t) => `${t.team} ${t.pts}`).join(", "),
        58,
        240,
        hoursFromNow(24)
      )
    );

    if (topThreeGap <= 2) {
      stories.push(
        story(
          `group-drama-${group}`,
          "GROUP DRAMA",
          `Group ${group} top three split by ${topThreeGap} pts.`,
          76,
          180,
          hoursFromNow(24)
        )
      );
    }

    const playedEnough = ranked.every((t) => t.played >= 3);

    if (playedEnough) {
      stories.push(
        story(
          `group-winner-${group}`,
          "GROUP WINNER",
          `${ranked[0].team} finish top of Group ${group}.`,
          83,
          720,
          hoursFromNow(24)
        )
      );
    }
  }
}

function addTournamentStories(stories, games) {
  const finished = games.filter((g) => g.isFinished);

  if (!finished.length) return;

  const biggest = [...finished]
    .map((g) => ({ ...g, margin: Math.abs(g.homeGoals - g.awayGoals) }))
    .sort((a, b) => b.margin - a.margin)[0];

  if (biggest && biggest.margin > 0) {
    stories.push(
      story(
        "biggest-win",
        "BIGGEST WIN",
        scoreLine(biggest),
        64,
        360,
        hoursFromNow(24)
      )
    );
  }

  const goalFest = [...finished].sort((a, b) => b.totalGoals - a.totalGoals)[0];

  if (goalFest) {
    stories.push(
      story(
        "goal-fest",
        "GOAL FEST",
        `${scoreLine(goalFest)} had ${goalFest.totalGoals} goals.`,
        66,
        360,
        hoursFromNow(24)
      )
    );
  }

  const goals = {};
  const conceded = {};
  const played = {};

  for (const game of finished) {
    goals[game.home] = (goals[game.home] || 0) + game.homeGoals;
    goals[game.away] = (goals[game.away] || 0) + game.awayGoals;

    conceded[game.home] = (conceded[game.home] || 0) + game.awayGoals;
    conceded[game.away] = (conceded[game.away] || 0) + game.homeGoals;

    played[game.home] = (played[game.home] || 0) + 1;
    played[game.away] = (played[game.away] || 0) + 1;
  }

  const topAttack = Object.entries(goals).sort((a, b) => b[1] - a[1])[0];

  if (topAttack) {
    stories.push(
      story(
        "top-attack",
        "GOAL MACHINE",
        `${topAttack[0]} have scored ${topAttack[1]}.`,
        70,
        240,
        hoursFromNow(24)
      )
    );
  }

  const bestDefence = Object.entries(conceded)
    .filter(([team]) => played[team] >= 2)
    .sort((a, b) => a[1] - b[1])[0];

  if (bestDefence) {
    stories.push(
      story(
        "best-defence",
        "FORTRESS",
        `${bestDefence[0]} have conceded ${bestDefence[1]}.`,
        70,
        240,
        hoursFromNow(24)
      )
    );
  }
}

function addPlayerStories(stories, games) {
  const counts = scorerCounts(games);
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1]);

  if (!top.length) return;

  stories.push(
    story(
      "golden-boot",
      "GOLDEN BOOT",
      `${top[0][0]} has ${top[0][1]} goals.`,
      74,
      180,
      hoursFromNow(24)
    )
  );

  stories.push(
    story(
      "top-scorers",
      "TOP SCORERS",
      top.slice(0, 3).map(([name, goals]) => `${name} ${goals}`).join(", "),
      68,
      240,
      hoursFromNow(24)
    )
  );
}

function addKnockoutStories(stories, games) {
  const now = new Date();

  const nextKnockout = games
    .filter((g) => g.type !== "group" && g.date > now)
    .sort((a, b) => a.date - b.date)[0];

  if (!nextKnockout) return;

  const days = Math.ceil((nextKnockout.date - now) / (1000 * 60 * 60 * 24));

  stories.push(
    story(
      "knockout-countdown",
      "KNOCKOUTS",
      `Round of 32 starts in ${days} days.`,
      60,
      360,
      hoursFromNow(24)
    )
  );

  stories.push(
    story(
      "road-to-final",
      "ROAD TO FINAL",
      `First knockout game is ${ukTime(nextKnockout.date)} ${dayLabel(nextKnockout.date)}.`,
      59,
      360,
      hoursFromNow(24)
    )
  );
}

export function generateStories(games, time24) {
  const stories = [];

  addLiveStories(stories, games);
  addFreshResultStories(stories, games);
  addTodayStories(stories, games);
  addScotlandStories(stories, games);
  addGroupStories(stories, games);
  addPlayerStories(stories, games);
  addTournamentStories(stories, games);
  addKnockoutStories(stories, games);

  return stories;
}
