import type { ScopedFile } from "./gather.ts";

type IgnoreRule = {
  match: (path: string) => string | null;
};

export type IgnoreCandidateGroup = {
  suggestion: string;
  count: number;
  examples: string[];
};

const IGNORE_RULES: IgnoreRule[] = [
  {
    match: (path) => directorySuggestion(path, "node_modules"),
  },
  {
    match: (path) => directorySuggestion(path, "dist"),
  },
  {
    match: (path) => directorySuggestion(path, "build"),
  },
  {
    match: (path) => directorySuggestion(path, "coverage"),
  },
  {
    match: (path) => directorySuggestion(path, ".next"),
  },
  {
    match: (path) => directorySuggestion(path, ".turbo"),
  },
  {
    match: (path) => directorySuggestion(path, ".cache"),
  },
  {
    match: (path) => path.endsWith("/.env") || path === ".env" ? path : null,
  },
  {
    match: (path) => path.endsWith("/.DS_Store") || path === ".DS_Store" ? path : null,
  },
];

function directorySuggestion(path: string, segment: string) {
  const parts = path.split("/");
  const index = parts.indexOf(segment);

  if (index === -1) {
    return null;
  }

  return `${parts.slice(0, index + 1).join("/")}/`;
}

export function findIgnoreSuggestions(files: ScopedFile[]) {
  return summarizeIgnoreCandidates(files).map((group) => group.suggestion);
}

export function isPathCoveredByIgnoreSuggestion(path: string, suggestion: string) {
  return suggestion.endsWith("/") ? path.startsWith(suggestion) : path === suggestion;
}

export function summarizeIgnoreCandidates(files: ScopedFile[]): IgnoreCandidateGroup[] {
  const suggestions = new Set<string>();
  const grouped = new Map<string, IgnoreCandidateGroup>();

  for (const file of files) {
    if (!file.untracked) {
      continue;
    }

    for (const rule of IGNORE_RULES) {
      const suggestion = rule.match(file.path);
      if (suggestion) {
        suggestions.add(suggestion);
        const group = grouped.get(suggestion) ?? {
          suggestion,
          count: 0,
          examples: [],
        };
        group.count += 1;
        if (group.examples.length < 3) {
          group.examples.push(file.path);
        }
        grouped.set(suggestion, group);
        break;
      }
    }
  }

  return [...suggestions]
    .sort()
    .map((suggestion) => grouped.get(suggestion)!)
    .sort((left, right) => right.count - left.count || left.suggestion.localeCompare(right.suggestion));
}
