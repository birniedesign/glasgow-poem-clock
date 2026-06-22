import express from "express";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

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

function pick(items, seed) {
  return items[Math.abs(seed) % items.length];
}

const poems = [
  ["A carrier bag came into view", "Snoopy fled at {time}."],
  ["A harmless leaf slid by the door", "Snoopy left at {time}."],
  ["The room was calm, the air serene", "Snoopy worried at {time}."],
  ["A doorbell made a tiny din", "Snoopy vanished at {time}."],
  ["Gary said his jacket had rizz", "The kids said no at {time}."],
  ["Gary tried to say 'no cap'", "The room went flat at {time}."],
  ["Gary said his trainers were fire", "Eyes rolled hard at {time}."],
  ["Gary claimed he came to slay", "Breakfast stopped at {time}."],
  ["UNO cards were spread between", "Accusations at {time}."],
  ["A draw-four caused a family row", "Justice waited at {time}."],
  ["Pizza boxes stacked between", "Garlic breath at {time}."],
  ["Di Maggio's called, the table gleamed", "Pizza won at {time}."],
  ["Candice pondered one more clue", "Coffee cooled at {time}."],
  ["A cryptic clue refused to bend", "Still no answer at {time}."],
  ["Alexandria's pals came through", "The volume rose at {time}."],
  ["The kettle clicked, the mugs were due", "PhD thoughts at {time}."],
  ["Pollok Park was soft and green", "Cold noses out at {time}."],
  ["Pollokshields sat under rain", "Still quite cosy at {time}."],
];

function makePoem(time24) {
  const [hour, minute] = time24.split(":").map(Number);
  const day = new Date().getDate();
  const seed = hour * 60 + minute + day;

  const [line1, line2] = pick(poems, seed);
  return `${line1}, / ${line2.replace("{time}", timeToWords(time24))}`;
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
