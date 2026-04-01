type GitRunOptions = {
  cwd?: string;
  allowExitCodes?: number[];
  env?: Record<string, string | undefined>;
  stdin?: string;
};

export async function runGit(args: string[], options: GitRunOptions = {}) {
  const proc = Bun.spawn(["git", ...args], {
    cwd: options.cwd,
    env: options.env,
    stdin: options.stdin ? "pipe" : "ignore",
    stdout: "pipe",
    stderr: "pipe",
  });

  if (options.stdin) {
    const stdin = proc.stdin;
    if (stdin) {
      stdin.write(options.stdin);
      stdin.end();
    }
  }

  const [stdout, stderr, exitCode] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
    proc.exited,
  ]);

  const result = {
    exitCode,
    stdout,
    stderr,
  };

  const allowExitCodes = options.allowExitCodes ?? [0];
  if (!allowExitCodes.includes(exitCode)) {
    throw new Error(stderr.trim() || `git ${args.join(" ")} failed with exit code ${exitCode}`);
  }

  return result;
}

export async function runGitLines(args: string[], options: GitRunOptions = {}) {
  const result = await runGit(args, options);
  return result.stdout.split("\n").filter(Boolean);
}
