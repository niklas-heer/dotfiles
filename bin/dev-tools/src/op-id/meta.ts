export default {
  name: "op-id",
  description: "Find a 1Password item by name and print its UUID",
  category: "Ops",
  aliases: ["op", "1p"],
  when: "You know the item roughly by name and need its stable 1Password UUID fast.",
  examples: [
    "nht op-id github",
    "nht op-id --vault Personal openrouter",
  ],
  notes: [
    "Copies the selected UUID to the clipboard when a system clipboard command is available.",
  ],
};
