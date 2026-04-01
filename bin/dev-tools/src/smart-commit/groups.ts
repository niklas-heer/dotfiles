import type { GatheredContext, ScopedFile } from "./gather.ts";
import type { CommitGroup } from "./plan.ts";

export type PlannedCommitGroup = CommitGroup & {
  scopedFiles: ScopedFile[];
};

export function materializeCommitGroups(
  context: GatheredContext,
  plan: CommitGroup[],
): PlannedCommitGroup[] {
  const filesByPath = new Map(context.files.map((file) => [file.path, file]));

  return plan.map((group) => ({
    ...group,
    scopedFiles: group.files.map((path) => {
      const file = filesByPath.get(path);
      if (!file) {
        throw new Error(`Unknown file in commit group: ${path}`);
      }

      return file;
    }),
  }));
}
