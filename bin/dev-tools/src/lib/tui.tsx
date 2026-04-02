import { Box, Text } from "ink";
import type { ReactNode } from "react";

type Tone = "default" | "primary" | "success" | "warning" | "danger";

export type KeyHint = {
  key: string;
  label: string;
  tone?: Tone;
};

export type Stat = {
  label: string;
  value: string;
  tone?: Tone;
};

function toneColor(tone: Tone = "default") {
  return tone === "primary"
    ? "blue"
    : tone === "success"
      ? "green"
      : tone === "warning"
        ? "yellow"
        : tone === "danger"
          ? "red"
          : "gray";
}

function dotColor(tone: Tone = "default") {
  return tone === "primary"
    ? "cyan"
    : tone === "success"
      ? "green"
      : tone === "warning"
        ? "yellow"
        : tone === "danger"
          ? "red"
          : "gray";
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return <Text color="cyan">{children}</Text>;
}

export function StatPill({
  label,
  value,
  tone = "default",
}: Stat) {
  return (
    <Box marginRight={1}>
      <Text color={dotColor(tone)}>●</Text>
      <Text dimColor> {label}</Text>
      <Text bold color={toneColor(tone)}> {value}</Text>
    </Box>
  );
}

export function KeyHintBar({ items }: { items: KeyHint[] }) {
  return (
    <Box marginTop={1} flexWrap="wrap">
      {items.map((item) => (
        <Box key={`${item.key}:${item.label}`} marginRight={2}>
          <Text color={toneColor(item.tone)}>[{item.key}]</Text>
          <Text dimColor> {item.label}</Text>
        </Box>
      ))}
    </Box>
  );
}

export function AppFrame({
  title,
  subtitle,
  stats = [],
  hints = [],
  children,
}: {
  title: string;
  subtitle: string;
  stats?: Stat[];
  hints?: KeyHint[];
  children: ReactNode;
}) {
  return (
    <Box flexDirection="column">
      <Box>
        <Text color="yellow">nht</Text>
        <Text color="gray"> / </Text>
        <Text bold color="blue">{title}</Text>
      </Box>
      <Text dimColor>{subtitle}</Text>
      {stats.length > 0
        ? (
          <Box marginTop={1} flexWrap="wrap">
            {stats.map((stat) => <StatPill key={`${stat.label}:${stat.value}`} {...stat} />)}
          </Box>
        )
        : null}
      <Box marginTop={1} flexDirection="column">
        {children}
      </Box>
      {hints.length > 0 ? <KeyHintBar items={hints} /> : null}
    </Box>
  );
}

export function Panel({
  title,
  active = false,
  children,
  width,
  flexGrow,
  marginRight,
}: {
  title: string;
  active?: boolean;
  children: ReactNode;
  width?: number;
  flexGrow?: number;
  marginRight?: number;
}) {
  return (
    <Box
      flexDirection="column"
      width={width}
      flexGrow={flexGrow}
      marginRight={marginRight}
      borderStyle="round"
      borderColor={active ? "blue" : "gray"}
      paddingX={1}
      paddingY={0}
    >
      <Box marginBottom={1}>
        <Text color={active ? "blue" : "cyan"}>{title}</Text>
      </Box>
      {children}
    </Box>
  );
}

export function InputField({
  label,
  value,
  placeholder,
  prefix = ">",
}: {
  label: string;
  value: string;
  placeholder: string;
  prefix?: string;
}) {
  return (
    <Box flexDirection="column">
      <SectionLabel>{label}</SectionLabel>
      <Box marginTop={1} borderStyle="round" borderColor="blue" paddingX={1}>
        <Text color="blue">{prefix}</Text>
        <Text> </Text>
        {value
          ? <Text>{value}</Text>
          : <Text dimColor>{placeholder}</Text>}
      </Box>
    </Box>
  );
}

export function ChoiceCard({
  title,
  subtitle,
  selected,
  children,
}: {
  title: string;
  subtitle?: string;
  selected: boolean;
  children?: ReactNode;
}) {
  return (
    <Box
      marginTop={1}
      paddingX={1}
      flexDirection="column"
      borderStyle="round"
      borderColor={selected ? "blue" : "gray"}
    >
      <Text color={selected ? "blue" : undefined} bold={selected}>
        {selected ? ">" : " "} {title}
      </Text>
      {subtitle ? <Text dimColor>{subtitle}</Text> : null}
      {children}
    </Box>
  );
}

export function ListRow({
  title,
  subtitle,
  selected = false,
  tone = "default",
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  selected?: boolean;
  tone?: Tone;
}) {
  return (
    <Box marginTop={1}>
      <Text color={selected ? "blue" : dotColor(tone)}>{selected ? "▌" : "·"}</Text>
      <Box marginLeft={1} flexDirection="column">
        <Text bold={selected} color={selected ? "blue" : undefined}>{title}</Text>
        {subtitle ? <Text dimColor>{subtitle}</Text> : null}
      </Box>
    </Box>
  );
}

export function StatusPill({
  label,
  tone = "default",
}: {
  label: string;
  tone?: Tone;
}) {
  return <Text color={toneColor(tone)}>[{label}]</Text>;
}

export function EmptyState({ message }: { message: string }) {
  return <Text dimColor>{message}</Text>;
}
