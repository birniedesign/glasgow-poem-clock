import express from "express";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

const numberWords = [
  "zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine",
  "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen",
  "seventeen", "eighteen", "nineteen", "twenty", "twenty-one", "twenty-two",
  "twenty-three", "twenty-four", "twenty-five", "twenty-six", "twenty-seven",
  "twenty-eight", "twenty-nine", "thirty", "thirty-one", "thirty-two",
  "thirty-three", "thirty-four", "thirty-five", "thirty-six", "thirty-seven",
  "thirty-eight", "thirty-nine", "forty", "forty-one", "forty-two",
  "forty-three", "forty-four", "forty-five", "forty-six", "forty-seven",
  "forty-eight", "forty-nine", "fifty", "fifty-one", "fifty-two",
  "fifty-three", "fifty-four", "fifty-five", "fifty-six", "fifty-seven",
  "fifty-eight", "fifty-nine"
];

const openers = [
  "A carrier bag flew into view",
  "Gary tried a little rizz",
  "UNO cards were spread between",
  "Candice paused upon a clue",
  "A pizza box began to lean",
  "Pollok Park looked soft and green",
  "A doorbell rang, the room withdrew",
  "Alexandria’s pals came through",
  "The kettle clicked, the mugs were due",
  "Di Maggio’s lights were warm and true",
  "Snoopy sensed a minor scene",
  "A harmless leaf crossed the floor"
];

const closers = [
  "Snoopy fled at {time}.",
  "The kids said no at {time}.",
  "Claims were made at {time}.",
  "Coffee helped at {time}.",
  "Pizza won at {time}.",
  "Clues were chewed at {time}.",
  "Chaos bloomed at {time}.",
  "Glasgow smiled at {time}.",
  "The house laughed loud at {time}.",
  "Nothing happened at {time}."
];

function hourWord(hour) {
  return numberWords[hour % 12 || 12];
}

function timeToWords(time24) {
  const [hour, minute] = time24.split(":").map(Number);

  if (minute === 0) {
    return `${hourWord(hour)} o’clock`;
  }

  if (minute < 10) {
    return `${hourWord(hour)} oh ${numberWords[minute]}`;
  }

  return `${hourWord(hour)} ${numberWords[minute]}`;
}

function getLondonTime() {
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });

  return formatter.format(new Date());
}

function pick(items, seed) {
  return items[Math.abs(seed) % items.length];
}

function makePoem(time24) {
  const [hour, minute] = time24.split(":").map(Number);
  const seed = hour * 60 + minute + new Date().getDate();

  const opener = pick(openers, seed);
  const closer = pick(closers, seed + 5).replace("{time}", timeToWords(time24));

  return `${opener}, / ${closer}`;
}

app.get("/", (_req, res) => {
  res.json({
    success: true,
    name: "Glasgow Poem Clock",
    message: "Server is running"
  });
});

app.post("/api/v1/clock/status", (req, res) => {
  res.json({
    success: true,
    device: {
      screenId: req.body?.screenId || "unknown",
      buildId: req.body?.buildId || null,
      lastSeen: new Date().toISOString(),
      seen: 1,
      isClaimed: true
    }
  });
});

app.post("/api/v1/clock/compose", (req, res) => {
  const time24 = req.body?.time24 || getLondonTime();

  res.json({
    poemId: `glasgow-${time24.replace(":", "")}`,
    time24,
    poem: makePoem(time24),
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