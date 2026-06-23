import express from "express";
import fs from "fs";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

const WORLDCUP_API = "https://worldcup26.ir/get/games";

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

function pickPoem(poems, time24) {
  const [hour, minute] = time24.split(":").map(Number);
  const now = new Date();
  const seed = hour * 97 + minute * 31 + now.getDate() * 17 + now.getMonth() * 13;
  return poems[Math.abs(seed) % poems.length];
}

function makeFamilyPoem(time24) {
  const poem = pickPoem(loadPoems(), time24);
  return `It's ${timeToWords(time24)}, / ${poem.line2}`;
}

function parseEasternDate(value) {
  const [datePart, timePart] = value.split(" ");
  const [month, day, year] = datePart.split("/").map(Number);
  const [hour, minute] = timePart.split(":").map(Number);
  return new Date(Date.UTC(year, month - 1, day, hour + 4, minute));
}

function ukTimeWords(date) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    hour: "numeric",
    minute: "2-digit",
    hour12: false
  }).format(date);
}

function teamName(game, side) {
  return (
    game[`${side}_team_name_en`] ||
    game[`${side}_team_label`] ||
    "TBD"
  );
}

async function makeWorldCupUpdate() {
  try {
    const response = await fetch(WORLDCUP_API);
    const data = await response.json();
    const games = data.games || [];
    const now = new Date();

    const parsed = games.map((game) => ({
      ...game,
      date: parseEasternDate(game.local_date)
    }));

    const live = parsed.find((game) =>
      game.finished === "FALSE" &&
      game.time_elapsed &&
      game.time_elapsed !== "notstarted"
    );

    if (live) {
      return `World Cup live, / ${teamName(live, "home")} ${live.home_score} ${teamName(live, "away")} ${live.away_score}`;
    }

    const upcoming = parsed
      .filter((game) => game.finished === "FALSE" && game.date > now)
      .sort((a, b) => a.date - b.date)[0];

    if (upcoming) {
      return `World Cup next, / ${teamName(upcoming, "home")} v ${teamName(upcoming, "away")} at ${ukTimeWords(upcoming.date)}.`;
    }

    const recent = parsed
      .filter((game) => game.finished === "TRUE" && game.date < now)
      .sort((a, b) => b.date - a.date)[0];

    if (recent) {
      return `World Cup result, / ${teamName(recent, "home")} ${recent.home_score} ${teamName(recent, "away")} ${recent.away_score}.`;
    }

    return null;
  } catch {
    return null;
  }
}

async function makePoem(time24) {
  const [, minute] = time24.split(":").map(Number);

  if (minute % 5 === 0) {
    const update = await makeWorldCupUpdate();
    if (update) return update;
  }

  return makeFamilyPoem(time24);
}

app.get("/", (_req, res) => {
  res.json({
    success: true,
    name: "Glasgow Poem Clock",
    message: "Server is running"
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
