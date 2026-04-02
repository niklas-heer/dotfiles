import { createInterface } from "node:readline/promises";

type PromptIo = {
  input?: typeof process.stdin;
  output?: typeof process.stdout;
};

function createPromptIo(io: PromptIo = {}) {
  return {
    input: io.input ?? process.stdin,
    output: io.output ?? process.stdout,
  };
}

async function promptForLine(question: string, io: PromptIo = {}) {
  const { input, output } = createPromptIo(io);
  const rl = createInterface({ input, output });

  try {
    const answer = await rl.question(question);
    return answer.trim() || null;
  } finally {
    rl.close();
  }
}

export async function promptForNotes(io: PromptIo = {}) {
  const { input, output } = createPromptIo(io);

  if (!input.isTTY) {
    const piped = (await Bun.stdin.text()).trim();
    return piped || null;
  }

  output.write("Decision Notes\n");
  output.write("Dump your thoughts. Finish with an empty line. Ctrl+C cancels.\n\n");

  const rl = createInterface({ input, output });
  const lines: string[] = [];

  try {
    while (true) {
      const line = await rl.question(lines.length === 0 ? "> " : "  ");
      if (line.trim().length === 0) {
        break;
      }

      lines.push(line);
    }
  } finally {
    rl.close();
  }

  const notes = lines.join("\n").trim();
  return notes || null;
}

export async function promptForFollowUp(question: string, io: PromptIo = {}) {
  const { output } = createPromptIo(io);
  output.write("\nNeed one more detail\n");
  output.write(`${question}\n\n`);
  return promptForLine("> ", io);
}

export async function promptForApproval(io: PromptIo = {}) {
  const answer = await promptForLine("Write this decision? [Y/n] ", io);
  if (!answer) {
    return true;
  }

  return !["n", "no"].includes(answer.toLowerCase());
}
