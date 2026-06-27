import express from "express";
import { getGames } from "./worldcup.js";
import { selectStory } from "./newsroom.js";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

function getLondonTime() {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).format(new Date());
}

app.get("/", (_req, res) => {
  res.json({
    success: true,
    name: "Glasgow World Cup Clock",
    mode: "World Cup Newsroom"
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

  try {
    const games = await getGames();
    const story = selectStory(games, time24);

    res.json({
      poemId: `worldcup-${story.key}-${Date.now()}`,
      time24,
      poem: `${story.title}, / ${story.body}`,
      preferredFont: "PLAYFAIR",
      screensaver: false
    });
  } catch {
    res.json({
      poemId: `worldcup-feed-error-${Date.now()}`,
      time24,
      poem: "WORLD CUP, / Feed waking up. Try again soon.",
      preferredFont: "PLAYFAIR",
      screensaver: false
    });
  }
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
  console.log(`World Cup Newsroom running on port ${PORT}`);
});
