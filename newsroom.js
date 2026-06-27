import { generateStories } from "./stories.js";
import { chooseStory } from "./history.js";

export function selectStory(games, time24) {
  const stories = generateStories(games, time24);
  return chooseStory(stories);
}
