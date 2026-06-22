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

function makeSeed(time24) {
  const [hour, minute] = time24.split(":").map(Number);
  const now = new Date();
  return hour * 60 + minute + now.getDate() * 17 + (now.getMonth() + 1) * 31;
}

const exactTimePoems = {
  "07:03": [
    "Good morning, it's {time}",
    "Coffee for Candice, if you please."
  ],
  "12:01": [
    "Gary, it is {time}",
    "Time to get soup in your tum."
  ],
  "12:15": [
    "Gary, it is {time}",
    "Sausage rolls don't eat themselves."
  ],
  "15:10": [
    "Gary, it is {time}",
    "Take poor Snoopy for a pee."
  ],
  "15:30": [
    "It is {time}",
    "The kids are due, where will snacks be?"
  ],
  "15:35": [
    "It is {time}",
    "The snack requests arrive with glee."
  ],
  "15:45": [
    "It is {time}",
    "The snack negotiations begin to thrive."
  ]
};

const templates = [
  // Household / family
  ["It is {time}", "The kettle knows just what to do."],
  ["It is {time}", "A biscuit and a brew will do."],
  ["It is {time}", "Coffee for Candice, if you please."],
  ["It is {time}", "After-school snacks are the priority."],
  ["It is {time}", "The snack cupboard awaits inspection, you see."],
  ["It is {time}", "Someone has asked for more."],
  ["It is {time}", "The snack requests begin once more."],

  // Pancakes / Nutella
  ["It is {time}", "Pancakes landed on the plate."],
  ["It is {time}", "Nutella work is never done."],
  ["It is {time}", "Nutella vanished from view."],
  ["It is {time}", "Pancakes sound like tea to me."],
  ["It is {time}", "Nutella makes it feel like heaven."],
  ["It is {time}", "Pancakes would be rather fine."],

  // Candice / crosswords
  ["It is {time}", "Candice has another cryptic clue."],
  ["It is {time}", "Coffee, crossword, one more clue."],
  ["It is {time}", "A crossword clue still disagrees."],
  ["It is {time}", "One clue left, maybe more."],
  ["It is {time}", "Crossword time is looking fine."],

  // Alexandria
  ["It is {time}", "Alexandria's pals arrive."],
  ["It is {time}", "The front room is fully alive."],
  ["It is {time}", "Snack discussions start, you see."],
  ["It is {time}", "Pals, laughs, and snack-based tricks."],
  ["It is {time}", "Someone's laughing through the door."],

  // Snoopy
  ["It is {time}", "A carrier bag came into view."],
  ["It is {time}", "Snoopy quietly withdrew."],
  ["It is {time}", "Take poor Snoopy for a pee."],
  ["It is {time}", "A leaf appeared — emergency."],
  ["It is {time}", "Snoopy suspects the kitchen floor."],
  ["It is {time}", "Nothing happened. Snoopy's done."],
  ["It is {time}", "Snoopy checked if he survived."],

  // Gym
  ["It is {time}", "Time for reps and protein tricks."],
  ["It is {time}", "Gym bag packed and feeling keen."],
  ["It is {time}", "Weights won't lift themselves, mate."],
  ["It is {time}", "One more set will do just fine."],
  ["It is {time}", "Trainers on, no clever tricks."],

  // PhD / research, positive not stressy
  ["It is {time}", "A fresh idea came into view."],
  ["It is {time}", "Another thought is breaking through."],
  ["It is {time}", "Research questions multiply freely."],
  ["It is {time}", "One paper opens three thoughts more."],
  ["It is {time}", "Green exercise thoughts have begun."],
  ["It is {time}", "That finding might be worth a line."],

  // Count of Monte Cristo
  ["It is {time}", "Dantes knew what he must do."],
  ["It is {time}", "A secret passage came into view."],
  ["It is {time}", "The Count returns, eventually."],
  ["It is {time}", "A hidden treasure, one clue more."],
  ["It is {time}", "Revenge takes time, and that's just fine."],

  // Gary cringe
  ["It is {time}", "Gary mentioned rizz."],
  ["It is {time}", "Gary said the vibe was great."],
  ["It is {time}", "Gary said drip. The silence grew."],
  ["It is {time}", "Gary said slay. The kids said no way."],
  ["It is {time}", "Gary tried Gen Z tricks."],

  // Light poetic
  ["It is {time}", "Rain makes Glasgow almost heaven."],
  ["It is {time}", "The kitchen hums, the house alive."],
  ["It is {time}", "The rain begins its song again."]
];

function renderPoem(lines, time24) {
  const timeWords = timeToWords(time24);
  return lines.map((line) => line.replace("{time}", timeWords)).join(", / ");
}

function makePoem(time24) {
  if (exactTimePoems[time24]) {
    return renderPoem(exactTimePoems[time24], time24);
  }

  const seed = makeSeed(time24);
  const selected = pick(templates, seed);

  return renderPoem(selected, time24);
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
