import { useRef, useEffect, useState, KeyboardEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Mic, Paperclip } from "lucide-react";
import { useAEOSStore, Message } from "@/store/useAEOSStore";
import { ActivityCard } from "./ActivityCard";
import clsx from "clsx";

function ThinkingBubble() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      className="flex gap-3"
    >
      <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-sm"
        style={{ background: "radial-gradient(circle at 35% 35%, #00d4ff, #7b2fff)" }}>
        ✦
      </div>
      <div className="glass rounded-2xl rounded-tl-sm px-4 py-3 flex gap-1.5 items-center">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-cyan/70"
            style={{ animation: `breathe 1.2s ease-in-out ${i * 0.2}s infinite` }}
          />
        ))}
      </div>
    </motion.div>
  );
}

function MessageBubble({ msg }: { msg: Message }) {
  const { approveActivity, rejectActivity } = useAEOSStore();
  const isUser = msg.role === "user";
  const isSys  = msg.role === "system";

  if (isSys) {
    return (
      <div className="flex justify-center my-2">
        <span className="text-xs text-muted font-mono px-3 py-1 rounded-full neo">
          {msg.text}
        </span>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={clsx("flex gap-3", isUser && "flex-row-reverse")}
    >
      {/* Avatar */}
      {!isUser && (
        <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-sm mt-0.5"
          style={{ background: "radial-gradient(circle at 35% 35%, #00d4ff, #7b2fff)", boxShadow: "0 0 12px rgba(0,212,255,0.3)" }}>
          ✦
        </div>
      )}
      {isUser && (
        <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-sm mt-0.5 bg-white/10 border border-white/10">
          U
        </div>
      )}

      <div className={clsx("flex flex-col gap-2 max-w-[78%]", isUser && "items-end")}>
        {/* Text bubble */}
        <div
          className={clsx(
            "px-4 py-2.5 rounded-2xl text-sm leading-relaxed",
            isUser
              ? "text-white rounded-tr-sm"
              : "glass text-soft rounded-tl-sm"
          )}
          style={isUser ? {
            background: "linear-gradient(135deg, rgba(0,212,255,0.25), rgba(123,47,255,0.3))",
            border: "1px solid rgba(0,212,255,0.2)",
          } : {}}
        >
          {msg.text}
        </div>

        {/* Embedded activity card */}
        {msg.activity && (
          <ActivityCard
            activity={msg.activity}
            onApprove={() => approveActivity(msg.activity!.id)}
            onReject={() => rejectActivity(msg.activity!.id)}
            compact
          />
        )}

        {/* Timestamp */}
        <span className="text-[10px] text-muted px-1">
          {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </span>
      </div>
    </motion.div>
  );
}

export function ChatWindow() {
  const { messages, isThinking, sendMessage, voiceActive, setVoiceActive } = useAEOSStore();
  const [input, setInput] = useState("");
  const endRef  = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking]);

  const submit = () => {
    const text = input.trim();
    if (!text) return;
    setInput("");
    sendMessage(text);
    inputRef.current?.focus();
  };

  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  // Suggestions
  const suggestions = [
    "Browse my latest emails",
    "Search for OpenClaw docs",
    "Create a PRD for this project",
    "Show me the GitHub PRs",
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scroll-smooth">
        {messages.map((m) => (
          <MessageBubble key={m.id} msg={m} />
        ))}
        <AnimatePresence>
          {isThinking && <ThinkingBubble />}
        </AnimatePresence>
        <div ref={endRef} />
      </div>

      {/* Quick suggestions (show only if few messages) */}
      {messages.length <= 2 && (
        <div className="px-4 pb-2 flex gap-2 overflow-x-auto no-scrollbar">
          {suggestions.map((s) => (
            <button
              key={s}
              onClick={() => { setInput(s); inputRef.current?.focus(); }}
              className="btn-ghost whitespace-nowrap text-xs flex-shrink-0"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input bar */}
      <div className="px-3 pb-3">
        <div
          className="glass rounded-2xl flex items-end gap-2 px-3 py-2"
          style={{ border: "1px solid rgba(0,212,255,0.15)" }}
        >
          <button className="p-1.5 text-muted hover:text-cyan transition-colors mb-0.5">
            <Paperclip size={16} />
          </button>

          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKey}
            placeholder="Ask Syd anything…"
            rows={1}
            className="flex-1 bg-transparent text-sm text-white placeholder:text-muted resize-none outline-none leading-relaxed py-1 max-h-32 overflow-y-auto"
            style={{ fontFamily: "Inter, sans-serif" }}
          />

          <div className="flex items-center gap-1 mb-0.5">
            <button
              onClick={() => setVoiceActive(!voiceActive)}
              className={clsx(
                "p-1.5 rounded-xl transition-all",
                voiceActive ? "text-cyan" : "text-muted hover:text-cyan"
              )}
              style={voiceActive ? { background: "rgba(0,212,255,0.12)" } : {}}
            >
              <Mic size={16} />
            </button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={submit}
              disabled={!input.trim()}
              className={clsx(
                "p-2 rounded-xl transition-all",
                input.trim()
                  ? "btn-primary !py-1.5 !px-1.5"
                  : "text-muted cursor-not-allowed"
              )}
            >
              <Send size={15} />
            </motion.button>
          </div>
        </div>

        <p className="text-center text-[10px] text-muted/50 mt-1.5">
          Syd can make mistakes. Review before approving actions.
        </p>
      </div>
    </div>
  );
}
