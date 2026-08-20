"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Bot, MessageSquare, SendHorizontal, Sparkles, UserRound } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import type { NarrativeMessage, NarrativeOrigin } from "@/lib/narrative-types";
import type { WalletNarrative } from "@/lib/wallet-narrative";

export type NarrativeSubject =
  | { type: "wallet"; walletId: string }
  | {
      type: "coin";
      network: string;
      address: string;
      whyHere?: string | null;
      trackedWalletBuys?: number;
    };

const WALLET_SUGGESTIONS = [
  "What did this desk buy?",
  "Is this feed live?",
  "Summarize buys vs sells",
  "Any overlap with other desks?",
];

const COIN_SUGGESTIONS = [
  "Any news headlines?",
  "Which tracked wallets bought?",
  "What's the liquidity risk?",
  "Show social / posts signals",
];

function linkifyText(text: string) {
  const parts: Array<{ type: "text" | "link"; value: string }> = [];
  const regex = /(https:\/\/[^\s<>"']+)/g;
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) != null) {
    if (match.index > last) {
      parts.push({ type: "text", value: text.slice(last, match.index) });
    }
    parts.push({ type: "link", value: match[1] });
    last = match.index + match[1].length;
  }
  if (last < text.length) parts.push({ type: "text", value: text.slice(last) });
  if (parts.length === 0) parts.push({ type: "text", value: text });
  return parts;
}

function MessageBody({ text }: { text: string }) {
  const lines = text.split("\n");

  return (
    <div className="space-y-1">
      {lines.map((line, lineIndex) => {
        const trimmed = line.trimStart();
        const isBullet =
          trimmed.startsWith("- ") ||
          trimmed.startsWith("• ") ||
          /^\d+\.\s/.test(trimmed);

        const content = (
          <span className="whitespace-pre-wrap break-words">
            {linkifyText(line).map((part, index) =>
              part.type === "link" ? (
                <a
                  key={`${part.value}-${index}`}
                  href={part.value}
                  target="_blank"
                  rel="noreferrer"
                  className="underline decoration-white/20 underline-offset-2 hover:text-teal-300 hover:decoration-teal-400/50"
                >
                  {part.value}
                </a>
              ) : (
                <span key={`${index}-${part.value.slice(0, 12)}`}>{part.value}</span>
              ),
            )}
          </span>
        );

        if (isBullet) {
          return (
            <p
              key={`${lineIndex}-${line.slice(0, 24)}`}
              className="pl-3 text-[12px] leading-5 before:mr-1.5 before:text-zinc-600 before:content-['•']"
            >
              {content}
            </p>
          );
        }

        return (
          <p key={`${lineIndex}-${line.slice(0, 24)}`} className="text-[12px] leading-5">
            {content}
          </p>
        );
      })}
    </div>
  );
}

function ChatBubble({ row, sending }: { row: NarrativeMessage; sending: boolean }) {
  const isUser = row.role === "user";

  return (
    <li
      className={cn(
        "flex gap-2",
        isUser ? "flex-row-reverse" : "flex-row",
      )}
    >
      <span
        className={cn(
          "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border",
          isUser
            ? "border-white/10 bg-white/[0.06] text-zinc-400"
            : "border-teal-500/20 bg-teal-500/10 text-teal-300",
        )}
      >
        {isUser ? <UserRound className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
      </span>
      <div className={cn("min-w-0 max-w-[88%] sm:max-w-[82%]", isUser ? "items-end" : "items-start")}>
        <p className="mb-1 font-mono text-[9px] uppercase tracking-[0.14em] text-zinc-600">
          {isUser ? "You" : "Priple"}
        </p>
        <div
          className={cn(
            "rounded-2xl px-3.5 py-2.5",
            isUser
              ? "bg-teal-500/10 text-zinc-100 ring-1 ring-teal-500/20"
              : "border border-white/[0.08] bg-[#0c0c0e] text-zinc-300",
          )}
        >
          {row.content ? (
            <MessageBody text={row.content} />
          ) : sending && row.role === "assistant" ? (
            <span className="inline-flex items-center gap-1 font-mono text-[11px] text-zinc-500">
              <span className="animate-pulse">Researching</span>
              <span className="animate-pulse">…</span>
            </span>
          ) : (
            ""
          )}
        </div>
      </div>
    </li>
  );
}

export function WalletNarrativeCard({
  narrative,
  walletId,
  subject,
  compact = false,
  variant = "full",
}: {
  narrative: WalletNarrative;
  walletId?: string;
  subject?: NarrativeSubject;
  compact?: boolean;
  variant?: "full" | "coin-desk";
}) {
  const isCoinDesk = variant === "coin-desk";

  const resolvedSubject = useMemo<NarrativeSubject | null>(() => {
    if (subject) return subject;
    if (walletId) return { type: "wallet", walletId };
    return null;
  }, [subject, walletId]);

  const [briefing, setBriefing] = useState(narrative);
  const [origin, setOrigin] = useState<NarrativeOrigin>("template");
  const [threadId, setThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<NarrativeMessage[]>([]);
  const [writing, setWriting] = useState(false);
  const [askOpen, setAskOpen] = useState(isCoinDesk || !compact);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLUListElement | null>(null);

  const suggestions = resolvedSubject?.type === "coin" ? COIN_SUGGESTIONS : WALLET_SUGGESTIONS;
  const askHint =
    resolvedSubject?.type === "coin"
      ? "Ask about news links, tracked buys, holder concentration, liquidity, or social heat."
      : "Ask about buys, sells, window flow, holdings, or whether this feed is live.";

  useEffect(() => {
    setBriefing(narrative);
    setOrigin("template");
    setThreadId(null);
    setMessages([]);
    setError(null);
  }, [narrative, resolvedSubject]);

  useEffect(() => {
    if (!resolvedSubject) return;
    let cancelled = false;

    async function load() {
      if (!resolvedSubject) return;
      setWriting(true);
      setError(null);
      try {
        const body =
          resolvedSubject.type === "wallet"
            ? { type: "wallet", walletId: resolvedSubject.walletId }
            : {
                type: "coin",
                network: resolvedSubject.network,
                address: resolvedSubject.address,
                whyHere: resolvedSubject.whyHere ?? undefined,
                trackedWalletBuys: resolvedSubject.trackedWalletBuys,
              };

        const res = await fetch("/api/narrative/brief", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = (await res.json()) as {
          threadId?: string;
          briefing?: WalletNarrative;
          origin?: NarrativeOrigin;
          messages?: NarrativeMessage[];
          error?: string;
        };
        if (cancelled) return;
        if (!res.ok || !data.briefing || !data.threadId) {
          setError(data.error || "Couldn't reach the model — template briefing is showing");
          return;
        }
        setBriefing(data.briefing);
        setOrigin(data.origin === "llm" ? "llm" : "template");
        setThreadId(data.threadId);
        setMessages(data.messages ?? []);
      } catch {
        if (!cancelled) {
          setError("Couldn't reach the model — template briefing is showing");
        }
      } finally {
        if (!cancelled) setWriting(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [resolvedSubject]);

  useEffect(() => {
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, sending]);

  async function sendAskMore(textRaw?: string) {
    const text = (textRaw ?? draft).trim();
    if (!threadId || !text || sending) return;
    setDraft("");
    setSending(true);
    setError(null);
    const userMsg: NarrativeMessage = {
      id: `local-${Date.now()}`,
      role: "user",
      content: text,
      createdAt: new Date().toISOString(),
    };
    setMessages((current) => [...current, userMsg]);

    try {
      const res = await fetch("/api/narrative/chat", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ threadId, message: text }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        setError(data?.error || "Couldn't reach the model — try again");
        return;
      }
      const reader = res.body?.getReader();
      if (!reader) return;
      const decoder = new TextDecoder();
      let acc = "";
      const assistantId = `asst-${Date.now()}`;
      setMessages((current) => [
        ...current,
        { id: assistantId, role: "assistant", content: "", createdAt: new Date().toISOString() },
      ]);
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        const snapshot = acc;
        setMessages((current) =>
          current.map((row) => (row.id === assistantId ? { ...row, content: snapshot } : row)),
        );
      }
    } catch {
      setError("Couldn't reach the model — try again");
    } finally {
      setSending(false);
    }
  }

  const lines = compact ? briefing.paragraphs.slice(0, 2) : briefing.paragraphs;
  const showBriefing = !isCoinDesk;

  const chatSection = (
    <div className={cn(!isCoinDesk && "mt-4 border-t border-white/[0.06] pt-4", isCoinDesk && "pt-0")}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-600">
          {isCoinDesk ? "Research chat" : "Ask more"}
        </p>
        <div className="flex items-center gap-2">
          {writing ? (
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-zinc-500">
              Loading context…
            </span>
          ) : threadId ? (
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-teal-400/80">
              Ready
            </span>
          ) : null}
          {sending ? (
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-zinc-500">
              Answering…
            </span>
          ) : null}
        </div>
      </div>

      {messages.length === 0 ? (
        <p className="mt-2 font-mono text-[11px] leading-5 text-zinc-500">{askHint}</p>
      ) : (
        <ul
          ref={listRef}
          className="mt-3 max-h-[420px] space-y-3 overflow-y-auto overscroll-contain pr-1 sm:max-h-[520px]"
        >
          {messages.map((row) => (
            <ChatBubble key={row.id} row={row} sending={sending} />
          ))}
        </ul>
      )}

      <div className="mt-3 flex flex-wrap gap-1.5">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            disabled={!threadId || sending || writing}
            onClick={() => void sendAskMore(suggestion)}
            className="rounded-full border border-white/10 bg-white/[0.02] px-2.5 py-1 font-mono text-[10px] text-zinc-400 transition hover:border-teal-500/30 hover:text-zinc-200 disabled:opacity-40"
          >
            {suggestion}
          </button>
        ))}
      </div>

      <form
        className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center"
        onSubmit={(event) => {
          event.preventDefault();
          void sendAskMore();
        }}
      >
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          disabled={!threadId || sending || writing}
          maxLength={600}
          placeholder={isCoinDesk ? "Ask Priple about this coin…" : "Ask about this window…"}
          className="h-10 w-full flex-1 rounded-full border border-white/10 bg-black/40 px-4 font-mono text-[12px] text-white outline-none ring-teal-500/0 transition placeholder:text-zinc-600 focus:border-teal-500/40 focus:ring-2 focus:ring-teal-500/20 disabled:opacity-50"
        />
        <Button
          type="submit"
          size="sm"
          variant="secondary"
          disabled={!threadId || sending || writing || !draft.trim()}
          className="h-10 w-full shrink-0 sm:w-auto"
        >
          <span className="inline-flex items-center gap-1.5">
            Send
            <SendHorizontal className="h-3.5 w-3.5" />
          </span>
        </Button>
      </form>
      {error ? <p className="mt-2 font-mono text-[11px] text-rose-400/90">{error}</p> : null}
    </div>
  );

  return (
    <section
      className={cn(
        "rounded-[20px] border bg-black/30",
        isCoinDesk ? "border-teal-500/15 bg-gradient-to-b from-teal-500/[0.04] to-black/30" : "border-white/[0.08]",
      )}
    >
      <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <span
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border",
              isCoinDesk
                ? "border-teal-500/25 bg-teal-500/10 text-teal-300"
                : "border-white/10 bg-[#151517] text-zinc-300",
            )}
          >
            {isCoinDesk ? <MessageSquare className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
          </span>
          <div className="min-w-0">
            <p className="flex flex-wrap items-center gap-2 text-[13px] font-medium text-white">
              {isCoinDesk ? "Ask Priple" : "Priple Narrative"}
              {origin === "llm" ? (
                <span className="rounded-full border border-teal-500/30 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.12em] text-teal-300">
                  LLM
                </span>
              ) : null}
              {writing && !isCoinDesk ? (
                <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-zinc-600">
                  Writing…
                </span>
              ) : null}
            </p>
            <p className="mt-0.5 font-mono text-[10px] text-zinc-600">
              {isCoinDesk
                ? "Grounded research · uses the market data above"
                : "This window's feeds · not a prediction"}
            </p>
          </div>
        </div>
        <Sparkles className={cn("h-4 w-4 shrink-0", isCoinDesk ? "text-teal-500/60" : "text-zinc-500")} />
      </div>

      <div className={cn("p-4", compact ? "sm:p-4" : "sm:p-5")}>
        {isCoinDesk && origin === "llm" && briefing.highlight ? (
          <div className="mb-4 rounded-2xl border border-teal-500/20 bg-teal-500/[0.06] px-3.5 py-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-teal-400/90">
              {briefing.highlight.title}
            </p>
            <p className="mt-1.5 text-[13px] leading-6 text-zinc-300">{briefing.highlight.body}</p>
          </div>
        ) : null}

        {showBriefing ? (
          <>
            <h3 className="font-sans text-[16px] font-semibold text-white">{briefing.headline}</h3>
            <div className="mt-3 space-y-3">
              {lines.map((line) => (
                <p key={line} className="text-[13px] leading-6 text-zinc-300">
                  {line}
                </p>
              ))}
            </div>

            {briefing.highlight ? (
              <div className="mt-4 rounded-2xl border border-white/[0.07] bg-white/[0.03] px-3.5 py-3">
                <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-zinc-500">
                  {briefing.highlight.title}
                </p>
                <p className="mt-1.5 font-mono text-[11px] leading-5 text-zinc-400">
                  {briefing.highlight.body}
                </p>
              </div>
            ) : null}

            <div className="mt-4 grid grid-cols-2 gap-2">
              {briefing.facts.map((fact) => (
                <div
                  key={fact.label}
                  className="rounded-2xl border border-white/[0.08] bg-[#09090b] px-3 py-2.5"
                >
                  <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-zinc-600">
                    {fact.label}
                  </p>
                  <p
                    className={cn(
                      "mt-1 font-mono text-[13px]",
                      fact.tone === "up"
                        ? "text-teal-300"
                        : fact.tone === "down"
                          ? "text-rose-300"
                          : "text-white",
                    )}
                  >
                    {fact.value}
                  </p>
                </div>
              ))}
            </div>

            <p className="mt-4 font-mono text-[10px] text-zinc-600">
              Sources: {briefing.sources.join(" · ")} · research only
            </p>

            {compact ? (
              <button
                type="button"
                onClick={() => setAskOpen((open) => !open)}
                className="mt-3 font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-500 hover:text-zinc-300"
              >
                {askOpen ? "Hide Ask more" : "Ask more"}
              </button>
            ) : null}
          </>
        ) : null}

        {isCoinDesk || askOpen ? chatSection : null}
      </div>
    </section>
  );
}
