import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { Box, Text, render, useApp, useInput } from "ink";
import type { ReactNode } from "react";
import { useState } from "react";

import type { PlannedCommitGroup } from "./groups.ts";
import type { CommitMessage } from "./messages.ts";

export type ReviewedCommitGroup = PlannedCommitGroup & {
  message: CommitMessage;
};

export type ReviewResult =
  | {
    status: "approved";
    groups: ReviewedCommitGroup[];
    skippedCount: number;
  }
  | {
    status: "skipped-all";
  }
  | {
    status: "quit";
  };

type ReviewDecision =
  | {
    type: "approve";
    skippedIds: string[];
    selectedIndex: number;
  }
  | {
    type: "edit";
    skippedIds: string[];
    selectedIndex: number;
  }
  | {
    type: "quit";
    skippedIds: string[];
    selectedIndex: number;
  };

function renderMessage(message: CommitMessage) {
  return message.body?.trim()
    ? `${message.subject}\n\n${message.body.trim()}`
    : message.subject;
}

function formatMultiline(value: string, indent = "  ") {
  return value
    .split("\n")
    .filter(Boolean)
    .map((line) => `${indent}${line}`);
}

function clampIndex(index: number, groups: ReviewedCommitGroup[]) {
  if (groups.length === 0) {
    return 0;
  }

  return Math.max(0, Math.min(index, groups.length - 1));
}

async function editMessageInEditor(message: CommitMessage) {
  const editor = process.env.EDITOR?.trim() || process.env.VISUAL?.trim();
  if (!editor) {
    throw new Error("EDITOR is not set");
  }

  const tempDir = await mkdtemp(join(tmpdir(), "smart-commit-"));
  const tempFile = join(tempDir, "COMMIT_EDITMSG");

  try {
    await writeFile(tempFile, renderMessage(message), "utf8");
    const result = spawnSync(editor, [tempFile], {
      stdio: "inherit",
    });

    if (result.status !== 0) {
      throw new Error(`${editor} exited with status ${result.status ?? "unknown"}`);
    }

    const edited = (await readFile(tempFile, "utf8")).trimEnd();
    const [subject, ...rest] = edited.split("\n");
    if (!subject?.trim()) {
      throw new Error("Edited commit message must include a subject line");
    }

    return {
      ...message,
      subject: subject.trim(),
      body: rest.join("\n").trim() || undefined,
    };
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

function renderGroupSummary(index: number, group: ReviewedCommitGroup, skipped: boolean) {
  const prefix = skipped ? "skip" : "keep";
  console.log(`${index + 1}. [${prefix}] ${group.message.subject}`);
  console.log("   reason:");
  for (const line of formatMultiline(group.reason, "     ")) {
    console.log(line);
  }
  console.log("   files:");
  for (const file of group.scopedFiles) {
    const rename = file.previousPath ? ` <- ${file.previousPath}` : "";
    console.log(`     - [${file.status}] ${file.path}${rename}`);
    for (const line of formatMultiline(file.statSummary, "       ")) {
      console.log(line);
    }
  }
  if (group.message.body?.trim()) {
    console.log("   body:");
    for (const line of formatMultiline(group.message.body.trim(), "     ")) {
      console.log(line);
    }
  }
}

function StatusTag({ skipped }: { skipped: boolean }) {
  return (
    <Text color={skipped ? "yellow" : "green"}>
      [{skipped ? "skip" : "keep"}]
    </Text>
  );
}

function LabeledBlock({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Box flexDirection="column" marginBottom={1}>
      <Text color="cyan">{label}</Text>
      <Box marginLeft={2} flexDirection="column">
        {children}
      </Box>
    </Box>
  );
}

function ReviewApp({
  groups,
  initialSkippedIds,
  initialSelectedIndex,
  onDecision,
}: {
  groups: ReviewedCommitGroup[];
  initialSkippedIds: string[];
  initialSelectedIndex: number;
  onDecision: (decision: ReviewDecision) => void;
}) {
  const { exit } = useApp();
  const [selectedIndex, setSelectedIndex] = useState(clampIndex(initialSelectedIndex, groups));
  const [skippedIds, setSkippedIds] = useState(() => new Set(initialSkippedIds));
  const selectedGroup = groups[selectedIndex];

  useInput((input, key) => {
    if (key.upArrow || input === "k") {
      setSelectedIndex((current: number) => clampIndex(current - 1, groups));
      return;
    }

    if (key.downArrow || input === "j") {
      setSelectedIndex((current: number) => clampIndex(current + 1, groups));
      return;
    }

    if (input === "s" || input === " ") {
      setSkippedIds((current: Set<string>) => {
        const next = new Set(current);
        const id = groups[selectedIndex]?.id;
        if (!id) {
          return next;
        }

        if (next.has(id)) {
          next.delete(id);
        } else {
          next.add(id);
        }

        return next;
      });
      return;
    }

    if (input === "e") {
      onDecision({
        type: "edit",
        skippedIds: [...skippedIds],
        selectedIndex,
      });
      exit();
      return;
    }

    if (input === "a" || key.return) {
      onDecision({
        type: "approve",
        skippedIds: [...skippedIds],
        selectedIndex,
      });
      exit();
      return;
    }

    if (input === "q" || key.escape || key.ctrl && input === "c") {
      onDecision({
        type: "quit",
        skippedIds: [...skippedIds],
        selectedIndex,
      });
      exit();
    }
  });

  return (
    <Box flexDirection="column">
      <Text bold color="green">Smart Commit Review</Text>
      <Text dimColor>
        ↑/↓ or j/k move  s toggle keep/skip  e edit message  enter/a approve  q quit
      </Text>
      <Box marginTop={1}>
        <Box flexDirection="column" width={40} marginRight={2} borderStyle="round" borderColor="gray" paddingX={1} paddingY={0}>
          <Text color="cyan">Commit Groups</Text>
          {groups.map((group, index) => {
            const isSelected = index === selectedIndex;
            const skipped = skippedIds.has(group.id);

            return (
              <Box
                key={group.id}
                marginTop={1}
                paddingX={1}
                flexDirection="column"
                borderStyle="round"
                borderColor={isSelected ? "magenta" : "gray"}
              >
                <Text color={isSelected ? "magenta" : undefined}>
                  {isSelected ? ">" : " "} {index + 1}. {group.message.subject}
                </Text>
                <Box marginLeft={2}>
                  <StatusTag skipped={skipped} />
                  <Text dimColor> {group.files.length} file{group.files.length === 1 ? "" : "s"}</Text>
                </Box>
              </Box>
            );
          })}
        </Box>
        <Box flexDirection="column" flexGrow={1} borderStyle="round" borderColor="gray" paddingX={1} paddingY={0}>
          <Text color="cyan">Selected Commit</Text>
          {selectedGroup
            ? (
              <Box flexDirection="column" marginTop={1}>
                <Box>
                  <StatusTag skipped={skippedIds.has(selectedGroup.id)} />
                  <Text> {selectedGroup.message.subject}</Text>
                </Box>
                <LabeledBlock label="Reason">
                  <Text>{selectedGroup.reason}</Text>
                </LabeledBlock>
                <LabeledBlock label="Files">
                  {selectedGroup.scopedFiles.map((file) => {
                    const rename = file.previousPath ? ` <- ${file.previousPath}` : "";
                    const descriptor = file.untracked ? "[A untracked]" : `[${file.status}]`;

                    return (
                      <Box
                        key={`${selectedGroup.id}:${file.path}`}
                        flexDirection="column"
                        marginBottom={1}
                        paddingX={1}
                        borderStyle="round"
                        borderColor="gray"
                      >
                        <Text>
                          - {descriptor} {file.path}{rename}
                        </Text>
                        {formatMultiline(file.statSummary).map((line) => (
                          <Text key={`${selectedGroup.id}:${file.path}:${line}`} dimColor>{line}</Text>
                        ))}
                      </Box>
                    );
                  })}
                </LabeledBlock>
                {selectedGroup.message.body?.trim()
                  ? (
                    <LabeledBlock label="Body">
                      {selectedGroup.message.body.trim().split("\n").map((line, index) => (
                        <Text key={`${selectedGroup.id}:body:${index}`}>{line}</Text>
                      ))}
                    </LabeledBlock>
                  )
                  : null}
              </Box>
            )
            : (
              <Text dimColor>No groups to review.</Text>
            )}
        </Box>
      </Box>
    </Box>
  );
}

async function runInkReview(
  groups: ReviewedCommitGroup[],
  skippedIds: string[],
  selectedIndex: number,
) {
  let decision: ReviewDecision | undefined;
  const app = render(
    <ReviewApp
      groups={groups}
      initialSkippedIds={skippedIds}
      initialSelectedIndex={selectedIndex}
      onDecision={(nextDecision) => {
        decision = nextDecision;
      }}
    />,
  );

  await app.waitUntilExit();

  if (!decision) {
    return {
      type: "quit" as const,
      skippedIds,
      selectedIndex,
    };
  }

  return decision;
}

export async function reviewCommitGroups(groups: ReviewedCommitGroup[]) {
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    for (const [index, group] of groups.entries()) {
      renderGroupSummary(index, group, false);
    }

    return {
      status: "approved" as const,
      groups,
      skippedCount: 0,
    };
  }

  let selectedIndex = 0;
  let skippedIds: string[] = [];

  while (true) {
    const decision = await runInkReview(groups, skippedIds, selectedIndex);
    skippedIds = decision.skippedIds;
    selectedIndex = decision.selectedIndex;

    if (decision.type === "approve") {
      const approvedGroups = groups.filter((group) => !new Set(skippedIds).has(group.id));
      if (approvedGroups.length === 0) {
        return {
          status: "skipped-all" as const,
        };
      }

      return {
        status: "approved" as const,
        groups: approvedGroups,
        skippedCount: skippedIds.length,
      };
    }

    if (decision.type === "quit") {
      return {
        status: "quit" as const,
      };
    }

    groups[selectedIndex] = {
      ...groups[selectedIndex],
      message: await editMessageInEditor(groups[selectedIndex].message),
    };
  }
}
