import { Box, Text, render, useApp, useInput } from "ink";

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
      <Text color="cyan">
        {title} {enabled ? `(${count})` : "(disabled)"}
      </Text>
      {enabled
        ? count === 0
          ? <Text dimColor>Nothing to upgrade.</Text>
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
    <Box flexDirection="column">
      <Text bold color="green">Upgrade</Text>
      <Text dimColor>Enter continues. Esc cancels.</Text>
      <Box marginTop={1} borderStyle="round" borderColor="gray" paddingX={1} paddingY={0} flexDirection="column">
        <Section
          title="Homebrew"
          count={preview.brew.length}
          items={preview.brew}
          enabled={preview.brewEnabled}
        />
        <Section
          title="Bun"
          count={preview.bun.length}
          items={preview.bun}
          enabled={preview.bunEnabled}
        />
      </Box>
    </Box>
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
