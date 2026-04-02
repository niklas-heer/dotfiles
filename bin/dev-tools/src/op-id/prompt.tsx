import { Box, Text, render, useApp, useInput } from "ink";
import type { ReactNode } from "react";
import { useState } from "react";

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

function PromptShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <Box flexDirection="column">
      <Text bold color="green">{title}</Text>
      <Text dimColor>{subtitle}</Text>
      <Box marginTop={1} borderStyle="round" borderColor="gray" paddingX={1} paddingY={0} flexDirection="column">
        {children}
      </Box>
    </Box>
  );
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
    <PromptShell
      title="1Password UUID"
      subtitle="Type an item name and press enter. Esc cancels."
    >
      <Text color="cyan">Query</Text>
      <Text>
        {"> "}
        {value ? value : <Text dimColor>e.g. github</Text>}
      </Text>
    </PromptShell>
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
    <PromptShell
      title="1Password UUID"
      subtitle={`Choose the matching item for ${query}. Enter confirms, Esc cancels.`}
    >
      <Text color="cyan">Matches</Text>
      {items.slice(0, 12).map((item, index) => {
        const selected = index === selectedIndex;

        return (
          <Box
            key={item.id}
            marginTop={1}
            paddingX={1}
            flexDirection="column"
            borderStyle="round"
            borderColor={selected ? "magenta" : "gray"}
          >
            <Text color={selected ? "magenta" : undefined}>
              {selected ? ">" : " "} {item.title}
            </Text>
            <Text dimColor>{item.vaultName} • {item.category}</Text>
            {item.additionalInformation ? <Text dimColor>{item.additionalInformation}</Text> : null}
          </Box>
        );
      })}
      {items.length > 12 ? <Text dimColor>...and {items.length - 12} more</Text> : null}
    </PromptShell>
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
