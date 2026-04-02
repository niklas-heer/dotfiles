export default {
  name: "smart-commit",
  description: "Group and commit changes with AI-written messages",
  category: "Git",
  aliases: ["sc", "commit"],
  when: "You want AI to split a dirty worktree or staged snapshot into reviewable commits with solid messages.",
  examples: [
    "nht smart-commit",
    "nht sc --dry-run",
  ],
  notes: [
    "Operates on the staged snapshot if anything is already staged; otherwise it uses the worktree.",
    "Leaves your real git index alone while it builds commits.",
  ],
};
