const RESET = "\u001b[0m";
const DIM = "\u001b[2m";
const GREEN = "\u001b[32m";
const YELLOW = "\u001b[33m";
const CYAN = "\u001b[36m";
const RED = "\u001b[31m";

const SPINNER_FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

function colorize(color: string, message: string) {
  return `${color}${message}${RESET}`;
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
  if (!process.stderr.isTTY) {
    note(`${label}...`);
    return task();
  }

  let frameIndex = 0;
  const renderFrame = () => {
    const frame = SPINNER_FRAMES[frameIndex % SPINNER_FRAMES.length];
    frameIndex += 1;
    process.stderr.write(`\r${colorize(CYAN, `${frame} ${label}`)}`);
  };

  renderFrame();
  const interval = setInterval(renderFrame, 80);

  try {
    const result = await task();
    clearInterval(interval);
    process.stderr.write(`\r${colorize(GREEN, `✓ ${label}`)}\n`);
    return result;
  } catch (error) {
    clearInterval(interval);
    process.stderr.write(`\r${colorize(RED, `✗ ${label}`)}\n`);
    throw error;
  }
}

export function renderCountLabel(count: number, singular: string, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}
