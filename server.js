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

const familyFunny = [
  ["Gary said the jacket had some rizz", "The room said no at {time}."],
  ["Gary tried a phrase too young", "Eyes rolled hard at {time}."],
  ["Gary said the vibe was lit", "The children quit at {time}."],
  ["A modern word escaped his face", "The house went still at {time}."],
  ["Gary said no cap with pride", "Four souls sighed at {time}."]
];

const snoopy = [
  ["A carrier bag came into view", "Snoopy withdrew at {time}."],
  ["A harmless leaf moved by the door", "Snoopy no more at {time}."],
  ["The room was calm, the air serene", "Snoopy left the scene at {time}."],
  ["A biscuit packet made a crack", "Snoopy stepped back at {time}."],
  ["A cushion shifted on the floor", "Snoopy chose the door at {time}."]
];

const candice = [
  ["A cryptic clue refused to yield", "Still unrevealed at {time}."],
  ["Coffee warm and crossword due", "One more clue at {time}."],
  ["The crossword sat with quiet might", "One clue to fight at {time}."],
  ["A clue looked simple, then it grew", "Not quite true at {time}."],
  ["The pencil paused, the kettle blew", "Back to the clue at {time}."]
];

const alexandria = [
  ["Alexandria's pals came through", "The volume grew at {time}."],
  ["Nutella waited by the stack", "No turning back at {time}."],
  ["A pancake landed warm and sweet", "A perfect treat at {time}."],
  ["The group chat lit the room anew", "Laughter flew at {time}."],
  ["Nutella spread from edge to edge", "A solemn pledge at {time}."]
];

const food = [
  ["Di Maggio's called, the table gleamed", "Pizza dreamed at {time}."],
  ["A garlic bread appeared between", "A family scene at {time}."],
  ["The final slice sat looking proud", "Claims got loud at {time}."],
  ["Pancakes rose in golden stacks", "No one relaxed at {time}."],
  ["Nutella shone with quiet power", "Gone within the hour at {time}."]
];

const places = [
  ["Pollok Park was soft and green", "A gentle scene at {time}."],
  ["Pollokshields sat under rain", "Cosy again at {time}."],
  ["The Glasgow sky turned silver-grey", "Still a good day at {time}."],
  ["Rain tapped softly on the pane", "Home again at {time}."],
  ["The trees stood quiet, dark and green", "A peaceful scene at {time}."]
];

const phdResearch = [
  ["A paper opened something new", "A thought broke through at {time}."],
  ["One question led to three or four", "Ideas wanted more at {time}."],
  ["A finding glowed beneath the page", "Curiosity took the stage at {time}."],
  ["A theory shifted into view", "Something grew at {time}."],
  ["The data whispered, quiet and bright", "That feels right at {time}."]
];

const books = [
  ["A prison wall, a hidden clue", "Dantes knew at {time}."],
  ["The Count returned with patient grace", "Revenge took place at {time}."],
  ["A treasure waited out of view", "The plot broke through at {time}."],
  ["One more page, then maybe sleep", "Promises keep at {time}."],
  ["A secret passage, dark and true", "The story grew at {time}."]
];

const gym = [
  ["The weights were waiting, calm and still", "One more will at {time}."],
  ["Another set, another rep", "One strong step at {time}."],
  ["The gym bag waited by the door", "Back for more at {time}."],
  ["Iron plates and steady pace", "A stronger place at {time}."],
  ["The mirror knew, the playlist lied", "Still we tried at {time}."]
];

const poetic = [
  ["The evening settled, calm and blue", "The daylight flew at {time}."],
  ["A quiet light moved through the room", "Softly bloomed at {time}."],
  ["The rain drew rivers on the glass", "Minutes pass at {time}."],
  ["The kettle sang, the shadows grew", "The day felt new at {time}."],
  ["A small warm lamp held back the night", "All felt right at {time}."]
];

const categories = [
  ...familyFunny,
  ...snoopy,
  ...candice,
  ...alexandria,
  ...food,
  ...places,
  ...phdResearch,
  ...books,
  ...gym,
  ...poetic
];

function makePoem(time24) {
  const [hour, minute] = time24.split(":").map(Number);
  const day = new Date().getDate();
  const month = new Date().getMonth() + 1;

  const seed = hour * 60 + minute + day * 17 + month * 31;

  const [line1, line2] = pick(categories, seed);
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
      lastSeen: new Date().toISOString().replace(/\.\d{3}Z$/, "Z"),
      seen: 1,
      createdAt: new Date().toISOString().replace(/\.\d{3}Z$/, "Z"),
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
