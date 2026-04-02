export default {
  name: "upgrade",
  description: "Check Brewfile and Bunfile upgrades, then run them sequentially",
  category: "Maint",
  aliases: ["up"],
  when: "You want a single pass over managed Homebrew and Bun upgrades before applying them.",
  examples: [
    "nht upgrade",
    "nht up --dry-run",
    "nht upgrade --brew-only",
  ],
  notes: [
    "Supports --dry-run and --yes for safer automation.",
    "Runs Homebrew upgrades first, then Bun globals one package at a time.",
  ],
};
