export default {
  name: "decision",
  description: "Add a formatted decision-log entry to the README",
  category: "Docs",
  aliases: ["dec", "log"],
  when: "You made a decision worth recording and want the README decision log updated consistently.",
  examples: [
    "nht decision \"Use Bun for local dev tools\"",
  ],
  notes: [
    "Prompts for follow-up context when the initial notes are too thin.",
    "Writes into the README decision log markers instead of inventing a new file format.",
  ],
};
