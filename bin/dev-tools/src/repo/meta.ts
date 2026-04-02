export default {
  name: "repo",
  description: "Pick a repository and print its path",
  category: "Nav",
  aliases: ["r"],
  when: "You want to jump into one of your local repositories without remembering the exact path.",
  examples: [
    "nht repo",
    "nht repo chez",
  ],
  notes: [
    "When launched through the shell wrapper it can cd your current shell into the selected repo.",
  ],
};
