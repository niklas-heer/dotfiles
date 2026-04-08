const RESET = "\u001b[0m";
const BOLD = "\u001b[1m";
const DIM = "\u001b[2m";
const BLUE = "\u001b[34m";
const GREEN = "\u001b[32m";
const YELLOW = "\u001b[33m";
const CYAN = "\u001b[36m";
const RED = "\u001b[31m";

const SPINNER_FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

export type WriteTarget = Pick<typeof process.stdout, "write"> | Pick<typeof process.stderr, "write">;

export function colorize(color: string, message: string) {
  return `${color}${message}${RESET}`;
}

export function writeLine(output: WriteTarget, message = "") {
  output.write(`${message}\n`);
}

export function writeAppHeader(output: WriteTarget, title: string, subtitle?: string) {
  writeLine(output, `${colorize(YELLOW, "nht")} ${colorize(DIM, "/")} ${colorize(`${BOLD}${BLUE}`, title)}`);
  if (subtitle) {
    writeLine(output, colorize(DIM, subtitle));
  }
}

export function writeSectionTo(output: WriteTarget, title: string) {
  writeLine(output);
  writeLine(output, colorize(CYAN, title));
}

export function writePairTo(output: WriteTarget, label: string, value: string) {
  writeLine(output, `${colorize(DIM, `${label}:`)} ${value}`);
}

export function writeBullet(output: WriteTarget, value: string, tone: "default" | "success" | "warning" | "danger" = "default") {
  const color = tone === "success"
    ? GREEN
    : tone === "warning"
      ? YELLOW
      : tone === "danger"
        ? RED
        : CYAN;

  writeLine(output, `${colorize(color, "•")} ${value}`);
}

export function writeCodeBlock(output: WriteTarget, value: string, indent = "  ") {
  for (const line of value.split("\n")) {
    writeLine(output, `${indent}${line}`);
  }
}

export function statusText(value: string, tone: "success" | "warning" | "danger" | "info" = "info") {
  const color = tone === "success"
    ? GREEN
    : tone === "warning"
      ? YELLOW
      : tone === "danger"
        ? RED
        : CYAN;

  return colorize(color, value);
}

export function info(message: string) {
  console.log(colorize(GREEN, message));
}

export function warn(message: string) {
  console.warn(colorize(YELLOW, message));
}

export function note(message: string) {
  console.log(colorize(DIM, message));
}

export function errorText(message: string) {
  return colorize(RED, message);
}

export function section(title: string) {
  console.log("");
  console.log(colorize(CYAN, title));
}

export function formatIndentedBlock(value: string, indent = "  ") {
  return value
    .split("\n")
    .filter(Boolean)
    .map((line) => `${indent}${line}`)
    .join("\n");
}

export async function withSpinner<T>(
  label: string,
  task: () => Promise<T>,
) {
  return withSpinnerTo(label, process.stderr, task);
}

export async function withSpinnerTo<T>(
  label: string,
  stderr: WriteTarget,
  task: () => Promise<T>,
) {
  if (stderr !== process.stderr || !process.stderr.isTTY) {
    writeLine(stderr, `${label}...`);
    return task();
  }

  let frameIndex = 0;
  const renderFrame = () => {
    const frame = SPINNER_FRAMES[frameIndex % SPINNER_FRAMES.length];
    frameIndex += 1;
    stderr.write(`\r${colorize(CYAN, `${frame} ${label}`)}`);
  };

  renderFrame();
  const interval = setInterval(renderFrame, 80);

  try {
    const result = await task();
    clearInterval(interval);
    stderr.write(`\r${colorize(GREEN, `✓ ${label}`)}\n`);
    return result;
  } catch (error) {
    clearInterval(interval);
    stderr.write(`\r${colorize(RED, `✗ ${label}`)}\n`);
    throw error;
  }
}

export function renderCountLabel(count: number, singular: string, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}
