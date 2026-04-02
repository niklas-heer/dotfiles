import { Box, Text, render, useApp, useInput } from "ink";
import type { ReactNode } from "react";
import { useState } from "react";

type Manager = "brew" | "bun";

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

function NamePromptApp({
  initialValue,
  onSubmit,
  onCancel,
}: {
  initialValue?: string;
  onSubmit: (value: string) => void;
  onCancel: () => void;
}) {
  const { exit } = useApp();
  const [value, setValue] = useState(initialValue ?? "");

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
      title="Add Tool"
      subtitle="Type a package name and press enter. Esc cancels."
    >
      <Text color="cyan">Package</Text>
      <Text>
        {"> "}
        {value ? value : <Text dimColor>e.g. glow</Text>}
      </Text>
    </PromptShell>
  );
}

function ManagerPromptApp({
  packageName,
  onSubmit,
  onCancel,
}: {
  packageName: string;
  onSubmit: (manager: Manager) => void;
  onCancel: () => void;
}) {
  const { exit } = useApp();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const options: Array<{ id: Manager; label: string; description: string }> = [
    {
      id: "brew",
      label: "brew",
      description: "Add a Homebrew formula to Brewfile",
    },
    {
      id: "bun",
      label: "bun",
      description: "Add a global Bun package to Bunfile",
    },
  ];

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
      setSelectedIndex((current) => Math.min(options.length - 1, current + 1));
      return;
    }

    if (key.return) {
      onSubmit(options[selectedIndex]!.id);
      exit();
    }
  });

  return (
    <PromptShell
      title="Add Tool"
      subtitle={`Choose where to add ${packageName}. Enter confirms, Esc cancels.`}
    >
      <Text color="cyan">Manager</Text>
      {options.map((option, index) => {
        const selected = index === selectedIndex;

        return (
          <Box
            key={option.id}
            marginTop={1}
            paddingX={1}
            flexDirection="column"
            borderStyle="round"
            borderColor={selected ? "magenta" : "gray"}
          >
            <Text color={selected ? "magenta" : undefined}>
              {selected ? ">" : " "} {option.label}
            </Text>
            <Text dimColor>{option.description}</Text>
          </Box>
        );
      })}
    </PromptShell>
  );
}

export async function promptForName(initialValue?: string) {
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    throw new Error("Pass the package name when stdin/stdout is not interactive.");
  }

  let result: string | null = null;
  const app = render(
    <NamePromptApp
      initialValue={initialValue}
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

export async function promptForManager(packageName: string) {
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    throw new Error("Pass --brew or --bun when stdin/stdout is not interactive.");
  }

  let result: Manager | null = null;
  const app = render(
    <ManagerPromptApp
      packageName={packageName}
      onSubmit={(manager) => {
        result = manager;
      }}
      onCancel={() => {
        result = null;
      }}
    />,
  );

  await app.waitUntilExit();
  return result;
}
