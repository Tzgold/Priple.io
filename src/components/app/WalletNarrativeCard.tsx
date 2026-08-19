"use client";

import { useEffect, useState } from "react";
import { Bot, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import type { NarrativeMessage, NarrativeOrigin } from "@/lib/narrative-types";
import type { WalletNarrative } from "@/lib/wallet-narrative";

export function WalletNarrativeCard({
  narrative,
  walletId,
  compact = false,
}: {
  narrative: WalletNarrative;
  walletId?: string;
  compact?: boolean;
}) {
  const [briefing, setBriefing] = useState(narrative);
  const [origin, setOrigin] = useState<NarrativeOrigin>("template");
  const [threadId, setThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<NarrativeMessage[]>([]);
  const [writing, setWriting] = useState(false);
  const [askOpen, setAskOpen] = useState(!compact);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setBriefing(narrative);
  }, [narrative]);

  useEffect(() => {
    if (!walletId) return;
    let cancelled = false;

    async function load() {
      setWriting(true);
      setError(null);
      try {
        const res = await fetch("/api/narrative/brief", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "wallet", walletId }),
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
          setError(data.error || "Couldn’t reach the model — template briefing is showing");
          return;
        }
        setBriefing(data.briefing);
        setOrigin(data.origin === "llm" ? "llm" : "template");
        setThreadId(data.threadId);
        setMessages(data.messages ?? []);
      } catch {
        if (!cancelled) {
          setError("Couldn’t reach the model — template briefing is showing");
        }
      } finally {
        if (!cancelled) setWriting(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [walletId]);

  async function sendAskMore(event: React.FormEvent) {
    event.preventDefault();
    const text = draft.trim();
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
        setError(data?.error || "Couldn’t reach the model — template briefing is showing");
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
      setError("Couldn’t reach the model — template briefing is showing");
    } finally {
      setSending(false);
    }
  }

  const lines = compact ? briefing.paragraphs.slice(0, 2) : briefing.paragraphs;

  return (
    <section className="rounded-[20px] border border-white/[0.08] bg-black/30">
      <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-[#151517] text-zinc-300">
            <Bot className="h-4 w-4" />
          </span>
          <div>
            <p className="flex items-center gap-2 text-[13px] font-medium text-white">
              Priple Narrative
              {origin === "llm" ? (
                <span className="rounded-full border border-teal-500/30 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.12em] text-teal-300">
                  LLM
                </span>
              ) : null}
              {writing ? (
                <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-zinc-600">
                  Writing…
                </span>
              ) : null}
            </p>
            <p className="mt-0.5 font-mono text-[10px] text-zinc-600">
              This window’s feeds · not a prediction
            </p>
          </div>
        </div>
        <Sparkles className="h-4 w-4 text-zinc-500" />
      </div>

      <div className={cn("p-4", compact ? "sm:p-4" : "sm:p-5")}>
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
            <div key={fact.label} className="rounded-2xl border border-white/[0.08] bg-[#09090b] px-3 py-2.5">
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

        {askOpen ? (
          <div className="mt-4 border-t border-white/[0.06] pt-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-600">Ask more</p>
            {messages.length === 0 ? (
              <p className="mt-2 font-mono text-[11px] leading-5 text-zinc-500">
                Ask about the buys, overlap, or whether this feed is live.
              </p>
            ) : (
              <ul className="mt-3 space-y-2">
                {messages.map((row) => (
                  <li
                    key={row.id}
                    className={cn(
                      "rounded-2xl px-3 py-2 font-mono text-[12px] leading-5",
                      row.role === "user"
                        ? "ml-6 bg-white/[0.06] text-zinc-200"
                        : "mr-6 border border-white/[0.06] text-zinc-400",
                    )}
                  >
                    {row.content || (sending && row.role === "assistant" ? "…" : "")}
                  </li>
                ))}
              </ul>
            )}
            <form className="mt-3 flex flex-wrap gap-2" onSubmit={(event) => void sendAskMore(event)}>
              <input
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                disabled={!threadId || sending}
                maxLength={400}
                placeholder="Ask about this window…"
                className="h-9 min-w-[180px] flex-1 rounded-full border border-white/10 bg-black/40 px-3 font-mono text-[12px] text-white outline-none placeholder:text-zinc-600 disabled:opacity-50"
              />
              <Button type="submit" size="sm" variant="secondary" disabled={!threadId || sending || !draft.trim()}>
                Send
              </Button>
            </form>
            {error ? <p className="mt-2 font-mono text-[11px] text-zinc-500">{error}</p> : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}
