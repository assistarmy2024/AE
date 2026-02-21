import { useState } from "react";
import { motion } from "framer-motion";
import { Puzzle, Search } from "lucide-react";
import { useAEOSStore, Plugin, Runtime } from "@/store/useAEOSStore";
import clsx from "clsx";

const CATEGORIES = ["all", "channel", "tool", "skill", "memory"] as const;
type Cat = typeof CATEGORIES[number];

function RuntimeBadge({ runtime }: { runtime: Runtime[] }) {
  const colors: Record<Runtime, string> = {
    openclaw: "rgba(0,212,255,0.15)",
    zeroclaw: "rgba(0,255,136,0.12)",
    picoclaw: "rgba(255,179,71,0.12)",
  };
  const text: Record<Runtime, string> = {
    openclaw: "#00d4ff",
    zeroclaw: "#00ff88",
    picoclaw: "#ffb347",
  };
  return (
    <div className="flex gap-1">
      {runtime.map((r) => (
        <span
          key={r}
          className="text-[9px] px-1.5 py-0.5 rounded-full font-mono font-medium"
          style={{ background: colors[r], color: text[r] }}
        >
          {r.replace("claw", "")}
        </span>
      ))}
    </div>
  );
}

function PluginRow({ plugin }: { plugin: Plugin }) {
  const { togglePlugin } = useAEOSStore();

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className={clsx(
        "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all cursor-pointer",
        plugin.enabled ? "glass" : "neo opacity-60 hover:opacity-80"
      )}
      onClick={() => togglePlugin(plugin.id)}
    >
      {/* Icon */}
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
        style={{
          background: plugin.enabled
            ? "linear-gradient(135deg, rgba(0,212,255,0.15), rgba(123,47,255,0.15))"
            : "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        {plugin.icon}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-white truncate">{plugin.name}</p>
        <p className="text-[10px] text-muted truncate leading-tight">{plugin.description}</p>
        <div className="mt-1">
          <RuntimeBadge runtime={plugin.runtime} />
        </div>
      </div>

      {/* Toggle */}
      <div
        className={clsx(
          "w-9 h-5 rounded-full relative flex-shrink-0 transition-all duration-300",
          plugin.enabled ? "bg-cyan/30" : "neo-inset"
        )}
        style={plugin.enabled ? { border: "1px solid rgba(0,212,255,0.4)" } : {}}
      >
        <div
          className="absolute top-0.5 w-4 h-4 rounded-full transition-all duration-300"
          style={{
            background: plugin.enabled
              ? "linear-gradient(135deg, #00d4ff, #7b2fff)"
              : "rgba(255,255,255,0.15)",
            boxShadow: plugin.enabled ? "0 0 8px rgba(0,212,255,0.5)" : "none",
            left: plugin.enabled ? "calc(100% - 18px)" : "2px",
          }}
        />
      </div>
    </motion.div>
  );
}

export function PluginPanel() {
  const { plugins } = useAEOSStore();
  const [cat, setCat] = useState<Cat>("all");
  const [query, setQuery] = useState("");

  const filtered = plugins.filter(
    (p) =>
      (cat === "all" || p.category === cat) &&
      (!query || p.name.toLowerCase().includes(query.toLowerCase()) || p.description.toLowerCase().includes(query.toLowerCase()))
  );

  const enabled = plugins.filter((p) => p.enabled).length;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Puzzle size={14} className="text-violet/70" />
            <span className="text-sm font-semibold">Plugins</span>
          </div>
          <span className="text-xs text-muted">
            <span className="text-white font-medium">{enabled}</span>/{plugins.length} active
          </span>
        </div>

        {/* Search */}
        <div className="neo-inset rounded-xl flex items-center gap-2 px-3 py-2 mb-3">
          <Search size={13} className="text-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search plugins…"
            className="flex-1 bg-transparent text-xs text-white placeholder:text-muted outline-none"
          />
        </div>

        {/* Category filter */}
        <div className="flex gap-1 overflow-x-auto">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={clsx(
                "px-2.5 py-1 rounded-lg text-[10px] font-medium capitalize whitespace-nowrap transition-all",
                cat === c ? "text-white" : "text-muted hover:text-white"
              )}
              style={cat === c ? {
                background: "linear-gradient(135deg, rgba(0,212,255,0.2), rgba(123,47,255,0.2))",
                border: "1px solid rgba(0,212,255,0.25)",
              } : {}}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Plugin list */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {filtered.map((p, i) => (
          <motion.div key={p.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
            <PluginRow plugin={p} />
          </motion.div>
        ))}
        {filtered.length === 0 && (
          <p className="text-xs text-muted text-center py-8">No matching plugins</p>
        )}
      </div>
    </div>
  );
}
