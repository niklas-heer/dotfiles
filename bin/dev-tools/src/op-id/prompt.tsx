import { Box, Text, render, useApp, useInput } from "ink";
import { useState } from "react";

import {
  AppFrame,
  ChoiceCard,
  InputField,
  Panel,
} from "../lib/tui.tsx";

export type OpItemMatch = {
  id: string;
  title: string;
  vaultName: string;
  category: string;
  additionalInformation?: string;
};

function isPrintable(input: string) {
  return /^[ -~]$/.test(input);
}

function QueryPromptApp({
  onSubmit,
  onCancel,
}: {
  onSubmit: (value: string) => void;
  onCancel: () => void;
}) {
  const { exit } = useApp();
  const [value, setValue] = useState("");

  useInput((input, key) => {
    if (key.ctrl && input === "c" || key.escape) {
      onCancel();
      exit();
      return;
    }

    if (key.return) {
      const nextValue = value.trim();
      if (!nextValue) {
        return;
      }

      onSubmit(nextValue);
      exit();
      return;
    }

    if (key.backspace || key.delete) {
      setValue((current) => current.slice(0, -1));
      return;
    }

    if (!key.ctrl && !key.meta && isPrintable(input)) {
      setValue((current) => current + input);
    }
  });

  return (
    <AppFrame
      title="1Password UUID"
      subtitle="Type an item name and press enter. Esc cancels."
      stats={[
        { label: "mode", value: "search", tone: "primary" },
        { label: "output", value: "UUID" },
      ]}
      hints={[
        { key: "Enter", label: "search", tone: "success" },
        { key: "Esc", label: "cancel", tone: "warning" },
      ]}
    >
      <Panel title="Lookup" active>
        <InputField
          label="Query"
          value={value}
          placeholder="e.g. github"
        />
      </Panel>
    </AppFrame>
  );
}

function SelectItemApp({
  query,
  items,
  onSubmit,
  onCancel,
}: {
  query: string;
  items: OpItemMatch[];
  onSubmit: (item: OpItemMatch) => void;
  onCancel: () => void;
}) {
  const { exit } = useApp();
  const [selectedIndex, setSelectedIndex] = useState(0);

  useInput((input, key) => {
    if (key.ctrl && input === "c" || key.escape) {
      onCancel();
      exit();
      return;
    }

    if (key.upArrow || input === "k") {
      setSelectedIndex((current) => Math.max(0, current - 1));
      return;
    }

    if (key.downArrow || input === "j") {
      setSelectedIndex((current) => Math.min(items.length - 1, current + 1));
      return;
    }

    if (key.return) {
      onSubmit(items[selectedIndex]!);
      exit();
    }
  });

  return (
    <AppFrame
      title="1Password UUID"
      subtitle={`Choose the matching item for ${query}. Enter confirms, Esc cancels.`}
      stats={[
        { label: "query", value: query, tone: "primary" },
        { label: "matches", value: String(items.length) },
      ]}
      hints={[
        { key: "j/k", label: "move" },
        { key: "Enter", label: "copy UUID", tone: "success" },
        { key: "Esc", label: "cancel", tone: "warning" },
      ]}
    >
      <Panel title="Matches" active>
        {items.slice(0, 12).map((item, index) => (
          <ChoiceCard
            key={item.id}
            title={item.title}
            subtitle={`${item.vaultName} • ${item.category}`}
            selected={index === selectedIndex}
          >
            {item.additionalInformation ? <Text dimColor>{item.additionalInformation}</Text> : null}
          </ChoiceCard>
        ))}
        {items.length > 12 ? <Text dimColor>...and {items.length - 12} more</Text> : null}
      </Panel>
    </AppFrame>
  );
}

export async function promptForQuery() {
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    throw new Error("Pass the item name when stdin/stdout is not interactive.");
  }

  let result: string | null = null;
  const app = render(
    <QueryPromptApp
      onSubmit={(value) => {
        result = value;
      }}
      onCancel={() => {
        result = null;
      }}
    />,
  );

  await app.waitUntilExit();
  return result;
}

export async function selectMatchingItem(query: string, items: OpItemMatch[]) {
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    throw new Error(`Multiple 1Password items matched ${query}. Refine the query or use --vault.`);
  }

  let result: OpItemMatch | null = null;
  const app = render(
    <SelectItemApp
      query={query}
      items={items}
      onSubmit={(item) => {
        result = item;
      }}
      onCancel={() => {
        result = null;
      }}
    />,
  );

  await app.waitUntilExit();
  return result;
}
