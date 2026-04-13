"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  BotMessageSquare,
  Send,
  Loader2,
  Sparkles,
  User,
  X,
} from "lucide-react";
import { useT, useLocale } from "@/lib/i18n/locale-context";
import { getDir } from "@/lib/i18n";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export function AiChat() {
  const t = useT();
  const locale = useLocale();
  const dir = getDir(locale);
  const k = (key: string) => key as Parameters<typeof t>[0];

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [open]);

  async function handleSend(text?: string) {
    const msg = (text ?? input).trim();
    if (!msg || streaming) return;

    setInput("");
    setError("");
    const userMsg: Message = { role: "user", content: msg };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setStreaming(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Request failed");
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No stream");

      const decoder = new TextDecoder();
      let assistantContent = "";
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (data === "[DONE]") break;

          try {
            const parsed = JSON.parse(data);
            if (parsed.text) {
              assistantContent += parsed.text;
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = {
                  role: "assistant",
                  content: assistantContent,
                };
                return updated;
              });
            }
          } catch {
            // skip malformed chunks
          }
        }
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t(k("ai.chat_error"))
      );
      setMessages((prev) => {
        if (prev[prev.length - 1]?.role === "assistant" && !prev[prev.length - 1]?.content) {
          return prev.slice(0, -1);
        }
        return prev;
      });
    } finally {
      setStreaming(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const suggestions = [
    t(k("ai.suggest_hours")),
    t(k("ai.suggest_utilization")),
    t(k("ai.suggest_promote")),
    t(k("ai.suggest_cancellations")),
  ];

  return (
    <>
      {/* Floating button */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed z-50 flex size-12 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-blue-600 text-white shadow-lg shadow-violet-500/25 transition-all hover:scale-105 hover:shadow-xl hover:shadow-violet-500/30 active:scale-95 sm:size-14"
        style={{
          bottom: "1.5rem",
          [dir === "rtl" ? "left" : "right"]: "1.5rem",
        }}
      >
        <BotMessageSquare className="size-6 sm:size-7" />
      </button>

      {/* Chat sheet */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side={dir === "rtl" ? "left" : "right"}
          className="flex w-full flex-col p-0 sm:max-w-md"
          showCloseButton={false}
        >
          {/* Header */}
          <SheetHeader className="shrink-0 border-b bg-gradient-to-r from-violet-50 to-blue-50 px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-blue-500">
                  <Sparkles className="size-5 text-white" />
                </div>
                <div>
                  <SheetTitle className="text-sm font-bold">
                    {t(k("ai.chat_title"))}
                  </SheetTitle>
                  <SheetDescription className="text-xs">
                    {t(k("ai.chat_subtitle"))}
                  </SheetDescription>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-white/80"
              >
                <X className="size-4" />
              </button>
            </div>
          </SheetHeader>

          {/* Messages */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto px-4 py-4"
          >
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-100 to-blue-100">
                  <BotMessageSquare className="size-8 text-violet-500" />
                </div>
                <p className="mb-6 max-w-xs text-sm text-muted-foreground leading-relaxed">
                  {t(k("ai.chat_welcome"))}
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {suggestions.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => handleSend(s)}
                      className="rounded-full border bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm transition-all hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex gap-2.5 ${
                      msg.role === "user" ? "flex-row-reverse" : ""
                    }`}
                  >
                    <div
                      className={`flex size-7 shrink-0 items-center justify-center rounded-lg ${
                        msg.role === "user"
                          ? "bg-gray-200"
                          : "bg-gradient-to-br from-violet-500 to-blue-500"
                      }`}
                    >
                      {msg.role === "user" ? (
                        <User className="size-4 text-gray-600" />
                      ) : (
                        <Sparkles className="size-3.5 text-white" />
                      )}
                    </div>
                    <div
                      className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                        msg.role === "user"
                          ? "bg-gray-100 text-gray-900"
                          : "bg-white text-gray-800 shadow-sm ring-1 ring-gray-100"
                      }`}
                    >
                      {msg.content ? (
                        <div className="whitespace-pre-wrap">{msg.content}</div>
                      ) : (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Loader2 className="size-3.5 animate-spin" />
                          <span className="text-xs">
                            {t(k("ai.chat_thinking"))}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {error && (
              <div className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
                {error}
              </div>
            )}
          </div>

          {/* Input */}
          <div className="shrink-0 border-t bg-white p-3">
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t(k("ai.chat_placeholder"))}
                disabled={streaming}
                rows={1}
                className="flex-1 resize-none rounded-xl border bg-gray-50 px-3.5 py-2.5 text-sm outline-none transition-colors placeholder:text-gray-400 focus:border-violet-300 focus:bg-white focus:ring-2 focus:ring-violet-100 disabled:opacity-50"
                style={{ maxHeight: "120px" }}
              />
              <Button
                type="button"
                size="icon"
                disabled={!input.trim() || streaming}
                onClick={() => handleSend()}
                className="size-10 shrink-0 rounded-xl bg-gradient-to-br from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700"
              >
                {streaming ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Send className="size-4" />
                )}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
