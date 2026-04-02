import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { Box, Text, render, useApp, useInput } from "ink";
import type { ReactNode } from "react";
import { useState } from "react";

import {
  AppFrame,
  EmptyState,
  ListRow,
  Panel,
  SectionLabel,
  StatusPill,
} from "../lib/tui.tsx";
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

function truncateText(value: string, maxWidth: number) {
  if (maxWidth <= 0 || value.length <= maxWidth) {
    return value;
  }

  if (maxWidth <= 1) {
    return "…";
  }

  return `${value.slice(0, maxWidth - 1)}…`;
}

function summarizeLines(value: string, maxLines: number) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, maxLines);
}

function summarizeStat(value: string) {
  return summarizeLines(value, 2).join("  ");
}

function getVisibleRange(selectedIndex: number, totalCount: number, visibleCount: number) {
  if (totalCount <= visibleCount) {
    return { start: 0, end: totalCount };
  }

  const halfWindow = Math.floor(visibleCount / 2);
  const maxStart = Math.max(0, totalCount - visibleCount);
  const start = Math.max(0, Math.min(selectedIndex - halfWindow, maxStart));
  return {
    start,
    end: Math.min(totalCount, start + visibleCount),
  };
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
  return <StatusPill label={skipped ? "skip" : "keep"} tone={skipped ? "warning" : "success"} />;
}

function FileStatusTag({ status, untracked }: { status: string; untracked?: boolean }) {
  const label = untracked ? "A+" : status;
  const tone = status === "A"
    ? "success"
    : status === "M"
      ? "warning"
      : status === "D"
        ? "danger"
        : "primary";

  return <StatusPill label={label} tone={tone} />;
}

function LabeledBlock({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Box flexDirection="column" marginBottom={1}>
      <SectionLabel>{label}</SectionLabel>
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
  const columns = process.stdout.columns ?? 120;
  const rows = process.stdout.rows ?? 32;
  const splitView = columns >= 108;
  const leftPaneWidth = splitView ? Math.max(44, Math.min(68, Math.floor(columns * 0.36))) : columns - 4;
  const visibleGroupCount = splitView ? Math.max(8, rows - 10) : Math.max(5, Math.floor(rows * 0.28));
  const range = getVisibleRange(selectedIndex, groups.length, visibleGroupCount);
  const visibleGroups = groups.slice(range.start, range.end);

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
    <AppFrame
      title="Smart Commit Review"
      subtitle="Review the proposed commit stack before anything is written."
      stats={[
        { label: "groups", value: String(groups.length), tone: "primary" },
        { label: "skipped", value: String(skippedIds.size), tone: skippedIds.size > 0 ? "warning" : "default" },
        { label: "selected", value: selectedGroup ? String(selectedIndex + 1) : "-" },
      ]}
      hints={[
        { key: "j/k", label: "move" },
        { key: "s", label: "skip or keep", tone: "warning" },
        { key: "e", label: "edit message", tone: "primary" },
        { key: "Enter", label: "approve", tone: "success" },
        { key: "q", label: "quit", tone: "warning" },
      ]}
    >
      <Box flexDirection={splitView ? "row" : "column"}>
        <Panel title="Commit Groups" active width={leftPaneWidth} marginRight={splitView ? 1 : 0}>
          {range.start > 0 ? <Text dimColor>... {range.start} above</Text> : null}
          {visibleGroups.map((group, offset) => {
            const index = range.start + offset;
            const isSelected = index === selectedIndex;
            const skipped = skippedIds.has(group.id);
            const groupLabelWidth = Math.max(20, leftPaneWidth - 9);

            return (
              <ListRow
                key={group.id}
                selected={isSelected}
                tone={skipped ? "warning" : "success"}
                title={`${index + 1}. ${truncateText(group.message.subject, groupLabelWidth)}`}
                subtitle={
                  <>
                    <StatusTag skipped={skipped} />
                    <Text dimColor> {group.files.length} file{group.files.length === 1 ? "" : "s"}</Text>
                  </>
                }
              />
            );
          })}
          {range.end < groups.length ? <Text dimColor>... {groups.length - range.end} below</Text> : null}
        </Panel>
        <Box marginTop={splitView ? 0 : 1} flexGrow={1}>
          <Panel title="Selected Commit" active={Boolean(selectedGroup)} flexGrow={1}>
            {selectedGroup
              ? (
                <Box flexDirection="column">
                  <Box flexDirection="column" marginBottom={1} borderStyle="round" borderColor="blue" paddingX={1}>
                    <SectionLabel>Subject</SectionLabel>
                    <Box>
                      <StatusTag skipped={skippedIds.has(selectedGroup.id)} />
                      <Text bold wrap="truncate-end"> {selectedGroup.message.subject}</Text>
                    </Box>
                  </Box>
                  <LabeledBlock label="Reason">
                    {summarizeLines(selectedGroup.reason, 3).map((line) => (
                      <Text key={`${selectedGroup.id}:reason:${line}`}>{line}</Text>
                    ))}
                  </LabeledBlock>
                  <LabeledBlock label="Files">
                    {selectedGroup.scopedFiles.map((file) => {
                      const rename = file.previousPath ? ` <- ${file.previousPath}` : "";

                      return (
                        <Box
                          key={`${selectedGroup.id}:${file.path}`}
                          flexDirection="column"
                          marginBottom={1}
                        >
                          <Text>
                            <FileStatusTag status={file.status} untracked={file.untracked} /> {file.path}{rename}
                          </Text>
                          <Text dimColor>  {summarizeStat(file.statSummary)}</Text>
                        </Box>
                      );
                    })}
                  </LabeledBlock>
                  {selectedGroup.message.body?.trim()
                    ? (
                      <LabeledBlock label="Body">
                        {summarizeLines(selectedGroup.message.body.trim(), splitView ? 5 : 3).map((line, index) => (
                          <Text key={`${selectedGroup.id}:body:${index}`}>{line}</Text>
                        ))}
                      </LabeledBlock>
                    )
                    : null}
                </Box>
              )
              : (
                <EmptyState message="No groups to review." />
              )}
          </Panel>
        </Box>
      </Box>
    </AppFrame>
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
