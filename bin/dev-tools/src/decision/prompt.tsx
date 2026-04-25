/** @jsxImportSource @opentui/react */

import { createCliRenderer, type InputRenderable, type ScrollBoxRenderable, type TextareaRenderable } from "@opentui/core";
import { createRoot, useKeyboard, useTerminalDimensions } from "@opentui/react";
import { useEffect, useMemo, useRef, useState, type ReactNode, type Ref } from "react";

import {
  OPEN_TUI_COLORS as COLORS,
  type OpenTuiPrompt as PromptResult,
  OpenTuiHeader as Header,
  OpenTuiKeyHints as KeyHints,
  OpenTuiPanel as Panel,
  OpenTuiScreen as Screen,
  OpenTuiSidebarCard as SidebarCard,
  OpenTuiStatBar as StatBar,
  closePrompt as finishPrompt,
} from "../lib/opentui.tsx";

export type DecisionReviewData = {
  number: number;
  title: string;
  statusLabel: string;
  decision: string;
  context: string;
  consequences: string;
  notes: string;
  followUps: Array<{ question: string; answer: string }>;
};

type SessionPrompt<T> = PromptResult<T> & {
  reject: (error: unknown) => void;
};

let decisionSession: {
  renderer: Awaited<ReturnType<typeof createCliRenderer>>;
  root: ReturnType<typeof createRoot>;
} | null = null;

async function getDecisionSession() {
  if (decisionSession) {
    return decisionSession;
  }

  const renderer = await createCliRenderer({
    exitOnCtrlC: false,
    useMouse: true,
    autoFocus: true,
    screenMode: "alternate-screen",
    backgroundColor: COLORS.bg,
  });
  const root = createRoot(renderer);
  decisionSession = { renderer, root };
  return decisionSession;
}

export function endDecisionSession() {
  if (!decisionSession) {
    return;
  }

  decisionSession.root.unmount();
  decisionSession.renderer.destroy();
  decisionSession = null;
}

async function runDecisionStep<T>(renderApp: (prompt: SessionPrompt<T>) => ReactNode): Promise<T> {
  const session = await getDecisionSession();

  return await new Promise<T>((resolve, reject) => {
    const prompt: SessionPrompt<T> = {
      renderer: session.renderer,
      root: session.root,
      resolve(value) {
        session.root.unmount();
        resolve(value);
      },
      reject(error) {
        session.root.unmount();
        reject(error);
      },
    };

    session.root.render(renderApp(prompt));
  });
}

function DraftingScreenApp({
  prompt,
  label,
  subtitle,
  task,
}: {
  prompt: SessionPrompt<unknown>;
  label: string;
  subtitle: string;
  task: () => Promise<unknown>;
}) {
  const [frame, setFrame] = useState(0);
  const frames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
  const spinnerLabel = `${frames[frame % frames.length]} ${label}`;

  useEffect(() => {
    const interval = setInterval(() => {
      setFrame((current) => current + 1);
    }, 80);

    let cancelled = false;
    void task()
      .then((result) => {
        if (!cancelled) {
          prompt.resolve(result);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          prompt.reject(error);
        }
      });

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [prompt, task]);

  return (
    <Screen>
      <Header title="Decision" subtitle={subtitle} />
      <Panel title="Working" focused flexGrow={1}>
        <box flexDirection="column" justifyContent="center" alignItems="center" flexGrow={1}>
          <text fg={COLORS.primary}>{spinnerLabel}</text>
          <box marginTop={1}>
            <text fg={COLORS.muted}>The renderer stays active while the draft is generated.</text>
          </box>
        </box>
      </Panel>
      <KeyHints items={[{ key: "Ctrl+C", label: "cancel process", tone: "warning" }]} />
    </Screen>
  );
}

function renderMultiline(value: string, fg: string = COLORS.text) {
  return (
    <box flexDirection="column">
      {value.split("\n").map((line, index) => (
        <text key={`${index}:${line}`} fg={fg}>{line || " "}</text>
      ))}
    </box>
  );
}

function InfoBlock({
  label,
  value,
  tone = COLORS.text,
}: {
  label: string;
  value: string;
  tone?: string;
}) {
  return (
    <box flexDirection="column" marginBottom={1}>
      <text fg={COLORS.muted}>{label}</text>
      {renderMultiline(value, tone)}
    </box>
  );
}

function ScrollPanel({
  title,
  focused,
  scrollRef,
  children,
}: {
  title: string;
  focused: boolean;
  scrollRef?: Ref<ScrollBoxRenderable>;
  children: ReactNode;
}) {
  return (
    <scrollbox
      ref={scrollRef}
      focused={focused}
      flexGrow={1}
      border
      borderColor={focused ? COLORS.borderFocus : COLORS.border}
      focusedBorderColor={COLORS.borderFocus}
      backgroundColor={focused ? COLORS.panel : COLORS.panelAlt}
      title={title}
      padding={1}
      viewportCulling
      scrollbarOptions={{
        visible: true,
      }}
    >
      {children}
    </scrollbox>
  );
}

function NotesPromptApp({
  prompt,
}: {
  prompt: PromptResult<string | null>;
}) {
  const { width, height } = useTerminalDimensions();
  const textareaRef = useRef<TextareaRenderable | null>(null);
  const [value, setValue] = useState("");
  const tooSmall = width < 88 || height < 24;
  const stacked = width < 126;
  const editorHeight = Math.max(12, Math.min(24, height - (stacked ? 18 : 10)));

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  useKeyboard((key) => {
    if (key.name === "escape" || key.ctrl && key.name === "c") {
      finishPrompt(prompt, null);
      return;
    }

    if (key.ctrl && key.name === "s") {
      const trimmed = textareaRef.current?.plainText.trim() ?? value.trim();
      if (trimmed) {
        finishPrompt(prompt, trimmed);
      }
    }
  });

  const stats = useMemo(() => {
    const trimmed = value.trimEnd();
    const lines = trimmed ? trimmed.split("\n").length : 0;
    return [
      { label: "lines", value: String(lines), tone: lines > 0 ? "primary" as const : "default" as const },
      { label: "chars", value: String(value.length) },
      { label: "submit", value: "Ctrl+S", tone: "success" as const },
    ];
  }, [value]);

  if (tooSmall) {
    return (
      <Screen>
        <Header title="Decision" subtitle="This editor works best with a larger terminal." />
        <Panel title="Terminal Too Small" focused flexGrow={1}>
          <text fg={COLORS.text}>Resize to at least 88 columns by 24 rows.</text>
          <box marginTop={1} flexDirection="column">
            <text fg={COLORS.muted}>Current width: {String(width)}</text>
            <text fg={COLORS.muted}>Current height: {String(height)}</text>
          </box>
        </Panel>
        <KeyHints items={[{ key: "Esc", label: "cancel", tone: "warning" }]} />
      </Screen>
    );
  }

  return (
    <Screen>
      <Header
        title="Decision"
        subtitle="Capture the rough idea first. The model will draft the final decision entry."
      />
      <StatBar items={stats} />
      <box flexDirection={stacked ? "column" : "row"} flexGrow={1} gap={1}>
        <Panel title="Notes" focused flexGrow={1} minHeight={editorHeight + 2}>
          <textarea
            ref={textareaRef}
            focused
            width="100%"
            height={editorHeight}
            initialValue=""
            wrapMode="word"
            backgroundColor={COLORS.editorBg}
            focusedBackgroundColor={COLORS.editorFocus}
            textColor={COLORS.text}
            focusedTextColor={COLORS.text}
            placeholder="What changed? Why now? Which constraints, tradeoffs, or tools matter?"
            placeholderColor={COLORS.placeholder}
            selectionBg={COLORS.selectionBg}
            selectionFg={COLORS.selectionFg}
            cursorColor={COLORS.primary}
            onContentChange={() => {
              setValue(textareaRef.current?.plainText ?? "");
            }}
          />
        </Panel>
        <box width={stacked ? "100%" : 34} minWidth={stacked ? undefined : 34} flexDirection="column">
          <SidebarCard title="Good Notes">
            <text fg={COLORS.text}>Problem</text>
            <text fg={COLORS.text}>Chosen approach</text>
            <text fg={COLORS.text}>Tradeoffs and constraints</text>
          </SidebarCard>
          <SidebarCard title="Why TUI">
            <text fg={COLORS.muted}>This is the experiment: write, review, and approve the whole decision inside one full-screen flow.</text>
          </SidebarCard>
        </box>
      </box>
      <KeyHints
        items={[
          { key: "Ctrl+S", label: "draft decision", tone: "success" },
          { key: "Esc", label: "cancel", tone: "warning" },
          { key: "Arrows", label: "move in text" },
        ]}
      />
    </Screen>
  );
}

function FollowUpPromptApp({
  prompt,
  question,
}: {
  prompt: PromptResult<string | null>;
  question: string;
}) {
  const { width } = useTerminalDimensions();
  const inputRef = useRef<InputRenderable | null>(null);
  const [value, setValue] = useState("");
  const stacked = width < 120;

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useKeyboard((key) => {
    if (key.name === "escape" || key.ctrl && key.name === "c") {
      finishPrompt(prompt, null);
    }
  });

  return (
    <Screen>
      <Header
        title="Decision Follow-Up"
        subtitle="One missing detail is blocking a clean draft."
      />
      <StatBar items={[{ label: "status", value: "awaiting answer", tone: "warning" }]} />
      <box flexDirection={stacked ? "column" : "row"} flexGrow={1} gap={1}>
        <Panel title="Question" width={stacked ? "100%" : "40%"} minWidth={34}>
          <text fg={COLORS.text}>{question}</text>
        </Panel>
        <Panel title="Answer" focused flexGrow={1}>
          <input
            ref={inputRef}
            focused
            value={value}
            width="100%"
            placeholder="Type the missing detail"
            backgroundColor={COLORS.editorBg}
            focusedBackgroundColor={COLORS.editorFocus}
            textColor={COLORS.text}
            focusedTextColor={COLORS.text}
            cursorColor={COLORS.primary}
            placeholderColor={COLORS.placeholder}
            onInput={setValue}
            onSubmit={() => {
              const trimmed = value.trim();
              if (trimmed) {
                finishPrompt(prompt, trimmed);
              }
            }}
          />
        </Panel>
      </box>
      <KeyHints
        items={[
          { key: "Enter", label: "submit answer", tone: "success" },
          { key: "Esc", label: "cancel", tone: "warning" },
        ]}
      />
    </Screen>
  );
}

function ReviewPromptApp({
  prompt,
  review,
}: {
  prompt: PromptResult<boolean>;
  review: DecisionReviewData;
}) {
  const { width, height } = useTerminalDimensions();
  const draftRef = useRef<ScrollBoxRenderable | null>(null);
  const sourceRef = useRef<ScrollBoxRenderable | null>(null);
  const [focusTarget, setFocusTarget] = useState<"draft" | "source" | "actions">("draft");
  const [selectedAction, setSelectedAction] = useState<0 | 1>(0);
  const stacked = width < 136;
  const compact = height < 30;
  const notesLines = review.notes.trim().length > 0 ? review.notes.split("\n").length : 0;

  useEffect(() => {
    if (focusTarget === "draft") {
      draftRef.current?.focus();
    } else if (focusTarget === "source") {
      sourceRef.current?.focus();
    }
  }, [focusTarget]);

  useKeyboard((key) => {
    if (key.name === "escape" || key.ctrl && key.name === "c" || key.name === "q") {
      finishPrompt(prompt, false);
      return;
    }

    if (key.name === "y") {
      finishPrompt(prompt, true);
      return;
    }

    if (key.name === "n") {
      finishPrompt(prompt, false);
      return;
    }

    if (key.name === "tab") {
      const order: Array<"draft" | "source" | "actions"> = ["draft", "source", "actions"];
      const currentIndex = order.indexOf(focusTarget);
      const nextIndex = key.shift
        ? (currentIndex + order.length - 1) % order.length
        : (currentIndex + 1) % order.length;
      setFocusTarget(order[nextIndex]!);
      return;
    }

    if (focusTarget !== "actions") {
      return;
    }

    if (key.name === "left" || key.name === "h") {
      setSelectedAction(0);
      return;
    }

    if (key.name === "right" || key.name === "l") {
      setSelectedAction(1);
      return;
    }

    if (key.name === "return" || key.name === "enter") {
      finishPrompt(prompt, selectedAction === 0);
    }
  });

  const stats = [
    { label: "decision", value: `#${review.number}`, tone: "primary" as const },
    { label: "status", value: review.statusLabel, tone: "success" as const },
    { label: "notes", value: `${notesLines} lines` },
    { label: "focus", value: focusTarget, tone: focusTarget === "actions" ? "warning" as const : "default" as const },
  ];

  return (
    <Screen>
      <Header
        title="Decision Review"
        subtitle="Review the drafted entry, compare it against your notes, then decide whether to write it."
      />
      <StatBar items={stats} />
      <box flexDirection={stacked ? "column" : "row"} flexGrow={1} gap={1}>
        <ScrollPanel title="Draft" focused={focusTarget === "draft"} scrollRef={draftRef}>
          <InfoBlock label="Number" value={String(review.number)} />
          <InfoBlock label="Title" value={review.title} />
          <InfoBlock label="Status" value={review.statusLabel} tone={COLORS.success} />
          <InfoBlock label="Decision" value={review.decision} />
          <InfoBlock label="Context" value={review.context} />
          <InfoBlock label="Consequences" value={review.consequences} />
        </ScrollPanel>
        <ScrollPanel title="Source Notes" focused={focusTarget === "source"} scrollRef={sourceRef}>
          <InfoBlock label="Original Notes" value={review.notes} />
          {review.followUps.length > 0 ? (
            <box flexDirection="column">
              <text fg={COLORS.muted}>Follow-Up Answers</text>
              {review.followUps.map(({ question, answer }, index) => (
                <box key={`${index}:${question}`} flexDirection="column" marginBottom={1}>
                  <text fg={COLORS.primary}>{`Q: ${question}`}</text>
                  <text fg={COLORS.text}>{`A: ${answer}`}</text>
                </box>
              ))}
            </box>
          ) : (
            <text fg={COLORS.muted}>No follow-up answers were needed.</text>
          )}
        </ScrollPanel>
      </box>
      <Panel title="Actions" focused={focusTarget === "actions"} minHeight={compact ? 6 : 7}>
        <box flexDirection="row" gap={1}>
          <box
            flexDirection="column"
            flexGrow={1}
            border
            borderColor={selectedAction === 0 ? COLORS.borderFocus : COLORS.border}
            backgroundColor={selectedAction === 0 ? "#133047" : COLORS.editorBg}
            padding={1}
          >
            <box marginBottom={compact ? 0 : 1}>
              <text fg={selectedAction === 0 ? COLORS.text : COLORS.success}>Write draft</text>
            </box>
            <text fg={COLORS.muted}>Update README.md with this decision entry.</text>
          </box>
          <box
            flexDirection="column"
            flexGrow={1}
            border
            borderColor={selectedAction === 1 ? COLORS.borderFocus : COLORS.border}
            backgroundColor={selectedAction === 1 ? "#342415" : COLORS.editorBg}
            padding={1}
          >
            <box marginBottom={compact ? 0 : 1}>
              <text fg={selectedAction === 1 ? COLORS.text : COLORS.warning}>Cancel</text>
            </box>
            <text fg={COLORS.muted}>Leave the repository unchanged and exit.</text>
          </box>
        </box>
      </Panel>
      <KeyHints
        items={[
          { key: "Tab", label: "cycle focus" },
          { key: "Arrows", label: focusTarget === "actions" ? "choose action" : "scroll active pane" },
          { key: "Enter", label: "confirm", tone: "success" },
          { key: "Y", label: "write now", tone: "success" },
          { key: "N", label: "cancel", tone: "warning" },
        ]}
      />
    </Screen>
  );
}

export async function promptForNotes(): Promise<string | null> {
  if (!process.stdin.isTTY) {
    const piped = (await Bun.stdin.text()).trim();
    return piped || null;
  }

  if (!process.stdout.isTTY) {
    return null;
  }

  return await runDecisionStep((prompt) => <NotesPromptApp prompt={prompt} />);
}

export async function promptForFollowUp(question: string): Promise<string | null> {
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    return null;
  }

  return await runDecisionStep((prompt) => <FollowUpPromptApp prompt={prompt} question={question} />);
}

export async function promptForApproval(review: DecisionReviewData): Promise<boolean> {
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    return true;
  }

  return await runDecisionStep((prompt) => <ReviewPromptApp prompt={prompt} review={review} />);
}

export async function withDecisionProgress<T>(label: string, task: () => Promise<T>): Promise<T> {
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    return await task();
  }

  return await runDecisionStep((prompt) => (
    <DraftingScreenApp
      prompt={prompt as SessionPrompt<unknown>}
      label={label}
      subtitle="Generating the draft inside the TUI."
      task={task as () => Promise<unknown>}
    />
  )) as T;
}
