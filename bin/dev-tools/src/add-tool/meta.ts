export default {
  name: "add-tool",
  description: "Add a Brewfile or Bunfile package with an AI-written comment",
  category: "Setup",
  aliases: ["at", "add"],
  when: "You want to install a new CLI dependency and keep your dotfiles manifests documented.",
  examples: [
    "nht add-tool glow",
    "nht add-tool --bun npm-check-updates",
  ],
  notes: [
    "Chooses Brewfile or Bunfile interactively unless you pass --brew or --bun.",
    "Supports --dry-run before it writes either manifest.",
  ],
};
