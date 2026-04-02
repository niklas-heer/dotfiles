import { Box, Text, render, useApp, useInput } from "ink";
import { useState } from "react";

import {
  AppFrame,
  ChoiceCard,
  InputField,
  Panel,
} from "../lib/tui.tsx";

type Manager = "brew" | "bun";

function isPrintable(input: string) {
  return /^[ -~]$/.test(input);
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
    <AppFrame
      title="Add Tool"
      subtitle="Type a package name and press enter. Esc cancels."
      stats={[
        { label: "step", value: "package", tone: "primary" },
        { label: "target", value: "Brewfile or Bunfile" },
      ]}
      hints={[
        { key: "Enter", label: "continue", tone: "success" },
        { key: "Esc", label: "cancel", tone: "warning" },
      ]}
    >
      <Panel title="Package Input" active>
        <InputField
          label="Package"
          value={value}
          placeholder="e.g. glow"
        />
      </Panel>
    </AppFrame>
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
    <AppFrame
      title="Add Tool"
      subtitle={`Choose where to add ${packageName}. Enter confirms, Esc cancels.`}
      stats={[
        { label: "package", value: packageName, tone: "primary" },
        { label: "choices", value: String(options.length) },
      ]}
      hints={[
        { key: "j/k", label: "move" },
        { key: "Enter", label: "select", tone: "success" },
        { key: "Esc", label: "cancel", tone: "warning" },
      ]}
    >
      <Panel title="Destination" active>
        {options.map((option, index) => (
          <ChoiceCard
            key={option.id}
            title={option.label}
            subtitle={option.description}
            selected={index === selectedIndex}
          />
        ))}
      </Panel>
    </AppFrame>
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
