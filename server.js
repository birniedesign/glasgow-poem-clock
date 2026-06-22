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

function pick(items, seed) {
  return items[Math.abs(seed) % items.length];
}

const household = [
  ["Gary, it's twelve oh one", "Time to get soup in your tum."],
  ["Gary, it's quarter past twelve", "Sausage rolls don't eat themselves."],
  ["It's ten past three", "Take poor Snoopy for a pee."],
  ["It's half past three", "The kids are due, where will snacks be?"],
  ["Good morning, it's seven oh three", "Coffee for Candice, if you please."],
  ["It's quarter past three", "After-school snacks are the priority."],
  ["It's twenty past three", "The snack cupboard awaits inspection, you see."],
  ["It's twenty-five to four", "Someone has asked for more."],
  ["It's quarter to four", "The snack requests begin once more."],
  ["It's ten past two", "A biscuit and a brew will do."]
];

const teaCoffee = [
  ["It's quarter past three", "Put the kettle on for tea."],
  ["It's twenty-two past two", "Time for a proper brew."],
  ["It's half past one", "Tea and pancakes, anyone?"],
  ["It's seven oh three", "Coffee for Candice, if you please."],
  ["It's ten past two", "The kettle knows what to do."],
  ["It's twenty past one", "Coffee first, then work gets done."],
  ["It's quarter to three", "Surely that's close enough for tea."],
  ["It's five past four", "One more brew, then maybe more."]
];

const pancakesNutella = [
  ["It's quarter past eight", "Pancakes landed on the plate."],
  ["It's half past one", "Nutella work is never done."],
  ["It's twenty-two past two", "Nutella vanished from view."],
  ["It's quarter past three", "Pancakes sound like tea to me."],
  ["It's ten past eleven", "Nutella makes it feel like heaven."],
  ["It's twenty-five past nine", "Pancakes would be rather fine."],
  ["It's half past ten", "Nutella calls again."]
];

const candice = [
  ["It's quarter past two", "Candice has another cryptic clue."],
  ["It's twenty-two past two", "Coffee, crossword, one more clue."],
  ["It's half past three", "A crossword clue still disagrees."],
  ["It's quarter to four", "One clue left, maybe more."],
  ["It's ten past nine", "Crossword time is looking fine."],
  ["It's twenty past ten", "That clue is back again."]
];

const alexandria = [
  ["It's quarter past five", "Alexandria's pals arrive."],
  ["It's half past five", "The front room is fully alive."],
  ["It's twenty-two past two", "Nutella vanished from view."],
  ["It's ten past three", "Snack discussions start, you see."],
  ["It's quarter to six", "Pals, laughs, and snack-based tricks."],
  ["It's twenty past four", "Someone's laughing through the door."]
];

const snoopy = [
  ["It's quarter past two", "A carrier bag came into view."],
  ["It's twenty-two past two", "Snoopy quietly withdrew."],
  ["It's ten past three", "Take poor Snoopy for a pee."],
  ["It's quarter past three", "A leaf appeared — emergency."],
  ["It's half past four", "Snoopy suspects the kitchen floor."],
  ["It's twenty past one", "Nothing happened. Snoopy's done."],
  ["It's quarter to five", "Snoopy checked if he survived."],
  ["It's five past six", "Snoopy fears suspicious sticks."]
];

const gym = [
  ["It's quarter past six", "Time for reps and protein tricks."],
  ["It's half past seven", "Gym bag packed, feeling eleven."],
  ["It's twenty past eight", "Weights won't lift themselves, mate."],
  ["It's quarter to nine", "One more set will do just fine."],
  ["It's ten past six", "Trainers on, no clever tricks."],
  ["It's half past five", "The gym routine is still alive."]
];

const phd = [
  ["It's quarter past two", "A fresh idea came into view."],
  ["It's twenty-two past two", "Another thought is breaking through."],
  ["It's half past three", "Research questions multiply freely."],
  ["It's quarter to four", "One paper opens three thoughts more."],
  ["It's ten past one", "Green exercise thoughts have begun."],
  ["It's twenty past nine", "That finding might be worth a line."],
  ["It's quarter past ten", "That paper's interesting again."]
];

const monteCristo = [
  ["It's quarter past two", "Dantes knew what he must do."],
  ["It's twenty-two past two", "A secret passage came into view."],
  ["It's half past three", "The Count returns, eventually."],
  ["It's quarter to four", "A hidden treasure, one clue more."],
  ["It's ten past nine", "Revenge takes time, and that's just fine."]
];

const garyCringe = [
  ["It's two oh six", "Gary mentioned rizz."],
  ["It's quarter past eight", "Gary said the vibe was great."],
  ["It's twenty past two", "Gary said drip. The silence grew."],
  ["It's five past four", "Gary said slay. The kids said no more."],
  ["It's ten past six", "Gary tried Gen Z tricks."],
  ["It's quarter to nine", "Gary said fire. Nobody's fine."]
];

const poetic = [
  ["It's quarter past seven", "Rain makes Glasgow almost heaven."],
  ["It's half past eight", "The evening settles by the gate."],
  ["It's twenty-two past two", "The grey sky turns a softer blue."],
  ["It's quarter to five", "The kitchen hums, the house alive."],
  ["It's ten past ten", "The rain begins its song again."]
];

const categories = [
  ...household,
  ...household,
  ...household,
  ...teaCoffee,
  ...teaCoffee,
  ...pancakesNutella,
  ...pancakesNutella,
  ...candice,
  ...alexandria,
  ...snoopy,
  ...gym,
  ...phd,
  ...phd,
  ...monteCristo,
  ...garyCringe,
  ...poetic
];

function makePoem(time24) {
  const [hour, minute] = time24.split(":").map(Number);
  const day = new Date().getDate();
  const month = new Date().getMonth() + 1;

  const seed = hour * 60 + minute + day * 17 + month * 31;

  const [line1, line2] = pick(categories, seed);
  return `${line1}, / ${line2}`;
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

app.post("/api/v1/clock/compose", (req, res) => {
  const time24 = req.body?.time24 || getLondonTime();

  res.json({
    poemId: `glasgow-${time24.replace(":", "")}-${new Date().getDate()}`,
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
