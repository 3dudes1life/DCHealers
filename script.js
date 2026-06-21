const prompts = [
  "Today’s intention: I allow my body to soften and my breath to lead me back to calm.",
  "Grounding prompt: Place one hand on your heart and ask, ‘What part of me needs kindness today?’",
  "Energy reset: Release the need to solve everything at once. Come back to the next right breath.",
  "Reflection: Where have I been carrying tension that does not belong to me?",
  "Affirmation: I am safe to pause. I am allowed to receive support."
];

function generatePrompt() {
  const output = document.getElementById("prompt-output");
  const randomPrompt = prompts[Math.floor(Math.random() * prompts.length)];
  output.textContent = randomPrompt;
}
