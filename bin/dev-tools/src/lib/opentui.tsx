/** @jsxImportSource @opentui/react */

import { createCliRenderer, type ScreenMode } from "@opentui/core";
import { createRoot } from "@opentui/react";
import type { ReactNode } from "react";

export const OPEN_TUI_COLORS = {
  bg: "#0f1115",
  panel: "#151922",
  panelAlt: "#10141c",
  border: "#2b3240",
  borderFocus: "#7dd3fc",
  text: "#e6edf7",
  muted: "#93a1b5",
  accent: "#f59e0b",
  primary: "#7dd3fc",
  success: "#86efac",
  warning: "#fbbf24",
  danger: "#fca5a5",
  editorBg: "#0b0f14",
  editorFocus: "#111827",
  placeholder: "#5f6b7c",
  selectionBg: "#1d4ed8",
  selectionFg: "#f8fbff",
} as const;

type Tone = "primary" | "success" | "warning" | "danger" | "default";

export type OpenTuiPrompt<T> = {
  resolve: (value: T) => void;
  root: ReturnType<typeof createRoot>;
  renderer: Awaited<ReturnType<typeof createCliRenderer>>;
};

type RunOpenTuiPromptOptions = {
  screenMode?: ScreenMode;
  footerHeight?: number;
};

export type OpenTuiStat = {
  label: string;
  value: string;
  tone?: Tone;
};

export type OpenTuiKeyHint = {
  key: string;
  label: string;
  tone?: Tone;
};

export type PanelWidth = number | "auto" | `${number}%`;

export function toneColor(tone: Tone = "default") {
  return tone === "primary"
    ? OPEN_TUI_COLORS.primary
    : tone === "success"
      ? OPEN_TUI_COLORS.success
      : tone === "warning"
        ? OPEN_TUI_COLORS.warning
        : tone === "danger"
          ? OPEN_TUI_COLORS.danger
          : OPEN_TUI_COLORS.muted;
}

export function closePrompt<T>(prompt: OpenTuiPrompt<T>, value: T) {
  prompt.root.unmount();
  prompt.renderer.destroy();
  prompt.resolve(value);
}

export function OpenTuiScreen({ children }: { children: ReactNode }) {
  return (
    <box width="100%" height="100%" flexDirection="column" backgroundColor={OPEN_TUI_COLORS.bg} padding={1}>
      {children}
    </box>
  );
}

export function OpenTuiHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <box flexDirection="column" marginBottom={1}>
      <box flexDirection="row">
        <text fg={OPEN_TUI_COLORS.accent}>nht</text>
        <text fg={OPEN_TUI_COLORS.muted}> / </text>
        <text fg={OPEN_TUI_COLORS.primary}>{title}</text>
      </box>
      <text fg={OPEN_TUI_COLORS.muted}>{subtitle}</text>
    </box>
  );
}

export function OpenTuiStatBar({ items }: { items: OpenTuiStat[] }) {
  return (
    <box flexDirection="row" flexWrap="wrap" gap={2} marginBottom={1}>
      {items.map((item) => (
        <box key={`${item.label}:${item.value}`} flexDirection="row">
          <text fg={toneColor(item.tone)}>●</text>
          <text fg={OPEN_TUI_COLORS.muted}> {item.label}</text>
          <text fg={OPEN_TUI_COLORS.text}> {item.value}</text>
        </box>
      ))}
    </box>
  );
}

export function OpenTuiKeyHints({
  items,
}: {
  items: OpenTuiKeyHint[];
}) {
  return (
    <box marginTop={1} flexDirection="row" flexWrap="wrap" gap={2}>
      {items.map((item) => (
        <box key={`${item.key}:${item.label}`} flexDirection="row">
          <text fg={toneColor(item.tone)}>[{item.key}]</text>
          <text fg={OPEN_TUI_COLORS.muted}> {item.label}</text>
        </box>
      ))}
    </box>
  );
}

export function OpenTuiPanel({
  title,
  focused = false,
  children,
  width,
  flexGrow,
  minWidth,
  minHeight,
}: {
  title: string;
  focused?: boolean;
  children: ReactNode;
  width?: PanelWidth;
  flexGrow?: number;
  minWidth?: number;
  minHeight?: number;
}) {
  return (
    <box
      flexDirection="column"
      width={width}
      flexGrow={flexGrow}
      minWidth={minWidth}
      minHeight={minHeight}
      backgroundColor={focused ? OPEN_TUI_COLORS.panel : OPEN_TUI_COLORS.panelAlt}
      border
      borderColor={focused ? OPEN_TUI_COLORS.borderFocus : OPEN_TUI_COLORS.border}
      focusedBorderColor={OPEN_TUI_COLORS.borderFocus}
      title={title}
      titleAlignment="left"
      padding={1}
    >
      {children}
    </box>
  );
}

export function OpenTuiSidebarCard({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <box
      flexDirection="column"
      border
      borderColor={OPEN_TUI_COLORS.border}
      backgroundColor={OPEN_TUI_COLORS.bg}
      padding={1}
      title={title}
      marginBottom={1}
    >
      {children}
    </box>
  );
}

export async function runOpenTuiPrompt<T>(
  renderApp: (prompt: OpenTuiPrompt<T>) => ReactNode,
  options: RunOpenTuiPromptOptions = {},
) {
  const renderer = await createCliRenderer({
    exitOnCtrlC: false,
    useMouse: true,
    autoFocus: true,
    screenMode: options.screenMode ?? "alternate-screen",
    footerHeight: options.footerHeight,
    backgroundColor: OPEN_TUI_COLORS.bg,
  });
  const root = createRoot(renderer);

  return await new Promise<T>((resolve) => {
    const prompt: OpenTuiPrompt<T> = {
      resolve,
      renderer,
      root,
    };

    root.render(renderApp(prompt));
  });
}
