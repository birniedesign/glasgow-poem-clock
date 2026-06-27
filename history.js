const shown = new Map();

export function wasRecentlyShown(key, cooldownMinutes) {
  const lastShown = shown.get(key);
  if (!lastShown) return false;

  const elapsed = Date.now() - lastShown;
  return elapsed < cooldownMinutes * 60 * 1000;
}

export function markShown(key) {
  shown.set(key, Date.now());
}

export function chooseStory(stories) {
  const now = new Date();

  const valid = stories
    .filter((story) => !story.expiresAt || story.expiresAt > now)
    .sort((a, b) => b.priority - a.priority);

  const fresh = valid.find(
    (story) => !wasRecentlyShown(story.key, story.cooldownMinutes || 30)
  );

  const chosen = fresh || valid[0] || {
    key: "fallback",
    title: "WORLD CUP",
    body: "More stories coming soon.",
    priority: 1,
    cooldownMinutes: 1
  };

  markShown(chosen.key);
  return chosen;
}
