import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { runGit } from "../lib/git.ts";
import type { GatheredContext } from "./gather.ts";
import { gatherContextForMode } from "./gather.ts";
import type { ReviewedCommitGroup } from "./review.tsx";

type ExecutionResult = {
  createdCommits: Array<{
    groupId: string;
    subject: string;
  }>;
};

export class CommitExecutionError extends Error {
  createdCommits: ExecutionResult["createdCommits"];

  constructor(message: string, createdCommits: ExecutionResult["createdCommits"]) {
    super(message);
    this.name = "CommitExecutionError";
    this.createdCommits = createdCommits;
  }
}

function uniquePathArgs(group: ReviewedCommitGroup) {
  return [...new Set(group.scopedFiles.flatMap((file) => (
    file.previousPath ? [file.previousPath, file.path] : [file.path]
  )))];
}

async function hasHead(repoRoot: string) {
  const result = await runGit(["rev-parse", "--verify", "HEAD"], {
    cwd: repoRoot,
    allowExitCodes: [0, 128],
  });

  return result.exitCode === 0;
}

async function createTempIndex(repoRoot: string) {
  const tempDir = await mkdtemp(join(tmpdir(), "smart-commit-index-"));
  const indexPath = join(tempDir, "index");
  const env = {
    ...process.env,
    GIT_INDEX_FILE: indexPath,
  };

  if (await hasHead(repoRoot)) {
    await runGit(["read-tree", "HEAD"], { cwd: repoRoot, env });
  } else {
    await runGit(["read-tree", "--empty"], { cwd: repoRoot, env });
  }

  return {
    tempDir,
    indexPath,
    env,
  };
}

async function writeCommitMessage(message: ReviewedCommitGroup["message"]) {
  const tempDir = await mkdtemp(join(tmpdir(), "smart-commit-message-"));
  const messagePath = join(tempDir, "COMMIT_EDITMSG");
  const body = message.body?.trim();
  const content = body ? `${message.subject}\n\n${body}\n` : `${message.subject}\n`;

  await writeFile(messagePath, content, "utf8");
  return {
    tempDir,
    messagePath,
  };
}

function asExecutionError(
  error: unknown,
  createdCommits: ExecutionResult["createdCommits"],
) {
  if (error instanceof CommitExecutionError) {
    return error;
  }

  const message = error instanceof Error ? error.message : String(error);
  return new CommitExecutionError(message, createdCommits);
}

async function stageGroupInTempIndex(
  repoRoot: string,
  context: GatheredContext,
  group: ReviewedCommitGroup,
  env: Record<string, string | undefined>,
) {
  if (context.mode === "staged") {
    const patch = await runGit([
      "diff",
      "--cached",
      "--binary",
      "--find-renames",
      "--no-ext-diff",
      "--",
      ...uniquePathArgs(group),
    ], { cwd: repoRoot });

    if (patch.stdout.trim()) {
      await runGit(["apply", "--cached", "--unidiff-zero", "-"], {
        cwd: repoRoot,
        env,
        stdin: patch.stdout,
      });
    }

    return;
  }

  await runGit(["add", "-A", "--", ...uniquePathArgs(group)], {
    cwd: repoRoot,
    env,
  });
}

async function assertNoDrift(
  context: GatheredContext,
  remainingGroups: ReviewedCommitGroup[],
) {
  const remainingPaths = new Set(remainingGroups.flatMap((group) => group.files));
  const fresh = await gatherContextForMode(context.repoRoot, context.mode);
  const originalByPath = new Map(context.files.map((file) => [file.path, file]));
  const freshByPath = new Map(fresh?.files.map((file) => [file.path, file]) ?? []);

  for (const path of remainingPaths) {
    const original = originalByPath.get(path);
    const current = freshByPath.get(path);

    if (!original || !current) {
      throw new Error(`Repo state changed during execution for ${path}`);
    }

    if (original.diffFingerprint !== current.diffFingerprint) {
      throw new Error(`Repo state changed during execution for ${path}`);
    }
  }

  if (context.mode === "staged") {
    for (const path of remainingPaths) {
      const original = originalByPath.get(path);
      const freshFile = freshByPath.get(path);

      if ((original?.worktreeFingerprint ?? "") !== (freshFile?.worktreeFingerprint ?? "")) {
        throw new Error(`Worktree drift detected for ${path}`);
      }
    }
  }
}

export async function executeCommitGroups(
  context: GatheredContext,
  groups: ReviewedCommitGroup[],
): Promise<ExecutionResult> {
  const createdCommits: ExecutionResult["createdCommits"] = [];

  for (const [index, group] of groups.entries()) {
    let tempIndex: Awaited<ReturnType<typeof createTempIndex>> | undefined;
    let messageFile: Awaited<ReturnType<typeof writeCommitMessage>> | undefined;

    try {
      await assertNoDrift(context, groups.slice(index));
      tempIndex = await createTempIndex(context.repoRoot);
      messageFile = await writeCommitMessage(group.message);
      await stageGroupInTempIndex(context.repoRoot, context, group, tempIndex.env);
      await runGit(["commit", "-F", messageFile.messagePath], {
        cwd: context.repoRoot,
        env: tempIndex.env,
      });

      createdCommits.push({
        groupId: group.id,
        subject: group.message.subject,
      });

      if (context.mode === "worktree") {
        await runGit(["reset", "--mixed", "-q", "HEAD"], {
          cwd: context.repoRoot,
        });
      }
    } catch (error) {
      throw asExecutionError(error, createdCommits);
    } finally {
      if (tempIndex) {
        await rm(tempIndex.tempDir, { recursive: true, force: true });
      }

      if (messageFile) {
        await rm(messageFile.tempDir, { recursive: true, force: true });
      }
    }
  }

  return {
    createdCommits,
  };
}
