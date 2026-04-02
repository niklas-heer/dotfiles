import { Box, Text, render, useApp, useInput } from "ink";

import {
  AppFrame,
  EmptyState,
  Panel,
  SectionLabel,
} from "../lib/tui.tsx";

export type UpgradePreviewItem = {
  name: string;
  current: string;
  latest: string;
};

export type UpgradePreview = {
  brew: UpgradePreviewItem[];
  bun: UpgradePreviewItem[];
  brewEnabled: boolean;
  bunEnabled: boolean;
};

function Section({
  title,
  count,
  items,
  enabled,
}: {
  title: string;
  count: number;
  items: UpgradePreviewItem[];
  enabled: boolean;
}) {
  return (
    <Box flexDirection="column" marginTop={1}>
      <SectionLabel>
        {title} {enabled ? `(${count})` : "(disabled)"}
      </SectionLabel>
      {enabled
        ? count === 0
          ? <EmptyState message="Nothing to upgrade." />
          : items.slice(0, 6).map((item) => (
            <Text key={item.name}>
              {item.name} <Text dimColor>{item.current}</Text> → <Text color="green">{item.latest}</Text>
            </Text>
          ))
        : <Text dimColor>Skipped for this run.</Text>}
      {enabled && items.length > 6 ? <Text dimColor>...and {items.length - 6} more</Text> : null}
    </Box>
  );
}

function UpgradePromptApp({
  preview,
  onConfirm,
  onCancel,
}: {
  preview: UpgradePreview;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const { exit } = useApp();
  const columns = process.stdout.columns ?? 120;
  const splitView = columns >= 110;

  useInput((input, key) => {
    if (key.return) {
      onConfirm();
      exit();
      return;
    }

    if (input === "q" || key.escape || key.ctrl && input === "c") {
      onCancel();
      exit();
    }
  });

  return (
    <AppFrame
      title="Upgrade"
      subtitle="Review managed upgrades before running them."
      stats={[
        { label: "brew", value: preview.brewEnabled ? String(preview.brew.length) : "off", tone: preview.brewEnabled ? "primary" : "default" },
        { label: "bun", value: preview.bunEnabled ? String(preview.bun.length) : "off", tone: preview.bunEnabled ? "primary" : "default" },
      ]}
      hints={[
        { key: "Enter", label: "run upgrades", tone: "success" },
        { key: "Esc", label: "cancel", tone: "warning" },
      ]}
    >
      <Box flexDirection={splitView ? "row" : "column"}>
        <Panel title="Homebrew" active={preview.brewEnabled} flexGrow={1} marginRight={splitView ? 1 : 0}>
          <Section
            title="Packages"
            count={preview.brew.length}
            items={preview.brew}
            enabled={preview.brewEnabled}
          />
        </Panel>
        <Box marginTop={splitView ? 0 : 1}>
          <Panel title="Bun" active={preview.bunEnabled} flexGrow={1}>
            <Section
              title="Packages"
              count={preview.bun.length}
              items={preview.bun}
              enabled={preview.bunEnabled}
            />
          </Panel>
        </Box>
      </Box>
    </AppFrame>
  );
}

export async function confirmUpgrade(preview: UpgradePreview) {
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    throw new Error("Pass --yes to continue in non-interactive mode.");
  }

  let confirmed = false;
  const app = render(
    <UpgradePromptApp
      preview={preview}
      onConfirm={() => {
        confirmed = true;
      }}
      onCancel={() => {
        confirmed = false;
      }}
    />,
  );

  await app.waitUntilExit();
  return confirmed;
}
